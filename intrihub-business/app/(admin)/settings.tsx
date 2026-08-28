import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Building2,
  Truck,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  FileText,
  IndianRupee,
  Save,
  Plus,
  X,
  AlertTriangle,
} from "lucide-react-native";
import { fetchAdminStoreSettings, updateAdminStoreSettings } from "../../src/api/admin";
import { StoreSettings } from "../../src/types";
import { COLORS, SPACING, RADIUS } from "../../src/constants/theme";

export default function AdminSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [storeName, setStoreName] = useState("Intrihub");
  const [gstNumber, setGstNumber] = useState("29AABCT1234F1Z8");
  const [contactPhone, setContactPhone] = useState("+91 78709 35277");
  const [whatsappNumber, setWhatsappNumber] = useState("+91 78709 35277");
  const [email, setEmail] = useState("support@intrihub.com");
  const [address, setAddress] = useState("Intrihub Central Supply Hub, Begur, Bangalore, Karnataka - 560114");

  // Shipping & Freight
  const [deliveryFeeEnabled, setDeliveryFeeEnabled] = useState(true);
  const [standardDeliveryFee, setStandardDeliveryFee] = useState("999");
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState("15000");
  const [bikeDeliveryRate, setBikeDeliveryRate] = useState("99");
  const [fourWheelerDeliveryRate, setFourWheelerDeliveryRate] = useState("349");
  const [weightThresholdKg, setWeightThresholdKg] = useState("20");
  const [lowStockThreshold, setLowStockThreshold] = useState("25");

  // COD Rules
  const [codEnabled, setCodEnabled] = useState(true);
  const [codMaxLimit, setCodMaxLimit] = useState("25000");
  const [pincodesList, setPincodesList] = useState<string[]>(["560099", "560088"]);
  const [newPincode, setNewPincode] = useState("");

  const loadData = useCallback(async () => {
    try {
      const res = await fetchAdminStoreSettings();
      if (res.success && res.settings) {
        const s: StoreSettings = res.settings;
        setStoreName(s.storeName || "Intrihub");
        setGstNumber(s.gstNumber || "");
        setContactPhone(s.contactPhone || "");
        setWhatsappNumber(s.whatsappNumber || "");
        setEmail(s.email || "");
        setAddress(s.address || "");

        setDeliveryFeeEnabled(s.deliveryFeeEnabled !== false);
        setStandardDeliveryFee(String(s.standardDeliveryFee ?? 999));
        setFreeDeliveryThreshold(String(s.freeDeliveryThreshold ?? 15000));
        setBikeDeliveryRate(String(s.bikeDeliveryRate ?? 99));
        setFourWheelerDeliveryRate(String(s.fourWheelerDeliveryRate ?? 349));
        setWeightThresholdKg(String(s.weightThresholdKg ?? 20));
        setLowStockThreshold(String(s.lowStockThreshold ?? 25));

        setCodEnabled(s.codEnabled !== false);
        setCodMaxLimit(String(s.codMaxLimit ?? 25000));
        setPincodesList(s.codBlockedPincodes || []);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddPincode = () => {
    const trimmed = newPincode.trim();
    if (!trimmed) return;
    if (pincodesList.includes(trimmed)) {
      Alert.alert("Already Added", `Pincode ${trimmed} is already in the restricted list.`);
      return;
    }
    setPincodesList([...pincodesList, trimmed]);
    setNewPincode("");
  };

  const handleRemovePincode = (pincode: string) => {
    setPincodesList(pincodesList.filter((p) => p !== pincode));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await updateAdminStoreSettings({
        storeName: storeName.trim(),
        gstNumber: gstNumber.trim().toUpperCase(),
        contactPhone: contactPhone.trim(),
        whatsappNumber: whatsappNumber.trim(),
        email: email.trim(),
        address: address.trim(),
        deliveryFeeEnabled,
        standardDeliveryFee: parseFloat(standardDeliveryFee) || 0,
        freeDeliveryThreshold: parseFloat(freeDeliveryThreshold) || 0,
        bikeDeliveryRate: parseFloat(bikeDeliveryRate) || 0,
        fourWheelerDeliveryRate: parseFloat(fourWheelerDeliveryRate) || 0,
        weightThresholdKg: parseFloat(weightThresholdKg) || 0,
        lowStockThreshold: parseInt(lowStockThreshold, 10) || 10,
        codEnabled,
        codMaxLimit: parseFloat(codMaxLimit) || 0,
        codBlockedPincodes: pincodesList,
      });

      if (res.success) {
        Alert.alert("Settings Saved", "Global store configuration and delivery fees updated!");
        loadData();
      } else {
        Alert.alert("Save Failed", res.error || "Failed to update settings.");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.accentBlue} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Global Store Settings</Text>
          <Text style={styles.headerSub}>Shipping charges, GST & COD guardrails</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accentBlue]} />}
      >
        {/* ── Section 1: Store Identity & Tax Info ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Building2 size={18} color={COLORS.accentOrange} />
            <Text style={styles.sectionHeading}>Store Identity & Tax (GST)</Text>
          </View>

          <Text style={styles.inputLabel}>Brand / Store Name:</Text>
          <TextInput
            style={styles.inputBox}
            value={storeName}
            onChangeText={setStoreName}
            placeholder="Intrihub"
            placeholderTextColor={COLORS.textTertiary}
          />

          <View style={styles.grid2}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Support Email:</Text>
              <TextInput
                style={styles.inputBox}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholder="support@intrihub.com"
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Platform GSTIN:</Text>
              <TextInput
                style={[styles.inputBox, { fontWeight: "800", textTransform: "uppercase" }]}
                value={gstNumber}
                onChangeText={(t) => setGstNumber(t.toUpperCase())}
                placeholder="29AABCT1234F1Z8"
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>
          </View>

          <View style={styles.grid2}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Primary Phone:</Text>
              <TextInput
                style={styles.inputBox}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
                placeholder="+91 78709 35277"
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { marginTop: 10 }]}>WhatsApp Desk:</Text>
              <TextInput
                style={styles.inputBox}
                value={whatsappNumber}
                onChangeText={setWhatsappNumber}
                keyboardType="phone-pad"
                placeholder="+91 78709 35277"
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>
          </View>

          <Text style={[styles.inputLabel, { marginTop: 10 }]}>Warehouse / HQ Address:</Text>
          <TextInput
            style={[styles.inputBox, { height: 60, textAlignVertical: "top", paddingTop: 8 }]}
            multiline
            value={address}
            onChangeText={setAddress}
            placeholder="Intrihub Central Supply Hub..."
            placeholderTextColor={COLORS.textTertiary}
          />
        </View>

        {/* ── Section 2: Shipping & Delivery Rules ── */}
        <View style={styles.sectionCard}>
          <View style={styles.toggleHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Truck size={18} color={COLORS.accentOrange} />
              <View>
                <Text style={styles.sectionHeading}>Shipping & Freight Rules</Text>
                <Text style={styles.sectionSub}>Manage delivery fees & free shipping slab</Text>
              </View>
            </View>
            <Switch
              value={deliveryFeeEnabled}
              onValueChange={setDeliveryFeeEnabled}
              trackColor={{ false: "#CBD5E1", true: "#F26522" }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Status Preview Card */}
          <View
            style={[
              styles.statusBanner,
              deliveryFeeEnabled
                ? { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }
                : { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
            ]}
          >
            <Text
              style={[
                styles.statusBannerTitle,
                { color: deliveryFeeEnabled ? "#1E40AF" : "#065F46" },
              ]}
            >
              {deliveryFeeEnabled
                ? "Delivery Charges are ACTIVE"
                : "100% Free Shipping Active Storewide"}
            </Text>
            <Text
              style={[
                styles.statusBannerSub,
                { color: deliveryFeeEnabled ? "#3B82F6" : "#059669" },
              ]}
            >
              {deliveryFeeEnabled
                ? `Standard freight fee of ₹${standardDeliveryFee} applies on orders under ₹${freeDeliveryThreshold}.`
                : "All customers receive ₹0 delivery fee across all categories."}
            </Text>
          </View>

          <View style={[styles.grid2, !deliveryFeeEnabled && { opacity: 0.5 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Standard Freight Fee (₹):</Text>
              <TextInput
                style={styles.inputBox}
                keyboardType="numeric"
                value={standardDeliveryFee}
                onChangeText={setStandardDeliveryFee}
                editable={deliveryFeeEnabled}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Free Shipping Threshold (₹):</Text>
              <TextInput
                style={styles.inputBox}
                keyboardType="numeric"
                value={freeDeliveryThreshold}
                onChangeText={setFreeDeliveryThreshold}
                editable={deliveryFeeEnabled}
              />
            </View>
          </View>

          {/* Vehicle Rates & Weights */}
          <Text style={[styles.subHeading, { marginTop: 14 }]}>Vehicle Weight Slabs (Auto Selected):</Text>
          <View style={styles.grid3}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>🛵 Bike Rate (₹):</Text>
              <TextInput
                style={styles.inputBox}
                keyboardType="numeric"
                value={bikeDeliveryRate}
                onChangeText={setBikeDeliveryRate}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>🚚 Truck Rate (₹):</Text>
              <TextInput
                style={styles.inputBox}
                keyboardType="numeric"
                value={fourWheelerDeliveryRate}
                onChangeText={setFourWheelerDeliveryRate}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>⚖️ Max Weight (kg):</Text>
              <TextInput
                style={styles.inputBox}
                keyboardType="numeric"
                value={weightThresholdKg}
                onChangeText={setWeightThresholdKg}
              />
            </View>
          </View>

          <View style={{ marginTop: 10 }}>
            <Text style={styles.inputLabel}>Low Stock Alert Threshold (Boxes):</Text>
            <TextInput
              style={styles.inputBox}
              keyboardType="numeric"
              value={lowStockThreshold}
              onChangeText={setLowStockThreshold}
            />
          </View>
        </View>

        {/* ── Section 3: Cash on Delivery (COD) Guardrails ── */}
        <View style={styles.sectionCard}>
          <View style={styles.toggleHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={18} color={COLORS.accentOrange} />
              <View>
                <Text style={styles.sectionHeading}>Cash on Delivery (COD) Rules</Text>
                <Text style={styles.sectionSub}>Set order limits & restricted zones</Text>
              </View>
            </View>
            <Switch
              value={codEnabled}
              onValueChange={setCodEnabled}
              trackColor={{ false: "#CBD5E1", true: "#F26522" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[!codEnabled && { opacity: 0.5 }]}>
            <Text style={styles.inputLabel}>Maximum Order Value for COD (₹):</Text>
            <TextInput
              style={styles.inputBox}
              keyboardType="numeric"
              value={codMaxLimit}
              onChangeText={setCodMaxLimit}
              editable={codEnabled}
            />
            <Text style={styles.helperText}>
              Orders above ₹{parseInt(codMaxLimit, 10)?.toLocaleString("en-IN") || 0} will enforce online prepaid checkout.
            </Text>

            {/* Blocked Pincodes Tag Manager */}
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Restricted COD Pincodes:</Text>
            <View style={styles.addPincodeRow}>
              <TextInput
                style={[styles.inputBox, { flex: 1 }]}
                keyboardType="numeric"
                maxLength={6}
                value={newPincode}
                onChangeText={setNewPincode}
                placeholder="Enter 6-digit pincode..."
                placeholderTextColor={COLORS.textTertiary}
                editable={codEnabled}
              />
              <TouchableOpacity
                style={styles.addPinBtn}
                onPress={handleAddPincode}
                disabled={!codEnabled}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.addPinBtnText}>Block</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pincodesTagsContainer}>
              {pincodesList.map((pin) => (
                <View key={pin} style={styles.pincodeTag}>
                  <Text style={styles.pincodeTagText}>{pin}</Text>
                  <TouchableOpacity
                    style={styles.removePinBtn}
                    onPress={() => handleRemovePincode(pin)}
                    disabled={!codEnabled}
                  >
                    <X size={12} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}
              {pincodesList.length === 0 && (
                <Text style={styles.noPinsText}>No pincodes restricted. COD is active everywhere.</Text>
              )}
            </View>
          </View>
        </View>

        {/* Global Save Button */}
        <TouchableOpacity
          style={styles.globalSaveBtn}
          onPress={handleSaveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Save size={18} color="#FFFFFF" />
              <Text style={styles.globalSaveBtnText}>Save Store Configuration</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#052A51",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  headerSub: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 12,
  },
  toggleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: "#052A51",
  },
  sectionSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  subHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  inputBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: COLORS.text,
  },
  grid2: {
    flexDirection: "row",
    gap: 10,
  },
  grid3: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  statusBanner: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  statusBannerTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  statusBannerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  helperText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 3,
  },
  addPincodeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  addPinBtn: {
    backgroundColor: "#DC2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 4,
  },
  addPinBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  pincodesTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  pincodeTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  pincodeTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },
  removePinBtn: {
    padding: 2,
  },
  noPinsText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontStyle: "italic",
  },
  globalSaveBtn: {
    backgroundColor: "#F26522",
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    shadowColor: "#F26522",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  globalSaveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
