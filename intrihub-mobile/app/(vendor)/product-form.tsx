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
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Trash2,
  Check,
  ChevronDown,
  UploadCloud,
  Layers,
  Sparkles,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";
import {
  fetchVendorProduct,
  fetchVendorCategories,
  createVendorProduct,
  updateVendorProduct,
  uploadProductImage,
} from "../../src/api/vendor";
import { Category } from "../../src/types";

const UNITS_OF_SALE = [
  { label: "Box (e.g. Tiles)", value: "box" },
  { label: "Square Feet (Sq.Ft)", value: "sqft" },
  { label: "Piece (Fittings / Sinks)", value: "piece" },
  { label: "Meter / Coil (Pipes/Wires)", value: "meter" },
  { label: "Kg / Bag (Cement/Adhesive)", value: "kg" },
  { label: "Litre / Can (Paint/Primer)", value: "litre" },
  { label: "Pack / Set", value: "pack" },
];

const FINISH_OPTIONS = ["Glossy", "Matte", "Satin", "Polished", "Rustic", "Carving", "High Gloss", "Textured"];
const SIZE_OPTIONS = ["600x600mm", "600x1200mm", "800x1600mm", "800x800mm", "300x600mm", "300x450mm", "Custom"];
const MATERIAL_OPTIONS = ["Vitrified", "Ceramic", "Porcelain", "Full Body", "Double Charge", "Marble", "Granite", "Standard"];

export default function ProductFormScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  // Form State
  const [name, setName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [unitOfSale, setUnitOfSale] = useState("box");
  const [pricePerSqft, setPricePerSqft] = useState("");
  const [mrp, setMrp] = useState("");
  const [stockBoxes, setStockBoxes] = useState("50");
  const [description, setDescription] = useState("");
  const [material, setMaterial] = useState("Vitrified");
  const [finish, setFinish] = useState("Glossy");
  const [size, setSize] = useState("600x600mm");
  const [thickness, setThickness] = useState("9mm");
  const [look, setLook] = useState("Marble Look");
  const [status, setStatus] = useState<"active" | "paused">("active");

  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Modal Pickers
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [unitModalVisible, setUnitModalVisible] = useState(false);

  // 1. Fetch Categories for Dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ["vendor-categories"],
    queryFn: fetchVendorCategories,
  });

  const categories = categoriesData?.categories || [];

  // 2. Fetch Existing Product if in Edit Mode
  const { data: productData, isLoading: loadingProduct } = useQuery({
    queryKey: ["vendor-product-detail", id],
    queryFn: () => fetchVendorProduct(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (productData?.product) {
      const p = productData.product;
      setName(p.name || "");
      setPricePerSqft(String(p.pricePerSqft || p.pricePerBox || ""));
      setMrp(p.mrp ? String(p.mrp) : "");
      setUnitOfSale(p.unitOfSale || "box");
      setDescription(p.description || "");
      setMaterial(p.material || "Vitrified");
      setFinish(p.finish || "Glossy");
      setSize(p.size || "600x600mm");
      setThickness(p.thickness || "9mm");
      setLook(p.look || "Marble Look");
      setStatus(p.status === "paused" ? "paused" : "active");
      setImages(p.images && p.images.length > 0 ? p.images : p.featuredImage ? [p.featuredImage] : []);

      if (p.categoryId && categories.length > 0) {
        const matched = categories.find((c) => c.id === p.categoryId || c.slug === p.categorySlug);
        if (matched) setSelectedCategory(matched);
      }
    }
  }, [productData, categories]);

  // Image Picker Logic (Library / Camera)
  const pickImage = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Camera access is needed to capture product photos.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Photo gallery access is needed to select product images.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });
      }

      if (!result.canceled && result.assets?.[0]?.uri) {
        const asset = result.assets[0];
        setUploadingImage(true);
        const uploadRes = await uploadProductImage(
          asset.uri,
          asset.fileName || `product-${Date.now()}.jpg`,
          asset.mimeType || "image/jpeg"
        );
        setUploadingImage(false);

        if (uploadRes.success && uploadRes.url) {
          setImages((prev) => [...prev, uploadRes.url!]);
        } else {
          Alert.alert("Upload Error", uploadRes.error || "Could not upload image to server.");
        }
      }
    } catch (e: any) {
      setUploadingImage(false);
      Alert.alert("Image Error", e?.message || "Failed to pick image");
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Mutation
  const mutation = useMutation({
    mutationFn: async () => {
      const priceNum = parseFloat(pricePerSqft.trim());
      const mrpNum = mrp.trim() ? parseFloat(mrp.trim()) : undefined;
      const stockNum = parseInt(stockBoxes.trim(), 10) || 50;

      const payload = {
        name: name.trim(),
        categoryId: selectedCategory?.id,
        categorySlug: selectedCategory?.slug || "general",
        categoryName: selectedCategory?.name || "General Building Materials",
        pricePerSqft: priceNum,
        pricePerBox: priceNum * 16,
        mrp: mrpNum,
        unitOfSale,
        description: description.trim(),
        images,
        stockBoxes: stockNum,
        material,
        finish,
        size,
        thickness,
        usage: "Indoor / Commercial",
        look,
        status,
      };

      if (isEditing) {
        return updateVendorProduct(id!, payload);
      } else {
        return createVendorProduct(payload);
      }
    },
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
        queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
        Alert.alert(
          "Success",
          isEditing ? "Product updated successfully!" : "Product created and submitted for catalog approval!",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Alert.alert("Error", res.error || "Failed to save product");
      }
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.message || "Failed to save product");
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter the product title");
      return;
    }
    const priceNum = parseFloat(pricePerSqft.trim());
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Validation Error", "Please enter a valid price per unit greater than 0");
      return;
    }
    if (images.length === 0) {
      Alert.alert("Photo Required", "Please add at least 1 image of your product");
      return;
    }
    mutation.mutate();
  };

  if (isEditing && loadingProduct) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? "Edit Product" : "Add New Product"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Product Photos Section */}
        <View style={styles.formCard}>
          <Text style={styles.cardHeaderTitle}>Product Photos ({images.length})</Text>
          <Text style={styles.cardHeaderSub}>
            Add high-quality photos showing finishes, angles, or packaging
          </Text>

          <View style={styles.imagesGrid}>
            {images.map((imgUri, index) => (
              <View key={index} style={styles.imageItem}>
                <Image source={{ uri: imgUri }} style={styles.imagePreview} contentFit="cover" />
                {index === 0 && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Cover</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => removeImage(index)}
                >
                  <Trash2 size={12} color={COLORS.textWhite} />
                </TouchableOpacity>
              </View>
            ))}

            {/* Uploading Spinner Box */}
            {uploadingImage && (
              <View style={[styles.imageItem, styles.uploadingBox]}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}

            {/* Add Photo Buttons */}
            <View style={styles.addPhotoButtonsCol}>
              <TouchableOpacity
                style={styles.uploadPickerBtn}
                onPress={() => pickImage(false)}
                activeOpacity={0.8}
                disabled={uploadingImage}
              >
                <ImageIcon size={18} color={COLORS.accentOrange} />
                <Text style={styles.uploadPickerText}>Choose Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadPickerBtn}
                onPress={() => pickImage(true)}
                activeOpacity={0.8}
                disabled={uploadingImage}
              >
                <Camera size={18} color={COLORS.accentBlue} />
                <Text style={styles.uploadPickerText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 2. Basic Information */}
        <View style={styles.formCard}>
          <Text style={styles.cardHeaderTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Product Name <Text style={styles.reqAsterisk}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Statuario Classic White Vitrified Tile"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Category Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setCategoryModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={selectedCategory ? styles.dropdownText : styles.dropdownPlaceholder}>
                {selectedCategory ? selectedCategory.name : "Select category"}
              </Text>
              <ChevronDown size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Unit of Sale Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Unit of Sale</Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setUnitModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownText}>
                {UNITS_OF_SALE.find((u) => u.value === unitOfSale)?.label || unitOfSale}
              </Text>
              <ChevronDown size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Pricing & Inventory */}
        <View style={styles.formCard}>
          <Text style={styles.cardHeaderTitle}>Pricing & Inventory</Text>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>
                Selling Price (₹) <Text style={styles.reqAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 45"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
                value={pricePerSqft}
                onChangeText={setPricePerSqft}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>MRP / Original (₹)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 60 (optional)"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
                value={mrp}
                onChangeText={setMrp}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Available Stock ({unitOfSale === "box" ? "Boxes" : "Units"})
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 100"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              value={stockBoxes}
              onChangeText={setStockBoxes}
            />
          </View>
        </View>

        {/* 4. Specifications */}
        <View style={styles.formCard}>
          <Text style={styles.cardHeaderTitle}>Specifications & Look</Text>

          {/* Material Options */}
          <Text style={styles.optionsSectionTitle}>Material</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {MATERIAL_OPTIONS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.chipItem, material === m && styles.chipItemActive]}
                onPress={() => setMaterial(m)}
              >
                <Text style={[styles.chipText, material === m && styles.chipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Finish Options */}
          <Text style={styles.optionsSectionTitle}>Finish</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {FINISH_OPTIONS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.chipItem, finish === f && styles.chipItemActive]}
                onPress={() => setFinish(f)}
              >
                <Text style={[styles.chipText, finish === f && styles.chipTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Size Options */}
          <Text style={styles.optionsSectionTitle}>Size</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {SIZE_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chipItem, size === s && styles.chipItemActive]}
                onPress={() => setSize(s)}
              >
                <Text style={[styles.chipText, size === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Thickness</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 9mm"
                placeholderTextColor={COLORS.textMuted}
                value={thickness}
                onChangeText={setThickness}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Look / Pattern</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Marble Look"
                placeholderTextColor={COLORS.textMuted}
                value={look}
                onChangeText={setLook}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Provide key details, ideal room application, and features..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        {/* 5. Listing Status Switch */}
        <View style={styles.formCard}>
          <Text style={styles.cardHeaderTitle}>Storefront Visibility</Text>
          <View style={styles.statusSwitchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusSwitchTitle}>
                {status === "active" ? "Active (Listed)" : "Paused (Hidden)"}
              </Text>
              <Text style={styles.statusSwitchSub}>
                {status === "active"
                  ? "Product will be visible on storefront once catalog approved."
                  : "Product is hidden from customer browsing."}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.statusToggleBtn,
                status === "active" ? styles.statusToggleActive : styles.statusTogglePaused,
              ]}
              onPress={() => setStatus(status === "active" ? "paused" : "active")}
            >
              <Text style={styles.statusToggleBtnText}>
                {status === "active" ? "Active" : "Paused"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Action Button */}
        <TouchableOpacity
          style={[styles.saveButton, mutation.isPending && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={mutation.isPending}
          activeOpacity={0.85}
        >
          {mutation.isPending ? (
            <ActivityIndicator size="small" color={COLORS.textWhite} />
          ) : (
            <>
              <Check size={18} color={COLORS.textWhite} />
              <Text style={styles.saveButtonText}>
                {isEditing ? "Save Product Changes" : "Submit Product for Catalog"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Category Modal */}
      <Modal visible={categoryModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalListItem,
                    selectedCategory?.id === item.id && styles.modalListItemActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(item);
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalListText,
                      selectedCategory?.id === item.id && styles.modalListTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedCategory?.id === item.id && (
                    <Check size={16} color={COLORS.accentOrange} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Unit of Sale Modal */}
      <Modal visible={unitModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Unit of Sale</Text>
              <TouchableOpacity onPress={() => setUnitModalVisible(false)}>
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={UNITS_OF_SALE}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalListItem,
                    unitOfSale === item.value && styles.modalListItemActive,
                  ]}
                  onPress={() => {
                    setUnitOfSale(item.value);
                    setUnitModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalListText,
                      unitOfSale === item.value && styles.modalListTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {unitOfSale === item.value && (
                    <Check size={16} color={COLORS.accentOrange} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 50,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 2,
  },
  cardHeaderSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  imageItem: {
    width: 90,
    height: 90,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    position: "relative",
    backgroundColor: COLORS.surfaceSecondary,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  primaryBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(5, 42, 81, 0.8)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  primaryBadgeText: {
    color: COLORS.textWhite,
    fontSize: 9,
    fontWeight: "800",
  },
  removeImageBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(239, 68, 68, 0.85)",
    width: 20,
    height: 20,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadingBox: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  uploadingText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  addPhotoButtonsCol: {
    justifyContent: "center",
    gap: 8,
  },
  uploadPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  uploadPickerText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  rowInputs: {
    flexDirection: "row",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  reqAsterisk: {
    color: COLORS.accentRed,
  },
  textInput: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 70,
  },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 11,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  optionsSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 6,
  },
  chipsScroll: {
    marginBottom: SPACING.md,
  },
  chipItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipItemActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.textWhite,
  },
  statusSwitchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusSwitchTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  statusSwitchSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  statusToggleActive: {
    backgroundColor: "#dcfce7",
  },
  statusTogglePaused: {
    backgroundColor: "#f1f5f9",
  },
  statusToggleBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    marginTop: 8,
    gap: 8,
    ...SHADOWS.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textWhite,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.accentOrange,
  },
  modalListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modalListItemActive: {
    backgroundColor: "#fff7ed",
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  modalListText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
  },
  modalListTextActive: {
    color: COLORS.accentOrange,
    fontWeight: "800",
  },
});
