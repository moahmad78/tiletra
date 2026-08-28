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
} from "lucide-react-native";
import {
  createVendorProduct,
  fetchVendorCategories,
} from "../../src/api/vendor";
import { uploadBusinessImage } from "../../src/api/auth";
import {
  CATALOG_COLOURS,
  CATALOG_UNITS,
  CATALOG_DIMENSIONS,
  CATALOG_FINISHES,
  CATALOG_MATERIALS,
} from "../../src/constants/catalog";
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
  const [description, setDescription] = useState("");
  const [size, setSize] = useState("600x600 mm");
  const [finish, setFinish] = useState("Glossy");
  const [material, setMaterial] = useState("Vitrified");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Multi-Variants (Flipkart Style)
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<VariantFormItem[]>([
    {
      color: "Alaska White",
      colorHex: "#F8FAFC",
      size: "600x600 mm",
      finish: "Glossy",
      pricePerBox: "750",
      pricePerSqft: "45",
      stockBoxes: "100",
    },
  ]);

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

  const createMutation = useMutation({
    mutationFn: createVendorProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      Alert.alert("Success 🎉", "Product submitted to catalog for approval!", [
        { text: "OK", onPress: () => router.back() },
      ]);
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
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
          setImages((prev) => [...prev, uploadRes.url]);
        } else {
          Alert.alert("Upload Failed", uploadRes.error || "Could not upload image");
        }
      }
    } catch (e: any) {
      setUploading(false);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        color: `Color ${prev.length + 1}`,
        colorHex: "#3B82F6",
        size: size || "600x600 mm",
        finish: finish || "Glossy",
        pricePerBox: pricePerBox || "750",
        pricePerSqft: pricePerSqft || "45",
        stockBoxes: stockBoxes || "50",
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      Alert.alert("Notice", "At least one product variant is required.");
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateVariant = (index: number, field: keyof VariantFormItem, val: string) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Product title is required.");
      return;
    }

    const numPriceBox = parseFloat(pricePerBox) || 750;
    const numPriceSqft = parseFloat(pricePerSqft) || 45;
    const numMrp = parseFloat(mrp) || numPriceBox * 1.3;
    const numStock = parseInt(stockBoxes, 10) || 50;

    const formattedVariants = (hasVariants && variants.length > 0 ? variants : [
      {
        color: "Standard",
        size: size || "600x600 mm",
        finish: finish || "Glossy",
        pricePerBox: pricePerBox || "750",
        pricePerSqft: pricePerSqft || "45",
        stockBoxes: stockBoxes || "50",
      },
    ]).map((v) => ({
      color: v.color.trim() || "Standard",
      colorHex: v.colorHex,
      size: v.size || size || "600x600 mm",
      finish: v.finish || finish || "Glossy",
      pricePerBox: parseFloat(v.pricePerBox) || numPriceBox,
      pricePerSqft: parseFloat(v.pricePerSqft) || numPriceSqft,
      sqftPerBox: 16,
      stockBoxes: parseInt(v.stockBoxes, 10) || numStock,
      mrp: numMrp,
      image: v.image || images[0] || undefined,
    }));

    createMutation.mutate({
      name: name.trim(),
      categoryId: categoryId || undefined,
      categorySlug,
      categoryName,
      unitOfSale,
      pricePerBox: numPriceBox,
      pricePerSqft: numPriceSqft,
      mrp: numMrp,
      stockBoxes: numStock,
      material,
      finish,
      size,
      description: description.trim(),
      images,
      status: "active",
      variants: formattedVariants,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Product</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Basic Info */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Product Title *</Text>
          <TextInput
            style={styles.inputBox}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Royal Statuario Floor Tile"
          />

          {/* Category Dropdown */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Category *</Text>
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

          {/* Unit of Sale Dropdown */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Unit of Sale *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
            {CATALOG_UNITS.map((u) => {
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

          {/* Dimensions / Size */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Dimensions / Size</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
            {CATALOG_DIMENSIONS.map((sz) => {
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

          {/* Finish */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Finish / Surface</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
            {CATALOG_FINISHES.map((fn) => {
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

          {/* Pricing Grid */}
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
              <Text style={styles.inputLabel}>MRP (₹)</Text>
              <TextInput
                style={styles.inputBox}
                value={mrp}
                onChangeText={setMrp}
                keyboardType="decimal-pad"
                placeholder="950"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Initial Stock ({unitOfSale}s) *</Text>
              <TextInput
                style={styles.inputBox}
                value={stockBoxes}
                onChangeText={setStockBoxes}
                keyboardType="number-pad"
                placeholder="100"
              />
            </View>
          </View>

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Product Description</Text>
          <TextInput
            style={[styles.inputBox, { height: 70, paddingTop: 8 }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Material composition, coverage, features..."
            multiline
          />
        </View>

        {/* Multi-Variants Section (Flipkart Style) */}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={styles.variantSectionTitle}>Multi-Variant Options (Flipkart Style)</Text>
              <Text style={styles.variantSectionSub}>Add different colors, dimensions, or textures</Text>
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
                      <Text style={styles.variantLabel}>Color / Shade Name</Text>
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
                        placeholder="600x600 mm"
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

        {/* Photos */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Product Images</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator size="small" color={COLORS.accentBlue} />
              ) : (
                <>
                  <Camera size={22} color="#64748B" />
                  <Text style={styles.uploadBoxText}>+ Add Photo</Text>
                </>
              )}
            </TouchableOpacity>

            {images.map((uri, idx) => (
              <View key={idx} style={styles.imageThumbBox}>
                <Image source={{ uri }} style={styles.imageThumb} contentFit="cover" />
                <TouchableOpacity
                  style={styles.removeImgBtn}
                  onPress={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <X size={12} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Product for Catalog Listing</Text>
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
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textWhite,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 50,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...SHADOWS.sm,
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
  uploadBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    marginRight: 10,
  },
  uploadBoxText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 4,
  },
  imageThumbBox: {
    position: "relative",
    marginRight: 10,
  },
  imageThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removeImgBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtn: {
    backgroundColor: "#052A51",
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
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
