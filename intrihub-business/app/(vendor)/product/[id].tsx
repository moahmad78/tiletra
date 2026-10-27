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
  Platform,
  Modal,
  Switch,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import {
  ArrowLeft,
  Camera,
  Upload,
  Layers,
  IndianRupee,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Boxes,
  ChevronDown,
  Scale,
  Ruler,
  Palette,
  Search,
  Check,
  Zap,
  Tag,
  BadgePercent,
  ShieldCheck,
  AlertTriangle,
  Star,
  ExternalLink,
  Info,
} from "lucide-react-native";
import {
  fetchVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
  fetchVendorCategories,
  fetchVendorDashboard,
} from "../../../src/api/vendor";
import { uploadBusinessImage } from "../../../src/api/auth";
import {
  CATALOG_COLOURS,
  CATALOG_UNITS,
  CATALOG_DIMENSIONS,
  CATALOG_FINISHES,
  CATALOG_MATERIALS,
  CATALOG_THICKNESSES,
  resolveColorHex,
} from "../../../src/constants/catalog";
import ColorPalettePickerModal from "../../../src/components/ColorPalettePickerModal";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../../src/constants/theme";
import { getImageUrl } from "../../../src/api/client";

interface VariantItem {
  id?: string;
  variantName: string;
  color: string;
  colorHex?: string;
  size: string;
  thickness?: string;
  finish: string;
  pricePerBox: string;
  pricePerSqft: string;
  stockBoxes: string;
  image?: string;
  sku?: string;
  active?: boolean;
}

interface SpecItem {
  key: string;
  value: string;
}

const GST_SLABS = ["0", "5", "12", "18", "28"];

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Basic Information
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [sku, setSku] = useState("");
  const [categorySlug, setCategorySlug] = useState("floor-tiles");
  const [categoryName, setCategoryName] = useState("Floor Tiles");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [unitOfSale, setUnitOfSale] = useState("box");
  const [material, setMaterial] = useState("Glazed Vitrified (GVT)");
  const [finish, setFinish] = useState("Glossy");
  const [size, setSize] = useState("600x600 mm (2x2 ft)");
  const [thickness, setThickness] = useState("9 mm");
  const [description, setDescription] = useState("");

  // Commercials & Pricing
  const [pricePerBox, setPricePerBox] = useState("");
  const [pricePerSqft, setPricePerSqft] = useState("");
  const [mrp, setMrp] = useState("");
  const [gstRate, setGstRate] = useState("18");
  const [hsnCode, setHsnCode] = useState("6907");

  // Logistics & Packaging
  const [weightKg, setWeightKg] = useState("2.5");
  const [isBulky, setIsBulky] = useState(false);
  const [piecesPerBox, setPiecesPerBox] = useState("4");
  const [sqftPerBox, setSqftPerBox] = useState("16");
  const [wastagePercent, setWastagePercent] = useState("10");

  // Inventory & Alerts
  const [stockBoxes, setStockBoxes] = useState("50");
  const [lowStockAlert, setLowStockAlert] = useState("10");
  const [warrantyDuration, setWarrantyDuration] = useState("1 Year");
  const [returnPolicyDays, setReturnPolicyDays] = useState("7");
  const [status, setStatus] = useState<"active" | "paused">("active");

  // Media Management
  const [images, setImages] = useState<string[]>([]);
  const [primaryImageUrlInput, setPrimaryImageUrlInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Multi-Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<VariantItem[]>([]);

  // Specifications (Dynamic Key-Value)
  const [attributes, setAttributes] = useState<SpecItem[]>([]);

  // Modals & Pickers
  const [dropdownType, setDropdownType] = useState<
    "category" | "unit" | "size" | "thickness" | "finish" | "material" | "variant_size" | "variant_finish" | null
  >(null);
  const [dropdownVariantIdx, setDropdownVariantIdx] = useState<number | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const [customOptionInput, setCustomOptionInput] = useState("");

  // Color Palette Picker
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorPickerVariantIdx, setColorPickerVariantIdx] = useState<number | null>(null);

  // Fetch product data
  const { data, isLoading } = useQuery({
    queryKey: ["vendor-product-detail", id],
    queryFn: () => fetchVendorProduct(id),
    enabled: Boolean(id),
  });

  // Fetch categories
  const { data: catData } = useQuery({
    queryKey: ["vendor-categories"],
    queryFn: () => fetchVendorCategories(),
  });

  const { data: dashboardData } = useQuery({
    queryKey: ["vendor-dashboard"],
    queryFn: () => fetchVendorDashboard(),
  });

  const isAutoPublish = Boolean(dashboardData?.vendor?.autoPublishEnabled);

  // Populate data when loaded
  useEffect(() => {
    if (data?.product) {
      const p = data.product;
      setName(p.name || "");
      setBrand(p.brand || "");
      setModelNumber(p.modelNumber || "");
      setSku(p.sku || "");
      setCategorySlug(p.categorySlug || "floor-tiles");
      setCategoryName(p.categoryName || "Floor Tiles");
      setCategoryId(p.categoryId || undefined);
      setUnitOfSale(p.unitOfSale || "box");
      setMaterial(p.material || "Glazed Vitrified (GVT)");
      setFinish(p.finish || "Glossy");
      setSize(p.size || "600x600 mm (2x2 ft)");
      setThickness(p.thickness || "9 mm");
      setDescription(p.description || "");

      setPricePerBox(p.pricePerBox ? String(p.pricePerBox) : "");
      setPricePerSqft(p.pricePerSqft ? String(p.pricePerSqft) : "");
      setMrp(p.mrp ? String(p.mrp) : "");
      setGstRate(p.gstRate ? String(p.gstRate) : (p.gstPercent ? String(p.gstPercent) : "18"));
      setHsnCode(p.hsnCode || "6907");

      setWeightKg(p.weightKg ? String(p.weightKg) : "2.5");
      setIsBulky(Boolean(p.isBulky));
      setPiecesPerBox(p.piecesPerBox ? String(p.piecesPerBox) : "4");
      setSqftPerBox(p.coverageRate ? String(p.coverageRate) : (p.sqftPerBox ? String(p.sqftPerBox) : "16"));
      setWastagePercent(p.wastageFactor ? String(Math.round((p.wastageFactor - 1) * 100)) : "10");

      setStockBoxes(p.stockBoxes ? String(p.stockBoxes) : "0");
      setLowStockAlert(p.lowStockAlert ? String(p.lowStockAlert) : "10");
      setWarrantyDuration(p.warrantyDuration || "1 Year");
      setReturnPolicyDays(p.returnPolicyDays ? String(p.returnPolicyDays) : "7");
      setStatus(p.status === "paused" ? "paused" : "active");

      // Images
      const validImages = Array.isArray(p.images)
        ? p.images.filter((img: string) => img && img !== "/placeholders/product.svg")
        : [];
      setImages(validImages);

      // Attributes
      if (Array.isArray(p.attributes) && p.attributes.length > 0) {
        setAttributes(p.attributes.map((a: any) => ({ key: a.key, value: a.value })));
      } else {
        setAttributes([]);
      }

      // Variants
      const pVariants = p.variants || [];
      const hasMulti = Boolean(p.hasVariants) || pVariants.length > 1;
      setHasVariants(hasMulti);

      if (pVariants.length > 0) {
        setVariants(
          pVariants.map((v: any) => ({
            id: v.id,
            variantName: v.variantName || v.color || "Standard",
            color: v.color || "Standard",
            colorHex: v.colorHex || resolveColorHex(v.color || "Standard"),
            size: v.size || p.size || "600x600 mm (2x2 ft)",
            thickness: v.thickness || p.thickness || "9 mm",
            finish: v.finish || p.finish || "Glossy",
            pricePerBox: v.pricePerBox ? String(v.pricePerBox) : (v.price ? String(v.price) : ""),
            pricePerSqft: v.pricePerSqft ? String(v.pricePerSqft) : "",
            stockBoxes: v.stockBoxes !== undefined && v.stockBoxes !== null ? String(v.stockBoxes) : "50",
            image: v.image || undefined,
            sku: v.sku || undefined,
            active: v.active !== false,
          }))
        );
      } else {
        setVariants([
          {
            variantName: "Standard",
            color: "Standard",
            colorHex: resolveColorHex("Standard"),
            size: p.size || "600x600 mm (2x2 ft)",
            thickness: p.thickness || "9 mm",
            finish: p.finish || "Glossy",
            pricePerBox: p.pricePerBox ? String(p.pricePerBox) : "750",
            pricePerSqft: p.pricePerSqft ? String(p.pricePerSqft) : "45",
            stockBoxes: p.stockBoxes ? String(p.stockBoxes) : "50",
            active: true,
          },
        ]);
      }
    }
  }, [data?.product]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (payload: any) => updateVendorProduct(id, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-product-detail", id] });
      Alert.alert(
        "Product Updated",
        isAutoPublish
          ? "Changes are live on Intrihub storefront!"
          : "Changes saved and queued for Super Admin re-approval.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    },
    onError: (err: any) => {
      Alert.alert("Update Failed", err?.message || "Failed to update product");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVendorProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      Alert.alert("Deleted", "Product has been removed from catalog.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.message || "Failed to delete product");
    },
  });

  // Image Actions
  const handlePickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Gallery access is required to upload product images.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const asset = result.assets[0];
        setUploadingImage(true);
        const uploadRes = await uploadBusinessImage(
          asset.uri,
          asset.fileName || `product-${Date.now()}.jpg`,
          asset.mimeType || "image/jpeg"
        );
        setUploadingImage(false);

        if (uploadRes.success && uploadRes.url) {
          setImages((prev) => [...prev, uploadRes.url!]);
        } else {
          Alert.alert("Upload Error", uploadRes.error || "Failed to upload image");
        }
      }
    } catch (e: any) {
      setUploadingImage(false);
      Alert.alert("Error", e?.message || "Something went wrong during image selection");
    }
  };

  const handleAddImageUrl = () => {
    const url = primaryImageUrlInput.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/")) {
      Alert.alert("Invalid URL", "Please enter a valid image web URL.");
      return;
    }
    if (!images.includes(url)) {
      setImages((prev) => [...prev, url]);
      setPrimaryImageUrlInput("");
    }
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const [target] = next.splice(index, 1);
      next.unshift(target);
      return next;
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Variant Actions
  const handleAddVariant = () => {
    const defaultColor = `Option ${variants.length + 1}`;
    setVariants((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        variantName: defaultColor,
        color: defaultColor,
        colorHex: resolveColorHex(defaultColor),
        size: size || "600x600 mm (2x2 ft)",
        thickness: thickness || "9 mm",
        finish: finish || "Glossy",
        pricePerBox: pricePerBox || "750",
        pricePerSqft: pricePerSqft || "45",
        stockBoxes: stockBoxes || "50",
        active: true,
      },
    ]);
  };

  const handleUpdateVariant = (index: number, field: keyof VariantItem, value: any) => {
    setVariants((prev) => {
      const next = [...prev];
      if (field === "color") {
        next[index] = {
          ...next[index],
          color: value,
          variantName: value,
          colorHex: resolveColorHex(value),
        };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      Alert.alert("Notice", "At least one variant must remain.");
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // Attributes / Specs Actions
  const handleAddAttribute = () => {
    setAttributes((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleUpdateAttribute = (index: number, field: "key" | "value", text: string) => {
    setAttributes((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: text };
      return next;
    });
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Validation & Submit
  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Product title cannot be empty.");
      return;
    }

    const parsedWeight = parseFloat(weightKg);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      Alert.alert("Validation Error", "Please enter an approximate weight in kg (required for logistics vehicle dispatch).");
      return;
    }

    const mappedVariants = hasVariants
      ? variants.map((v) => ({
          id: v.id && !v.id.startsWith("new-") ? v.id : undefined,
          variantName: v.variantName || v.color,
          color: v.color,
          colorHex: v.colorHex || resolveColorHex(v.color),
          size: v.size || size,
          thickness: v.thickness || thickness,
          finish: v.finish || finish,
          pricePerBox: parseFloat(v.pricePerBox) || parseFloat(pricePerBox) || 0,
          pricePerSqft: parseFloat(v.pricePerSqft) || parseFloat(pricePerSqft) || 0,
          stockBoxes: parseInt(v.stockBoxes, 10) || 0,
          image: v.image || undefined,
          sku: v.sku || undefined,
          active: v.active !== false,
        }))
      : undefined;

    const cleanAttributes = attributes
      .filter((a) => a.key.trim() && a.value.trim())
      .map((a) => ({ key: a.key.trim(), value: a.value.trim() }));

    updateMutation.mutate({
      name: name.trim(),
      brand: brand.trim(),
      modelNumber: modelNumber.trim(),
      sku: sku.trim(),
      categorySlug,
      categoryName,
      categoryId,
      unitOfSale,
      material,
      finish,
      size,
      thickness,
      description: description.trim(),
      pricePerBox: parseFloat(pricePerBox) || 0,
      pricePerSqft: parseFloat(pricePerSqft) || 0,
      mrp: parseFloat(mrp) || 0,
      gstRate: parseFloat(gstRate) || 18,
      gstPercent: parseFloat(gstRate) || 18,
      hsnCode: hsnCode.trim(),
      weightKg: parsedWeight,
      isBulky,
      piecesPerBox: parseInt(piecesPerBox, 10) || undefined,
      coverageRate: parseFloat(sqftPerBox) || undefined,
      wastageFactor: (parseFloat(wastagePercent) || 10) / 100 + 1.0,
      stockBoxes: parseInt(stockBoxes, 10) || 0,
      lowStockAlert: parseInt(lowStockAlert, 10) || 10,
      warrantyDuration: warrantyDuration.trim(),
      returnPolicyDays: parseInt(returnPolicyDays, 10) || 7,
      status,
      images,
      hasVariants,
      variants: mappedVariants,
      attributes: cleanAttributes,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accentOrange} />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  const product = data?.product;
  const categoriesList = catData?.categories || [];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Edit Product Listing</Text>
          <Text style={styles.headerSubtitle}>Complete CPO-grade specifications</Text>
        </View>
        <View style={[styles.statusBadge, status === "active" ? styles.badgeActive : styles.badgePaused]}>
          <Text style={styles.statusBadgeText}>{status.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Approval / Rejection Banner */}
        {product?.approvalStatus === "rejected" ? (
          <View style={styles.rejectionBanner}>
            <AlertTriangle size={18} color="#DC2626" />
            <View style={{ flex: 1 }}>
              <Text style={styles.rejectionTitle}>Listing Approval Rejected by Super Admin</Text>
              <Text style={styles.rejectionReason}>
                {product?.rejectionReason || "Please update pricing/details and resubmit."}
              </Text>
            </View>
          </View>
        ) : product?.approvalStatus === "pending" ? (
          <View style={styles.pendingBanner}>
            <Info size={18} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingTitle}>Queued for Super Admin Approval</Text>
              <Text style={styles.pendingSubtitle}>
                Updates will be reviewed before going live on the storefront.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.liveBanner}>
            <CheckCircle2 size={18} color="#16A34A" />
            <View style={{ flex: 1 }}>
              <Text style={styles.liveTitle}>Live on Storefront</Text>
              <Text style={styles.liveSubtitle}>
                Customers can view and place orders for this catalog item.
              </Text>
            </View>
          </View>
        )}

        {/* 1. Multi-Image Media Manager */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Camera size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Product Photos ({images.length})</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            The first photo is the storefront cover. Tap any photo to set it as primary.
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            {images.map((img, idx) => (
              <View key={`${img}-${idx}`} style={styles.imageThumbContainer}>
                <Image source={{ uri: getImageUrl(img) }} style={styles.imageThumb} contentFit="cover" />
                {idx === 0 ? (
                  <View style={styles.coverBadge}>
                    <Star size={10} color="#fff" fill="#fff" />
                    <Text style={styles.coverBadgeText}>Cover</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.setCoverBtn}
                    onPress={() => handleSetPrimaryImage(idx)}
                  >
                    <Text style={styles.setCoverText}>Set Cover</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => handleRemoveImage(idx)}
                >
                  <X size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addImageBtn}
              onPress={handlePickImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color={COLORS.accentOrange} />
              ) : (
                <>
                  <Upload size={22} color={COLORS.accentOrange} />
                  <Text style={styles.addImageBtnText}>Upload Photo</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* Web Image Link Input */}
          <View style={styles.urlInputRow}>
            <TextInput
              style={styles.urlInput}
              value={primaryImageUrlInput}
              onChangeText={setPrimaryImageUrlInput}
              placeholder="Or paste external image URL..."
              placeholderTextColor="#94A3B8"
            />
            <TouchableOpacity style={styles.urlAddBtn} onPress={handleAddImageUrl}>
              <Plus size={16} color="#fff" />
              <Text style={styles.urlAddBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Basic Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Tag size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Basic Information</Text>
          </View>

          <Text style={styles.inputLabel}>Product Title *</Text>
          <TextInput
            style={styles.inputBox}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Royal Statuario Glazed Vitrified Tile"
            placeholderTextColor="#94A3B8"
          />

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Brand</Text>
              <TextInput
                style={styles.inputBox}
                value={brand}
                onChangeText={setBrand}
                placeholder="e.g. Roff, Somany, Kajaria"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Model / SKU</Text>
              <TextInput
                style={styles.inputBox}
                value={modelNumber || sku}
                onChangeText={(val) => {
                  setModelNumber(val);
                  setSku(val);
                }}
                placeholder="e.g. ROFF-T16-1L"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Category & Unit Selectors */}
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Category *</Text>
              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => {
                  setDropdownType("category");
                  setDropdownSearch("");
                }}
              >
                <Text style={styles.selectorBtnText} numberOfLines={1}>
                  {categoryName}
                </Text>
                <ChevronDown size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Unit of Sale *</Text>
              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => {
                  setDropdownType("unit");
                  setDropdownSearch("");
                }}
              >
                <Text style={styles.selectorBtnText} numberOfLines={1}>
                  {unitOfSale.toUpperCase()}
                </Text>
                <ChevronDown size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Material & Finish */}
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Material</Text>
              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => {
                  setDropdownType("material");
                  setDropdownSearch("");
                }}
              >
                <Text style={styles.selectorBtnText} numberOfLines={1}>
                  {material}
                </Text>
                <ChevronDown size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Surface Finish</Text>
              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => {
                  setDropdownType("finish");
                  setDropdownSearch("");
                }}
              >
                <Text style={styles.selectorBtnText} numberOfLines={1}>
                  {finish}
                </Text>
                <ChevronDown size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Size & Thickness */}
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Size / Dimension</Text>
              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => {
                  setDropdownType("size");
                  setDropdownSearch("");
                }}
              >
                <Text style={styles.selectorBtnText} numberOfLines={1}>
                  {size}
                </Text>
                <ChevronDown size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Thickness</Text>
              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => {
                  setDropdownType("thickness");
                  setDropdownSearch("");
                }}
              >
                <Text style={styles.selectorBtnText} numberOfLines={1}>
                  {thickness}
                </Text>
                <ChevronDown size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 3. Pricing, GST & Taxes */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IndianRupee size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Commercial & Tax (GST)</Text>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Selling Price / {unitOfSale.toUpperCase()} (₹) *</Text>
              <TextInput
                style={styles.inputBox}
                value={pricePerBox}
                onChangeText={setPricePerBox}
                keyboardType="numeric"
                placeholder="750"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Ref Price / Sq.Ft (₹)</Text>
              <TextInput
                style={styles.inputBox}
                value={pricePerSqft}
                onChangeText={setPricePerSqft}
                keyboardType="numeric"
                placeholder="45"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>List MRP (₹)</Text>
              <TextInput
                style={styles.inputBox}
                value={mrp}
                onChangeText={setMrp}
                keyboardType="numeric"
                placeholder="950"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>HSN / SAC Code</Text>
              <TextInput
                style={styles.inputBox}
                value={hsnCode}
                onChangeText={setHsnCode}
                placeholder="6907"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* GST Slabs */}
          <Text style={styles.inputLabel}>Applicable GST Slab</Text>
          <View style={styles.gstPillsRow}>
            {GST_SLABS.map((slab) => {
              const isSelected = gstRate === slab;
              return (
                <TouchableOpacity
                  key={slab}
                  style={[styles.gstPill, isSelected && styles.gstPillSelected]}
                  onPress={() => setGstRate(slab)}
                >
                  <Text style={[styles.gstPillText, isSelected && styles.gstPillTextSelected]}>
                    {slab}% GST
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Logistics, Weight & Packaging */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Scale size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Logistics, Weight & Packaging</Text>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Weight per {unitOfSale} (kg) *</Text>
              <TextInput
                style={styles.inputBox}
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="numeric"
                placeholder="2.5"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Coverage / {unitOfSale} (sq.ft)</Text>
              <TextInput
                style={styles.inputBox}
                value={sqftPerBox}
                onChangeText={setSqftPerBox}
                keyboardType="numeric"
                placeholder="16"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Pieces per {unitOfSale}</Text>
              <TextInput
                style={styles.inputBox}
                value={piecesPerBox}
                onChangeText={setPiecesPerBox}
                keyboardType="numeric"
                placeholder="4"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Wastage Factor (%)</Text>
              <TextInput
                style={styles.inputBox}
                value={wastagePercent}
                onChangeText={setWastagePercent}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Bulky Item Toggle */}
          <View style={styles.bulkyRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bulkyTitle}>Oversized / Heavy Bulky Cargo</Text>
              <Text style={styles.bulkySub}>
                Requires dedicated flatbed / tempo delivery vehicle.
              </Text>
            </View>
            <Switch
              value={isBulky}
              onValueChange={setIsBulky}
              trackColor={{ false: "#CBD5E1", true: "#F26522" }}
            />
          </View>
        </View>

        {/* 5. Inventory & Stock Thresholds */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Boxes size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Inventory & Stock Management</Text>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Available Stock ({unitOfSale.toUpperCase()}) *</Text>
              <TextInput
                style={styles.inputBox}
                value={stockBoxes}
                onChangeText={setStockBoxes}
                keyboardType="numeric"
                placeholder="50"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Low Stock Alert Threshold</Text>
              <TextInput
                style={styles.inputBox}
                value={lowStockAlert}
                onChangeText={setLowStockAlert}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Warranty Duration</Text>
              <TextInput
                style={styles.inputBox}
                value={warrantyDuration}
                onChangeText={setWarrantyDuration}
                placeholder="e.g. 1 Year, 10 Years"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Return Policy (Days)</Text>
              <TextInput
                style={styles.inputBox}
                value={returnPolicyDays}
                onChangeText={setReturnPolicyDays}
                keyboardType="numeric"
                placeholder="7"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        </View>

        {/* 6. Dynamic Multi-Variants Section */}
        <View style={styles.card}>
          <View style={styles.variantToggleRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Layers size={18} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Multi-Variant Listing</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Add multiple colors, sizes, or finishes under one listing
              </Text>
            </View>
            <Switch
              value={hasVariants}
              onValueChange={setHasVariants}
              trackColor={{ false: "#CBD5E1", true: "#F26522" }}
            />
          </View>

          {hasVariants && (
            <View style={{ marginTop: 12 }}>
              {variants.map((v, idx) => (
                <View key={v.id || idx} style={styles.variantCard}>
                  <View style={styles.variantCardHeader}>
                    <TouchableOpacity
                      style={styles.colorPillBtn}
                      onPress={() => {
                        setColorPickerVariantIdx(idx);
                        setColorPickerOpen(true);
                      }}
                    >
                      <View style={[styles.colorDot, { backgroundColor: v.colorHex || "#ccc" }]} />
                      <Text style={styles.colorPillText}>{v.color || "Pick Color"}</Text>
                      <Palette size={14} color="#64748B" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.variantRemoveBtn}
                      onPress={() => handleRemoveVariant(idx)}
                    >
                      <Trash2 size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.gridRow}>
                    <View style={styles.gridCol}>
                      <Text style={styles.variantSmallLabel}>Size</Text>
                      <TouchableOpacity
                        style={styles.selectorBtnSmall}
                        onPress={() => {
                          setDropdownVariantIdx(idx);
                          setDropdownType("variant_size");
                          setDropdownSearch("");
                        }}
                      >
                        <Text style={styles.selectorSmallText} numberOfLines={1}>
                          {v.size}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.gridCol}>
                      <Text style={styles.variantSmallLabel}>Finish</Text>
                      <TouchableOpacity
                        style={styles.selectorBtnSmall}
                        onPress={() => {
                          setDropdownVariantIdx(idx);
                          setDropdownType("variant_finish");
                          setDropdownSearch("");
                        }}
                      >
                        <Text style={styles.selectorSmallText} numberOfLines={1}>
                          {v.finish}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.gridRow}>
                    <View style={styles.gridCol}>
                      <Text style={styles.variantSmallLabel}>Price (₹)</Text>
                      <TextInput
                        style={styles.inputBoxSmall}
                        value={v.pricePerBox}
                        onChangeText={(val) => handleUpdateVariant(idx, "pricePerBox", val)}
                        keyboardType="numeric"
                        placeholder="750"
                      />
                    </View>
                    <View style={styles.gridCol}>
                      <Text style={styles.variantSmallLabel}>Stock</Text>
                      <TextInput
                        style={styles.inputBoxSmall}
                        value={v.stockBoxes}
                        onChangeText={(val) => handleUpdateVariant(idx, "stockBoxes", val)}
                        keyboardType="numeric"
                        placeholder="50"
                      />
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addVariantBtn} onPress={handleAddVariant}>
                <Plus size={16} color="#F26522" />
                <Text style={styles.addVariantBtnText}>Add Another Variant</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 7. Custom Specifications (Dynamic Key-Value Pairs) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <ShieldCheck size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Technical Specifications</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Add custom attributes (e.g. Water Absorption, Breaking Strength, Grade)
          </Text>

          {attributes.map((attr, idx) => (
            <View key={idx} style={styles.attributeRow}>
              <TextInput
                style={[styles.inputBoxSmall, { flex: 1 }]}
                value={attr.key}
                onChangeText={(val) => handleUpdateAttribute(idx, "key", val)}
                placeholder="Spec (e.g. Grade)"
                placeholderTextColor="#94A3B8"
              />
              <TextInput
                style={[styles.inputBoxSmall, { flex: 1.2 }]}
                value={attr.value}
                onChangeText={(val) => handleUpdateAttribute(idx, "value", val)}
                placeholder="Value (e.g. Grade A)"
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity
                style={styles.attrRemoveBtn}
                onPress={() => handleRemoveAttribute(idx)}
              >
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addAttrBtn} onPress={handleAddAttribute}>
            <Plus size={15} color="#052A51" />
            <Text style={styles.addAttrBtnText}>Add Specification Attribute</Text>
          </TouchableOpacity>
        </View>

        {/* 8. Description */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product Description</Text>
          <TextInput
            style={[styles.inputBox, { height: 110, textAlignVertical: "top", marginTop: 8 }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe product highlights, application instructions, and key features..."
            placeholderTextColor="#94A3B8"
            multiline
          />
        </View>

        {/* 9. Listing Status (Active / Paused) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Catalog Visibility</Text>
          <View style={styles.statusToggleRow}>
            <TouchableOpacity
              style={[styles.statusToggleBtn, status === "active" && styles.statusActive]}
              onPress={() => setStatus("active")}
            >
              <CheckCircle2 size={16} color={status === "active" ? "#fff" : "#16A34A"} />
              <Text style={[styles.statusToggleText, status === "active" && styles.textWhite]}>
                Active Listing
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusToggleBtn, status === "paused" && styles.statusPaused]}
              onPress={() => setStatus("paused")}
            >
              <Text style={[styles.statusToggleText, status === "paused" && styles.textWhite]}>
                Paused / Hidden
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
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
              <CheckCircle2 size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() =>
            Alert.alert("Delete Product", `Are you sure you want to remove "${name}" from your catalog?`, [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() },
            ])
          }
        >
          <Trash2 size={16} color={COLORS.error} />
          <Text style={styles.deleteBtnText}>Delete Product Listing</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Dropdown Options Modal */}
      <Modal
        visible={dropdownType !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDropdownType(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {dropdownType === "category"
                  ? "Select Category"
                  : dropdownType === "unit"
                  ? "Select Unit of Sale"
                  : dropdownType === "finish" || dropdownType === "variant_finish"
                  ? "Select Surface Finish"
                  : dropdownType === "material"
                  ? "Select Material"
                  : dropdownType === "thickness"
                  ? "Select Thickness"
                  : "Select Dimension / Size"}
              </Text>
              <TouchableOpacity onPress={() => setDropdownType(null)}>
                <X size={20} color="#052A51" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <Search size={16} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                value={dropdownSearch}
                onChangeText={setDropdownSearch}
                placeholder="Search options..."
                placeholderTextColor="#94A3B8"
              />
            </View>

            <ScrollView style={{ maxHeight: 360 }}>
              {dropdownType === "category" ? (
                categoriesList
                  .filter((c: any) => c.name.toLowerCase().includes(dropdownSearch.toLowerCase()))
                  .map((c: any) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.modalItem, categorySlug === c.slug && styles.modalItemSelected]}
                      onPress={() => {
                        setCategorySlug(c.slug);
                        setCategoryName(c.name);
                        setCategoryId(c.id);
                        setDropdownType(null);
                      }}
                    >
                      <Text style={[styles.modalItemText, categorySlug === c.slug && styles.modalItemTextSelected]}>
                        {c.name}
                      </Text>
                      {categorySlug === c.slug && <Check size={16} color="#F26522" />}
                    </TouchableOpacity>
                  ))
              ) : dropdownType === "unit" ? (
                CATALOG_UNITS
                  .filter((u) => u.toLowerCase().includes(dropdownSearch.toLowerCase()))
                  .map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[styles.modalItem, unitOfSale === u && styles.modalItemSelected]}
                      onPress={() => {
                        setUnitOfSale(u);
                        setDropdownType(null);
                      }}
                    >
                      <Text style={[styles.modalItemText, unitOfSale === u && styles.modalItemTextSelected]}>
                        {u.toUpperCase()}
                      </Text>
                      {unitOfSale === u && <Check size={16} color="#F26522" />}
                    </TouchableOpacity>
                  ))
              ) : dropdownType === "finish" || dropdownType === "variant_finish" ? (
                CATALOG_FINISHES
                  .filter((f) => f.toLowerCase().includes(dropdownSearch.toLowerCase()))
                  .map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={styles.modalItem}
                      onPress={() => {
                        if (dropdownType === "variant_finish" && dropdownVariantIdx !== null) {
                          handleUpdateVariant(dropdownVariantIdx, "finish", f);
                        } else {
                          setFinish(f);
                        }
                        setDropdownType(null);
                      }}
                    >
                      <Text style={styles.modalItemText}>{f}</Text>
                    </TouchableOpacity>
                  ))
              ) : dropdownType === "material" ? (
                CATALOG_MATERIALS
                  .filter((m) => m.toLowerCase().includes(dropdownSearch.toLowerCase()))
                  .map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={styles.modalItem}
                      onPress={() => {
                        setMaterial(m);
                        setDropdownType(null);
                      }}
                    >
                      <Text style={styles.modalItemText}>{m}</Text>
                    </TouchableOpacity>
                  ))
              ) : dropdownType === "thickness" ? (
                CATALOG_THICKNESSES
                  .filter((t) => t.toLowerCase().includes(dropdownSearch.toLowerCase()))
                  .map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={styles.modalItem}
                      onPress={() => {
                        setThickness(t);
                        setDropdownType(null);
                      }}
                    >
                      <Text style={styles.modalItemText}>{t}</Text>
                    </TouchableOpacity>
                  ))
              ) : (
                CATALOG_DIMENSIONS
                  .filter((d) => d.toLowerCase().includes(dropdownSearch.toLowerCase()))
                  .map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={styles.modalItem}
                      onPress={() => {
                        if (dropdownType === "variant_size" && dropdownVariantIdx !== null) {
                          handleUpdateVariant(dropdownVariantIdx, "size", d);
                        } else {
                          setSize(d);
                        }
                        setDropdownType(null);
                      }}
                    >
                      <Text style={styles.modalItemText}>{d}</Text>
                    </TouchableOpacity>
                  ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rich Color Palette Picker Modal */}
      <ColorPalettePickerModal
        visible={colorPickerOpen}
        onClose={() => {
          setColorPickerOpen(false);
          setColorPickerVariantIdx(null);
        }}
        onSelectColor={(colorName, colorHex) => {
          if (colorPickerVariantIdx !== null) {
            handleUpdateVariant(colorPickerVariantIdx, "color", colorName);
            handleUpdateVariant(colorPickerVariantIdx, "colorHex", colorHex);
          }
          setColorPickerOpen(false);
          setColorPickerVariantIdx(null);
        }}
      />
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
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeActive: {
    backgroundColor: "#16A34A",
  },
  badgePaused: {
    backgroundColor: "#D97706",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 60,
  },
  rejectionBanner: {
    flexDirection: "row",
    backgroundColor: "#FEE2E2",
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: SPACING.md,
    gap: 10,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  rejectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#DC2626",
  },
  rejectionReason: {
    fontSize: 12,
    color: "#991B1B",
    marginTop: 2,
  },
  pendingBanner: {
    flexDirection: "row",
    backgroundColor: "#FEF3C7",
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: SPACING.md,
    gap: 10,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  pendingTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#D97706",
  },
  pendingSubtitle: {
    fontSize: 11,
    color: "#92400E",
    marginTop: 2,
  },
  liveBanner: {
    flexDirection: "row",
    backgroundColor: "#DCFCE7",
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: SPACING.md,
    gap: 10,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  liveTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#16A34A",
  },
  liveSubtitle: {
    fontSize: 11,
    color: "#166534",
    marginTop: 2,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },
  cardSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 4,
    marginTop: 8,
  },
  inputBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 13,
    color: "#0F172A",
  },
  inputBoxSmall: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: "#0F172A",
  },
  gridRow: {
    flexDirection: "row",
    gap: 10,
  },
  gridCol: {
    flex: 1,
  },
  selectorBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectorBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    flex: 1,
  },
  selectorBtnSmall: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  selectorSmallText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F172A",
  },
  imageScroll: {
    flexDirection: "row",
    marginBottom: 10,
  },
  imageThumbContainer: {
    position: "relative",
    marginRight: 10,
  },
  imageThumb: {
    width: 90,
    height: 90,
    borderRadius: RADIUS.md,
    backgroundColor: "#E2E8F0",
  },
  coverBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#16A34A",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  coverBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
  },
  setCoverBtn: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  setCoverText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },
  removeImageBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(220,38,38,0.85)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addImageBtn: {
    width: 90,
    height: 90,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: "#F26522",
    borderStyle: "dashed",
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addImageBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#F26522",
  },
  urlInputRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  urlInput: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
  },
  urlAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    gap: 4,
  },
  urlAddBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  gstPillsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  gstPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: RADIUS.md,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  gstPillSelected: {
    backgroundColor: "#052A51",
    borderColor: "#052A51",
  },
  gstPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  gstPillTextSelected: {
    color: "#fff",
  },
  bulkyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF7ED",
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  bulkyTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#C2410C",
  },
  bulkySub: {
    fontSize: 11,
    color: "#9A3412",
    marginTop: 2,
  },
  variantToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  variantCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 8,
  },
  variantCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  colorPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
  },
  colorPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  variantRemoveBtn: {
    padding: 6,
  },
  variantSmallLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 2,
  },
  addVariantBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#F26522",
    borderStyle: "dashed",
    backgroundColor: "#FFF7ED",
    gap: 6,
    marginTop: 4,
  },
  addVariantBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F26522",
  },
  attributeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  attrRemoveBtn: {
    padding: 6,
  },
  addAttrBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    gap: 6,
    marginTop: 6,
  },
  addAttrBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#052A51",
  },
  statusToggleRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  statusToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    gap: 6,
  },
  statusActive: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  statusPaused: {
    backgroundColor: "#D97706",
    borderColor: "#D97706",
  },
  statusToggleText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#475569",
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
    paddingVertical: 16,
    marginTop: SPACING.md,
    gap: 8,
    ...SHADOWS.md,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: SPACING.xs,
    gap: 6,
  },
  deleteBtnText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalItemSelected: {
    backgroundColor: "#FFF7ED",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  modalItemText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "600",
  },
  modalItemTextSelected: {
    color: "#F26522",
    fontWeight: "800",
  },
});
