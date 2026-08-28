import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ShieldCheck, Store, Phone, Mail } from "lucide-react-native";
import { fetchAdminVendorDetail, updateAdminVendor } from "../../../src/api/admin";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../../src/constants/theme";

export default function AdminVendorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState("approved");
  const [commissionRate, setCommissionRate] = useState("10");
  const [verified, setVerified] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-vendor-detail", id],
    queryFn: () => fetchAdminVendorDetail(id),
    enabled: Boolean(id),
  });

  const vendor = data?.vendor;

  useEffect(() => {
    if (vendor) {
      setStatus(vendor.status || "approved");
      setCommissionRate(vendor.commissionRate ? String(vendor.commissionRate) : "10");
      setVerified(Boolean(vendor.verified));
    }
  }, [vendor]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => updateAdminVendor(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vendor-detail", id] });
      Alert.alert("Success", "Vendor partner settings updated!");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to update vendor");
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      status,
      commissionRate: Number(commissionRate) || 10,
      verified,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accentBlue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Vendor Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Vendor Header Card */}
        <View style={styles.headerCard}>
          <Text style={styles.vendorName}>{vendor?.businessName}</Text>
          <Text style={styles.vendorCategory}>{vendor?.category || "Building Supplies"}</Text>
          <Text style={styles.vendorMeta}>Registered on: {new Date(vendor?.createdAt).toLocaleDateString("en-IN")}</Text>
        </View>

        {/* Status Selector */}
        <Text style={styles.sectionLabel}>Account Status</Text>
        <View style={styles.statusGrid}>
          {["approved", "pending", "suspended", "rejected"].map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.statusChip, status === st && styles.statusChipActive]}
              onPress={() => setStatus(st)}
            >
              <Text style={[styles.statusChipText, status === st && styles.textWhite]}>
                {st.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Commission Rate */}
        <Text style={styles.sectionLabel}>Platform Commission Rate (%)</Text>
        <TextInput
          style={styles.textInput}
          value={commissionRate}
          onChangeText={setCommissionRate}
          keyboardType="numeric"
          placeholder="e.g. 10"
        />

        {/* Verified Badge */}
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleTitle}>Verified Partner Badge</Text>
            <Text style={styles.toggleSub}>Shows verified green checkmark across customer apps</Text>
          </View>
          <Switch
            value={verified}
            onValueChange={setVerified}
            trackColor={{ false: COLORS.border, true: COLORS.accentGreen }}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <CheckCircle2 size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Save Vendor Settings</Text>
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
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryDark,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textWhite,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
  },
  vendorCategory: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  vendorMeta: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
    marginTop: SPACING.sm,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: SPACING.md,
  },
  statusChip: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusChipActive: {
    backgroundColor: COLORS.accentBlue,
    borderColor: COLORS.accentBlue,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },
  textWhite: {
    color: "#fff",
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  toggleSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    maxWidth: 240,
    marginTop: 2,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accentBlue,
    borderRadius: RADIUS.lg,
    paddingVertical: 15,
    gap: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
