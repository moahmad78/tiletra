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
import * as ImagePicker from "expo-image-picker";
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
  ChevronDown,
  IndianRupee,
  Boxes,
  Eye,
  Palette,
  Ruler,
  Tag,
  Check,
  Camera,
  Scale,
  SlidersHorizontal,
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
import { uploadBusinessImage } from "../../src/api/auth";
import {
  CATALOG_COLOURS,
  CATALOG_UNITS,
  CATALOG_DIMENSIONS,
  CATALOG_FINISHES,
  CATALOG_MATERIALS,
  resolveColorHex,
} from "../../src/constants/catalog";
import { Product } from "../../src/types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

interface ProductVariantForm {
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
  const [size, setSize] = useState("600x1200 mm (2x4 ft)");
  const [finish, setFinish] = useState("Glossy");
  const [material, setMaterial] = useState("Glazed Vitrified (GVT)");
  const [thickness, setThickness] = useState("9mm");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("active");
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Multi-Variants State
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<ProductVariantForm[]>([]);

  // Reusable Dropdown Picker Sheet State
  const [dropdownType, setDropdownType] = useState<
    "category" | "unit" | "size" | "finish" | "material" | "variant_size" | "variant_finish" | "variant_color" | null
  >(null);
  const [dropdownVariantIdx, setDropdownVariantIdx] = useState<number | null>(null);
  const [customOptionInput, setCustomOptionInput] = useState("");
  const [dropdownSearch, setDropdownSearch] = useState("");

  // Custom Local Master Options (persisted in memory for fast add)
  const [customUnits, setCustomUnits] = useState<string[]>([]);
  const [customSizes, setCustomSizes] = useState<string[]>([]);
  const [customFinishes, setCustomFinishes] = useState<string[]>([]);
  const [customMaterials, setCustomMaterials] = useState<string[]>([]);

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

  const allUnits = Array.from(new Set([...CATALOG_UNITS, ...customUnits]));
  const allSizes = Array.from(new Set([...CATALOG_DIMENSIONS, ...customSizes]));
  const allFinishes = Array.from(new Set([...CATALOG_FINISHES, ...customFinishes]));
  const allMaterials = Array.from(new Set([...CATALOG_MATERIALS, ...customMaterials]));

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
    setSize("600x1200 mm (2x4 ft)");
    setFinish("Glossy");
    setMaterial("Glazed Vitrified (GVT)");
    setThickness("9mm");
    setImageUrl("");
    setStatus("active");
    setHasVariants(false);
    setVariants([
      {
        color: "Alaska White",
        colorHex: resolveColorHex("Alaska White"),
        size: "600x1200 mm (2x4 ft)",
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
    setSize(p.size || "600x1200 mm (2x4 ft)");
    setFinish(p.finish || "Glossy");
    setMaterial(p.material || "Glazed Vitrified (GVT)");
    setThickness(p.thickness || "9mm");
    setImageUrl(p.images?.[0] || "");
    setStatus(p.status || "active");
    setHasVariants(false);
    setVariants([
      {
        color: "Standard",
        colorHex: resolveColorHex("Standard"),
        size: p.size || "600x1200 mm (2x4 ft)",
        finish: p.finish || "Glossy",
        pricePerBox: String(p.pricePerBox || "750"),
        pricePerSqft: String(p.pricePerSqft || "45"),
        stockBoxes: String(p.stockBoxes ?? "100"),
      },
    ]);
    setFormModalOpen(true);
  };

  // Add Variant Row
  const handleAddVariant = () => {
    const defaultColor = `Option ${variants.length + 1}`;
    setVariants((prev) => [
      ...prev,
      {
        color: defaultColor,
        colorHex: resolveColorHex(defaultColor),
        size: size || "600x1200 mm (2x4 ft)",
        finish: finish || "Glossy",
        pricePerBox: pricePerBox || "750",
        pricePerSqft: pricePerSqft || "45",
        stockBoxes: stockBoxes || "50",
        image: imageUrl || undefined,
      },
    ]);
  };

  const handleUpdateVariant = (index: number, field: keyof ProductVariantForm, value: string) => {
    setVariants((prev) => {
      const next = [...prev];
      if (field === "color") {
        // Auto-detect and resolve hex code on the fly!
        const detectedHex = resolveColorHex(value);
        next[index] = { ...next[index], color: value, colorHex: detectedHex };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      Alert.alert("Notice", "You need at least one variant when multi-variant is enabled.");
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // Primary Image Upload Helper
  const handlePickAndUploadPrimaryImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const asset = result.assets[0];
        setUploadingImage(true);
        const res = await uploadBusinessImage(
          asset.uri,
          asset.fileName || `prod-${Date.now()}.jpg`,
          asset.mimeType || "image/jpeg"
        );
        setUploadingImage(false);

        if (res.success && res.url) {
          setImageUrl(res.url);
          Alert.alert("Uploaded 🎉", "Product primary image uploaded!");
        } else {
          Alert.alert("Upload Error", res.error || "Could not upload image");
        }
      }
    } catch (e: any) {
      setUploadingImage(false);
      Alert.alert("Error", e?.message || "Something went wrong during image upload");
    }
  };

  // Variant Image Upload Helper
  const handlePickAndUploadVariantImage = async (variantIdx: number) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const asset = result.assets[0];
        setUploadingImage(true);
        const res = await uploadBusinessImage(
          asset.uri,
          asset.fileName || `var-${variantIdx}-${Date.now()}.jpg`,
          asset.mimeType || "image/jpeg"
        );
        setUploadingImage(false);

        if (res.success && res.url) {
          handleUpdateVariant(variantIdx, "image", res.url);
          Alert.alert("Uploaded 🎉", `Variant #${variantIdx + 1} image updated!`);
        } else {
          Alert.alert("Upload Error", res.error || "Could not upload image");
        }
      }
    } catch (e: any) {
      setUploadingImage(false);
      Alert.alert("Error", e?.message || "Something went wrong during image upload");
    }
  };

  // Handle Add New Custom Option inside Dropdown
  const handleAddCustomOption = async () => {
    if (!customOptionInput.trim()) {
      Alert.alert("Validation", "Please enter a value to add.");
      return;
    }
    const val = customOptionInput.trim();

    if (dropdownType === "category") {
      try {
        const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const res = await createAdminCategory({
          name: val,
          slug,
          description: "Admin added custom category",
        });
        if (res.success) {
          refetchCats();
          setCategoryName(val);
          setCategorySlug(slug);
          setCustomOptionInput("");
          setDropdownType(null);
          Alert.alert("Category Added 🎉", `"${val}" is now active in category dropdown.`);
        } else {
          Alert.alert("Error", res.error || "Failed to create category");
        }
      } catch (e: any) {
        Alert.alert("Error", e?.message || "Failed to create category");
      }
      return;
    }

    if (dropdownType === "unit") {
      const lower = val.toLowerCase();
      setCustomUnits((prev) => Array.from(new Set([...prev, lower])));
      setUnitOfSale(lower);
      setCustomOptionInput("");
      setDropdownType(null);
    } else if (dropdownType === "size") {
      setCustomSizes((prev) => Array.from(new Set([...prev, val])));
      setSize(val);
      setCustomOptionInput("");
      setDropdownType(null);
    } else if (dropdownType === "finish") {
      setCustomFinishes((prev) => Array.from(new Set([...prev, val])));
      setFinish(val);
      setCustomOptionInput("");
      setDropdownType(null);
    } else if (dropdownType === "material") {
      setCustomMaterials((prev) => Array.from(new Set([...prev, val])));
      setMaterial(val);
      setCustomOptionInput("");
      setDropdownType(null);
    } else if (dropdownType === "variant_size" && dropdownVariantIdx !== null) {
      setCustomSizes((prev) => Array.from(new Set([...prev, val])));
      handleUpdateVariant(dropdownVariantIdx, "size", val);
      setCustomOptionInput("");
      setDropdownType(null);
    } else if (dropdownType === "variant_finish" && dropdownVariantIdx !== null) {
      setCustomFinishes((prev) => Array.from(new Set([...prev, val])));
      handleUpdateVariant(dropdownVariantIdx, "finish", val);
      setCustomOptionInput("");
      setDropdownType(null);
    }
  };

  // Handle Save / Create Product
  const handleSaveProduct = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Product title is required.");
      return;
    }

    setSavingProduct(true);
    try {
      const payload: any = {
        name: name.trim(),
        description: description.trim(),
        categorySlug,
        categoryName,
        categoryId,
        unitOfSale,
        pricePerBox: parseFloat(pricePerBox) || 0,
        pricePerSqft: parseFloat(pricePerSqft) || 0,
        mrp: parseFloat(mrp) || 0,
        stockBoxes: parseInt(stockBoxes, 10) || 0,
        size,
        finish,
        material,
        thickness,
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
        status,
        variants: hasVariants ? variants : undefined,
      };

      let res;
      if (isEditing && editingProductId) {
        res = await updateAdminProduct(editingProductId, payload);
      } else {
        res = await createAdminProduct(payload);
      }

      setSavingProduct(false);

      if (res.success) {
        setFormModalOpen(false);
        refetchProducts();
        queryClient.invalidateQueries({ queryKey: ["admin-products"] });
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
        Alert.alert(
          isEditing ? "Product Updated 🎉" : "Product Created 🎉",
          `Product "${name}" saved successfully!`
        );
      } else {
        Alert.alert("Error", res.error || "Failed to save product");
      }
    } catch (e: any) {
      setSavingProduct(false);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = (id: string, prodName: string) => {
    Alert.alert(
      "Move to Recycle Bin",
      `Move "${prodName}" to Trash?\n\nIt will be safely stored in the Recycle Bin for 3 days and can be restored at any time.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Move to Trash",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await deleteAdminProduct(id);
              if (res.success) {
                refetchProducts();
                queryClient.invalidateQueries({ queryKey: ["admin-products"] });
                queryClient.invalidateQueries({ queryKey: ["admin-trash"] });
                Alert.alert("Moved to Trash", `"${prodName}" moved to Recycle Bin.`);
              } else {
                Alert.alert("Error", res.error || "Failed to delete");
              }
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to delete");
            }
          },
        },
      ]
    );
  };

  // Handle Approve / Reject Pending
  const handleApproveProduct = async (id: string, prodName: string) => {
    try {
      const res = await approveAdminProductPending(id);
      if (res.success) {
        Alert.alert("Approved 🎉", `"${prodName}" is now live in the marketplace!`);
        refetchApprovals();
        refetchProducts();
      } else {
        Alert.alert("Error", res.error || "Failed to approve");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to approve");
    }
  };

  const handleRejectProduct = (id: string, prodName: string) => {
    Alert.alert("Reject Product", `Reject listing for "${prodName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await rejectAdminProductPending(id, "Does not meet catalog quality standards");
            if (res.success) {
              Alert.alert("Rejected", "Product rejected.");
              refetchApprovals();
            } else {
              Alert.alert("Error", res.error || "Failed to reject");
            }
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to reject");
          }
        },
      },
    ]);
  };

  // Bulk CSV Handlers
  const handlePickCsvFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel", "text/plain"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const fileUri = result.assets[0].uri;
        const text = await FileSystem.readAsStringAsync(fileUri);
        setBulkCsvText(text);

        setValidating(true);
        const res = await validateAdminBulkCSV(text);
        setValidating(false);

        if (res.success) {
          setValidationResult(res);
          Alert.alert("CSV Validated 🎉", `Found ${res.validRows} valid rows out of ${res.totalRows}.`);
        } else {
          Alert.alert("CSV Validation Error", res.error || "Invalid CSV structure");
        }
      }
    } catch (e: any) {
      setValidating(false);
      Alert.alert("Error", e?.message || "Failed to read CSV file");
    }
  };

  const handleCommitBulk = async () => {
    if (!bulkCsvText) return;
    setCommitting(true);
    try {
      const res = await commitAdminBulkProducts(bulkCsvText);
      setCommitting(false);
      if (res.success) {
        Alert.alert("Import Successful 🎉", `Imported/Updated ${res.importedCount} products!`);
        setValidationResult(null);
        setBulkCsvText("");
        refetchProducts();
      } else {
        Alert.alert("Commit Error", res.error || "Failed to commit products");
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

      {/* Comprehensive Product Add & Edit Modal (with Clean Dropdowns & Multi-Variants) */}
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

              {/* 1. Category Dropdown */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Category *</Text>
              <TouchableOpacity
                style={styles.dropdownSelectBox}
                onPress={() => {
                  setDropdownType("category");
                  setCustomOptionInput("");
                  setDropdownSearch("");
                }}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                  <Layers size={16} color="#052A51" />
                  <Text style={styles.dropdownSelectText}>{categoryName || "Select Category"}</Text>
                </View>
                <ChevronDown size={18} color="#64748B" />
              </TouchableOpacity>

              {/* 2. Unit of Sale Dropdown */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Unit of Sale *</Text>
              <TouchableOpacity
                style={styles.dropdownSelectBox}
                onPress={() => {
                  setDropdownType("unit");
                  setCustomOptionInput("");
                  setDropdownSearch("");
                }}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                  <Scale size={16} color="#052A51" />
                  <Text style={styles.dropdownSelectText}>{unitOfSale.toUpperCase()}</Text>
                </View>
                <ChevronDown size={18} color="#64748B" />
              </TouchableOpacity>

              {/* 3. Dimensions / Size Dropdown */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Dimensions / Size</Text>
              <TouchableOpacity
                style={styles.dropdownSelectBox}
                onPress={() => {
                  setDropdownType("size");
                  setCustomOptionInput("");
                  setDropdownSearch("");
                }}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                  <Ruler size={16} color="#052A51" />
                  <Text style={styles.dropdownSelectText}>{size || "Select Dimension / Size"}</Text>
                </View>
                <ChevronDown size={18} color="#64748B" />
              </TouchableOpacity>

              {/* 4. Finish / Look Dropdown */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Finish / Look</Text>
              <TouchableOpacity
                style={styles.dropdownSelectBox}
                onPress={() => {
                  setDropdownType("finish");
                  setCustomOptionInput("");
                  setDropdownSearch("");
                }}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                  <Sparkles size={16} color="#052A51" />
                  <Text style={styles.dropdownSelectText}>{finish || "Select Finish / Look"}</Text>
                </View>
                <ChevronDown size={18} color="#64748B" />
              </TouchableOpacity>

              {/* 5. Material Dropdown */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Material Composition</Text>
              <TouchableOpacity
                style={styles.dropdownSelectBox}
                onPress={() => {
                  setDropdownType("material");
                  setCustomOptionInput("");
                  setDropdownSearch("");
                }}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                  <Boxes size={16} color="#052A51" />
                  <Text style={styles.dropdownSelectText}>{material || "Select Material"}</Text>
                </View>
                <ChevronDown size={18} color="#64748B" />
              </TouchableOpacity>

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

              {/* Primary Image with Upload & URL */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Primary Product Image</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  style={[styles.inputBox, { flex: 1 }]}
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  placeholder="https://example.com/tile-image.jpg"
                />
                <TouchableOpacity
                  style={styles.uploadMiniBtn}
                  onPress={handlePickAndUploadPrimaryImage}
                  disabled={uploadingImage}
                >
                  <Camera size={14} color="#052A51" />
                  <Text style={styles.uploadMiniBtnText}>Upload</Text>
                </TouchableOpacity>
              </View>
              {imageUrl ? (
                <View style={styles.imagePreviewBox}>
                  <Image source={{ uri: imageUrl }} style={styles.imagePreviewImg} contentFit="cover" />
                </View>
              ) : null}

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Product Description</Text>
              <TextInput
                style={[styles.inputBox, { height: 70, paddingTop: 8 }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Detailed specifications, installation guidelines..."
                multiline
              />
            </View>

            {/* Multi-Variant Section */}
            <View style={styles.modalCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.variantSectionTitle}>Multi-Variant Options</Text>
                  <Text style={styles.variantSectionSub}>
                    Add different colors, dimensions, prices or finishes for this product
                  </Text>
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
                  {variants.map((v, idx) => {
                    const activeHex = v.colorHex || resolveColorHex(v.color);
                    return (
                      <View key={idx} style={styles.variantCard}>
                        <View style={styles.variantCardHeader}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <View style={[styles.colorBubbleLive, { backgroundColor: activeHex }]} />
                            <Text style={styles.variantNum}>Variant #{idx + 1}</Text>
                          </View>
                          <TouchableOpacity onPress={() => handleRemoveVariant(idx)}>
                            <Trash2 size={14} color="#DC2626" />
                          </TouchableOpacity>
                        </View>

                        {/* Color Name with Real-Time Live Swatch Auto-Detection */}
                        <Text style={styles.variantLabel}>Color / Shade Name * (Auto Swatch)</Text>
                        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                          <View style={[styles.colorBubbleInput, { backgroundColor: activeHex }]}>
                            <View style={styles.colorBubbleBorder} />
                          </View>
                          <TextInput
                            style={[styles.variantInput, { flex: 1 }]}
                            value={v.color}
                            onChangeText={(val) => handleUpdateVariant(idx, "color", val)}
                            placeholder="e.g. Royal Blue, Alaska White, Teak, Charcoal..."
                          />
                          <TouchableOpacity
                            style={styles.chooseSwatchBtn}
                            onPress={() => {
                              setDropdownType("variant_color");
                              setDropdownVariantIdx(idx);
                              setDropdownSearch("");
                            }}
                          >
                            <Palette size={13} color="#052A51" />
                            <Text style={styles.chooseSwatchBtnText}>Palette</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Dimensions & Finish Dropdowns for Variant */}
                        <View style={[styles.twoCol, { marginTop: 8 }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.variantLabel}>Dimension / Size</Text>
                            <TouchableOpacity
                              style={styles.variantDropdownBtn}
                              onPress={() => {
                                setDropdownType("variant_size");
                                setDropdownVariantIdx(idx);
                                setCustomOptionInput("");
                                setDropdownSearch("");
                              }}
                            >
                              <Text style={styles.variantDropdownText} numberOfLines={1}>
                                {v.size || "Select Size"}
                              </Text>
                              <ChevronDown size={14} color="#64748B" />
                            </TouchableOpacity>
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.variantLabel}>Finish / Look</Text>
                            <TouchableOpacity
                              style={styles.variantDropdownBtn}
                              onPress={() => {
                                setDropdownType("variant_finish");
                                setDropdownVariantIdx(idx);
                                setCustomOptionInput("");
                                setDropdownSearch("");
                              }}
                            >
                              <Text style={styles.variantDropdownText} numberOfLines={1}>
                                {v.finish || "Select Finish"}
                              </Text>
                              <ChevronDown size={14} color="#64748B" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Price & Stock */}
                        <View style={[styles.twoCol, { marginTop: 8 }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.variantLabel}>Price / {unitOfSale.toUpperCase()} (₹)</Text>
                            <TextInput
                              style={styles.variantInput}
                              value={v.pricePerBox}
                              onChangeText={(val) => handleUpdateVariant(idx, "pricePerBox", val)}
                              keyboardType="decimal-pad"
                              placeholder="750"
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.variantLabel}>Stock Quantity</Text>
                            <TextInput
                              style={styles.variantInput}
                              value={v.stockBoxes}
                              onChangeText={(val) => handleUpdateVariant(idx, "stockBoxes", val)}
                              keyboardType="number-pad"
                              placeholder="50"
                            />
                          </View>
                        </View>

                        {/* Variant Image Upload & URL */}
                        <Text style={[styles.variantLabel, { marginTop: 8 }]}>Variant Image URL / Upload</Text>
                        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                          <TextInput
                            style={[styles.variantInput, { flex: 1 }]}
                            value={v.image || ""}
                            onChangeText={(val) => handleUpdateVariant(idx, "image", val)}
                            placeholder="https://... (variant specific image)"
                          />
                          <TouchableOpacity
                            style={styles.uploadMiniBtn}
                            onPress={() => handlePickAndUploadVariantImage(idx)}
                          >
                            <Camera size={13} color="#052A51" />
                            <Text style={styles.uploadMiniBtnText}>Upload</Text>
                          </TouchableOpacity>
                        </View>
                        {v.image ? (
                          <View style={styles.variantImagePreview}>
                            <Image source={{ uri: v.image }} style={styles.variantImagePreviewImg} contentFit="cover" />
                          </View>
                        ) : null}
                      </View>
                    );
                  })}

                  <TouchableOpacity style={styles.addVariantBtn} onPress={handleAddVariant}>
                    <Plus size={14} color="#052A51" />
                    <Text style={styles.addVariantBtnText}>+ Add Another Variant</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Save Action Button */}
            <TouchableOpacity
              style={styles.publishBtn}
              onPress={handleSaveProduct}
              disabled={savingProduct}
            >
              {savingProduct ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.publishBtnText}>
                  {isEditing ? "Save Changes" : "Publish Product to Catalog"}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* UNIVERSAL REUSABLE DROPDOWN PICKER MODAL (WITH "+ ADD NEW" BUTTON) */}
      <Modal visible={dropdownType !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.dropdownModalBox}>
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>
                {dropdownType === "category"
                  ? "Select Category"
                  : dropdownType === "unit"
                  ? "Select Unit of Sale"
                  : dropdownType === "size" || dropdownType === "variant_size"
                  ? "Select Dimensions / Size"
                  : dropdownType === "finish" || dropdownType === "variant_finish"
                  ? "Select Finish / Look"
                  : dropdownType === "material"
                  ? "Select Material"
                  : "Pick Color Swatch"}
              </Text>
              <TouchableOpacity onPress={() => setDropdownType(null)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Inline Add New Option Box */}
            {dropdownType !== "variant_color" && (
              <View style={styles.addOptionInlineBox}>
                <TextInput
                  style={styles.addOptionInput}
                  value={customOptionInput}
                  onChangeText={setCustomOptionInput}
                  placeholder={`+ Add new ${dropdownType?.replace("variant_", "") || "item"}...`}
                />
                <TouchableOpacity style={styles.addOptionBtn} onPress={handleAddCustomOption}>
                  <Plus size={14} color="#FFFFFF" />
                  <Text style={styles.addOptionBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Search filter for long lists */}
            <View style={styles.dropdownSearchBox}>
              <Search size={14} color="#94A3B8" />
              <TextInput
                style={styles.dropdownSearchInput}
                value={dropdownSearch}
                onChangeText={setDropdownSearch}
                placeholder="Type to filter..."
              />
            </View>

            {/* List of Options */}
            <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 4, paddingVertical: 4 }}>
              {dropdownType === "category" ? (
                categories
                  .filter((c: any) => c.name.toLowerCase().includes(dropdownSearch.toLowerCase()))
                  .map((cat: any) => {
                    const isSelected = categorySlug === cat.slug;
                    return (
                      <TouchableOpacity
                        key={cat.id || cat.slug}
                        style={[styles.dropdownItemRow, isSelected && styles.dropdownItemRowSelected]}
                        onPress={() => {
                          setCategorySlug(cat.slug);
                          setCategoryName(cat.name);
                          setCategoryId(cat.id);
                          setDropdownType(null);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                          {cat.name}
                        </Text>
                        {isSelected && <Check size={16} color="#052A51" />}
                      </TouchableOpacity>
                    );
                  })
              ) : dropdownType === "unit" ? (
                allUnits
                  .filter((u) => u.toLowerCase().includes(dropdownSearch.toLowerCase()))
                  .map((u) => {
                    const isSelected = unitOfSale === u;
                    return (
                      <TouchableOpacity
                        key={u}
                        style={[styles.dropdownItemRow, isSelected && styles.dropdownItemRowSelected]}
                        onPress={() => {
                          setUnitOfSale(u);
                          setDropdownType(null);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                          {u.toUpperCase()}
                        </Text>
                        {isSelected && <Check size={16} color="#052A51" />}
                      </TouchableOpacity>
                    );
                  })
              ) : dropdownType === "size" || dropdownType === "variant_size" ? (
                allSizes
                  .filter((s) => s.toLowerCase().includes(dropdownSearch.toLowerCase()))
                  .map((s) => {
                    const currentVal = dropdownType === "size" ? size : dropdownVariantIdx !== null ? variants[dropdownVariantIdx]?.size : "";
                    const isSelected = currentVal === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[styles.dropdownItemRow, isSelected && styles.dropdownItemRowSelected]}
                        onPress={() => {
                          if (dropdownType === "size") {
                            setSize(s);
                          } else if (dropdownVariantIdx !== null) {
                            handleUpdateVariant(dropdownVariantIdx, "size", s);
                          }
                          setDropdownType(null);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                          {s}
                        </Text>
                        {isSelected && <Check size={16} color="#052A51" />}
                      </TouchableOpacity>
                    );
                  })
              ) : dropdownType === "finish" || dropdownType === "variant_finish" ? (
                allFinishes
                  .filter((f) => f.toLowerCase().includes(dropdownSearch.toLowerCase()))
                  .map((f) => {
                    const currentVal = dropdownType === "finish" ? finish : dropdownVariantIdx !== null ? variants[dropdownVariantIdx]?.finish : "";
                    const isSelected = currentVal === f;
                    return (
                      <TouchableOpacity
                        key={f}
                        style={[styles.dropdownItemRow, isSelected && styles.dropdownItemRowSelected]}
                        onPress={() => {
                          if (dropdownType === "finish") {
                            setFinish(f);
                          } else if (dropdownVariantIdx !== null) {
                            handleUpdateVariant(dropdownVariantIdx, "finish", f);
                          }
                          setDropdownType(null);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                          {f}
                        </Text>
                        {isSelected && <Check size={16} color="#052A51" />}
                      </TouchableOpacity>
                    );
                  })
              ) : dropdownType === "material" ? (
                allMaterials
                  .filter((m) => m.toLowerCase().includes(dropdownSearch.toLowerCase()))
                  .map((m) => {
                    const isSelected = material === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.dropdownItemRow, isSelected && styles.dropdownItemRowSelected]}
                        onPress={() => {
                          setMaterial(m);
                          setDropdownType(null);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                          {m}
                        </Text>
                        {isSelected && <Check size={16} color="#052A51" />}
                      </TouchableOpacity>
                    );
                  })
              ) : dropdownType === "variant_color" && dropdownVariantIdx !== null ? (
                CATALOG_COLOURS.filter((c) => c.name.toLowerCase().includes(dropdownSearch.toLowerCase())).map((c) => {
                  const isSelected = variants[dropdownVariantIdx]?.color === c.name;
                  return (
                    <TouchableOpacity
                      key={c.name}
                      style={[styles.dropdownItemRow, isSelected && styles.dropdownItemRowSelected]}
                      onPress={() => {
                        handleUpdateVariant(dropdownVariantIdx, "color", c.name);
                        handleUpdateVariant(dropdownVariantIdx, "colorHex", c.hexCode);
                        setDropdownType(null);
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <View style={[styles.colorCircle, { backgroundColor: c.hexCode }]} />
                        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                          {c.name}
                        </Text>
                      </View>
                      {isSelected && <Check size={16} color="#052A51" />}
                    </TouchableOpacity>
                  );
                })
              ) : null}
            </ScrollView>
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
    paddingVertical: 40,
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
    backgroundColor: "#F26522",
    flexDirection: "row",
    alignItems: "center",
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
    padding: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.xs,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: "#F8FAFC",
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
    backgroundColor: "#FFFFFF",
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
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
  chipsScroll: {
    marginHorizontal: -4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.accentBlue,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: "#fff",
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
    gap: SPACING.sm,
  },
  productRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: RADIUS.md,
    backgroundColor: "#F1F5F9",
  },
  productInfo: {
    flex: 1,
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
    fontWeight: "700",
    color: COLORS.textSecondary,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  vendorSubtitle: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  priceText: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.text,
  },
  unitText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  stockPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.accentBlue,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  approvalActions: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
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
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
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
    gap: SPACING.md,
  },
  bulkCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: 8,
  },
  bulkIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  bulkCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  bulkCardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  pickFileBtn: {
    backgroundColor: "#052A51",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    gap: 8,
    marginTop: 8,
  },
  pickFileBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  validationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
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
    color: "#166534",
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  errorText: {
    fontSize: 11,
    color: "#DC2626",
  },
  commitBtn: {
    backgroundColor: "#16A34A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    borderBottomColor: COLORS.border,
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
    paddingBottom: 60,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 6,
  },
  inputBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: "#052A51",
  },
  dropdownSelectBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
  },
  dropdownSelectText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#052A51",
  },
  twoCol: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  uploadMiniBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    gap: 4,
  },
  uploadMiniBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#052A51",
  },
  imagePreviewBox: {
    marginTop: 8,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 120,
    backgroundColor: "#F1F5F9",
  },
  imagePreviewImg: {
    width: "100%",
    height: "100%",
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
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
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
    gap: 6,
  },
  variantCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  variantNum: {
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
  },
  colorBubbleLive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
  },
  colorBubbleInput: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  colorBubbleBorder: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  variantLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
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
  chooseSwatchBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    gap: 4,
  },
  chooseSwatchBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#052A51",
  },
  variantDropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
  },
  variantDropdownText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#052A51",
    flex: 1,
  },
  variantImagePreview: {
    marginTop: 4,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    height: 60,
    width: 90,
  },
  variantImagePreviewImg: {
    width: "100%",
    height: "100%",
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
    marginTop: 4,
  },
  addVariantBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
  },
  publishBtn: {
    backgroundColor: "#052A51",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  publishBtnText: {
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
  dropdownModalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    width: "100%",
    maxWidth: 400,
    ...SHADOWS.md,
    gap: 8,
  },
  dropdownModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 8,
  },
  dropdownModalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#052A51",
  },
  addOptionInlineBox: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  addOptionInput: {
    flex: 1,
    fontSize: 12,
    paddingHorizontal: 8,
    color: "#052A51",
  },
  addOptionBtn: {
    backgroundColor: "#052A51",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addOptionBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  dropdownSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
    gap: 6,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 12,
    color: "#052A51",
  },
  dropdownItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownItemRowSelected: {
    backgroundColor: "#EFF6FF",
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  dropdownItemTextSelected: {
    fontWeight: "800",
    color: "#052A51",
  },
  colorCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
  },
});
