import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import {
  X,
  Plus,
  Check,
  MapPin,
  Building,
  Home,
  Briefcase,
  HardHat,
  Compass,
  Navigation,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react-native";
import * as Location from "expo-location";
import { Address } from "../types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { useAuthStore } from "../store/authStore";
import { API_BASE_URL } from "../constants/config";
import { InteractiveLocationMap } from "./InteractiveLocationMap";

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAddress: (address: Address) => void;
}

export const AddressModal: React.FC<AddressModalProps> = ({ visible, onClose, onSelectAddress }) => {
  const { user, selectedAddress, setSelectedAddress } = useAuthStore();
  const addresses: Address[] = user?.addresses || [];
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);

  // Address Coordinates & Source
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 12.9716,
    lng: 77.5946,
  });
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [source, setSource] = useState<"GPS" | "MAP_PIN" | "SEARCH" | "MANUAL">("GPS");
  const [detectedSummary, setDetectedSummary] = useState<string>("");

  // Search Autocomplete State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Form Fields
  const [label, setLabel] = useState<"Home" | "Work" | "Site" | "Other">("Home");
  const [fullName, setFullName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone?.replace(/\D/g, "").slice(-10) || "");
  const [houseNumber, setHouseNumber] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [floor, setFloor] = useState("");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [pincode, setPincode] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [error, setError] = useState("");

  // Populate recipient defaults on open
  useEffect(() => {
    if (visible && user) {
      if (user.name && !fullName) setFullName(user.name);
      if (user.phone && !phone) setPhone(user.phone.replace(/\D/g, "").slice(-10));
    }
  }, [visible, user]);

  const handleSelect = (addr: Address) => {
    setSelectedAddress(addr);
    onSelectAddress(addr);
    onClose();
  };

  // ── REVERSE GEOCODE HELPER ──
  const performReverseGeocode = async (
    lat: number,
    lng: number,
    acc?: number | null,
    locSource: "GPS" | "MAP_PIN" | "SEARCH" = "MAP_PIN"
  ) => {
    try {
      setReverseGeocoding(true);

      // Try Backend API First
      let addressData: any = null;
      try {
        const res = await fetch(`${API_BASE_URL}/api/location/reverse-geocode`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: lat, longitude: lng, accuracy: acc, source: locSource }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.address) {
            addressData = data.address;
          }
        }
      } catch (e) {
        console.warn("Backend reverse-geocode failed, using client fallback:", e);
      }

      // Client-side Fallback (BigDataCloud Client API)
      if (!addressData) {
        try {
          const bdcRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
          );
          if (bdcRes.ok) {
            const bdcData = await bdcRes.json();
            addressData = {
              houseNumber: bdcData.localityInfo?.informative?.[0]?.name || "",
              buildingName: "",
              street: bdcData.localityInfo?.administrative?.[3]?.name || bdcData.locality || "",
              area: bdcData.locality || bdcData.city || "",
              city: bdcData.city || bdcData.principalSubdivision || "Bengaluru",
              state: bdcData.principalSubdivision || "Karnataka",
              postalCode: bdcData.postcode || "",
              formattedAddress: [bdcData.locality, bdcData.city, bdcData.principalSubdivision, bdcData.postcode]
                .filter(Boolean)
                .join(", "),
            };
          }
        } catch (err) {
          console.warn("Client fallback reverse-geocode failed:", err);
        }
      }

      if (addressData) {
        // Auto-fill detected fields (preserve manual input if customer already typed)
        if (addressData.houseNumber && !houseNumber) setHouseNumber(addressData.houseNumber);
        if (addressData.buildingName && !buildingName) setBuildingName(addressData.buildingName);
        if (addressData.street) setStreet(addressData.street);
        if (addressData.area) setArea(addressData.area);
        if (addressData.city) setCity(addressData.city);
        if (addressData.state) setState(addressData.state);
        if (addressData.postalCode) setPincode(addressData.postalCode);
        if (addressData.landmark && !landmark) setLandmark(addressData.landmark);

        const summary = [addressData.area, addressData.city, addressData.postalCode]
          .filter(Boolean)
          .join(", ");
        setDetectedSummary(summary || addressData.formattedAddress || "Location detected");
      }
    } catch (err) {
      console.warn("Reverse geocode handler error:", err);
    } finally {
      setReverseGeocoding(false);
    }
  };

  // ── GPS CURRENT LOCATION HANDLER ──
  const handleDetectGps = async () => {
    try {
      setLocatingGps(true);
      setError("");

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocatingGps(false);
        Alert.alert(
          "Location Permission",
          "Location permission was denied. You can search your building or adjust the map pin."
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude, accuracy: acc } = loc.coords;
      setCoords({ lat: latitude, lng: longitude });
      setAccuracy(acc);
      setSource("GPS");

      await performReverseGeocode(latitude, longitude, acc, "GPS");
    } catch (err: any) {
      console.warn("Mobile GPS error:", err);
      Alert.alert("GPS Warning", "Could not fetch GPS location. Please search or pick on map.");
    } finally {
      setLocatingGps(false);
    }
  };

  // ── MAP PIN DRAGGED / MOVED ──
  const handleMapLocationChange = async (lat: number, lng: number, locSource: "MAP_PIN" | "GPS") => {
    setCoords({ lat, lng });
    setSource(locSource);
    await performReverseGeocode(lat, lng, accuracy, locSource);
  };

  // ── SEARCH AUTOCOMPLETE HANDLER ──
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        let results: any[] = [];

        // 1. Try Backend API
        try {
          const res = await fetch(`${API_BASE_URL}/api/location/geocode`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: searchQuery }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.results && data.results.length > 0) {
              results = data.results;
            }
          }
        } catch (e) {
          console.warn("Backend geocode search failed, trying Photon mirror:", e);
        }

        // 2. Client-side Photon OSM Mirror Fallback
        if (results.length === 0) {
          try {
            const photonRes = await fetch(
              `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=5&lang=en`
            );
            if (photonRes.ok) {
              const photonData = await photonRes.json();
              if (photonData.features) {
                results = photonData.features.map((f: any) => {
                  const p = f.properties;
                  const [lng, lat] = f.geometry.coordinates;
                  return {
                    latitude: lat,
                    longitude: lng,
                    formattedAddress: [p.name, p.street, p.district, p.city, p.state, p.postcode]
                      .filter(Boolean)
                      .join(", "),
                    street: p.street || p.name || "",
                    area: p.district || p.suburb || p.city || "",
                    city: p.city || p.county || "Bengaluru",
                    state: p.state || "Karnataka",
                    postalCode: p.postcode || "",
                  };
                });
              }
            }
          } catch (err) {
            console.warn("Client Photon search fallback failed:", err);
          }
        }

        setSearchResults(results);
      } catch (err) {
        console.warn("Search geocode error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = (res: any) => {
    const lat = Number(res.latitude);
    const lng = Number(res.longitude);
    setCoords({ lat, lng });
    setSource("SEARCH");
    setAccuracy(null);
    setSearchQuery("");
    setSearchResults([]);

    if (res.buildingName) setBuildingName(res.buildingName);
    if (res.street) setStreet(res.street);
    if (res.area) setArea(res.area);
    if (res.city) setCity(res.city);
    if (res.state) setState(res.state);
    if (res.postalCode) setPincode(res.postalCode);

    setDetectedSummary(res.formattedAddress || `${res.street || res.area}, ${res.city}`);
  };

  // ── SAVE ADDRESS HANDLER ──
  const handleSaveAddress = async () => {
    if (!fullName.trim()) {
      setError("Please enter recipient name");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    if (!street.trim() && !area.trim() && !buildingName.trim()) {
      setError("Please enter street, area or building name");
      return;
    }
    if (!city.trim()) {
      setError("Please enter city");
      return;
    }
    if (!pincode.trim() || pincode.replace(/\D/g, "").length < 6) {
      setError("Please enter a valid 6-digit PIN code");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const newAddressPayload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        label,
        houseNumber: houseNumber.trim() || null,
        buildingName: buildingName.trim() || null,
        floor: floor.trim() || null,
        street: street.trim() || area.trim(),
        area: area.trim() || null,
        landmark: landmark.trim() || null,
        city: city.trim(),
        district: city.trim(),
        state: state.trim() || "Karnataka",
        country: "India",
        pincode: pincode.trim(),
        postalCode: pincode.trim(),
        latitude: coords.lat,
        longitude: coords.lng,
        accuracy: accuracy || 15.0,
        source,
        deliveryInstructions: deliveryInstructions.trim() || null,
        isDefault: true,
      };

      // 1. Sync via Backend API if authenticated
      try {
        const res = await fetch(`${API_BASE_URL}/api/addresses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newAddressPayload),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.address) {
            handleSelect(data.address);
            return;
          }
        }
      } catch (err) {
        console.warn("Backend address save failed, saving locally in store:", err);
      }

      // 2. Local fallback save in auth store
      const localAddress: Address = {
        id: `addr_${Date.now()}`,
        userId: user?.id || "guest",
        ...newAddressPayload,
      } as any;

      handleSelect(localAddress);
    } catch (err: any) {
      console.warn("Address save error:", err);
      setError(err?.message || "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyBadge = () => {
    if (!accuracy) return { text: "Pin Confirmed", color: COLORS.primary };
    if (accuracy <= 15) return { text: `GPS High Precision (±${Math.round(accuracy)}m)`, color: "#10b981" };
    if (accuracy <= 50) return { text: `GPS Acceptable (±${Math.round(accuracy)}m)`, color: "#0284c7" };
    return { text: `Approximate (±${Math.round(accuracy)}m)`, color: "#f59e0b" };
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>
                {isAddingNew ? "Add Delivery Address" : "Delivery Address"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isAddingNew
                  ? "Pin exact delivery point for turn-by-turn navigation"
                  : "Choose where your materials should be delivered"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {isAddingNew ? (
              <View style={styles.form}>
                {error ? (
                  <View style={styles.errorBanner}>
                    <AlertCircle size={14} color={COLORS.accentRed} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Search Address Bar */}
                <View style={styles.searchContainer}>
                  <Search size={16} color={COLORS.textTertiary} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search apartment, building, road, area..."
                    placeholderTextColor={COLORS.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {isSearching && <ActivityIndicator size="small" color={COLORS.primary} />}
                </View>

                {/* Autocomplete Results Dropdown */}
                {searchResults.length > 0 && (
                  <View style={styles.searchDropdown}>
                    {searchResults.map((res, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.searchResultItem}
                        onPress={() => handleSelectSearchResult(res)}
                      >
                        <MapPin size={15} color={COLORS.secondary} style={{ marginTop: 2 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.searchResultTitle}>
                            {res.street || res.area || "Location Point"}
                          </Text>
                          <Text style={styles.searchResultSub} numberOfLines={2}>
                            {res.formattedAddress}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* GPS Trigger Button */}
                <TouchableOpacity
                  style={styles.gpsButton}
                  onPress={handleDetectGps}
                  disabled={locatingGps}
                  activeOpacity={0.88}
                >
                  {locatingGps ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Navigation size={16} color="#fff" />
                  )}
                  <Text style={styles.gpsButtonText}>
                    {locatingGps ? "Detecting Satellite GPS..." : "Use Current GPS Location"}
                  </Text>
                </TouchableOpacity>

                {/* ── INTERACTIVE MAP VIEW WITH DRAGGABLE PIN ── */}
                <InteractiveLocationMap
                  latitude={coords.lat}
                  longitude={coords.lng}
                  accuracy={accuracy}
                  onLocationChange={handleMapLocationChange}
                  onRecenter={handleDetectGps}
                  height={220}
                />

                {/* Detected Location Status Banner */}
                <View style={styles.detectedStatusCard}>
                  <View style={styles.detectedStatusHeader}>
                    <View style={styles.detectedStatusRow}>
                      <CheckCircle2 size={15} color="#10b981" />
                      <Text style={styles.detectedStatusTitle}>Delivery Point Selected</Text>
                    </View>
                    <View
                      style={[
                        styles.accuracyPill,
                        { borderColor: getAccuracyBadge().color + "40" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.accuracyPillText,
                          { color: getAccuracyBadge().color },
                        ]}
                      >
                        {getAccuracyBadge().text}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.detectedStatusSummary}>
                    {reverseGeocoding
                      ? "Fetching address details..."
                      : detectedSummary || `${area || "Bangalore"}, ${city}`}
                  </Text>
                </View>

                {/* Address Type Selector */}
                <Text style={styles.inputLabel}>Address Type</Text>
                <View style={styles.labelRow}>
                  {[
                    { key: "Home", icon: Home },
                    { key: "Work", icon: Briefcase },
                    { key: "Site", icon: HardHat },
                    { key: "Other", icon: Building },
                  ].map(({ key, icon: Icon }) => (
                    <TouchableOpacity
                      key={key}
                      style={[styles.labelBtn, label === key && styles.labelBtnActive]}
                      onPress={() => setLabel(key as any)}
                    >
                      <Icon
                        size={14}
                        color={label === key ? COLORS.textWhite : COLORS.textSecondary}
                      />
                      <Text
                        style={[
                          styles.labelText,
                          label === key && styles.labelTextActive,
                        ]}
                      >
                        {key}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Contact Fields */}
                <View style={styles.fieldRow}>
                  <View style={styles.fieldHalf}>
                    <Text style={styles.inputLabel}>Recipient Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. IntriHub"
                      placeholderTextColor={COLORS.textTertiary}
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>
                  <View style={styles.fieldHalf}>
                    <Text style={styles.inputLabel}>Phone Number *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="10-digit mobile"
                      placeholderTextColor={COLORS.textTertiary}
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>
                </View>

                {/* Doorstep Precision Fields */}
                <View style={styles.fieldRow}>
                  <View style={styles.fieldHalf}>
                    <Text style={styles.inputLabel}>House / Flat / Shop No.</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Flat 402"
                      placeholderTextColor={COLORS.textTertiary}
                      value={houseNumber}
                      onChangeText={setHouseNumber}
                    />
                  </View>
                  <View style={styles.fieldHalf}>
                    <Text style={styles.inputLabel}>Floor (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 4th Floor"
                      placeholderTextColor={COLORS.textTertiary}
                      value={floor}
                      onChangeText={setFloor}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Building / Apartment / Project Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Kumari Elite Apartment / Sobha Daffodil"
                    placeholderTextColor={COLORS.textTertiary}
                    value={buildingName}
                    onChangeText={setBuildingName}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Street / Road *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 24th Main Road, Sector 2"
                    placeholderTextColor={COLORS.textTertiary}
                    value={street}
                    onChangeText={setStreet}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Area / Locality / Sector</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. HSR Layout"
                    placeholderTextColor={COLORS.textTertiary}
                    value={area}
                    onChangeText={setArea}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Nearby Landmark</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Opposite BDA Complex Gate 2"
                    placeholderTextColor={COLORS.textTertiary}
                    value={landmark}
                    onChangeText={setLandmark}
                  />
                </View>

                <View style={styles.fieldRow}>
                  <View style={styles.fieldHalf}>
                    <Text style={styles.inputLabel}>City *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Bengaluru"
                      placeholderTextColor={COLORS.textTertiary}
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>
                  <View style={styles.fieldHalf}>
                    <Text style={styles.inputLabel}>PIN Code *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="6-digit PIN"
                      placeholderTextColor={COLORS.textTertiary}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={pincode}
                      onChangeText={setPincode}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Delivery Instructions (For Driver)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="e.g. Call before entering gate, heavy tiles unloading site"
                    placeholderTextColor={COLORS.textTertiary}
                    multiline
                    numberOfLines={2}
                    value={deliveryInstructions}
                    onChangeText={setDeliveryInstructions}
                  />
                </View>

                {/* Form Action Buttons */}
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setIsAddingNew(false)}
                  >
                    <Text style={styles.cancelBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSaveAddress}
                    disabled={loading}
                    activeOpacity={0.88}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save Delivery Address</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Saved Address List */
              <View style={styles.addressList}>
                <TouchableOpacity
                  style={styles.addNewBtn}
                  onPress={() => setIsAddingNew(true)}
                  activeOpacity={0.85}
                >
                  <Plus size={18} color={COLORS.primary} />
                  <Text style={styles.addNewText}>Add New Delivery Address</Text>
                </TouchableOpacity>

                {addresses.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MapPin size={40} color={COLORS.textTertiary} />
                    <Text style={styles.emptyTitle}>No saved addresses</Text>
                    <Text style={styles.emptySub}>
                      Add your site, home or shop address to place material orders
                    </Text>
                  </View>
                ) : (
                  addresses.map((addr: Address) => {
                    const isSelected = selectedAddress?.id === addr.id;
                    return (
                      <TouchableOpacity
                        key={addr.id}
                        style={[
                          styles.addressCard,
                          isSelected && styles.addressCardSelected,
                        ]}
                        onPress={() => handleSelect(addr)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.addressCardHeader}>
                          <View style={styles.labelBadge}>
                            <Text style={styles.labelBadgeText}>
                              {addr.label || "Address"}
                            </Text>
                          </View>
                          {isSelected && (
                            <View style={styles.selectedBadge}>
                              <Check size={12} color="#fff" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.addressName}>{addr.fullName}</Text>
                        <Text style={styles.addressDetails}>
                          {[
                            addr.houseNumber,
                            addr.buildingName,
                            addr.street,
                            addr.area,
                            addr.city,
                            addr.pincode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </Text>
                        <Text style={styles.addressPhone}>Phone: {addr.phone}</Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: "92%",
    minHeight: "55%",
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
  },
  form: {
    paddingBottom: SPACING.xl,
  },
  addressList: {
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  content: {
    padding: SPACING.lg,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 13,
    color: COLORS.text,
  },
  searchDropdown: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    maxHeight: 180,
    ...SHADOWS.sm,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  searchResultTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  searchResultSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  gpsButtonText: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: "700",
  },
  detectedStatusCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  detectedStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detectedStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detectedStatusTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#166534",
  },
  detectedStatusSummary: {
    fontSize: 11,
    color: "#15803d",
    fontWeight: "500",
  },
  accuracyPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    backgroundColor: "#ffffff",
  },
  accuracyPillText: {
    fontSize: 9,
    fontWeight: "800",
  },
  labelRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: SPACING.md,
  },
  labelBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  labelBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  labelText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  labelTextActive: {
    color: COLORS.textWhite,
  },
  fieldRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  fieldHalf: {
    flex: 1,
  },
  field: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    fontSize: 12,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  textArea: {
    height: 60,
    paddingTop: 8,
    textAlignVertical: "top",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef2f2",
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    fontSize: 11,
    color: COLORS.accentRed,
    fontWeight: "600",
  },
  formActions: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textWhite,
  },
  addNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceSecondary,
    marginBottom: SPACING.md,
  },
  addNewText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  emptySub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  addressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  addressCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#f8fafc",
  },
  addressCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  labelBadge: {
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  labelBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
  },
  selectedBadge: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addressName: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 2,
  },
  addressDetails: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
});
