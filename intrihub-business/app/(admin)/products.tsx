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
  Palette,
  Ruler,
  Tag,
  Check,
} from "lucide-react-native";
import {
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  fetchAdminProductApprovals,
  approveAdminProductPending,
  rejectAdminProductPending,
  fetchAdminBulkTemplate,
  validateAdminBulkCSV,
  commitAdminBulkProducts,
  fetchAdminCategories,
  createAdminCategory,
} from "../../src/api/admin";
import {
  CATALOG_COLOURS,
  CATALOG_UNITS,
  CATALOG_DIMENSIONS,
  CATALOG_FINISHES,
  CATALOG_MATERIALS,
} from "../../src/constants/catalog";
import { Product } from "../../src/types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

interface ProductVariantForm {
  id?: string;
  color: string;
  colorHex?: string;
  size: string;
  finish: string;
  pricePerBox: string;
  pricePerSqft: string;
  stockBoxes: string;
  image?: string;
}

export default function AdminProductsHubScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Top Segment: "catalog" | "approvals" | "bulk"
  const [activeSection, setActiveSection] = useState<"catalog" | "approvals" | "bulk">("catalog");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Product Add / Edit Modal State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categorySlug, setCategorySlug] = useState("tiles-stone");
  const [categoryName, setCategoryName] = useState("Tiles & Stone");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [unitOfSale, setUnitOfSale] = useState("box");
  const [pricePerBox, setPricePerBox] = useState("750");
  const [pricePerSqft, setPricePerSqft] = useState("45");
  const [mrp, setMrp] = useState("950");
  const [stockBoxes, setStockBoxes] = useState("100");
  const [size, setSize] = useState("600x1200mm");
  const [finish, setFinish] = useState("Glossy");
  const [material, setMaterial] = useState("Glazed Vitrified");
  const [thickness, setThickness] = useState("9mm");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("active");
  const [savingProduct, setSavingProduct] = useState(false);

  // Multi-Variants State (Flipkart Style)
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<ProductVariantForm[]>([]);

  // Quick Inline Category Creator State
  const [newCatModalOpen, setNewCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

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

  // 3. Categories Query
  const { data: catData, refetch: refetchCats } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => fetchAdminCategories(),
  });

  const products = productsData?.products || [];
  const approvals = approvalsData?.products || [];
  const categories = catData?.categories || [
    { id: "1", name: "Tiles & Stone", slug: "tiles-stone" },
    { id: "2", name: "Electrical & Lighting", slug: "electrical-lighting" },
    { id: "3", name: "Plumbing & Sanitaryware", slug: "plumbing-sanitaryware" },
    { id: "4", name: "Paints & Wallpapers", slug: "paints-wallpapers" },
    { id: "5", name: "Hardware & Tools", slug: "hardware-tools" },
  ];

  // Open Create Product Modal
  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingProductId(null);
    setName("");
    setDescription("");
    setCategorySlug(categories[0]?.slug || "tiles-stone");
    setCategoryName(categories[0]?.name || "Tiles & Stone");
    setCategoryId(categories[0]?.id);
    setUnitOfSale("box");
    setPricePerBox("750");
    setPricePerSqft("45");
    setMrp("950");
    setStockBoxes("100");
    setSize("600x1200mm");
    setFinish("Glossy");
    setMaterial("Glazed Vitrified");
    setThickness("9mm");
    setImageUrl("");
    setStatus("active");
    setHasVariants(false);
    setVariants([
      {
        color: "Alaska White",
        colorHex: "#F8FAFC",
        size: "600x1200mm",
        finish: "Glossy",
        pricePerBox: "750",
        pricePerSqft: "45",
        stockBoxes: "100",
      },
    ]);
    setFormModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEdit = (p: Product) => {
    setIsEditing(true);
    setEditingProductId(p.id);
    setName(p.name || "");
    setDescription(p.description || "");
    setCategorySlug(p.categorySlug || "tiles-stone");
    setCategoryName(p.categoryName || "Tiles & Stone");
    setCategoryId(p.categoryId || undefined);
    setUnitOfSale(p.unitOfSale || "box");
    setPricePerBox(String(p.pricePerBox || "750"));
    setPricePerSqft(String(p.pricePerSqft || "45"));
    setMrp(String(p.mrp || "950"));
    setStockBoxes(String(p.stockBoxes ?? "100"));
    setSize(p.size || "600x1200mm");
    setFinish(p.finish || "Glossy");
    setMaterial(p.material || "Glazed Vitrified");
    setThickness(p.thickness || "9mm");
    setImageUrl(p.images?.[0] || "");
    setStatus(p.status || "active");
    setHasVariants(false);
    setVariants([
      {
        color: "Standard",
        colorHex: "#E2E8F0",
        size: p.size || "600x1200mm",
        finish: p.finish || "Glossy",
        pricePerBox: String(p.pricePerBox || "750"),
        pricePerSqft: String(p.pricePerSqft || "45"),
        stockBoxes: String(p.stockBoxes ?? "100"),
      },
    ]);
    setFormModalOpen(true);
  };

  // Add Variant Row (Flipkart / Amazon style)
  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        color: `Option ${prev.length + 1}`,
        colorHex: "#3B82F6",
        size: size || "600x1200mm",
        finish: finish || "Glossy",
        pricePerBox: pricePerBox || "750",
        pricePerSqft: pricePerSqft || "45",
        stockBoxes: stockBoxes || "50",
        image: imageUrl || undefined,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      Alert.alert("Notice", "At least one product variant must remain.");
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateVariant = (index: number, field: keyof ProductVariantForm, value: string) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Product title cannot be empty.");
      return;
    }

    setSavingProduct(true);

    const formattedVariants = (hasVariants && variants.length > 0 ? variants : [
      {
        color: "Standard",
        size: size || "600x600mm",
        finish: finish || "Glossy",
        pricePerBox: pricePerBox || "750",
        pricePerSqft: pricePerSqft || "45",
        stockBoxes: stockBoxes || "50",
      },
    ]).map((v) => ({
      color: v.color.trim() || "Standard",
      colorHex: v.colorHex,
      size: v.size || size || "600x600mm",
      finish: v.finish || finish || "Glossy",
      pricePerBox: parseFloat(v.pricePerBox) || 750,
      pricePerSqft: parseFloat(v.pricePerSqft) || 45,
      sqftPerBox: 16,
      stockBoxes: parseInt(v.stockBoxes, 10) || 50,
      image: v.image || imageUrl || undefined,
    }));

    try {
      if (isEditing && editingProductId) {
        const res = await updateAdminProduct(editingProductId, {
          name: name.trim(),
          description: description.trim(),
          categorySlug,
          categoryId,
          unitOfSale,
          pricePerBox: parseFloat(pricePerBox) || undefined,
          pricePerSqft: parseFloat(pricePerSqft) || undefined,
          mrp: parseFloat(mrp) || undefined,
          stockBoxes: parseInt(stockBoxes, 10) || undefined,
          material,
          finish,
          size,
          thickness,
          images: imageUrl ? [imageUrl] : undefined,
          status,
        });
        setSavingProduct(false);
        if (res.success) {
          setFormModalOpen(false);
          Alert.alert("Product Updated", "Catalog item updated successfully!");
          refetchProducts();
        } else {
          Alert.alert("Error", res.error || "Failed to update product");
        }
      } else {
        const res = await createAdminProduct({
          name: name.trim(),
          description: description.trim(),
          categorySlug,
          categoryName,
          categoryId,
          unitOfSale,
          pricePerBox: parseFloat(pricePerBox) || 750,
          pricePerSqft: parseFloat(pricePerSqft) || 45,
          mrp: parseFloat(mrp) || 950,
          stockBoxes: parseInt(stockBoxes, 10) || 100,
          material,
          finish,
          size,
          thickness,
          images: imageUrl ? [imageUrl] : [],
          status,
          variants: formattedVariants,
        });
        setSavingProduct(false);
        if (res.success) {
          setFormModalOpen(false);
          Alert.alert("Product Published 🎉", "New item listed in catalog!");
          refetchProducts();
        } else {
          Alert.alert("Error", res.error || "Failed to create product");
        }
      }
    } catch (e: any) {
      setSavingProduct(false);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  // Quick Inline Category Creation
  const handleQuickAddCategory = async () => {
    if (!newCatName.trim()) return;
    setCreatingCategory(true);
    try {
      const slug = newCatName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const res = await createAdminCategory({
        name: newCatName.trim(),
        slug,
        calculatorType: "tile",
      });
      setCreatingCategory(false);
      if (res.success) {
        setCategorySlug(slug);
        setCategoryName(newCatName.trim());
        setNewCatName("");
        setNewCatModalOpen(false);
        refetchCats();
        Alert.alert("Category Created", `Category "${newCatName}" added & selected!`);
      } else {
        Alert.alert("Error", res.error || "Failed to create category");
      }
    } catch (e: any) {
      setCreatingCategory(false);
      Alert.alert("Error", e?.message || "Failed to create category");
    }
  };

  // Delete Product Handler
  const handleDeleteProduct = (productId: string, productName: string) => {
    Alert.alert("Delete Product", `Permanently delete "${productName}" from catalog?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await deleteAdminProduct(productId);
            if (res.success) {
              Alert.alert("Deleted", "Product deleted from database.");
              refetchProducts();
            } else {
              Alert.alert("Error", res.error || "Failed to delete");
            }
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to delete");
          }
        },
      },
    ]);
  };

  // Approve Pending Product Handler
  const handleApproveProduct = async (id: string, prodName: string) => {
    try {
      const res = await approveAdminProductPending(id);
      if (res.success) {
        Alert.alert("Approved 🎉", `Product "${prodName}" is now active in the live store!`);
        refetchApprovals();
        refetchProducts();
      } else {
        Alert.alert("Error", res.error || "Failed to approve product");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  // Reject Pending Product Handler
  const handleRejectProduct = (id: string, prodName: string) => {
    Alert.alert("Reject Product", `Reject seller product "${prodName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await rejectAdminProductPending(id, "Does not meet catalog image and pricing quality standard");
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

  // Bulk CSV Importer Handlers
  const handlePickCsvFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/csv", "text/plain"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const fileUri = result.assets[0].uri;
        const content = await FileSystem.readAsStringAsync(fileUri);
        setBulkCsvText(content);
        setValidating(true);
        const res = await validateAdminBulkCSV(content);
        setValidating(false);
        if (res.success) {
          setValidationResult(res);
          Alert.alert("CSV Parsed Successfully", `Found ${res.validRows} valid rows ready for import!`);
        } else {
          Alert.alert("CSV Validation Error", res.error || "Invalid file format");
        }
      }
    } catch (err: any) {
      setValidating(false);
      Alert.alert("File Error", err?.message || "Could not read CSV file");
    }
  };

  const handleCommitBulk = async () => {
    if (!validationResult?.preview || validationResult.preview.length === 0) {
      Alert.alert("Error", "No validated products to import.");
      return;
    }
    setCommitting(true);
    try {
      const res = await commitAdminBulkProducts(validationResult.preview);
      setCommitting(false);
      if (res.success) {
        Alert.alert("Bulk Import Complete 🎉", `Successfully imported ${res.count || validationResult.validRows} products to the catalog!`);
        setValidationResult(null);
        setBulkCsvText("");
        setActiveSection("catalog");
        refetchProducts();
      } else {
        Alert.alert("Import Error", res.error || "Failed to commit products");
      }
    } catch (e: any) {
      setCommitting(false);
      Alert.alert("Error", e?.message || "Failed to commit products");
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productRow}>
        <Image
          source={item.images?.[0] ? { uri: item.images[0] } : require("../../assets/intri-icon.png")}
          style={styles.productImage}
          contentFit="cover"
        />
        <View style={styles.productInfo}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, item.status === "active" ? styles.statusActive : styles.statusDraft]}>
              <Text style={[styles.statusText, item.status === "active" ? styles.statusTextActive : styles.statusTextDraft]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.categoryPill}>{item.categorySlug}</Text>
          </View>

          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.vendorSubtitle}>Vendor: {item.vendorName || "Direct / Admin"}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>
              ₹{item.pricePerBox?.toLocaleString("en-IN") || item.pricePerSqft?.toLocaleString("en-IN") || "0"}
              <Text style={styles.unitText}> / {item.unitOfSale || "box"}</Text>
            </Text>

            <View style={styles.stockPill}>
              <Boxes size={11} color="#64748B" />
              <Text style={styles.stockText}>{item.stockBoxes ?? 0} in stock</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEdit(item)}>
          <Edit2 size={13} color={COLORS.accentBlue} />
          <Text style={styles.editBtnText}>Edit Item Details</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteProduct(item.id, item.name)}>
          <Trash2 size={13} color="#DC2626" />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderApprovalItem = ({ item }: { item: any }) => (
    <View style={styles.productCard}>
      <View style={styles.productRow}>
        <Image
          source={item.images?.[0] ? { uri: item.images[0] } : require("../../assets/intri-icon.png")}
          style={styles.productImage}
          contentFit="cover"
        />
        <View style={styles.productInfo}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: "#FEF3C7" }]}>
              <Text style={[styles.statusText, { color: "#D97706" }]}>AWAITING APPROVAL</Text>
            </View>
          </View>

          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.vendorSubtitle}>Submitted by: {item.vendor?.businessName || "Vendor Partner"}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>₹{item.pricePerBox || item.pricePerSqft || "0"} / box</Text>
          </View>
        </View>
      </View>

      <View style={styles.approvalActions}>
        <TouchableOpacity
          style={styles.approveBtn}
          onPress={() => handleApproveProduct(item.id, item.name)}
        >
          <CheckCircle2 size={14} color="#FFFFFF" />
          <Text style={styles.approveBtnText}>Approve & Publish</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => handleRejectProduct(item.id, item.name)}
        >
          <XCircle size={14} color="#DC2626" />
          <Text style={styles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Products Catalog Hub</Text>
          <Text style={styles.headerSubtitle}>Manage catalog items, seller approvals & bulk CSV</Text>
        </View>
        <TouchableOpacity style={styles.headerAddBtn} onPress={handleOpenAdd}>
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.headerAddBtnText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* 3-Segment Top Bar */}
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

      {/* Section Content */}
      {activeSection === "catalog" ? (
        <>
          <View style={styles.filterSection}>
            <View style={styles.searchBar}>
              <Search size={16} color={COLORS.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products by title, category..."
                placeholderTextColor={COLORS.textTertiary}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {["all", "active", "draft", "out_of_stock"].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
                  onPress={() => setStatusFilter(st)}
                >
                  <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
                    {st === "all" ? "All Products" : st.replace("_", " ").toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {productsLoading ? (
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
          )}
        </>
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

      {/* Comprehensive Product Add & Edit Modal (with Multi-Variants) */}
      <Modal
        visible={formModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFormModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEditing ? "Edit Product" : "Add New Product"}</Text>
            <TouchableOpacity onPress={() => setFormModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              {/* Product Title */}
              <Text style={styles.inputLabel}>Product Title *</Text>
              <TextInput
                style={styles.inputBox}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Royal Statuario Glazed Vitrified Tile"
              />

              {/* Category Dropdown & Quick Add */}
              <View style={{ marginTop: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <Text style={styles.inputLabel}>Category *</Text>
                  <TouchableOpacity onPress={() => setNewCatModalOpen(true)}>
                    <Text style={styles.quickAddLink}>+ Add New Category</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                  {categories.map((cat: any) => {
                    const isSelected = categorySlug === cat.slug;
                    return (
                      <TouchableOpacity
                        key={cat.id || cat.slug}
                        style={[styles.dropdownChip, isSelected && styles.dropdownChipActive]}
                        onPress={() => {
                          setCategorySlug(cat.slug);
                          setCategoryName(cat.name);
                          setCategoryId(cat.id);
                        }}
                      >
                        <Text style={[styles.dropdownChipText, isSelected && styles.dropdownChipTextActive]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Unit of Sale Dropdown */}
              <View style={{ marginTop: 14 }}>
                <Text style={styles.inputLabel}>Unit of Sale *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                  {STANDARD_UNITS.map((u) => {
                    const isSelected = unitOfSale === u;
                    return (
                      <TouchableOpacity
                        key={u}
                        style={[styles.dropdownChip, isSelected && styles.dropdownChipActive]}
                        onPress={() => setUnitOfSale(u)}
                      >
                        <Text style={[styles.dropdownChipText, isSelected && styles.dropdownChipTextActive]}>
                          {u.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Size Selector */}
              <View style={{ marginTop: 14 }}>
                <Text style={styles.inputLabel}>Dimensions / Size</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                  {STANDARD_SIZES.map((sz) => {
                    const isSelected = size === sz;
                    return (
                      <TouchableOpacity
                        key={sz}
                        style={[styles.dropdownChip, isSelected && styles.dropdownChipActive]}
                        onPress={() => setSize(sz)}
                      >
                        <Text style={[styles.dropdownChipText, isSelected && styles.dropdownChipTextActive]}>
                          {sz}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Finish Selector */}
              <View style={{ marginTop: 14 }}>
                <Text style={styles.inputLabel}>Finish / Look</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                  {STANDARD_FINISHES.map((fn) => {
                    const isSelected = finish === fn;
                    return (
                      <TouchableOpacity
                        key={fn}
                        style={[styles.dropdownChip, isSelected && styles.dropdownChipActive]}
                        onPress={() => setFinish(fn)}
                      >
                        <Text style={[styles.dropdownChipText, isSelected && styles.dropdownChipTextActive]}>
                          {fn}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Pricing & Stock Grid */}
              <View style={[styles.twoCol, { marginTop: 14 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Price / {unitOfSale.toUpperCase()} (₹) *</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={pricePerBox}
                    onChangeText={setPricePerBox}
                    keyboardType="decimal-pad"
                    placeholder="750"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Price / Sqft (₹)</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={pricePerSqft}
                    onChangeText={setPricePerSqft}
                    keyboardType="decimal-pad"
                    placeholder="45"
                  />
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>List MRP (₹)</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={mrp}
                    onChangeText={setMrp}
                    keyboardType="decimal-pad"
                    placeholder="950"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Stock Quantity ({unitOfSale}s) *</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={stockBoxes}
                    onChangeText={setStockBoxes}
                    keyboardType="number-pad"
                    placeholder="100"
                  />
                </View>
              </View>

              {/* Image URL & Description */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Primary Image URL</Text>
              <TextInput
                style={styles.inputBox}
                value={imageUrl}
                onChangeText={setImageUrl}
                placeholder="https://example.com/tile-image.jpg"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Product Description</Text>
              <TextInput
                style={[styles.inputBox, { height: 70, paddingTop: 8 }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Detailed specifications, installation guidelines..."
                multiline
              />
            </View>

            {/* Multi-Variant Section (Flipkart / Amazon Style) */}
            <View style={styles.modalCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={styles.variantSectionTitle}>Multi-Variant Options (Flipkart Style)</Text>
                  <Text style={styles.variantSectionSub}>Add different colors, sizes, or finishes for the same item</Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggleBtn, hasVariants && styles.toggleBtnActive]}
                  onPress={() => setHasVariants(!hasVariants)}
                >
                  <Text style={[styles.toggleBtnText, hasVariants && styles.toggleBtnTextActive]}>
                    {hasVariants ? "ON" : "OFF"}
                  </Text>
                </TouchableOpacity>
              </View>

              {hasVariants && (
                <View style={{ marginTop: 14 }}>
                  {variants.map((v, idx) => (
                    <View key={idx} style={styles.variantCard}>
                      <View style={styles.variantCardHeader}>
                        <Text style={styles.variantNum}>Variant #{idx + 1}</Text>
                        <TouchableOpacity onPress={() => handleRemoveVariant(idx)}>
                          <Trash2 size={14} color="#DC2626" />
                        </TouchableOpacity>
                      </View>

                      <View style={{ marginBottom: 8 }}>
                        <Text style={styles.variantLabel}>Pick Preset Colour Swatch:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                          {CATALOG_COLOURS.map((col) => {
                            const isSelected = v.color === col.name;
                            return (
                              <TouchableOpacity
                                key={col.name}
                                style={[
                                  styles.colorSwatchChip,
                                  isSelected && styles.colorSwatchChipActive,
                                ]}
                                onPress={() => {
                                  handleUpdateVariant(idx, "color", col.name);
                                  handleUpdateVariant(idx, "colorHex", col.hexCode);
                                }}
                              >
                                <View style={[styles.colorCircle, { backgroundColor: col.hexCode }]} />
                                <Text style={[styles.colorSwatchText, isSelected && styles.colorSwatchTextActive]}>
                                  {col.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>

                      <View style={styles.twoCol}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.variantLabel}>Color Name (Custom / Edited)</Text>
                          <TextInput
                            style={styles.variantInput}
                            value={v.color}
                            onChangeText={(val) => handleUpdateVariant(idx, "color", val)}
                            placeholder="e.g. Statuario White"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.variantLabel}>Dimension / Size</Text>
                          <TextInput
                            style={styles.variantInput}
                            value={v.size}
                            onChangeText={(val) => handleUpdateVariant(idx, "size", val)}
                            placeholder="600x1200mm"
                          />
                        </View>
                      </View>

                      <View style={styles.twoCol}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.variantLabel}>Price / Box (₹)</Text>
                          <TextInput
                            style={styles.variantInput}
                            value={v.pricePerBox}
                            onChangeText={(val) => handleUpdateVariant(idx, "pricePerBox", val)}
                            keyboardType="decimal-pad"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.variantLabel}>Stock Units</Text>
                          <TextInput
                            style={styles.variantInput}
                            value={v.stockBoxes}
                            onChangeText={(val) => handleUpdateVariant(idx, "stockBoxes", val)}
                            keyboardType="number-pad"
                          />
                        </View>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity style={styles.addVariantBtn} onPress={handleAddVariant}>
                    <Plus size={14} color="#052A51" />
                    <Text style={styles.addVariantBtnText}>+ Add Another Color / Size Variant</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveProduct} disabled={savingProduct}>
              {savingProduct ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveActionBtnText}>
                  {isEditing ? "Save Changes" : "Publish Product to Catalog"}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Quick Category Modal */}
      <Modal visible={newCatModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.quickModalCard}>
            <Text style={styles.quickModalTitle}>Add New Category</Text>
            <TextInput
              style={styles.inputBox}
              value={newCatName}
              onChangeText={setNewCatName}
              placeholder="Category Name (e.g. Adhesives & Grouts)"
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={[styles.quickModalBtn, { backgroundColor: "#F1F5F9" }]}
                onPress={() => setNewCatModalOpen(false)}
              >
                <Text style={{ color: "#64748B", fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickModalBtn, { backgroundColor: "#052A51" }]}
                onPress={handleQuickAddCategory}
                disabled={creatingCategory}
              >
                {creatingCategory ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={{ color: "#FFF", fontWeight: "800" }}>Add & Select</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  headerAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F26522",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  headerAddBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
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
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 13,
    color: COLORS.text,
  },
  chipsScroll: {
    marginTop: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: "#052A51",
    borderColor: "#052A51",
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    padding: SPACING.md,
    gap: 12,
    paddingBottom: 40,
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...SHADOWS.sm,
  },
  productRow: {
    flexDirection: "row",
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusActive: { backgroundColor: "#DCFCE7" },
  statusDraft: { backgroundColor: "#F1F5F9" },
  statusText: { fontSize: 9, fontWeight: "800" },
  statusTextActive: { color: "#16A34A" },
  statusTextDraft: { color: "#64748B" },
  categoryPill: {
    fontSize: 10,
    color: "#64748B",
  },
  productName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
  },
  vendorSubtitle: {
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
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 8,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.accentBlue,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#DC2626",
  },
  approvalActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16A34A",
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  approveBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  rejectBtnText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "800",
  },
  bulkContent: {
    padding: SPACING.md,
    gap: 14,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  bulkCardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#052A51",
  },
  bulkCardSub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  pickFileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#052A51",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
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
    gap: 12,
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
    borderRadius: 8,
    padding: 10,
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
    backgroundColor: "#16A34A",
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 8,
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
    fontSize: 16,
    fontWeight: "800",
    color: "#052A51",
  },
  closeBtn: {
    padding: 6,
  },
  modalContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 50,
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
    fontSize: 13,
    color: COLORS.text,
  },
  twoCol: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  dropdownChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginHorizontal: 4,
  },
  dropdownChipActive: {
    backgroundColor: "#052A51",
    borderColor: "#052A51",
  },
  dropdownChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  dropdownChipTextActive: {
    color: "#FFFFFF",
  },
  quickAddLink: {
    fontSize: 11,
    fontWeight: "800",
    color: "#F26522",
  },
  variantSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#052A51",
  },
  variantSectionSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
  },
  toggleBtnActive: {
    backgroundColor: "#16A34A",
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
  },
  toggleBtnTextActive: {
    color: "#FFFFFF",
  },
  variantCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  variantCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  variantNum: {
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
  },
  variantLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 4,
  },
  variantInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
    color: "#052A51",
  },
  addVariantBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
    marginTop: 6,
  },
  addVariantBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
  },
  saveActionBtn: {
    backgroundColor: "#052A51",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveActionBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  quickModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    ...SHADOWS.md,
  },
  quickModalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#052A51",
    marginBottom: 12,
  },
  quickModalBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 6,
    gap: 6,
  },
  colorSwatchChipActive: {
    borderColor: "#052A51",
    backgroundColor: "#EFF6FF",
  },
  colorCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
  },
  colorSwatchText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },
  colorSwatchTextActive: {
    color: "#052A51",
    fontWeight: "800",
  },
});
