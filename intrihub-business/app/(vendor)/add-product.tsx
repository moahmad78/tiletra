import { useState } from "react";
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
} from "lucide-react-native";
import {
  createVendorProduct,
  fetchVendorCategories,
} from "../../src/api/vendor";
import { uploadBusinessImage } from "../../src/api/auth";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function AddProductScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [categorySlug, setCategorySlug] = useState("floor-tiles");
  const [categoryName, setCategoryName] = useState("Floor Tiles");
  const [pricePerSqft, setPricePerSqft] = useState("");
  const [pricePerBox, setPricePerBox] = useState("");
  const [mrp, setMrp] = useState("");
  const [stockBoxes, setStockBoxes] = useState("");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState("600x600 mm");
  const [finish, setFinish] = useState("Glossy");
  const [material, setMaterial] = useState("Vitrified");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: categoriesData } = useQuery({
    queryKey: ["vendor-categories"],
    queryFn: fetchVendorCategories,
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
      Alert.alert("Success", "Product successfully added to your catalog!", [
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
          setImages((prev) => [...prev, uploadRes.url!]);
        } else {
          Alert.alert("Upload Error", uploadRes.error || "Failed to upload image.");
        }
      }
    } catch (e: any) {
      setUploading(false);
      Alert.alert("Error", e?.message || "Could not select photo");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Missing Field", "Please enter product name");
      return;
    }
    if (!pricePerBox.trim() || isNaN(Number(pricePerBox))) {
      Alert.alert("Missing Field", "Please enter valid price per box");
      return;
    }
    if (!stockBoxes.trim() || isNaN(Number(stockBoxes))) {
      Alert.alert("Missing Field", "Please enter available stock quantity");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      categorySlug,
      categoryName,
      pricePerBox: Number(pricePerBox),
      pricePerSqft: pricePerSqft ? Number(pricePerSqft) : undefined,
      mrp: mrp ? Number(mrp) : undefined,
      stockBoxes: Number(stockBoxes),
      description: description.trim() || undefined,
      size,
      finish,
      material,
      images:
        images.length > 0
          ? images
          : ["https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400"],
      status: "active",
    });
  };

  return (
    <View style={styles.container}>
      {/* App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Add New Product</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Product Images */}
        <Text style={styles.fieldLabel}>Product Photos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
          {images.map((imgUri, idx) => (
            <View key={idx} style={styles.imagePreviewWrapper}>
              <Image source={{ uri: imgUri }} style={styles.imagePreview} contentFit="cover" />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => handleRemoveImage(idx)}>
                <X size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addPhotoBox} onPress={handlePickImage} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color={COLORS.accentOrange} />
            ) : (
              <>
                <Camera size={24} color={COLORS.accentOrange} />
                <Text style={styles.addPhotoText}>Upload Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Basic Details */}
        <Text style={styles.fieldLabel}>Product Name *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Royal Statuario Marble Vitrified Tile"
          placeholderTextColor={COLORS.textTertiary}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.fieldLabel}>Category *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.slug}
              style={[
                styles.categoryChip,
                categorySlug === cat.slug && styles.categoryChipActive,
              ]}
              onPress={() => {
                setCategorySlug(cat.slug);
                setCategoryName(cat.name);
              }}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  categorySlug === cat.slug && styles.categoryChipTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pricing Grid */}
        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.fieldLabel}>Price Per Box (₹) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 1450"
              placeholderTextColor={COLORS.textTertiary}
              value={pricePerBox}
              onChangeText={setPricePerBox}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.fieldLabel}>Price / Sq.Ft (₹)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 75"
              placeholderTextColor={COLORS.textTertiary}
              value={pricePerSqft}
              onChangeText={setPricePerSqft}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.fieldLabel}>MRP (₹)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 1850"
              placeholderTextColor={COLORS.textTertiary}
              value={mrp}
              onChangeText={setMrp}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.fieldLabel}>Stock (Boxes) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 250"
              placeholderTextColor={COLORS.textTertiary}
              value={stockBoxes}
              onChangeText={setStockBoxes}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Technical Specs */}
        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.fieldLabel}>Size</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 600x1200 mm"
              placeholderTextColor={COLORS.textTertiary}
              value={size}
              onChangeText={setSize}
            />
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.fieldLabel}>Finish</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Glossy / Matt"
              placeholderTextColor={COLORS.textTertiary}
              value={finish}
              onChangeText={setFinish}
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>Product Description</Text>
        <TextInput
          style={[styles.textInput, { height: 90, textAlignVertical: "top" }]}
          placeholder="Enter specifications, coverage area per box, water absorption etc."
          placeholderTextColor={COLORS.textTertiary}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
          activeOpacity={0.85}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <CheckCircle2 size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Publish Product</Text>
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
    marginTop: SPACING.md,
  },
  imageRow: {
    flexDirection: "row",
    marginBottom: SPACING.sm,
  },
  imagePreviewWrapper: {
    position: "relative",
    marginRight: SPACING.sm,
  },
  imagePreview: {
    width: 90,
    height: 90,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSecondary,
  },
  removeImageBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoBox: {
    width: 90,
    height: 90,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.accentOrange,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(234, 88, 12, 0.05)",
  },
  addPhotoText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.accentOrange,
    marginTop: 4,
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
  categoriesRow: {
    flexDirection: "row",
    marginBottom: SPACING.sm,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  categoryChipTextActive: {
    color: "#fff",
  },
  gridRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  gridCol: {
    flex: 1,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accentOrange,
    borderRadius: RADIUS.lg,
    paddingVertical: 15,
    marginTop: SPACING.xl,
    gap: 8,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
