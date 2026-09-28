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
} from "lucide-react-native";
import * as Location from "expo-location";
import { Address } from "../types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { useAuthStore } from "../store/authStore";
import { updateProfile } from "../api/auth";
import { GOOGLE_MAPS_API_KEY } from "../constants/config";

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
  const [detectedNotice, setDetectedNotice] = useState<string | null>(null);

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

  // ── 1-CLICK AUTOMATIC ADDRESS DETECTION (GPS + GOOGLE MAPS) ──
  const handleUseCurrentLocation = async () => {
    try {
      setDetectingLocation(true);
      setError("");
      setDetectedNotice(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please enable location access in device settings to automatically detect your address."
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
      if (detectedHouse) setHouseNumber(detectedHouse);
      if (detectedLandmark) setLandmark(detectedLandmark);

      setDetectedNotice("GPS Address detected! Review & add flat/floor details if needed.");
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

      const formatted = [
        houseNumber ? `Flat ${houseNumber}` : null,
        buildingName,
        street,
        area,
        city,
        pincode,
      ]
        .filter(Boolean)
        .join(", ");

      const newAddressPayload: Address = {
        id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        fullName: fullName.trim(),
        phone: phone.trim(),
        label,
        houseNumber: houseNumber.trim() || undefined,
        buildingName: buildingName.trim() || undefined,
        floor: floor.trim() || undefined,
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
        addressLine1: [houseNumber, buildingName, street].filter(Boolean).join(", "),
        addressLine2: [area, landmark].filter(Boolean).join(", "),
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
                {isAddingNew ? "Add Delivery Address" : "Delivery Address"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isAddingNew
                  ? "Enter accurate delivery details for swift material dispatch"
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
                {/* 1-Click Detect Location Bar inside form */}
                <TouchableOpacity
                  style={styles.detectLocationFormBtn}
                  onPress={handleUseCurrentLocation}
                  disabled={detectingLocation}
                  activeOpacity={0.85}
                >
                  {detectingLocation ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MapPin size={16} color="#fff" />
                  )}
                  <Text style={styles.detectLocationFormBtnText}>
                    {detectingLocation ? "Detecting GPS location..." : "Auto-Detect My Current Location"}
                  </Text>
                  <Sparkles size={14} color="#fde047" />
                </TouchableOpacity>

                {detectedNotice ? (
                  <View style={styles.successBanner}>
                    <Check size={14} color="#15803d" />
                    <Text style={styles.successText}>{detectedNotice}</Text>
                  </View>
                ) : null}

                {error ? (
                  <View style={styles.errorBanner}>
                    <AlertCircle size={14} color={COLORS.accentRed} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

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
                {/* 1-Click Use Current Location Banner */}
                <TouchableOpacity
                  style={styles.detectLocationHeroCard}
                  onPress={handleUseCurrentLocation}
                  disabled={detectingLocation}
                  activeOpacity={0.88}
                >
                  <View style={styles.detectLocationIconWrap}>
                    {detectingLocation ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <MapPin size={20} color="#fff" />
                    )}
                  </View>
                  <View style={styles.detectLocationTextContainer}>
                    <View style={styles.detectLocationTitleRow}>
                      <Text style={styles.detectLocationTitle}>Use Current Location</Text>
                      <View style={styles.oneClickBadge}>
                        <Sparkles size={10} color="#fff" />
                        <Text style={styles.oneClickBadgeText}>1-CLICK</Text>
                      </View>
                    </View>
                    <Text style={styles.detectLocationSubtitle}>
                      {detectingLocation
                        ? "Fetching GPS & reverse geocoding address..."
                        : "Auto-detects street, area, city & PIN code"}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.addNewBtn}
                  onPress={() => {
                    setDetectedNotice(null);
                    setIsAddingNew(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Plus size={18} color={COLORS.primary} />
                  <Text style={styles.addNewText}>Add New Delivery Address Manually</Text>
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
    maxHeight: "90%",
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  form: {
    paddingBottom: SPACING.xxl,
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
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  labelBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
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
  textArea: {
    height: 60,
    paddingTop: SPACING.sm,
    textAlignVertical: "top",
  },
  formActions: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.md,
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
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textWhite,
  },
  detectLocationFormBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  detectLocationFormBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  successText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#15803d",
    flex: 1,
  },
  addressList: {
    paddingBottom: SPACING.xxl,
  },
  detectLocationHeroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
    ...SHADOWS.md,
  },
  detectLocationIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  detectLocationTextContainer: {
    flex: 1,
  },
  detectLocationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detectLocationTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  oneClickBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  oneClickBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },
  detectLocationSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  addNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    marginBottom: SPACING.md,
  },
  addNewText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: 15,
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
