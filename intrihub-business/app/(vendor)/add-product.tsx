import React, { useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
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
  Sparkles,
  ChevronDown,
  Scale,
  Ruler,
  Palette,
  Search,
  Check,
  Zap,
} from "lucide-react-native";
import {
  createVendorProduct,
  fetchVendorCategories,
  fetchVendorDashboard,
} from "../../src/api/vendor";
import { uploadBusinessImage } from "../../src/api/auth";
import {
  CATALOG_COLOURS,
  CATALOG_UNITS,
  CATALOG_DIMENSIONS,
  CATALOG_FINISHES,
  CATALOG_MATERIALS,
  resolveColorHex,
} from "../../src/constants/catalog";
import ColorPalettePickerModal from "../../src/components/ColorPalettePickerModal";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

interface VariantFormItem {
  color: string;
  colorHex?: string;
  size: string;
  finish: string;
  pricePerBox: string;
  pricePerSqft: string;
  stockBoxes: string;
  image?: string;
}

export default function AddProductScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [categorySlug, setCategorySlug] = useState("floor-tiles");
  const [categoryName, setCategoryName] = useState("Floor Tiles");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [unitOfSale, setUnitOfSale] = useState("box");
  const [pricePerSqft, setPricePerSqft] = useState("45");
  const [pricePerBox, setPricePerBox] = useState("750");
  const [mrp, setMrp] = useState("950");
  const [stockBoxes, setStockBoxes] = useState("100");
  const [weightKg, setWeightKg] = useState("2.5");
  const [isBulky, setIsBulky] = useState(false);
  const [description, setDescription] = useState("");
  const [size, setSize] = useState("600x600 mm (2x2 ft)");
  const [finish, setFinish] = useState("Glossy");
  const [material, setMaterial] = useState("Glazed Vitrified (GVT)");
  const [images, setImages] = useState<string[]>([]);
  const [primaryImageUrlInput, setPrimaryImageUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);

  // Multi-Variants State
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<VariantFormItem[]>([
    {
      color: "Alaska White",
      colorHex: resolveColorHex("Alaska White"),
      size: "600x600 mm (2x2 ft)",
      finish: "Glossy",
      pricePerBox: "750",
      pricePerSqft: "45",
      stockBoxes: "100",
    },
  ]);

  // Dropdown Picker Modal State
  const [dropdownType, setDropdownType] = useState<
    "category" | "unit" | "size" | "finish" | "material" | "variant_size" | "variant_finish" | null
  >(null);
  const [dropdownVariantIdx, setDropdownVariantIdx] = useState<number | null>(null);
  const [customOptionInput, setCustomOptionInput] = useState("");
  const [dropdownSearch, setDropdownSearch] = useState("");

  // Rich Color Palette Picker Modal State (Solid, Gradient, Spectrum)
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorPickerVariantIdx, setColorPickerVariantIdx] = useState<number | null>(null);

  // Custom Local Master Options
  const [customUnits, setCustomUnits] = useState<string[]>([]);
  const [customSizes, setCustomSizes] = useState<string[]>([]);
  const [customFinishes, setCustomFinishes] = useState<string[]>([]);
  const [customMaterials, setCustomMaterials] = useState<string[]>([]);

  const { data: dashboardData } = useQuery({
    queryKey: ["vendor-dashboard"],
    queryFn: () => fetchVendorDashboard(),
  });
  const isAutoPublish = Boolean(dashboardData?.vendor?.autoPublishEnabled);

  const { data: categoriesData } = useQuery({
    queryKey: ["vendor-categories"],
    queryFn: () => fetchVendorCategories(),
  });

  const categories = categoriesData?.categories || [
    { id: "1", name: "Floor Tiles", slug: "floor-tiles" },
    { id: "2", name: "Wall Tiles", slug: "wall-tiles" },
    { id: "3", name: "Granite & Marble", slug: "granite-marble" },
    { id: "4", name: "Plumbing & Sanitary", slug: "plumbing-sanitary" },
    { id: "5", name: "Hardware & Tools", slug: "hardware-tools" },
  ];

  const allUnits = Array.from(new Set([...CATALOG_UNITS, ...customUnits]));
  const allSizes = Array.from(new Set([...CATALOG_DIMENSIONS, ...customSizes]));
  const allFinishes = Array.from(new Set([...CATALOG_FINISHES, ...customFinishes]));
  const allMaterials = Array.from(new Set([...CATALOG_MATERIALS, ...customMaterials]));

  const createMutation = useMutation({
    mutationFn: createVendorProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      Alert.alert(
        isAutoPublish ? "Product Published 🎉" : "Submitted for Approval ⏳",
        isAutoPublish
          ? "Your product is now published and directly live on Intrihub storefront!"
          : "Your product has been submitted and is awaiting Super Admin approval before going live.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.message || "Failed to create product");
    },
  });

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Gallery access is required to upload product images.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const asset = result.assets[0];
        setUploading(true);
        const uploadRes = await uploadBusinessImage(
          asset.uri,
          asset.fileName || `product-${Date.now()}.jpg`,
          asset.mimeType || "image/jpeg"
        );
        setUploading(false);

        if (uploadRes.success && uploadRes.url) {
          setImages((prev) => [...prev, uploadRes.url!]);
          setPrimaryImageUrlInput(uploadRes.url!);
        } else {
          Alert.alert("Upload Error", uploadRes.error || "Failed to upload image");
        }
      }
    } catch (e: any) {
      setUploading(false);
      Alert.alert("Error", e?.message || "Something went wrong during image selection");
    }
  };

  const handlePickVariantImage = async (variantIdx: number) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const asset = result.assets[0];
        setUploading(true);
        const uploadRes = await uploadBusinessImage(
          asset.uri,
          asset.fileName || `var-${variantIdx}-${Date.now()}.jpg`,
          asset.mimeType || "image/jpeg"
        );
        setUploading(false);

        if (uploadRes.success && uploadRes.url) {
          handleUpdateVariant(variantIdx, "image", uploadRes.url);
        } else {
          Alert.alert("Upload Error", uploadRes.error || "Failed to upload image");
        }
      }
    } catch (e: any) {
      setUploading(false);
      Alert.alert("Error", e?.message || "Something went wrong during image selection");
    }
  };

  const handleAddVariant = () => {
    const defaultColor = `Option ${variants.length + 1}`;
    setVariants((prev) => [
      ...prev,
      {
        color: defaultColor,
        colorHex: resolveColorHex(defaultColor),
        size: size || "600x600 mm (2x2 ft)",
        finish: finish || "Glossy",
        pricePerBox: pricePerBox || "750",
        pricePerSqft: pricePerSqft || "45",
        stockBoxes: stockBoxes || "50",
      },
    ]);
  };

  const handleUpdateVariant = (index: number, field: keyof VariantFormItem, value: string) => {
    setVariants((prev) => {
      const next = [...prev];
      if (field === "color") {
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

  const handleAddCustomOption = () => {
    if (!customOptionInput.trim()) {
      Alert.alert("Validation", "Please enter a value to add.");
      return;
    }
    const val = customOptionInput.trim();

    if (dropdownType === "category") {
      setCategoryName(val);
      setCategorySlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
      setCustomOptionInput("");
      setDropdownType(null);
    } else if (dropdownType === "unit") {
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

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Product title is required.");
      return;
    }

    const parsedWeight = parseFloat(weightKg);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      Alert.alert("Validation Error", "Please enter an approximate weight in kg (required for delivery vehicle routing).");
      return;
    }

    const allImages = [...images];
    if (primaryImageUrlInput.trim() && !allImages.includes(primaryImageUrlInput.trim())) {
      allImages.unshift(primaryImageUrlInput.trim());
    }

    createMutation.mutate({
      name: name.trim(),
      categorySlug,
      categoryName,
      categoryId,
      unitOfSale,
      pricePerSqft: parseFloat(pricePerSqft) || 0,
      pricePerBox: parseFloat(pricePerBox) || 0,
      mrp: parseFloat(mrp) || 0,
      stockBoxes: parseInt(stockBoxes, 10) || 0,
      description: description.trim(),
      size,
      finish,
      material,
      weightKg: parsedWeight,
      isBulky,
      images: allImages,
      variants: hasVariants ? variants : undefined,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#052A51" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Add Product Listing</Text>
          <Text style={styles.headerSubtitle}>Submit new item to platform catalog</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Upload Mode Status Banner */}
        <View style={[styles.modeBanner, isAutoPublish ? styles.modeBannerLive : styles.modeBannerPending]}>
          <Zap size={18} color={isAutoPublish ? "#16A34A" : "#D97706"} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.modeBannerTitle, { color: isAutoPublish ? "#166534" : "#92400E" }]}>
              {isAutoPublish ? "⚡ Auto-Upload Mode Active (Direct Live)" : "⏳ Admin Approval Required Mode"}
            </Text>
            <Text style={[styles.modeBannerSub, { color: isAutoPublish ? "#15803D" : "#78350F" }]}>
              {isAutoPublish
                ? "This product will go live immediately on Intrihub storefront upon submission."
                : "This product will be reviewed and approved by Super Admin before appearing live."}
            </Text>
          </View>
        </View>

        {/* Basic Details */}
        <View style={styles.card}>
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

          {/* Pricing & Stock */}
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

          {/* F8: Weight & Bulkiness Section */}
          <View style={{ marginTop: 14, padding: 12, backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Scale size={16} color="#052A51" />
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#052A51" }}>Weight & Cargo Sizing *</Text>
            </View>
            <Text style={{ fontSize: 11, color: "#64748B", marginBottom: 10 }}>
              Required to automatically route orders to the correct vehicle (Borzo Bike, Porter 3-Wheeler, or Tata Ace).
            </Text>

            <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Weight per {unitOfSale.toUpperCase()} (kg) *</Text>
                <TextInput
                  style={styles.inputBox}
                  value={weightKg}
                  onChangeText={setWeightKg}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 2.5"
                />
              </View>
            </View>

            {/* isBulky Checkbox Toggle */}
            <TouchableOpacity
              style={{
                marginTop: 10,
                padding: 10,
                backgroundColor: isBulky ? "#FEF3C7" : "#FFFFFF",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isBulky ? "#F59E0B" : "#CBD5E1",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              onPress={() => setIsBulky(!isBulky)}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: "800", color: isBulky ? "#92400E" : "#1E293B" }}>
                  📦 Oversized / Bulky Item
                </Text>
                <Text style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>
                  Check this for plywood, PVC pipes, ceiling panels, or doors (routes directly to Tata Ace mini-truck).
                </Text>
              </View>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: isBulky ? "#D97706" : "#94A3B8",
                  backgroundColor: isBulky ? "#D97706" : "#FFFFFF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isBulky ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
              </View>
            </TouchableOpacity>
          </View>

          {/* Primary Images URL & Upload */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Primary Product Image</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              style={[styles.inputBox, { flex: 1 }]}
              value={primaryImageUrlInput}
              onChangeText={(val) => {
                setPrimaryImageUrlInput(val);
                if (val.trim()) {
                  setImages((prev) => Array.from(new Set([val.trim(), ...prev])));
                }
              }}
              placeholder="https://example.com/tile.jpg"
            />
            <TouchableOpacity
              style={styles.uploadMiniBtn}
              onPress={handlePickImage}
              disabled={uploading}
            >
              <Camera size={14} color="#052A51" />
              <Text style={styles.uploadMiniBtnText}>Upload</Text>
            </TouchableOpacity>
          </View>

          {images.length > 0 ? (
            <View style={{ marginTop: 10, gap: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 }}>
                  <Check size={12} color="#16A34A" />
                  <Text style={{ fontSize: 11, fontWeight: "800", color: "#166534" }}>
                    {images.length} Image(s) Attached
                  </Text>
                </View>

                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#16A34A", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, gap: 4 }}
                  onPress={() => Alert.alert("Confirmed 🎉", "Image preview saved!")}
                >
                  <Check size={12} color="#FFFFFF" />
                  <Text style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>Done</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 8 }}>
                {images.map((imgUri, idx) => (
                  <View key={idx} style={{ position: "relative", width: 80, height: 80, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: "#CBD5E1", backgroundColor: "#F1F5F9", marginRight: 8 }}>
                    <Image source={{ uri: imgUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                    <TouchableOpacity
                      style={{ position: "absolute", top: 4, right: 4, backgroundColor: "#DC2626", width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" }}
                      onPress={() => setImages((prev) => prev.filter((img) => img !== imgUri))}
                    >
                      <Trash2 size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Product Description</Text>
          <TextInput
            style={[styles.inputBox, { height: 70, paddingTop: 8 }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Detailed specifications, warranty, coverage info..."
            multiline
          />
        </View>

        {/* Multi-Variant Section */}
        <View style={styles.card}>
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
                      <View style={[styles.colorBubbleInput, { backgroundColor: activeHex }]} />
                      <TextInput
                        style={[styles.variantInput, { flex: 1 }]}
                        value={v.color}
                        onChangeText={(val) => handleUpdateVariant(idx, "color", val)}
                        placeholder="e.g. Royal Blue, Teak, Charcoal, Alaska White..."
                      />
                      <TouchableOpacity
                        style={styles.chooseSwatchBtn}
                        onPress={() => {
                          setColorPickerVariantIdx(idx);
                          setColorPickerOpen(true);
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
                        onPress={() => handlePickVariantImage(idx)}
                        disabled={uploading}
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

        {/* Submit Action */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Product for Approval</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

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
                  ? "Select Size / Dimension"
                  : dropdownType === "finish" || dropdownType === "variant_finish"
                  ? "Select Surface Finish"
                  : "Select Material"}
              </Text>
              <TouchableOpacity onPress={() => setDropdownType(null)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Inline Add New Option Box */}
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
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rich Color Palette Picker Modal (Solid, Dual Gradient & Spectrum Graph) */}
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
        }}
        currentColorName={colorPickerVariantIdx !== null ? variants[colorPickerVariantIdx]?.color : ""}
        currentColorHex={colorPickerVariantIdx !== null ? variants[colorPickerVariantIdx]?.colorHex : "#F26522"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#052A51",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 60,
  },
  card: {
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
  thumbWrapper: {
    position: "relative",
    marginRight: 10,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  thumbRemove: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#DC2626",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
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
  submitBtn: {
    backgroundColor: "#052A51",
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  submitBtnText: {
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
  modeBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    ...SHADOWS.sm,
  },
  modeBannerLive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  modeBannerPending: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  modeBannerTitle: {
    fontSize: 12,
    fontWeight: "800",
  },
  modeBannerSub: {
    fontSize: 10.5,
    marginTop: 2,
    lineHeight: 14,
  },
});
