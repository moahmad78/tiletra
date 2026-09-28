import React, { useState, useEffect } from "react";
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
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import {
  X,
  Plus,
  Check,
  MapPin,
  Building,
  Home,
  Briefcase,
  HardHat,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Navigation,
} from "lucide-react-native";
import * as Location from "expo-location";
import { Address } from "../types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { useAuthStore } from "../store/authStore";
import { updateProfile } from "../api/auth";
import { GOOGLE_MAPS_API_KEY } from "../constants/config";
import { MapPickerModal, PickedLocation } from "./MapPickerModal";

// Authentic Google Maps 4-color Pin Icon
export const GoogleMapsIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path
      d="M24 4C14.06 4 6 12.06 6 22c0 7.7 5.02 14.23 12.06 16.71L24 44l5.94-5.29C36.98 36.23 42 29.7 42 22c0-9.94-8.06-18-18-18z"
      fill="#EA4335"
    />
    <Path
      d="M24 4c-9.94 0-18 8.06-18 18 0 7.7 5.02 14.23 12.06 16.71L24 44V22H6.1c.14-1.39.46-2.73.95-4L24 4z"
      fill="#4285F4"
    />
    <Path
      d="M24 4v18h17.9c-.14-1.39-.46-2.73-.95-4L24 4z"
      fill="#FBBC04"
    />
    <Path
      d="M24 22v22l5.94-5.29C36.98 36.23 42 29.7 42 22H24z"
      fill="#34A853"
    />
    <Circle cx="24" cy="22" r="7" fill="#ffffff" />
  </Svg>
);

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
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showManualAreaEdit, setShowManualAreaEdit] = useState(false);

  // Form Fields
  const [label, setLabel] = useState<"Home" | "Work" | "Site" | "Other">("Home");
  const [fullName, setFullName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone?.replace(/\D/g, "").slice(-10) || "");
  const [houseNumber, setHouseNumber] = useState("");
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

  // ── 1-CLICK AUTOMATIC ADDRESS DETECTION (GPS + GOOGLE MAPS) ──
  const handleUseCurrentLocation = async () => {
    try {
      setDetectingLocation(true);
      setError("");

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission",
          "Please allow location access to auto-detect your delivery address via Google Maps."
        );
        setDetectingLocation(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;

      let detectedStreet = "";
      let detectedArea = "";
      let detectedCity = "Bengaluru";
      let detectedState = "Karnataka";
      let detectedPincode = "";
      let detectedHouse = "";
      let detectedLandmark = "";

      // 1. Google Maps Geocoding API
      let googleSuccess = false;
      if (GOOGLE_MAPS_API_KEY) {
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&region=in`
          );
          const data = await res.json();
          if (data.status === "OK" && data.results?.[0]) {
            const result = data.results[0];
            for (const comp of result.address_components || []) {
              const types = comp.types || [];
              if (types.includes("street_number")) detectedHouse = comp.long_name;
              if (types.includes("route")) detectedStreet = comp.long_name;
              if (types.includes("sublocality_level_1") || types.includes("neighborhood")) {
                detectedArea = comp.long_name;
              } else if (types.includes("sublocality_level_2") && !detectedArea) {
                detectedArea = comp.long_name;
              }
              if (types.includes("point_of_interest") || types.includes("establishment")) {
                detectedLandmark = comp.long_name;
              }
              if (types.includes("postal_code")) detectedPincode = comp.long_name;
              if (types.includes("locality")) {
                detectedCity = comp.long_name;
              } else if (!detectedCity && (types.includes("administrative_area_level_2") || types.includes("postal_town"))) {
                detectedCity = comp.long_name;
              }
              if (types.includes("administrative_area_level_1")) detectedState = comp.long_name;
            }
            googleSuccess = true;
          }
        } catch (gErr) {
          console.warn("Google reverse-geocode failed, using native:", gErr);
        }
      }

      // 2. Fallback to native reverse geocode if needed
      if (!googleSuccess || (!detectedStreet && !detectedArea)) {
        try {
          const [nativeAddr] = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (nativeAddr) {
            detectedStreet = nativeAddr.street || nativeAddr.name || detectedStreet;
            detectedArea = nativeAddr.subregion || nativeAddr.district || detectedArea;
            if (nativeAddr.city) detectedCity = nativeAddr.city;
            if (nativeAddr.region) detectedState = nativeAddr.region;
            if (nativeAddr.postalCode) detectedPincode = nativeAddr.postalCode;
          }
        } catch (nErr) {
          console.warn("Native reverse-geocode error:", nErr);
        }
      }

      if (detectedStreet) setStreet(detectedStreet);
      if (detectedArea) setArea(detectedArea);
      if (detectedCity) setCity(detectedCity);
      if (detectedState) setState(detectedState);
      if (detectedPincode) setPincode(detectedPincode);
      if (detectedHouse && !houseNumber) setHouseNumber(detectedHouse);
      if (detectedLandmark && !landmark) setLandmark(detectedLandmark);

      setIsAddingNew(true);
    } catch (err: any) {
      console.error("Auto detect address error:", err);
      Alert.alert("Location Detection", "Could not get current address. Please enter manually.");
    } finally {
      setDetectingLocation(false);
    }
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
    if (!houseNumber.trim() && !street.trim() && !area.trim()) {
      setError("Please enter flat / house / building name");
      return;
    }
    if (!city.trim()) {
      setError("Please select city or detect location");
      return;
    }
    if (!pincode.trim() || pincode.replace(/\D/g, "").length < 6) {
      setError("Please enter a valid 6-digit PIN code");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formatted = [
        houseNumber.trim(),
        street.trim(),
        area.trim(),
        landmark.trim() ? `Near ${landmark.trim()}` : null,
        city.trim(),
        pincode.trim(),
      ]
        .filter(Boolean)
        .join(", ");

      const newAddressPayload: Address = {
        id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        fullName: fullName.trim(),
        phone: phone.trim(),
        label,
        houseNumber: houseNumber.trim() || undefined,
        street: street.trim() || area.trim(),
        area: area.trim() || undefined,
        landmark: landmark.trim() || undefined,
        city: city.trim(),
        district: city.trim(),
        state: state.trim() || "Karnataka",
        country: "India",
        pincode: pincode.trim(),
        postalCode: pincode.trim(),
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        formattedAddress: formatted,
        isDefault: addresses.length === 0,
        addressLine1: [houseNumber.trim(), street.trim()].filter(Boolean).join(", "),
        addressLine2: [area.trim(), landmark.trim()].filter(Boolean).join(", "),
      };

      // Update auth store addresses
      const updatedAddresses = [...addresses, newAddressPayload];
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({ ...currentUser, addresses: updatedAddresses });
      }
      try {
        await updateProfile({ addresses: updatedAddresses } as any);
      } catch (syncErr) {
        console.warn("Could not sync address to backend:", syncErr);
      }

      // Automatically select newly saved address
      handleSelect(newAddressPayload);
      setIsAddingNew(false);
    } catch (err: any) {
      console.error("Save address error:", err);
      setError(err?.message || "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>
                {isAddingNew ? "Add Delivery Address" : "Select Delivery Address"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isAddingNew
                  ? "Where should your materials be delivered?"
                  : "Choose delivery location for orders"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {isAddingNew ? (
              <View style={styles.form}>
                {/* 1. Google Maps Verified Location Card */}
                <View style={styles.googleMapsCard}>
                  <View style={styles.googleMapsCardHeader}>
                    <View style={styles.googleBrandRow}>
                      <GoogleMapsIcon size={18} />
                      <Text style={styles.googleBrandText}>Google Maps</Text>
                      <View style={styles.verifiedDot} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.changeOnMapBtn}
                      onPress={() => setShowMapPicker(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.changeOnMapBtnText}>Change on Map</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.googleLocationDetails}>
                    <Text style={styles.googleAreaTitle} numberOfLines={1}>
                      {area || street || "Location Selected"}
                    </Text>
                    <Text style={styles.googleSubText} numberOfLines={2}>
                      {[street, area, city, pincode ? `PIN ${pincode}` : null]
                        .filter(Boolean)
                        .join(", ") || "Tap Change on Map to pick exact site"}
                    </Text>
                  </View>
                </View>

                {error ? (
                  <View style={styles.errorBanner}>
                    <AlertCircle size={14} color={COLORS.accentRed} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* 2. Primary Doorstep Input */}
                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Flat / House / Building *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Flat 402, 4th Floor, Sobha Daffodil"
                    placeholderTextColor={COLORS.textTertiary}
                    value={houseNumber}
                    onChangeText={setHouseNumber}
                  />
                </View>

                {/* 3. Nearby Landmark */}
                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Nearby Landmark (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Near BDA Complex / Gate 2"
                    placeholderTextColor={COLORS.textTertiary}
                    value={landmark}
                    onChangeText={setLandmark}
                  />
                </View>

                {/* 4. Save Address As (Chips) */}
                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Save Address As</Text>
                  <View style={styles.labelRow}>
                    {[
                      { key: "Home", icon: Home, label: "Home" },
                      { key: "Work", icon: Briefcase, label: "Work" },
                      { key: "Site", icon: HardHat, label: "Site" },
                      { key: "Other", icon: Building, label: "Other" },
                    ].map(({ key, icon: Icon, label: itemLabel }) => (
                      <TouchableOpacity
                        key={key}
                        style={[styles.labelBtn, label === key && styles.labelBtnActive]}
                        onPress={() => setLabel(key as any)}
                        activeOpacity={0.8}
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
                          {itemLabel}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 5. Contact Details (Compact Row) */}
                <View style={styles.fieldRow}>
                  <View style={styles.fieldHalf}>
                    <Text style={styles.inputLabel}>Recipient Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Name"
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

                {/* 6. Expandable Manual Area/City/PIN Override */}
                <TouchableOpacity
                  style={styles.accordionToggle}
                  onPress={() => setShowManualAreaEdit(!showManualAreaEdit)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.accordionToggleText}>
                    {showManualAreaEdit ? "Hide full address details" : "Edit street, city or PIN code"}
                  </Text>
                  {showManualAreaEdit ? (
                    <ChevronUp size={15} color={COLORS.primary} />
                  ) : (
                    <ChevronDown size={15} color={COLORS.primary} />
                  )}
                </TouchableOpacity>

                {showManualAreaEdit && (
                  <View style={styles.manualAreaBox}>
                    <View style={styles.field}>
                      <Text style={styles.inputLabel}>Street / Road</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Street name"
                        placeholderTextColor={COLORS.textTertiary}
                        value={street}
                        onChangeText={setStreet}
                      />
                    </View>
                    <View style={styles.field}>
                      <Text style={styles.inputLabel}>Area / Locality</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Area name"
                        placeholderTextColor={COLORS.textTertiary}
                        value={area}
                        onChangeText={setArea}
                      />
                    </View>
                    <View style={styles.fieldRow}>
                      <View style={styles.fieldHalf}>
                        <Text style={styles.inputLabel}>City</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="City"
                          placeholderTextColor={COLORS.textTertiary}
                          value={city}
                          onChangeText={setCity}
                        />
                      </View>
                      <View style={styles.fieldHalf}>
                        <Text style={styles.inputLabel}>PIN Code</Text>
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
                  </View>
                )}

                {/* 7. Action Buttons */}
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setIsAddingNew(false)}
                    activeOpacity={0.8}
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
                {/* 1. Google Maps Choice Card */}
                <TouchableOpacity
                  style={styles.googleMapsHeroCard}
                  onPress={() => setShowMapPicker(true)}
                  activeOpacity={0.88}
                >
                  <View style={styles.googleMapsHeroIconWrap}>
                    <GoogleMapsIcon size={24} />
                  </View>
                  <View style={styles.heroTextContainer}>
                    <View style={styles.heroTitleRow}>
                      <Text style={styles.heroTitle}>Choose on Google Maps</Text>
                      <View style={styles.googleBadge}>
                        <Text style={styles.googleBadgeText}>MAP PIN</Text>
                      </View>
                    </View>
                    <Text style={styles.heroSubtitle}>
                      Drag pin to select exact building, gate or site
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 2. Auto-Detect Current GPS Location */}
                <TouchableOpacity
                  style={styles.detectLocationHeroCard}
                  onPress={handleUseCurrentLocation}
                  disabled={detectingLocation}
                  activeOpacity={0.88}
                >
                  <View style={styles.detectLocationIconWrap}>
                    {detectingLocation ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Navigation size={20} color={COLORS.primary} />
                    )}
                  </View>
                  <View style={styles.heroTextContainer}>
                    <View style={styles.heroTitleRow}>
                      <Text style={styles.detectHeroTitle}>Use Current Location</Text>
                      <View style={styles.oneClickBadge}>
                        <Sparkles size={9} color="#fff" />
                        <Text style={styles.oneClickBadgeText}>1-CLICK</Text>
                      </View>
                    </View>
                    <Text style={styles.detectHeroSubtitle}>
                      {detectingLocation
                        ? "Detecting via Google Maps..."
                        : "Auto-detects street, area, city & PIN code"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 3. Manual Add Button */}
                <TouchableOpacity
                  style={styles.addNewBtn}
                  onPress={() => {
                    setIsAddingNew(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Plus size={16} color={COLORS.textSecondary} />
                  <Text style={styles.addNewText}>Enter Address Manually</Text>
                </TouchableOpacity>

                {/* Saved Address Cards */}
                {addresses.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MapPin size={36} color={COLORS.textTertiary} />
                    <Text style={styles.emptyTitle}>No saved addresses</Text>
                    <Text style={styles.emptySub}>
                      Add your site, home or shop address to place orders
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
                            addr.landmark ? `Near ${addr.landmark}` : null,
                            addr.city,
                            addr.pincode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </Text>
                        <Text style={styles.addressPhone}>Phone: +91 {addr.phone}</Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Interactive Google Map Picker Modal */}
      <MapPickerModal
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onConfirmLocation={(loc) => {
          if (loc.street) setStreet(loc.street);
          if (loc.area) setArea(loc.area);
          if (loc.city) setCity(loc.city);
          if (loc.state) setState(loc.state);
          if (loc.pincode) setPincode(loc.pincode);
          if (loc.houseNumber && !houseNumber) setHouseNumber(loc.houseNumber);
          if (loc.landmark && !landmark) setLandmark(loc.landmark);
          setIsAddingNew(true);
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: "92%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  form: {
    paddingBottom: SPACING.xxl,
  },
  googleMapsCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: SPACING.md,
  },
  googleMapsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  googleBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  googleBrandText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
  },
  verifiedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#94A3B8",
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#16A34A",
  },
  changeOnMapBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#EFF6FF",
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  changeOnMapBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
  },
  googleLocationDetails: {
    marginTop: 2,
  },
  googleAreaTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  googleSubText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: "#FEE2E2",
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.accentRed,
    fontWeight: "600",
    flex: 1,
  },
  field: {
    marginBottom: SPACING.md,
  },
  fieldRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  fieldHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    fontSize: 13,
    color: COLORS.text,
  },
  labelRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  labelBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 38,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  labelBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  labelText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  labelTextActive: {
    color: COLORS.textWhite,
  },
  accordionToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    marginBottom: SPACING.sm,
  },
  accordionToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  manualAreaBox: {
    backgroundColor: "#F8FAFC",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formActions: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  saveBtn: {
    flex: 2,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accentOrange,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textWhite,
  },
  addressList: {
    paddingBottom: SPACING.xxl,
  },
  googleMapsHeroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    ...SHADOWS.sm,
  },
  googleMapsHeroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  googleBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  googleBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  detectLocationHeroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  detectLocationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  detectHeroTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  oneClickBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  oneClickBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },
  detectHeroSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.md,
  },
  addNewText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: SPACING.xl,
  },
  addressCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addressCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: "#EFF6FF",
  },
  addressCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  labelBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  labelBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
  },
  selectedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addressName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  addressDetails: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  addressPhone: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
});
