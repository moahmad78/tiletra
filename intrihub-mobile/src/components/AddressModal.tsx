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
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Navigation,
  Edit3,
  Trash2,
  ArrowLeft,
  Search,
} from "lucide-react-native";
import * as Location from "expo-location";
import { Address } from "../types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { useAuthStore } from "../store/authStore";
import { useLocationStore } from "../store/locationStore";
import { GOOGLE_MAPS_API_KEY } from "../constants/config";
import { MapPickerModal, PickedLocation } from "./MapPickerModal";
import { apiClient } from "../api/client";
import { getOrders } from "../api/orders";

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
  const [savedAddresses, setSavedAddresses] = useState<Address[]>(user?.addresses || []);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
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

  // ── Blinkit-Style Address Search State ──
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [addressPredictions, setAddressPredictions] = useState<
    Array<{ placeId: string; description: string; mainText: string; secondaryText: string; latitude?: number; longitude?: number }>
  >([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressPredictions, setShowAddressPredictions] = useState(false);
  const addressSearchDebounceRef = useRef<any>(null);

  const handleAddressSearchChange = (text: string) => {
    setAddressSearchQuery(text);
    if (!text.trim() || text.length < 2) {
      setAddressPredictions([]);
      setShowAddressPredictions(false);
      return;
    }

    if (addressSearchDebounceRef.current) clearTimeout(addressSearchDebounceRef.current);
    addressSearchDebounceRef.current = setTimeout(async () => {
      try {
        setIsSearchingAddress(true);
        const res = await apiClient.get("/api/geo/autocomplete", {
          params: { input: text },
        });
        if (res.data?.success && Array.isArray(res.data.predictions)) {
          setAddressPredictions(res.data.predictions);
          setShowAddressPredictions(true);
        }
      } catch (err) {
        console.warn("Mobile address search error:", err);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 250);
  };

  const handleSelectSearchedAddress = async (prediction: {
    placeId: string;
    mainText: string;
    description: string;
    latitude?: number;
    longitude?: number;
  }) => {
    setShowAddressPredictions(false);
    setAddressSearchQuery("");
    try {
      setLoading(true);

      if (prediction.latitude && prediction.longitude) {
        setStreet(prediction.mainText);
        setArea("");
        setLatitude(prediction.latitude);
        setLongitude(prediction.longitude);
        setFormattedAddress(prediction.description);
        setIsAddingNew(true);
        return;
      }

      const res = await apiClient.get("/api/geo/place-details", {
        params: { placeId: prediction.placeId },
      });
      if (res.data?.success && res.data.location) {
        const loc = res.data.location;
        setStreet(loc.street || prediction.mainText);
        setArea(loc.area || "");
        setCity(loc.city || "Bengaluru");
        setState(loc.state || "Karnataka");
        setPincode(loc.pincode || "");
        setLatitude(loc.latitude || null);
        setLongitude(loc.longitude || null);
        setFormattedAddress(loc.formattedAddress || prediction.description);
        setIsAddingNew(true);
      }
    } catch (e) {
      console.warn("Failed to fetch searched place details:", e);
    } finally {
      setLoading(false);
    }
  };

  // Populate recipient defaults on open
  useEffect(() => {
    if (visible && user) {
      if (user.name && !fullName) setFullName(user.name);
      if (user.phone && !phone) setPhone(user.phone.replace(/\D/g, "").slice(-10));
    }
  }, [visible, user]);

  // Load saved addresses from server (/api/addresses) AND past orders
  useEffect(() => {
    if (!visible) return;

    let isMounted = true;
    const fetchAddresses = async () => {
      try {
        setLoadingAddresses(true);
        const combined: Address[] = [];
        const seenFingerprints = new Set<string>();

        const addAddressIfDistinct = (addr: Address) => {
          if (!addr) return;
          const streetStr = (addr.street || addr.area || "").trim();
          const pinStr = (addr.pincode || addr.postalCode || "").trim();
          const houseStr = (addr.houseNumber || "").trim();
          const areaStr = (addr.area || "").trim();
          const fp = `${houseStr}|${streetStr}|${areaStr}|${pinStr}`.toLowerCase();
          if (fp.length > 2 && !seenFingerprints.has(fp)) {
            seenFingerprints.add(fp);
            combined.push(addr);
          }
        };

        // 1. Fetch addresses from /api/addresses
        try {
          const res = await apiClient.get("/api/addresses");
          if (res.data?.success && Array.isArray(res.data.addresses)) {
            res.data.addresses.forEach(addAddressIfDistinct);
          }
        } catch (apiErr) {
          console.warn("AddressModal /api/addresses fetch notice:", apiErr);
        }

        // 2. Fetch past orders to include previous delivery addresses
        try {
          const ordersRes = await getOrders(1, 10);
          if (ordersRes?.success && Array.isArray(ordersRes.orders)) {
            for (const ord of ordersRes.orders) {
              const sAddr: any = ord.shippingAddress;
              const streetVal = ord.deliveryStreet || sAddr?.street || sAddr?.line1 || sAddr?.area || "";
              const pinVal = ord.deliveryPostalCode || sAddr?.postalCode || sAddr?.pincode || "";
              const houseVal = ord.deliveryHouseNumber || sAddr?.houseNumber || sAddr?.flatNumber || "";
              const areaVal = ord.deliveryArea || sAddr?.area || sAddr?.line2 || "";
              const landmarkVal = ord.deliveryLandmark || sAddr?.landmark || "";
              const cityVal = ord.deliveryCity || sAddr?.city || "Bengaluru";
              const stateVal = ord.deliveryState || sAddr?.state || "Karnataka";
              const nameVal = ord.deliveryName || sAddr?.fullName || ord.customerName;
              const phoneVal = ord.deliveryPhone || sAddr?.phone || ord.customerPhone;
              const formattedVal =
                ord.deliveryAddress ||
                sAddr?.formattedAddress ||
                [houseVal, streetVal, areaVal, cityVal, pinVal ? `PIN: ${pinVal}` : null]
                  .filter(Boolean)
                  .join(", ");

              if (streetVal || areaVal || houseVal || formattedVal) {
                addAddressIfDistinct({
                  id: `order_addr_${ord.id}`,
                  label: (sAddr?.label as string) || "Home",
                  fullName: nameVal,
                  phone: phoneVal,
                  houseNumber: houseVal || null,
                  buildingName: ord.deliveryBuildingName || sAddr?.buildingName || null,
                  street: streetVal || formattedVal,
                  area: areaVal || null,
                  landmark: landmarkVal || null,
                  city: cityVal,
                  state: stateVal,
                  country: "India",
                  pincode: pinVal || "560001",
                  postalCode: pinVal || "560001",
                  formattedAddress: formattedVal,
                  source: "ORDER",
                });
              }
            }
          }
        } catch (orderErr) {
          console.warn("AddressModal getOrders fetch notice:", orderErr);
        }

        // 3. User addresses from local auth store
        if (user?.addresses && Array.isArray(user.addresses)) {
          user.addresses.forEach(addAddressIfDistinct);
        }

        if (isMounted) {
          setSavedAddresses(combined);
          // Sync with auth store
          const currentUser = useAuthStore.getState().user;
          if (currentUser && combined.length > 0) {
            useAuthStore.getState().setUser({ ...currentUser, addresses: combined });
          }

          // If no address is currently selected, select default or first
          if (!useAuthStore.getState().selectedAddress && combined.length > 0) {
            const defaultAddr = combined.find((a) => a.isDefault) || combined[0];
            setSelectedAddress(defaultAddr);
          }
        }
      } catch (err) {
        console.warn("Error loading saved addresses:", err);
      } finally {
        if (isMounted) setLoadingAddresses(false);
      }
    };

    fetchAddresses();
    return () => {
      isMounted = false;
    };
  }, [visible]);

  const handleSelect = (addr: Address) => {
    setSelectedAddress(addr);
    onSelectAddress(addr);
    onClose();
  };

  const resetForm = () => {
    setEditingAddress(null);
    setLabel("Home");
    setFullName(user?.name || "");
    setPhone(user?.phone?.replace(/\D/g, "").slice(-10) || "");
    setHouseNumber("");
    setStreet("");
    setArea("");
    setLandmark("");
    setCity("Bengaluru");
    setState("Karnataka");
    setPincode("");
    setDeliveryInstructions("");
    setError("");
  };

  const handleStartEdit = (addr: Address) => {
    setEditingAddress(addr);
    setLabel((addr.label as any) || "Home");
    setFullName(addr.fullName || user?.name || "");
    setPhone(
      addr.phone
        ? addr.phone.replace(/\D/g, "").slice(-10)
        : user?.phone?.replace(/\D/g, "").slice(-10) || ""
    );
    setHouseNumber(addr.houseNumber || "");
    setStreet(addr.street || "");
    setArea(addr.area || "");
    setLandmark(addr.landmark || "");
    setCity(addr.city || "Bengaluru");
    setState(addr.state || "Karnataka");
    setPincode(addr.pincode || addr.postalCode || "");
    setDeliveryInstructions(addr.deliveryInstructions || "");
    setError("");
    setIsAddingNew(true);
  };

  const handleConfirmDelete = (addr: Address) => {
    Alert.alert(
      "Delete Address",
      `Are you sure you want to delete this ${addr.label || "saved"} address?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (!addr.id.startsWith("order_addr_") && !addr.id.startsWith("addr_")) {
                try {
                  await apiClient.delete(`/api/addresses/${addr.id}`);
                } catch (delErr) {
                  console.warn("Could not delete address on server:", delErr);
                }
              }

              const remaining = savedAddresses.filter((a) => a.id !== addr.id);
              setSavedAddresses(remaining);

              const currentUser = useAuthStore.getState().user;
              if (currentUser) {
                useAuthStore.getState().setUser({ ...currentUser, addresses: remaining });
              }

              if (selectedAddress?.id === addr.id) {
                const nextSelected = remaining.length > 0 ? remaining[0] : null;
                setSelectedAddress(nextSelected);
                if (nextSelected) {
                  onSelectAddress(nextSelected);
                }
              }
            } catch (err: any) {
              console.error("Delete address error:", err);
              Alert.alert("Error", "Could not delete address. Please try again.");
            }
          },
        },
      ]
    );
  };

  // ── INSTANT ZERO-WAIT AUTOMATIC ADDRESS DETECTION ──
  const handleUseCurrentLocation = async () => {
    try {
      resetForm();
      setDetectingLocation(true);
      setError("");

      const detected = await useLocationStore.getState().getQuickLocation();
      if (!detected) {
        Alert.alert(
          "Location Permission",
          "Please allow location access to auto-detect your delivery address via Google Maps."
        );
        setDetectingLocation(false);
        return;
      }

      if (detected.street) setStreet(detected.street);
      if (detected.area) setArea(detected.area);
      if (detected.city) setCity(detected.city);
      if (detected.state) setState(detected.state);
      if (detected.pincode) setPincode(detected.pincode);
      if (detected.houseNumber && !houseNumber) setHouseNumber(detected.houseNumber);
      if (detected.landmark && !landmark) setLandmark(detected.landmark);

      setIsAddingNew(true);
    } catch (err: any) {
      console.error("Auto detect address error:", err);
      Alert.alert("Location Detection", "Could not get current address. Please choose on Google Maps.");
    } finally {
      setDetectingLocation(false);
    }
  };

  // ── SAVE / UPDATE ADDRESS HANDLER ──
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

      const addressPayload: Address = {
        id: editingAddress?.id || `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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
        isDefault: editingAddress ? Boolean(editingAddress.isDefault) : savedAddresses.length === 0,
        addressLine1: [houseNumber.trim(), street.trim()].filter(Boolean).join(", "),
        addressLine2: [area.trim(), landmark.trim()].filter(Boolean).join(", "),
      };

      if (editingAddress) {
        // ── UPDATE MODE (PATCH /api/addresses/[id]) ──
        try {
          if (!editingAddress.id.startsWith("order_addr_") && !editingAddress.id.startsWith("addr_")) {
            await apiClient.patch(`/api/addresses/${editingAddress.id}`, {
              label: addressPayload.label,
              fullName: addressPayload.fullName,
              phone: addressPayload.phone,
              houseNumber: addressPayload.houseNumber,
              street: addressPayload.street,
              area: addressPayload.area,
              landmark: addressPayload.landmark,
              city: addressPayload.city,
              state: addressPayload.state,
              pincode: addressPayload.pincode,
              postalCode: addressPayload.postalCode,
              deliveryInstructions: addressPayload.deliveryInstructions,
              isDefault: addressPayload.isDefault,
            });
          } else {
            // For order address or temp address, save as a persistent address
            const res = await apiClient.post("/api/addresses", {
              label: addressPayload.label,
              fullName: addressPayload.fullName,
              phone: addressPayload.phone,
              houseNumber: addressPayload.houseNumber,
              street: addressPayload.street,
              area: addressPayload.area,
              landmark: addressPayload.landmark,
              city: addressPayload.city,
              state: addressPayload.state,
              pincode: addressPayload.pincode,
              postalCode: addressPayload.postalCode,
              deliveryInstructions: addressPayload.deliveryInstructions,
              isDefault: addressPayload.isDefault,
            });
            if (res.data?.success && res.data.address?.id) {
              addressPayload.id = res.data.address.id;
            }
          }
        } catch (syncErr) {
          console.warn("Could not patch address on server:", syncErr);
        }

        const updatedAddresses = savedAddresses.map((a) =>
          a.id === editingAddress.id ? addressPayload : a
        );
        setSavedAddresses(updatedAddresses);

        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().setUser({ ...currentUser, addresses: updatedAddresses });
        }

        handleSelect(addressPayload);
        setEditingAddress(null);
        setIsAddingNew(false);
      } else {
        // ── CREATE NEW MODE (POST /api/addresses) ──
        try {
          const res = await apiClient.post("/api/addresses", {
            label: addressPayload.label,
            fullName: addressPayload.fullName,
            phone: addressPayload.phone,
            houseNumber: addressPayload.houseNumber,
            street: addressPayload.street,
            area: addressPayload.area,
            landmark: addressPayload.landmark,
            city: addressPayload.city,
            state: addressPayload.state,
            pincode: addressPayload.pincode,
            postalCode: addressPayload.postalCode,
            deliveryInstructions: addressPayload.deliveryInstructions,
            isDefault: addressPayload.isDefault,
          });
          if (res.data?.success && res.data.address?.id) {
            addressPayload.id = res.data.address.id;
          }
        } catch (syncErr) {
          console.warn("Could not sync address to /api/addresses:", syncErr);
        }

        const updatedAddresses = [
          addressPayload,
          ...savedAddresses.filter((a) => a.id !== addressPayload.id),
        ];
        setSavedAddresses(updatedAddresses);

        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().setUser({ ...currentUser, addresses: updatedAddresses });
        }

        handleSelect(addressPayload);
        setIsAddingNew(false);
      }
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
            <View style={styles.headerTitleContainer}>
              {isAddingNew && (
                <TouchableOpacity
                  onPress={() => {
                    setIsAddingNew(false);
                    setEditingAddress(null);
                    setError("");
                  }}
                  style={styles.backBtn}
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={18} color={COLORS.text} />
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>
                  {editingAddress
                    ? "Edit Delivery Address"
                    : isAddingNew
                    ? "Add Delivery Address"
                    : "Select Delivery Address"}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {editingAddress
                    ? "Update your delivery location details"
                    : isAddingNew
                    ? "Where should your materials be delivered?"
                    : "Choose delivery location for orders"}
                </Text>
              </View>
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
                    onPress={() => {
                      setIsAddingNew(false);
                      setEditingAddress(null);
                      setError("");
                    }}
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
                      <Text style={styles.saveBtnText}>
                        {editingAddress ? "Update Delivery Address" : "Save Delivery Address"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Saved Address List */
              <View style={styles.addressList}>
                {/* 0. Blinkit-Style Address Search Input */}
                <View style={styles.addressSearchBarContainer}>
                  <View style={styles.addressSearchBar}>
                    <Search size={18} color={COLORS.textTertiary} />
                    <TextInput
                      style={styles.addressSearchInput}
                      placeholder="Search area, apartment, street (e.g. Indiranagar)..."
                      placeholderTextColor={COLORS.textTertiary}
                      value={addressSearchQuery}
                      onChangeText={handleAddressSearchChange}
                      returnKeyType="search"
                    />
                    {isSearchingAddress ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : addressSearchQuery ? (
                      <TouchableOpacity onPress={() => { setAddressSearchQuery(""); setAddressPredictions([]); setShowAddressPredictions(false); }}>
                        <X size={16} color={COLORS.textTertiary} />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Predictions List */}
                  {showAddressPredictions && addressPredictions.length > 0 && (
                    <View style={styles.searchPredictionsCard}>
                      {addressPredictions.map((p) => (
                        <TouchableOpacity
                          key={p.placeId}
                          style={styles.searchPredictionItem}
                          onPress={() => handleSelectSearchedAddress(p)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.searchPredictionIcon}>
                            <MapPin size={16} color={COLORS.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.searchPredictionMain} numberOfLines={1}>{p.mainText}</Text>
                            <Text style={styles.searchPredictionSub} numberOfLines={1}>{p.secondaryText || p.description}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* 1. Google Maps Card */}
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => {
                    resetForm();
                    setShowMapPicker(true);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={styles.actionIconWrapGoogle}>
                    <GoogleMapsIcon size={24} />
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Choose on Google Maps</Text>
                    <Text style={styles.actionSubtitle}>
                      Drag pin to select exact building, gate or site
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" />
                </TouchableOpacity>

                {/* 2. Auto-Detect Current GPS Location */}
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={handleUseCurrentLocation}
                  disabled={detectingLocation}
                  activeOpacity={0.75}
                >
                  <View style={styles.actionIconWrapGps}>
                    <Navigation size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Use Current Location</Text>
                    <Text style={styles.actionSubtitle}>
                      {detectingLocation
                        ? "Detecting address via GPS..."
                        : "Auto-detects street, area, city & PIN code"}
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" />
                </TouchableOpacity>

                {/* Section Header: Saved Addresses */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>SAVED ADDRESSES</Text>
                  {savedAddresses.length > 0 && (
                    <Text style={styles.sectionCount}>
                      {savedAddresses.length} saved
                    </Text>
                  )}
                </View>

                {/* Saved Address Cards */}
                {loadingAddresses ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading saved addresses...</Text>
                  </View>
                ) : savedAddresses.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconWrap}>
                      <MapPin size={26} color={COLORS.textTertiary} />
                    </View>
                    <Text style={styles.emptyTitle}>No saved addresses</Text>
                    <Text style={styles.emptySub}>
                      Select on Google Maps or use current location to place orders
                    </Text>
                  </View>
                ) : (
                  savedAddresses.map((addr: Address) => {
                    const isSelected =
                      selectedAddress?.id === addr.id ||
                      (selectedAddress?.pincode === addr.pincode &&
                        selectedAddress?.street === addr.street &&
                        Boolean(addr.street));

                    const LabelIcon =
                      addr.label === "Work"
                        ? Briefcase
                        : addr.label === "Site"
                        ? HardHat
                        : addr.label === "Other"
                        ? Building
                        : Home;

                    const formattedDisplay =
                      addr.formattedAddress ||
                      [
                        addr.houseNumber,
                        addr.buildingName,
                        addr.street,
                        addr.area,
                        addr.landmark ? `Near ${addr.landmark}` : null,
                        addr.city,
                        addr.pincode ? `PIN: ${addr.pincode}` : null,
                      ]
                        .filter(Boolean)
                        .join(", ");

                    return (
                      <View
                        key={addr.id}
                        style={[
                          styles.addressCard,
                          isSelected && styles.addressCardSelected,
                        ]}
                      >
                        <TouchableOpacity
                          onPress={() => handleSelect(addr)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.addressCardTopRow}>
                            <View style={styles.addressLabelChip}>
                              <LabelIcon size={13} color={COLORS.primary} />
                              <Text style={styles.addressLabelText}>
                                {addr.label || "Home"}
                              </Text>
                            </View>
                            {isSelected ? (
                              <View style={styles.selectedPill}>
                                <Check size={11} color="#fff" />
                                <Text style={styles.selectedPillText}>DELIVERING HERE</Text>
                              </View>
                            ) : (
                              <View style={styles.radioCircle} />
                            )}
                          </View>

                          {addr.fullName ? (
                            <Text style={styles.addressRecipient}>
                              {addr.fullName}
                              {addr.phone
                                ? ` • +91 ${addr.phone.replace(/\D/g, "").slice(-10)}`
                                : ""}
                            </Text>
                          ) : null}

                          <Text style={styles.addressDetails} numberOfLines={3}>
                            {formattedDisplay}
                          </Text>
                        </TouchableOpacity>

                        {/* Zepto/Blinkit Actions: Edit & Delete */}
                        <View style={styles.cardActionsFooter}>
                          <TouchableOpacity
                            style={styles.cardActionBtn}
                            onPress={() => handleStartEdit(addr)}
                            activeOpacity={0.7}
                          >
                            <Edit3 size={13} color={COLORS.primary} />
                            <Text style={styles.cardActionBtnText}>Edit</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.cardActionBtnDelete}
                            onPress={() => handleConfirmDelete(addr)}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={13} color="#EF4444" />
                            <Text style={styles.cardActionBtnDeleteText}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
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
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
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
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    ...SHADOWS.sm,
  },
  actionIconWrapGoogle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  actionIconWrapGps: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  actionSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 15,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.8,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 28,
  },
  emptyIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 16,
  },
  addressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    ...SHADOWS.sm,
  },
  addressCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#F8FAFC",
  },
  addressCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  addressLabelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  addressLabelText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.text,
    textTransform: "uppercase",
  },
  selectedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  selectedPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
  },
  addressRecipient: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  addressDetails: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  cardActionsFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 8,
  },
  cardActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  cardActionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  cardActionBtnDelete: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
  },
  cardActionBtnDeleteText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EF4444",
  },
  addressSearchBarContainer: {
    marginBottom: SPACING.md,
  },
  addressSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    ...SHADOWS.sm,
  },
  addressSearchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    paddingVertical: 0,
  },
  searchPredictionsCard: {
    backgroundColor: "#ffffff",
    borderRadius: RADIUS.lg,
    marginTop: 6,
    maxHeight: 260,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    ...SHADOWS.md,
  },
  searchPredictionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },
  searchPredictionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  searchPredictionMain: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },
  searchPredictionSub: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
});
