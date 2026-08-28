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
import {
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  Calculator,
  Tag,
  Package,
  X,
  CheckCircle2,
  Sparkles,
} from "lucide-react-native";
import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from "../../src/api/admin";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function AdminCategoriesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [calculatorType, setCalculatorType] = useState("none");
  const [saving, setSaving] = useState(false);

  const {
    data: categoriesData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["admin-categories", search],
    queryFn: () => fetchAdminCategories({ search: search.trim() || undefined }),
  });

  const categories = categoriesData?.categories || [];

  const filteredCategories = categories.filter((c: any) =>
    (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.slug || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setImage("");
    setCalculatorType("none");
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name || "");
    setSlug(cat.slug || "");
    setDescription(cat.description || "");
    setImage(cat.image || "");
    setCalculatorType(cat.calculatorType || "none");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Category name is required.");
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        const res = await updateAdminCategory(editingCategory.id, {
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          image: image.trim() || undefined,
          calculatorType,
        });

        setSaving(false);
        if (res.success) {
          setModalOpen(false);
          Alert.alert("Updated", "Category updated successfully!");
          refetch();
          queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
        } else {
          Alert.alert("Error", res.error || "Failed to update category.");
        }
      } else {
        const res = await createAdminCategory({
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          image: image.trim() || undefined,
          calculatorType,
        });

        setSaving(false);
        if (res.success) {
          setModalOpen(false);
          Alert.alert("Created", "Category created successfully!");
          refetch();
          queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
        } else {
          Alert.alert("Error", res.error || "Failed to create category.");
        }
      }
    } catch (e: any) {
      setSaving(false);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  const handleDelete = (cat: any) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${cat.name}"? Products in this category may be unlinked.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await deleteAdminCategory(cat.id);
              if (res.success) {
                Alert.alert("Deleted", "Category has been removed.");
                refetch();
                queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
              } else {
                Alert.alert("Error", res.error || "Failed to delete category.");
              }
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Something went wrong.");
            }
          },
        },
      ]
    );
  };

  const renderCategoryItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.categoryCard}>
        <View style={styles.cardTop}>
          <Image
            source={item.image ? { uri: item.image } : require("../../assets/intri-icon.png")}
            style={styles.categoryImage}
            contentFit="cover"
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.categorySlug}>/{item.slug}</Text>

            {item.description ? (
              <Text style={styles.categoryDesc} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}

            <View style={styles.tagsRow}>
              <View style={styles.productCountBadge}>
                <Package size={11} color={COLORS.accentBlue} />
                <Text style={styles.productCountText}>
                  {item.productCount || 0} Products
                </Text>
              </View>

              {item.calculatorType && item.calculatorType !== "none" ? (
                <View style={styles.calculatorBadge}>
                  <Calculator size={11} color="#D97706" />
                  <Text style={styles.calculatorText}>Tile Calculator</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => handleOpenEdit(item)}
            activeOpacity={0.85}
          >
            <Edit2 size={14} color={COLORS.accentBlue} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
            activeOpacity={0.85}
          >
            <Trash2 size={14} color="#DC2626" />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Category Master</Text>
          <Text style={styles.headerSubtitle}>
            {categories.length} taxonomy categories & calculators
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addCategoryBtn}
          onPress={handleOpenAdd}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addCategoryBtnText}>Add Category</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search category name or slug..."
            placeholderTextColor={COLORS.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.accentBlue} />
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.id || item.slug}
          renderItem={renderCategoryItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.accentBlue} />}
        />
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingCategory ? "Edit Category" : "Create New Category"}
            </Text>
            <TouchableOpacity onPress={() => setModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Category Name *</Text>
              <TextInput
                style={styles.inputBox}
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (!editingCategory && !slug) {
                    setSlug(
                      t
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)+/g, "")
                    );
                  }
                }}
                placeholder="e.g. Vitrified Tiles, Bath Fittings"
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Slug URL Path</Text>
              <TextInput
                style={styles.inputBox}
                value={slug}
                onChangeText={setSlug}
                placeholder="vitrified-tiles"
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Description</Text>
              <TextInput
                style={[styles.inputBox, { height: 60, textAlignVertical: "top", paddingTop: 8 }]}
                multiline
                value={description}
                onChangeText={setDescription}
                placeholder="Short category summary for buyers..."
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Image URL / Banner Path</Text>
              <TextInput
                style={styles.inputBox}
                value={image}
                onChangeText={setImage}
                placeholder="https://... or /categories/tiles.jpg"
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Calculator Type</Text>
              <View style={styles.calculatorOptionsRow}>
                {[
                  { key: "none", label: "Standard (None)" },
                  { key: "area_to_boxes", label: "Area-to-Boxes (Tiles)" },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.calculatorOptionChip,
                      calculatorType === opt.key && styles.calculatorOptionChipActive,
                    ]}
                    onPress={() => setCalculatorType(opt.key)}
                  >
                    <Text
                      style={[
                        styles.calculatorOptionText,
                        calculatorType === opt.key && styles.calculatorOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>
                    {editingCategory ? "Update Category" : "Create Category"}
                  </Text>
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
  addCategoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F26522",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  addCategoryBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  searchContainer: {
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
  categoryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  categoryImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  categorySlug: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontFamily: "monospace",
    marginTop: 1,
  },
  categoryDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  productCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  productCountText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.accentBlue,
  },
  calculatorBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  calculatorText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#D97706",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#DC2626",
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
  calculatorOptionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  calculatorOptionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  calculatorOptionChipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  calculatorOptionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  calculatorOptionTextActive: {
    color: "#1D4ED8",
  },
  saveBtn: {
    backgroundColor: "#052A51",
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
