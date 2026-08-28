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
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { ArrowLeft, CheckCircle2, Trash2 } from "lucide-react-native";
import {
  fetchVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
} from "../../../src/api/vendor";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../../src/constants/theme";

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [pricePerBox, setPricePerBox] = useState("");
  const [pricePerSqft, setPricePerSqft] = useState("");
  const [stockBoxes, setStockBoxes] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "paused">("active");

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-product-detail", id],
    queryFn: () => fetchVendorProduct(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (data?.product) {
      const p = data.product;
      setName(p.name || "");
      setPricePerBox(p.pricePerBox ? String(p.pricePerBox) : "");
      setPricePerSqft(p.pricePerSqft ? String(p.pricePerSqft) : "");
      setStockBoxes(p.stockBoxes ? String(p.stockBoxes) : "0");
      setDescription(p.description || "");
      setStatus(p.status === "paused" ? "paused" : "active");
    }
  }, [data?.product]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => updateVendorProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      Alert.alert("Success", "Product updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.message || "Failed to update product");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVendorProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      Alert.alert("Deleted", "Product removed from catalog", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Required", "Product name cannot be empty");
      return;
    }
    updateMutation.mutate({
      name: name.trim(),
      pricePerBox: Number(pricePerBox) || 0,
      pricePerSqft: pricePerSqft ? Number(pricePerSqft) : undefined,
      stockBoxes: Number(stockBoxes) || 0,
      description: description.trim(),
      status,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accentOrange} />
      </View>
    );
  }

  const product = data?.product;
  const mainImage = product?.images?.[0] || "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400";

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Edit Product</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Image source={{ uri: mainImage }} style={styles.productBanner} contentFit="cover" />

        <Text style={styles.fieldLabel}>Product Name *</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="Product title"
        />

        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.fieldLabel}>Price Per Box (₹) *</Text>
            <TextInput
              style={styles.textInput}
              value={pricePerBox}
              onChangeText={setPricePerBox}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.fieldLabel}>Stock (Boxes) *</Text>
            <TextInput
              style={styles.textInput}
              value={stockBoxes}
              onChangeText={setStockBoxes}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.fieldLabel}>Price Per Sq.Ft (₹)</Text>
            <TextInput
              style={styles.textInput}
              value={pricePerSqft}
              onChangeText={setPricePerSqft}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.fieldLabel}>Listing Status</Text>
            <View style={styles.statusToggleRow}>
              <TouchableOpacity
                style={[styles.statusToggleBtn, status === "active" && styles.statusActive]}
                onPress={() => setStatus("active")}
              >
                <Text style={[styles.statusToggleText, status === "active" && styles.textWhite]}>
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusToggleBtn, status === "paused" && styles.statusPaused]}
                onPress={() => setStatus("paused")}
              >
                <Text style={[styles.statusToggleText, status === "paused" && styles.textWhite]}>
                  Paused
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput
          style={[styles.textInput, { height: 90, textAlignVertical: "top" }]}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={updateMutation.isPending}
          activeOpacity={0.85}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <CheckCircle2 size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() =>
            Alert.alert("Delete Product", "Are you sure?", [
              { text: "Cancel" },
              { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() },
            ])
          }
        >
          <Trash2 size={16} color={COLORS.error} />
          <Text style={styles.deleteBtnText}>Delete Product</Text>
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
    backgroundColor: COLORS.primary,
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
  productBanner: {
    width: "100%",
    height: 180,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceSecondary,
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
    marginTop: SPACING.md,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 14,
    color: COLORS.text,
  },
  gridRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  gridCol: {
    flex: 1,
  },
  statusToggleRow: {
    flexDirection: "row",
    gap: 6,
  },
  statusToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusActive: {
    backgroundColor: COLORS.accentGreen,
    borderColor: COLORS.accentGreen,
  },
  statusPaused: {
    backgroundColor: COLORS.accentAmber,
    borderColor: COLORS.accentAmber,
  },
  statusToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  textWhite: {
    color: "#fff",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accentOrange,
    borderRadius: RADIUS.lg,
    paddingVertical: 15,
    marginTop: SPACING.xl,
    gap: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: SPACING.sm,
    gap: 6,
  },
  deleteBtnText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: "700",
  },
});
