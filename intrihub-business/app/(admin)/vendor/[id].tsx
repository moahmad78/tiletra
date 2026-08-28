import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Store,
  Phone,
  Mail,
  Building2,
  IndianRupee,
  Package,
  ShoppingCart,
  Clock,
  Boxes,
  Edit2,
  Trash2,
  X,
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
} from "lucide-react-native";
import {
  fetchAdminVendorDetail,
  updateAdminVendor,
  updateAdminProduct,
  deleteAdminProduct,
} from "../../../src/api/admin";
import { Product } from "../../../src/types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../../src/constants/theme";

export default function AdminVendorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");

  // Edit Vendor Modal State
  const [vendorEditModalOpen, setVendorEditModalOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [commissionRate, setCommissionRate] = useState("15.0");
  const [status, setStatus] = useState("approved");
  const [verified, setVerified] = useState(false);
  const [savingVendor, setSavingVendor] = useState(false);

  // Edit Product Modal State
  const [productEditModalOpen, setProductEditModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProdName, setEditProdName] = useState("");
  const [editProdPriceBox, setEditProdPriceBox] = useState("");
  const [editProdPriceSqft, setEditProdPriceSqft] = useState("");
  const [editProdStock, setEditProdStock] = useState("");
  const [editProdStatus, setEditProdStatus] = useState("active");
  const [savingProduct, setSavingProduct] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-vendor-detail", id],
    queryFn: () => fetchAdminVendorDetail(id as string),
    enabled: Boolean(id),
  });

  const vendor = data?.vendor;
  const stats = data?.stats;

  useEffect(() => {
    if (vendor) {
      setBusinessName(vendor.businessName || "");
      setContactEmail(vendor.contactEmail || "");
      setContactPhone(vendor.contactPhone || "");
      setCommissionRate(String(vendor.commissionRate ?? 15));
      setStatus(vendor.status || "approved");
      setVerified(Boolean(vendor.verified || vendor.kycStatus === "verified"));
    }
  }, [vendor]);

  const handleSaveVendor = async () => {
    setSavingVendor(true);
    try {
      const res = await updateAdminVendor(id as string, {
        businessName: businessName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone.trim(),
        commissionRate: parseFloat(commissionRate) || 15.0,
        status,
        verified,
      });
      setSavingVendor(false);
      if (res.success) {
        setVendorEditModalOpen(false);
        Alert.alert("Vendor Updated", "Partner profile changes saved!");
        refetch();
        queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
      } else {
        Alert.alert("Error", res.error || "Failed to update vendor");
      }
    } catch (e: any) {
      setSavingVendor(false);
      Alert.alert("Error", e?.message || "Failed to update vendor");
    }
  };

  const handleOpenEditProduct = (p: any) => {
    setEditingProductId(p.id);
    setEditProdName(p.name || "");
    setEditProdPriceBox(String(p.pricePerBox || ""));
    setEditProdPriceSqft(String(p.pricePerSqft || ""));
    setEditProdStock(String(p.stockBoxes ?? ""));
    setEditProdStatus(p.status || "active");
    setProductEditModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!editingProductId) return;
    setSavingProduct(true);
    try {
      const res = await updateAdminProduct(editingProductId, {
        name: editProdName.trim(),
        pricePerBox: editProdPriceBox ? parseFloat(editProdPriceBox) : undefined,
        pricePerSqft: editProdPriceSqft ? parseFloat(editProdPriceSqft) : undefined,
        stockBoxes: editProdStock !== "" ? parseInt(editProdStock, 10) : undefined,
        status: editProdStatus,
      });
      setSavingProduct(false);
      if (res.success) {
        setProductEditModalOpen(false);
        Alert.alert("Product Updated", "Item catalog details updated!");
        refetch();
        queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      } else {
        Alert.alert("Error", res.error || "Failed to update product");
      }
    } catch (e: any) {
      setSavingProduct(false);
      Alert.alert("Error", e?.message || "Failed to update product");
    }
  };

  const handleDeleteProduct = (prodId: string, name: string) => {
    Alert.alert("Delete Item", `Permanently delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAdminProduct(prodId);
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-products"] });
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to delete");
          }
        },
      },
    ]);
  };

  if (isLoading || !vendor) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accentBlue} />
      </View>
    );
  }

  const products = vendor.products || [];
  const splits = vendor.splits || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {vendor.businessName}
        </Text>
        <TouchableOpacity style={styles.headerEditBtn} onPress={() => setVendorEditModalOpen(true)}>
          <Edit2 size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.vendorCard}>
          <View style={styles.vendorHeaderRow}>
            <View style={styles.iconCircle}>
              <Store size={26} color="#052A51" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.businessTitle}>{vendor.businessName}</Text>
                {verified && <ShieldCheck size={16} color="#16A34A" />}
              </View>
              <Text style={styles.categorySub}>{vendor.category || "Building Materials"}</Text>
              <Text style={styles.ownerSub}>Owner: {vendor.owner?.name || "Verified Partner"}</Text>
            </View>
          </View>

          <View style={styles.contactDetailsBox}>
            <View style={styles.contactItem}>
              <Mail size={13} color="#64748B" />
              <Text style={styles.contactText}>{vendor.contactEmail || "No email"}</Text>
            </View>
            <View style={styles.contactItem}>
              <Phone size={13} color="#64748B" />
              <Text style={styles.contactText}>+91 {vendor.contactPhone || "No phone"}</Text>
            </View>
            {vendor.businessAddress ? (
              <Text style={styles.addressText}>📍 {vendor.businessAddress}</Text>
            ) : null}
          </View>
        </View>

        {/* Financial & Performance Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Today's Sales</Text>
            <Text style={styles.statVal}>₹{(stats?.todaySales || 0).toLocaleString("en-IN")}</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>All-Time GMV</Text>
            <Text style={styles.statVal}>₹{(stats?.totalSales || 0).toLocaleString("en-IN")}</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Orders</Text>
            <Text style={styles.statVal}>{stats?.totalOrdersCount || splits.length}</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Commission</Text>
            <Text style={styles.statVal}>{vendor.commissionRate || 15}%</Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === "products" && styles.segmentBtnActive]}
            onPress={() => setActiveTab("products")}
          >
            <Package size={15} color={activeTab === "products" ? "#052A51" : "#64748B"} />
            <Text style={[styles.segmentBtnText, activeTab === "products" && styles.segmentBtnTextActive]}>
              Products & Stock ({products.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === "orders" && styles.segmentBtnActive]}
            onPress={() => setActiveTab("orders")}
          >
            <ShoppingCart size={15} color={activeTab === "orders" ? "#052A51" : "#64748B"} />
            <Text style={[styles.segmentBtnText, activeTab === "orders" && styles.segmentBtnTextActive]}>
              Orders ({splits.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Products */}
        {activeTab === "products" ? (
          products.length === 0 ? (
            <View style={styles.emptyCard}>
              <Package size={32} color="#94A3B8" />
              <Text style={styles.emptyText}>This vendor has not uploaded any products yet.</Text>
            </View>
          ) : (
            products.map((p: any) => {
              const uploadDate = p.createdAt
                ? new Date(p.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Unknown";

              return (
                <View key={p.id} style={styles.productCard}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                    <Image
                      source={p.images?.[0] ? { uri: p.images[0] } : require("../../../assets/intri-icon.png")}
                      style={styles.productThumb}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.productName} numberOfLines={2}>{p.name}</Text>
                      <Text style={styles.uploadDateText}>🕒 Uploaded: {uploadDate}</Text>

                      <View style={styles.priceRow}>
                        <Text style={styles.priceText}>
                          ₹{p.pricePerBox?.toLocaleString("en-IN") || p.pricePerSqft?.toLocaleString("en-IN") || "0"}
                          <Text style={styles.unitText}> / {p.unitOfSale || "box"}</Text>
                        </Text>
                        <View style={[styles.stockPill, (p.stockBoxes ?? 0) < 10 ? styles.stockRed : styles.stockGreen]}>
                          <Boxes size={11} color={(p.stockBoxes ?? 0) < 10 ? "#DC2626" : "#16A34A"} />
                          <Text style={[styles.stockText, (p.stockBoxes ?? 0) < 10 ? styles.stockTextRed : styles.stockTextGreen]}>
                            {p.stockBoxes ?? 0} In Stock
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.productActionRow}>
                    <TouchableOpacity style={styles.editItemBtn} onPress={() => handleOpenEditProduct(p)}>
                      <Edit2 size={13} color="#052A51" />
                      <Text style={styles.editItemBtnText}>Edit Item Details & Stock</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteItemBtn} onPress={() => handleDeleteProduct(p.id, p.name)}>
                      <Trash2 size={13} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )
        ) : (
          /* Tab 2: Orders */
          splits.length === 0 ? (
            <View style={styles.emptyCard}>
              <ShoppingCart size={32} color="#94A3B8" />
              <Text style={styles.emptyText}>No orders received for this vendor yet.</Text>
            </View>
          ) : (
            splits.map((s: any) => {
              const orderDate = s.createdAt
                ? new Date(s.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Unknown";

              return (
                <View key={s.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View>
                      <Text style={styles.orderIdText}>SPLIT #{s.id.slice(-8)}</Text>
                      <Text style={styles.orderDateText}>🕒 {orderDate}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>{s.fulfillmentStatus?.toUpperCase() || "PENDING"}</Text>
                    </View>
                  </View>

                  <View style={styles.orderCustomerRow}>
                    <Text style={styles.customerName}>
                      Customer: {s.parentOrder?.customerName || "Customer"}
                    </Text>
                    {s.parentOrder?.customerPhone && (
                      <Text style={styles.customerPhone}>+91 {s.parentOrder.customerPhone}</Text>
                    )}
                  </View>

                  <View style={styles.orderAmountRow}>
                    <Text style={styles.orderAmountLabel}>Vendor Subtotal:</Text>
                    <Text style={styles.orderAmountVal}>₹{(s.subtotal || 0).toLocaleString("en-IN")}</Text>
                  </View>
                </View>
              );
            })
          )
        )}
      </ScrollView>

      {/* Edit Vendor Modal */}
      <Modal visible={vendorEditModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Vendor Profile</Text>
            <TouchableOpacity onPress={() => setVendorEditModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Business / Store Name</Text>
              <TextInput style={styles.inputBox} value={businessName} onChangeText={setBusinessName} />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Contact Email</Text>
              <TextInput style={styles.inputBox} value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Contact Phone</Text>
              <TextInput style={styles.inputBox} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Commission Rate (%)</Text>
              <TextInput style={styles.inputBox} value={commissionRate} onChangeText={setCommissionRate} keyboardType="decimal-pad" />
            </View>

            <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveVendor} disabled={savingVendor}>
              {savingVendor ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveActionBtnText}>Save Vendor Profile</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Product Modal */}
      <Modal visible={productEditModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Vendor Item</Text>
            <TouchableOpacity onPress={() => setProductEditModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Product Title</Text>
              <TextInput style={styles.inputBox} value={editProdName} onChangeText={setEditProdName} />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Price Per Box (₹)</Text>
              <TextInput style={styles.inputBox} value={editProdPriceBox} onChangeText={setEditProdPriceBox} keyboardType="decimal-pad" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Price Per Sqft (₹)</Text>
              <TextInput style={styles.inputBox} value={editProdPriceSqft} onChangeText={setEditProdPriceSqft} keyboardType="decimal-pad" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Current Stock (Boxes / Units)</Text>
              <TextInput style={styles.inputBox} value={editProdStock} onChangeText={setEditProdStock} keyboardType="number-pad" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Status</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                {["active", "draft", "out_of_stock"].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusChip, editProdStatus === st && styles.statusChipActive]}
                    onPress={() => setEditProdStatus(st)}
                  >
                    <Text style={[styles.statusChipText, editProdStatus === st && styles.statusChipTextActive]}>
                      {st.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveProduct} disabled={savingProduct}>
              {savingProduct ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveActionBtnText}>Save Item Changes</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textWhite,
    textAlign: "center",
    marginHorizontal: 10,
  },
  headerEditBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 50,
  },
  vendorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...SHADOWS.sm,
  },
  vendorHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  businessTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#052A51",
  },
  categorySub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  ownerSub: {
    fontSize: 11,
    color: "#94A3B8",
  },
  contactDetailsBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 6,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactText: {
    fontSize: 12,
    color: "#475569",
  },
  addressText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
  },
  statVal: {
    fontSize: 16,
    fontWeight: "900",
    color: "#052A51",
    marginTop: 4,
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  segmentBtnTextActive: {
    color: "#052A51",
    fontWeight: "800",
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...SHADOWS.sm,
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  productName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
  },
  uploadDateText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  priceText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#052A51",
  },
  unitText: {
    fontSize: 10,
    color: "#64748B",
  },
  stockPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  stockGreen: { backgroundColor: "#DCFCE7" },
  stockRed: { backgroundColor: "#FEE2E2" },
  stockText: { fontSize: 10, fontWeight: "800" },
  stockTextGreen: { color: "#16A34A" },
  stockTextRed: { color: "#DC2626" },
  productActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  editItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  editItemBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#052A51",
  },
  deleteItemBtn: {
    padding: 6,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
    ...SHADOWS.sm,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
  },
  orderDateText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1E40AF",
  },
  orderCustomerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  customerName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  customerPhone: {
    fontSize: 12,
    color: "#64748B",
  },
  orderAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  orderAmountLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  orderAmountVal: {
    fontSize: 13,
    fontWeight: "900",
    color: "#052A51",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    color: "#64748B",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#052A51",
  },
  closeBtn: {
    padding: 6,
  },
  modalContent: {
    padding: 16,
    gap: 12,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: COLORS.text,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  statusChipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  statusChipTextActive: {
    color: "#1D4ED8",
    fontWeight: "800",
  },
  saveActionBtn: {
    backgroundColor: "#052A51",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  saveActionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
