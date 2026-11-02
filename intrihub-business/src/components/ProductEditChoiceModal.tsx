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
  Platform,
} from "react-native";
import { Image } from "expo-image";
import {
  X,
  Zap,
  Sliders,
  IndianRupee,
  Package,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Tag,
  Boxes,
} from "lucide-react-native";
import { Product } from "../types";
import { quickUpdateVendorProductRatesAndStock } from "../api/vendor";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../constants/theme";

interface ProductEditChoiceModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product | null;
  onNavigateToFullEdit: (productId: string) => void;
  onSuccess: () => void;
}

export default function ProductEditChoiceModal({
  visible,
  onClose,
  product,
  onNavigateToFullEdit,
  onSuccess,
}: ProductEditChoiceModalProps) {
  const [mode, setMode] = useState<"choice" | "instant">("choice");
  const [saving, setSaving] = useState(false);

  // Master rate & stock
  const [masterMrp, setMasterMrp] = useState<string>("");
  const [masterSaleRate, setMasterSaleRate] = useState<string>("");
  const [masterBuyRate, setMasterBuyRate] = useState<string>("");
  const [masterStock, setMasterStock] = useState<string>("");

  // Variant rows
  const [variantRows, setVariantRows] = useState<
    Array<{
      id: string;
      sku: string;
      name: string;
      color: string;
      mrp: string;
      saleRate: string;
      buyRate: string;
      stock: string;
    }>
  >([]);

  useEffect(() => {
    if (visible && product) {
      setMode("choice");

      const primaryVar = product.variants?.[0];
      const initialMrp = product.mrp ?? primaryVar?.mrp ?? "";
      const initialSale = product.pricePerBox ?? product.price ?? primaryVar?.pricePerBox ?? primaryVar?.price ?? "";
      const specs = (product.specs as Record<string, any>) || {};
      const initialBuy = specs.costPrice ?? specs.buyRate ?? primaryVar?.costPrice ?? "";
      const initialStock = product.stockBoxes ?? product.stock ?? primaryVar?.stockBoxes ?? "";

      setMasterMrp(initialMrp ? String(initialMrp) : "");
      setMasterSaleRate(initialSale ? String(initialSale) : "");
      setMasterBuyRate(initialBuy ? String(initialBuy) : "");
      setMasterStock(initialStock !== undefined && initialStock !== null ? String(initialStock) : "");

      if (product.variants && product.variants.length > 0) {
        setVariantRows(
          product.variants.map((v: any, idx: number) => ({
            id: v.id || `var-${idx}`,
            sku: v.sku || `SKU-${idx + 1}`,
            name: v.variantName || v.size || `Variant ${idx + 1}`,
            color: v.color || "Standard",
            mrp: v.mrp ? String(v.mrp) : initialMrp ? String(initialMrp) : "",
            saleRate: v.pricePerBox || v.price ? String(v.pricePerBox || v.price) : initialSale ? String(initialSale) : "",
            buyRate: v.costPrice ? String(v.costPrice) : initialBuy ? String(initialBuy) : "",
            stock: v.stockBoxes !== undefined && v.stockBoxes !== null ? String(v.stockBoxes) : "50",
          }))
        );
      } else {
        setVariantRows([]);
      }
    }
  }, [visible, product]);

  if (!product) return null;

  // Margin calculation
  const saleNum = parseFloat(masterSaleRate) || 0;
  const buyNum = parseFloat(masterBuyRate) || 0;
  const marginAmt = saleNum - buyNum;
  const marginPct = saleNum > 0 && buyNum > 0 ? Math.round((marginAmt / saleNum) * 100) : null;

  const handleApplyMasterToAll = () => {
    if (variantRows.length === 0) return;
    setVariantRows((prev) =>
      prev.map((row) => ({
        ...row,
        mrp: masterMrp || row.mrp,
        saleRate: masterSaleRate || row.saleRate,
        buyRate: masterBuyRate || row.buyRate,
        stock: masterStock || row.stock,
      }))
    );
    Alert.alert("Applied", "Master rate and stock values copied to all variants below.");
  };

  const handleSaveInstant = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const payload: any = {
        productId: product.id,
        mrp: masterMrp ? parseFloat(masterMrp) : undefined,
        saleRate: masterSaleRate ? parseFloat(masterSaleRate) : undefined,
        buyRate: masterBuyRate ? parseFloat(masterBuyRate) : undefined,
        stock: masterStock !== "" ? parseInt(masterStock, 10) : undefined,
      };

      if (variantRows.length > 0) {
        payload.variants = variantRows.map((v) => ({
          id: v.id.startsWith("var-") ? undefined : v.id,
          mrp: v.mrp ? parseFloat(v.mrp) : undefined,
          price: v.saleRate ? parseFloat(v.saleRate) : undefined,
          pricePerBox: v.saleRate ? parseFloat(v.saleRate) : undefined,
          costPrice: v.buyRate ? parseFloat(v.buyRate) : undefined,
          stockBoxes: v.stock !== "" ? parseInt(v.stock, 10) : undefined,
        }));
      }

      const res = await quickUpdateVendorProductRatesAndStock(payload);
      if (res.success) {
        Alert.alert("Success 🎉", "Rates and stock updated instantly!");
        onSuccess();
        onClose();
      } else {
        Alert.alert("Update Error", res.error || "Failed to update rates and stock");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to save rate and stock");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {mode === "choice" ? "Choose Edit Action" : "⚡ Instant Rate & Stock"}
                </Text>
              </View>
              <Text style={styles.productSubtitle} numberOfLines={1}>
                {product.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {mode === "choice" ? (
            /* Mode 1: Choice Selection */
            <View style={styles.choiceBody}>
              <Text style={styles.choiceInstructions}>
                Select how you would like to update this catalog item:
              </Text>

              {/* Instant Update Card */}
              <TouchableOpacity
                style={styles.choiceCardInstant}
                activeOpacity={0.85}
                onPress={() => setMode("instant")}
              >
                <View style={styles.choiceIconWrapInstant}>
                  <Zap size={22} color="#F26522" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={styles.choiceTitleInstant}>Instant Rate & Stock Update</Text>
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedBadgeText}>FAST (5s)</Text>
                    </View>
                  </View>
                  <Text style={styles.choiceDesc}>
                    Quickly update MRP, Selling Rate, Buy Rate, and available Stock without loading the full catalog form.
                  </Text>
                </View>
                <ArrowRight size={18} color="#F26522" />
              </TouchableOpacity>

              {/* Full Edit Card */}
              <TouchableOpacity
                style={styles.choiceCardFull}
                activeOpacity={0.85}
                onPress={() => {
                  onClose();
                  onNavigateToFullEdit(product.id);
                }}
              >
                <View style={styles.choiceIconWrapFull}>
                  <Sliders size={22} color="#052A51" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.choiceTitleFull}>Full Product Details & Customization</Text>
                  <Text style={styles.choiceDesc}>
                    Edit images, specifications, materials, finishes, delivery rules, return policies, and dimensions.
                  </Text>
                </View>
                <ArrowRight size={18} color="#052A51" />
              </TouchableOpacity>
            </View>
          ) : (
            /* Mode 2: Quick Rate & Stock Form */
            <ScrollView style={styles.instantBody} keyboardShouldPersistTaps="handled">
              <TouchableOpacity
                style={styles.backToChoiceBtn}
                onPress={() => setMode("choice")}
              >
                <ArrowLeft size={14} color="#64748B" />
                <Text style={styles.backToChoiceText}>Back to options</Text>
              </TouchableOpacity>

              {/* Live Profit Margin Banner */}
              {marginPct !== null && (
                <View style={[styles.marginBanner, marginPct >= 15 ? styles.marginBannerGood : styles.marginBannerLow]}>
                  <TrendingUp size={16} color={marginPct >= 15 ? "#16A34A" : "#D97706"} />
                  <Text style={[styles.marginBannerText, { color: marginPct >= 15 ? "#166534" : "#92400E" }]}>
                    Estimated Margin: <Text style={{ fontWeight: "900" }}>₹{marginAmt.toFixed(1)} / Box ({marginPct}%)</Text>
                  </Text>
                </View>
              )}

              {/* Master Rate Fields Grid */}
              <View style={styles.fieldsGrid}>
                {/* Selling Rate */}
                <View style={styles.fieldCol}>
                  <Text style={styles.fieldLabel}>Selling Rate (₹/Box) *</Text>
                  <View style={styles.inputContainer}>
                    <IndianRupee size={14} color="#052A51" />
                    <TextInput
                      style={styles.inputField}
                      keyboardType="numeric"
                      value={masterSaleRate}
                      onChangeText={setMasterSaleRate}
                      placeholder="e.g. 750"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                {/* MRP */}
                <View style={styles.fieldCol}>
                  <Text style={styles.fieldLabel}>MRP (Print Price)</Text>
                  <View style={styles.inputContainer}>
                    <IndianRupee size={14} color="#64748B" />
                    <TextInput
                      style={styles.inputField}
                      keyboardType="numeric"
                      value={masterMrp}
                      onChangeText={setMasterMrp}
                      placeholder="e.g. 950"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                {/* Buy / Cost Rate */}
                <View style={styles.fieldCol}>
                  <Text style={styles.fieldLabel}>Buy Rate (Cost Price)</Text>
                  <View style={styles.inputContainer}>
                    <IndianRupee size={14} color="#64748B" />
                    <TextInput
                      style={styles.inputField}
                      keyboardType="numeric"
                      value={masterBuyRate}
                      onChangeText={setMasterBuyRate}
                      placeholder="e.g. 520"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                {/* Stock Boxes */}
                <View style={styles.fieldCol}>
                  <Text style={styles.fieldLabel}>Stock (Boxes) *</Text>
                  <View style={styles.inputContainer}>
                    <Boxes size={14} color="#052A51" />
                    <TextInput
                      style={styles.inputField}
                      keyboardType="numeric"
                      value={masterStock}
                      onChangeText={setMasterStock}
                      placeholder="e.g. 100"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              </View>

              {/* Variants Section (if any) */}
              {variantRows.length > 0 && (
                <View style={styles.variantsSection}>
                  <View style={styles.variantsHeaderRow}>
                    <View>
                      <Text style={styles.variantsSectionTitle}>Variant Matrix ({variantRows.length} items)</Text>
                      <Text style={styles.variantsSectionSub}>Override specific rates per color/size</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.applyAllBtn}
                      onPress={handleApplyMasterToAll}
                    >
                      <Text style={styles.applyAllText}>Apply Master to All</Text>
                    </TouchableOpacity>
                  </View>

                  {variantRows.map((v, idx) => (
                    <View key={v.id} style={styles.variantCard}>
                      <View style={styles.variantTopRow}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <View style={styles.variantDot} />
                          <Text style={styles.variantName}>{v.name} ({v.color})</Text>
                        </View>
                        <Text style={styles.variantSku}>{v.sku}</Text>
                      </View>

                      <View style={styles.variantInputsRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.variantMiniLabel}>Sale Rate (₹)</Text>
                          <TextInput
                            style={styles.variantMiniInput}
                            keyboardType="numeric"
                            value={v.saleRate}
                            onChangeText={(val) => {
                              const updated = [...variantRows];
                              updated[idx].saleRate = val;
                              setVariantRows(updated);
                            }}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.variantMiniLabel}>MRP (₹)</Text>
                          <TextInput
                            style={styles.variantMiniInput}
                            keyboardType="numeric"
                            value={v.mrp}
                            onChangeText={(val) => {
                              const updated = [...variantRows];
                              updated[idx].mrp = val;
                              setVariantRows(updated);
                            }}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.variantMiniLabel}>Stock</Text>
                          <TextInput
                            style={styles.variantMiniInput}
                            keyboardType="numeric"
                            value={v.stock}
                            onChangeText={(val) => {
                              const updated = [...variantRows];
                              updated[idx].stock = val;
                              setVariantRows(updated);
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Submit CTA */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                disabled={saving}
                onPress={handleSaveInstant}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Check size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Save Rates & Stock Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    width: "100%",
    maxWidth: 480,
    maxHeight: "88%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#F8FAFC",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  productSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  choiceBody: {
    padding: 20,
    gap: 14,
  },
  choiceInstructions: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
    marginBottom: 4,
  },
  choiceCardInstant: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF7ED",
    borderWidth: 1.5,
    borderColor: "#F26522",
    borderRadius: 18,
    gap: 14,
  },
  choiceIconWrapInstant: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
  },
  choiceTitleInstant: {
    fontSize: 14,
    fontWeight: "800",
    color: "#9A3412",
  },
  recommendedBadge: {
    backgroundColor: "#F26522",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recommendedBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  choiceCardFull: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    gap: 14,
  },
  choiceIconWrapFull: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  choiceTitleFull: {
    fontSize: 14,
    fontWeight: "800",
    color: "#052A51",
  },
  choiceDesc: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
    marginTop: 3,
  },
  instantBody: {
    padding: 18,
  },
  backToChoiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  backToChoiceText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  marginBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    gap: 8,
    marginBottom: 14,
  },
  marginBannerGood: {
    backgroundColor: "#DCFCE7",
  },
  marginBannerLow: {
    backgroundColor: "#FEF3C7",
  },
  marginBannerText: {
    fontSize: 12,
    fontWeight: "600",
  },
  fieldsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  fieldCol: {
    width: "48%",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 10,
    gap: 6,
  },
  inputField: {
    flex: 1,
    height: 40,
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  variantsSection: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 14,
    marginBottom: 16,
  },
  variantsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  variantsSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  variantsSectionSub: {
    fontSize: 10,
    color: "#64748B",
  },
  applyAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
  },
  applyAllText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#052A51",
  },
  variantCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  variantTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  variantDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F26522",
  },
  variantName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  variantSku: {
    fontSize: 10,
    color: "#64748B",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  variantInputsRow: {
    flexDirection: "row",
    gap: 8,
  },
  variantMiniLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 3,
  },
  variantMiniInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 32,
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F26522",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: "#F26522",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});

