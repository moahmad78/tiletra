import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import {
  Package,
  Search,
  CheckCircle2,
  XCircle,
  Plus,
  Edit2,
  Trash2,
  Layers,
  FileSpreadsheet,
  CheckSquare,
  Sparkles,
  X,
  Upload,
  ChevronRight,
  IndianRupee,
  Boxes,
  Eye,
} from "lucide-react-native";
import {
  fetchAdminProducts,
  updateAdminProduct,
  deleteAdminProduct,
  fetchAdminProductApprovals,
  approveAdminProductPending,
  rejectAdminProductPending,
  fetchAdminBulkTemplate,
  validateAdminBulkCSV,
  commitAdminBulkProducts,
  fetchAdminCategories,
} from "../../src/api/admin";
import { Product } from "../../src/types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function AdminProductsHubScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Top Segment: "catalog" | "approvals" | "bulk"
  const [activeSection, setActiveSection] = useState<"catalog" | "approvals" | "bulk">("catalog");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPricePerBox, setEditPricePerBox] = useState("");
  const [editPricePerSqft, setEditPricePerSqft] = useState("");
  const [editMrp, setEditMrp] = useState("");
  const [editStockBoxes, setEditStockBoxes] = useState("");
  const [editUnitOfSale, setEditUnitOfSale] = useState("box");
  const [editCategorySlug, setEditCategorySlug] = useState("tiles-stone");
  const [editSize, setEditSize] = useState("600x1200mm");
  const [editFinish, setEditFinish] = useState("Glossy");
  const [editMaterial, setEditMaterial] = useState("Glazed Vitrified");
  const [editThickness, setEditThickness] = useState("9mm");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [editFeatured, setEditFeatured] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Bulk CSV State
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);

  // 1. Products Query
  const {
    data: productsData,
    isLoading: productsLoading,
    refetch: refetchProducts,
    isRefetching: productsRefetching,
  } = useQuery({
    queryKey: ["admin-products", search, statusFilter],
    queryFn: () =>
      fetchAdminProducts({
        search: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
  });

  // 2. Approvals Query
  const {
    data: approvalsData,
    isLoading: approvalsLoading,
    refetch: refetchApprovals,
    isRefetching: approvalsRefetching,
  } = useQuery({
    queryKey: ["admin-product-approvals"],
    queryFn: () => fetchAdminProductApprovals(),
  });

  // 3. Categories Query for Picker
  const { data: catData } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => fetchAdminCategories(),
  });

  const products = productsData?.products || [];
  const approvals = approvalsData?.products || [];
  const categories = catData?.categories || [];

  const handleOpenEdit = (p: Product) => {
    setEditingProductId(p.id);
    setEditName(p.name || "");
    setEditDescription(p.description || "");
    setEditPricePerBox(String(p.pricePerBox || ""));
    setEditPricePerSqft(String(p.pricePerSqft || ""));
    setEditMrp(String(p.mrp || ""));
    setEditStockBoxes(String(p.stockBoxes ?? ""));
    setEditUnitOfSale(p.unitOfSale || "box");
    setEditCategorySlug(p.categorySlug || "tiles-stone");
    setEditSize(p.size || "600x1200mm");
    setEditFinish(p.finish || "Glossy");
    setEditMaterial(p.material || "Glazed Vitrified");
    setEditThickness(p.thickness || "9mm");
    setEditImageUrl(p.images?.[0] || "");
    setEditStatus(p.status || "active");
    setEditFeatured(Boolean(p.featured));
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingProductId) return;
    if (!editName.trim()) {
      Alert.alert("Validation Error", "Product title cannot be empty.");
      return;
    }

    setSavingEdit(true);
    try {
      const res = await updateAdminProduct(editingProductId, {
        name: editName.trim(),
        description: editDescription.trim(),
        pricePerBox: editPricePerBox ? parseFloat(editPricePerBox) : undefined,
        pricePerSqft: editPricePerSqft ? parseFloat(editPricePerSqft) : undefined,
        mrp: editMrp ? parseFloat(editMrp) : undefined,
        stockBoxes: editStockBoxes !== "" ? parseInt(editStockBoxes, 10) : undefined,
        unitOfSale: editUnitOfSale.trim(),
        categorySlug: editCategorySlug.trim(),
        size: editSize.trim(),
        finish: editFinish.trim(),
        material: editMaterial.trim(),
        thickness: editThickness.trim(),
        images: editImageUrl.trim() ? [editImageUrl.trim()] : undefined,
        status: editStatus,
        featured: editFeatured,
      });

      setSavingEdit(false);
      if (res.success) {
        setEditModalOpen(false);
        Alert.alert("Product Updated", "Product catalog details saved successfully!");
        refetchProducts();
        queryClient.invalidateQueries({ queryKey: ["admin-products"] });
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      } else {
        Alert.alert("Update Error", res.error || "Failed to update product.");
      }
    } catch (e: any) {
      setSavingEdit(false);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  const handleDeleteProduct = (id: string, name: string) => {
    Alert.alert("Delete Product", `Permanently delete "${name}" from master catalog?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await deleteAdminProduct(id);
            if (res.success) {
              Alert.alert("Deleted", "Product removed.");
              refetchProducts();
              queryClient.invalidateQueries({ queryKey: ["admin-products"] });
              queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
            } else {
              Alert.alert("Error", res.error || "Failed to delete product.");
            }
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Something went wrong.");
          }
        },
      },
    ]);
  };

  const handleApproveProduct = async (id: string, name: string) => {
    Alert.alert("Approve Product", `Publish "${name}" to live marketplace?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve & Publish",
        onPress: async () => {
          try {
            const res = await approveAdminProductPending(id);
            if (res.success) {
              Alert.alert("Published 🎉", `"${name}" is now live on marketplace!`);
              refetchApprovals();
              refetchProducts();
              queryClient.invalidateQueries({ queryKey: ["admin-products"] });
            } else {
              Alert.alert("Error", res.error || "Failed to approve product");
            }
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Something went wrong.");
          }
        },
      },
    ]);
  };

  const handleRejectProduct = (id: string, name: string) => {
    Alert.alert("Reject Product", `Reject submission for "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await rejectAdminProductPending(id, "Product details or imagery incomplete");
            if (res.success) {
              Alert.alert("Rejected", "Product rejected.");
              refetchApprovals();
            } else {
              Alert.alert("Error", res.error || "Failed to reject");
            }
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Something went wrong.");
          }
        },
      },
    ]);
  };

  // Bulk CSV Pick File
  const handlePickCsvFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel", "text/plain"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri);
      setBulkCsvText(content);
      handleValidateCsvText(content);
    } catch (e: any) {
      Alert.alert("File Picker Error", e?.message || "Could not read selected CSV file");
    }
  };

  const handleValidateCsvText = async (textToValidate: string) => {
    if (!textToValidate.trim()) return;
    setValidating(true);
    setValidationResult(null);
    try {
      const res = await validateAdminBulkCSV(textToValidate);
      setValidating(false);
      if (res.success) {
        setValidationResult(res);
      } else {
        Alert.alert("Validation Error", res.error || "Invalid CSV structure");
      }
    } catch (e: any) {
      setValidating(false);
      Alert.alert("Error", e?.message || "Failed to validate CSV");
    }
  };

  const handleCommitBulk = async () => {
    if (!validationResult?.preview || validationResult.preview.length === 0) return;
    setCommitting(true);
    try {
      const res = await commitAdminBulkProducts(validationResult.preview);
      setCommitting(false);
      if (res.success) {
        Alert.alert(
          "Import Successful 🎉",
          `Imported ${res.count || validationResult.preview.length} products to live database!`
        );
        setBulkCsvText("");
        setValidationResult(null);
        setActiveSection("catalog");
        refetchProducts();
      } else {
        Alert.alert("Commit Error", res.error || "Failed to commit products");
      }
    } catch (e: any) {
      setCommitting(false);
      Alert.alert("Error", e?.message || "Something went wrong during bulk import.");
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productTopRow}>
        <Image
          source={item.images?.[0] ? { uri: item.images[0] } : require("../../assets/intri-icon.png")}
          style={styles.productThumb}
          contentFit="cover"
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.titleRow}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          </View>
          <Text style={styles.vendorName}>By {item.vendor?.businessName || "Intrihub Direct"}</Text>

          <View style={styles.priceStockRow}>
            <Text style={styles.priceText}>
              ₹{item.pricePerBox?.toLocaleString("en-IN") || item.pricePerSqft?.toLocaleString("en-IN") || "0"}
              <Text style={styles.unitText}> / {item.unitOfSale || "box"}</Text>
            </Text>
            <View style={[styles.stockPill, (item.stockBoxes ?? 0) > 0 ? styles.stockGreen : styles.stockRed]}>
              <Boxes size={11} color={(item.stockBoxes ?? 0) > 0 ? "#16A34A" : "#DC2626"} />
              <Text style={[styles.stockText, (item.stockBoxes ?? 0) > 0 ? styles.stockTextGreen : styles.stockTextRed]}>
                {item.stockBoxes ?? 0} In Stock
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.specsRow}>
        <View style={styles.specBadge}><Text style={styles.specBadgeText}>{item.categorySlug || "tiles"}</Text></View>
        {item.size ? <View style={styles.specBadge}><Text style={styles.specBadgeText}>{item.size}</Text></View> : null}
        {item.finish ? <View style={styles.specBadge}><Text style={styles.specBadgeText}>{item.finish}</Text></View> : null}
      </View>

      <View style={styles.actionFooter}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => handleOpenEdit(item)}
          activeOpacity={0.85}
        >
          <Edit2 size={13} color={COLORS.accentBlue} />
          <Text style={styles.editBtnText}>Edit Item</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeleteProduct(item.id, item.name)}
          activeOpacity={0.85}
        >
          <Trash2 size={13} color="#DC2626" />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderApprovalItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productTopRow}>
        <Image
          source={item.images?.[0] ? { uri: item.images[0] } : require("../../assets/intri-icon.png")}
          style={styles.productThumb}
          contentFit="cover"
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.vendorName}>Submitted by: {item.vendor?.businessName || "Partner"}</Text>
          <Text style={styles.priceText}>
            ₹{item.pricePerBox || item.pricePerSqft || "0"} / {item.unitOfSale || "box"}
          </Text>
        </View>
      </View>

      <View style={styles.actionFooter}>
        <TouchableOpacity
          style={[styles.quickBtn, styles.approveBtn]}
          onPress={() => handleApproveProduct(item.id, item.name)}
        >
          <CheckCircle2 size={14} color="#16A34A" />
          <Text style={styles.approveBtnText}>Approve & Publish</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickBtn, styles.suspendBtn]}
          onPress={() => handleRejectProduct(item.id, item.name)}
        >
          <XCircle size={14} color="#DC2626" />
          <Text style={styles.suspendBtnText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Products & Catalog Hub</Text>
          <Text style={styles.headerSubtitle}>
            {products.length} live catalog items • {approvals.length} pending moderation
          </Text>
        </View>
      </View>

      {/* Segmented Switcher */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSection === "catalog" && styles.segmentBtnActive]}
          onPress={() => setActiveSection("catalog")}
        >
          <Package size={15} color={activeSection === "catalog" ? "#052A51" : "#64748B"} />
          <Text style={[styles.segmentBtnText, activeSection === "catalog" && styles.segmentBtnTextActive]}>
            Catalog ({products.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSection === "approvals" && styles.segmentBtnActive]}
          onPress={() => setActiveSection("approvals")}
        >
          <CheckSquare size={15} color={activeSection === "approvals" ? "#052A51" : "#64748B"} />
          <Text style={[styles.segmentBtnText, activeSection === "approvals" && styles.segmentBtnTextActive]}>
            Approvals ({approvals.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSection === "bulk" && styles.segmentBtnActive]}
          onPress={() => setActiveSection("bulk")}
        >
          <FileSpreadsheet size={15} color={activeSection === "bulk" ? "#052A51" : "#64748B"} />
          <Text style={[styles.segmentBtnText, activeSection === "bulk" && styles.segmentBtnTextActive]}>
            Bulk CSV
          </Text>
        </TouchableOpacity>
      </View>

      {/* Catalog Search Header */}
      {activeSection === "catalog" && (
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Search size={18} color={COLORS.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search product name, category, SKU..."
              placeholderTextColor={COLORS.textTertiary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
      )}

      {/* Content Rendering */}
      {activeSection === "catalog" ? (
        productsLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.accentBlue} />
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={renderProductItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={productsRefetching} onRefresh={refetchProducts} tintColor={COLORS.accentBlue} />}
          />
        )
      ) : activeSection === "approvals" ? (
        approvalsLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.accentBlue} />
          </View>
        ) : (
          <FlatList
            data={approvals}
            keyExtractor={(item) => item.id}
            renderItem={renderApprovalItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={approvalsRefetching} onRefresh={refetchApprovals} tintColor={COLORS.accentBlue} />}
          />
        )
      ) : (
        <ScrollView contentContainerStyle={styles.bulkContent}>
          <View style={styles.bulkCard}>
            <View style={styles.bulkIconCircle}>
              <FileSpreadsheet size={32} color={COLORS.accentBlue} />
            </View>
            <Text style={styles.bulkCardTitle}>Bulk CSV Product Importer</Text>
            <Text style={styles.bulkCardSub}>
              Upload a standard RFC-4180 CSV file to insert or update multiple catalog products instantly.
            </Text>

            <TouchableOpacity style={styles.pickFileBtn} onPress={handlePickCsvFile} disabled={validating}>
              {validating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Upload size={18} color="#FFFFFF" />
                  <Text style={styles.pickFileBtnText}>Choose CSV File from Device</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {validationResult && (
            <View style={styles.validationCard}>
              <View style={styles.validationHeader}>
                <CheckCircle2 size={18} color="#16A34A" />
                <Text style={styles.validationTitle}>
                  Validated {validationResult.validRows} / {validationResult.totalRows} Products
                </Text>
              </View>

              {validationResult.errors?.length > 0 ? (
                <View style={styles.errorBox}>
                  {validationResult.errors.slice(0, 3).map((err: string, i: number) => (
                    <Text key={i} style={styles.errorText}>• {err}</Text>
                  ))}
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.commitBtn}
                onPress={handleCommitBulk}
                disabled={committing}
              >
                {committing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Sparkles size={18} color="#FFFFFF" />
                    <Text style={styles.commitBtnText}>Commit & Publish to Marketplace</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Edit Product Modal */}
      <Modal
        visible={editModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Product</Text>
            <TouchableOpacity onPress={() => setEditModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Product Title *</Text>
              <TextInput
                style={styles.inputBox}
                value={editName}
                onChangeText={setEditName}
                placeholder="Product Name"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Category</Text>
              <TextInput
                style={styles.inputBox}
                value={editCategorySlug}
                onChangeText={setEditCategorySlug}
                placeholder="e.g. tiles-stone, electrical, sanitaryware"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Unit of Sale</Text>
              <TextInput
                style={styles.inputBox}
                value={editUnitOfSale}
                onChangeText={setEditUnitOfSale}
                placeholder="box, sqft, piece, meter, kg, bag, ton"
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Price / Box (₹)</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={editPricePerBox}
                    onChangeText={setEditPricePerBox}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Price / Sqft (₹)</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={editPricePerSqft}
                    onChangeText={setEditPricePerSqft}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>MRP (₹)</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={editMrp}
                    onChangeText={setEditMrp}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Stock (Boxes/Units)</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={editStockBoxes}
                    onChangeText={setEditStockBoxes}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Primary Image URL</Text>
              <TextInput
                style={styles.inputBox}
                value={editImageUrl}
                onChangeText={setEditImageUrl}
                placeholder="https://... or /categories/tiles.jpg"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Description</Text>
              <TextInput
                style={[styles.inputBox, { height: 70, textAlignVertical: "top", paddingTop: 8 }]}
                multiline
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Full product technical specifications..."
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Size</Text>
                  <TextInput style={styles.inputBox} value={editSize} onChangeText={setEditSize} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Finish</Text>
                  <TextInput style={styles.inputBox} value={editFinish} onChangeText={setEditFinish} />
                </View>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Status</Text>
              <View style={styles.statusOptionsRow}>
                {["active", "draft", "out_of_stock"].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusOptionChip, editStatus === st && styles.statusOptionChipActive]}
                    onPress={() => setEditStatus(st)}
                  >
                    <Text style={[styles.statusOptionText, editStatus === st && styles.statusOptionTextActive]}>
                      {st.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveProductBtn}
              onPress={handleSaveEdit}
              disabled={savingEdit}
            >
              {savingEdit ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#FFFFFF" />
                  <Text style={styles.saveProductBtnText}>Save Product Details</Text>
                </>
              )}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textWhite,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
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
  filterSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 40,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: 40,
  },
  productCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  productTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  productThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    lineHeight: 18,
  },
  vendorName: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  priceStockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  priceText: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.primary,
  },
  unitText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  stockPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  stockGreen: {
    backgroundColor: "rgba(22, 163, 74, 0.1)",
  },
  stockRed: {
    backgroundColor: "rgba(220, 38, 38, 0.1)",
  },
  stockText: {
    fontSize: 10,
    fontWeight: "800",
  },
  stockTextGreen: {
    color: "#16A34A",
  },
  stockTextRed: {
    color: "#DC2626",
  },
  specsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  specBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  specBadgeText: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "700",
  },
  actionFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 8,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.accentBlue,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#DC2626",
  },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  approveBtn: {
    backgroundColor: "rgba(22, 163, 74, 0.1)",
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#16A34A",
  },
  suspendBtn: {
    backgroundColor: "rgba(220, 38, 38, 0.1)",
  },
  suspendBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#DC2626",
  },
  bulkContent: {
    padding: 16,
    gap: 16,
  },
  bulkCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...SHADOWS.sm,
  },
  bulkIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  bulkCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#052A51",
    textAlign: "center",
  },
  bulkCardSub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 16,
  },
  pickFileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#052A51",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  pickFileBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  validationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...SHADOWS.sm,
  },
  validationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  validationTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#16A34A",
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 4,
  },
  errorText: {
    fontSize: 11,
    color: "#DC2626",
  },
  commitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F26522",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 14,
  },
  commitBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
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
    fontSize: 17,
    fontWeight: "800",
    color: "#052A51",
  },
  closeBtn: {
    padding: 6,
  },
  modalContent: {
    padding: 16,
    gap: 16,
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
  twoCol: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  statusOptionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  statusOptionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  statusOptionChipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  statusOptionText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  statusOptionTextActive: {
    color: "#1D4ED8",
    fontWeight: "800",
  },
  saveProductBtn: {
    backgroundColor: "#052A51",
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveProductBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
