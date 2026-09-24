import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Calendar,
  Globe,
  Tag,
  User,
  Image as ImageIcon,
  Eye,
  X,
  FileText,
  Sparkles,
} from "lucide-react-native";
import {
  fetchAdminGuides,
  createAdminGuide,
  updateAdminGuide,
  deleteAdminGuide,
} from "../../src/api/admin";
import { COLORS, SPACING, RADIUS } from "../../src/constants/theme";

const TABS = [
  { key: "ALL", label: "All" },
  { key: "PUBLISHED", label: "Published" },
  { key: "DRAFT", label: "Drafts" },
  { key: "SCHEDULED", label: "Scheduled" },
];

const CATEGORIES = [
  "Trends",
  "Buying Guide",
  "How-To",
  "Product Spotlight",
  "Tiles",
  "Sanitaryware",
  "Electrical",
  "Bathware",
  "Flooring",
  "Architecture & Design",
];

export default function AdminGuidesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Editor Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [editingGuide, setEditingGuide] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Trends");
  const [status, setStatus] = useState<"PUBLISHED" | "DRAFT" | "SCHEDULED">("PUBLISHED");
  const [authorName, setAuthorName] = useState("IntriHub Team");
  const [readTime, setReadTime] = useState("5 min read");
  const [featuredImage, setFeaturedImage] = useState("");
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");
  const [keywords, setKeywords] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAdminGuides();
      if (res.success && res.guides) {
        setGuides(res.guides);
      } else {
        setGuides([]);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load guides");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openCreateModal = () => {
    setEditingGuide(null);
    setTitle("");
    setSlug("");
    setCategory("Trends");
    setStatus("PUBLISHED");
    setAuthorName("IntriHub Team");
    setReadTime("5 min read");
    setFeaturedImage("");
    setFeaturedImageAlt("");
    setKeywords("");
    setExcerpt("");
    setContent("<h2>Introduction</h2>\n<p>Write your detailed guide content here...</p>\n<h2>Key Factors to Consider</h2>\n<p>Add helpful points and buying advice...</p>");
    setMetaTitle("");
    setMetaDescription("");
    setModalVisible(true);
  };

  const openEditModal = (guide: any) => {
    setEditingGuide(guide);
    setTitle(guide.title || "");
    setSlug(guide.slug || "");
    setCategory(guide.category || "Trends");
    setStatus(guide.status || "PUBLISHED");
    setAuthorName(guide.authorName || "IntriHub Team");
    setReadTime(guide.readTime || `${guide.readTimeMinutes || 5} min read`);
    setFeaturedImage(guide.featuredImage || "");
    setFeaturedImageAlt(guide.featuredImageAlt || guide.title || "");
    setKeywords(Array.isArray(guide.keywords) ? guide.keywords.join(", ") : "");
    setExcerpt(guide.excerpt || "");
    setContent(guide.content || "");
    setMetaTitle(guide.metaTitle || "");
    setMetaDescription(guide.metaDescription || "");
    setModalVisible(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingGuide) {
      const autoSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      setSlug(autoSlug);
      if (!metaTitle) {
        setMetaTitle(`${val} | Intrihub Guide`.slice(0, 60));
      }
    }
  };

  const handleSave = async (statusOverride?: "DRAFT" | "PUBLISHED" | "SCHEDULED") => {
    if (!title.trim()) {
      Alert.alert("Validation", "Please enter a post title");
      return;
    }
    if (!slug.trim()) {
      Alert.alert("Validation", "Please enter a URL slug");
      return;
    }
    if (!featuredImage.trim()) {
      Alert.alert("Validation", "Please enter a featured image URL");
      return;
    }
    if (!featuredImageAlt.trim()) {
      Alert.alert("Validation", "Please enter alt text for the featured image (required for SEO)");
      return;
    }
    if (!content.trim()) {
      Alert.alert("Validation", "Please enter content body");
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        category,
        status: statusOverride || status,
        authorName: authorName.trim(),
        readTime: readTime.trim(),
        featuredImage: featuredImage.trim(),
        featuredImageAlt: featuredImageAlt.trim(),
        keywords: keywords ? keywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
        excerpt: excerpt.trim(),
        content: content.trim(),
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
      };

      if (editingGuide) {
        const res = await updateAdminGuide(editingGuide.id, payload);
        if (res.success) {
          Alert.alert("Success", "Guide updated successfully!");
          setModalVisible(false);
          loadData();
        } else {
          Alert.alert("Error", res.error || "Failed to update guide");
        }
      } else {
        const res = await createAdminGuide(payload);
        if (res.success) {
          Alert.alert("Success", "Guide published successfully!");
          setModalVisible(false);
          loadData();
        } else {
          Alert.alert("Error", res.error || "Failed to create guide");
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save guide");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (guide: any) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete "${guide.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await deleteAdminGuide(guide.id);
              if (res.success) {
                Alert.alert("Deleted", "Guide removed successfully");
                loadData();
              } else {
                Alert.alert("Error", res.error || "Failed to delete");
              }
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete");
            }
          },
        },
      ]
    );
  };

  // Quick formatting insert helpers
  const insertFormatting = (prefix: string, suffix: string = "") => {
    setContent((prev) => `${prev}\n${prefix}${suffix}`);
  };

  const filteredGuides = guides.filter((g) => {
    const matchesSearch =
      g.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = activeTab === "ALL" || g.status === activeTab;
    return matchesSearch && matchesStatus;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color={COLORS.slate[800]} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Guides & Blog</Text>
          <Text style={styles.headerSubtitle}>Publish content to /guides</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.slate[400]} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search guides, slugs, categories..."
          placeholderTextColor={COLORS.slate[400]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <X size={16} color={COLORS.slate[400]} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabButton, activeTab === t.key && styles.tabButtonActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === t.key && styles.tabButtonTextActive,
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.emerald[600]} />
          <Text style={styles.loadingText}>Loading guides...</Text>
        </View>
      ) : filteredGuides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BookOpen size={48} color={COLORS.slate[300]} />
          <Text style={styles.emptyTitle}>No Guides Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? "Try adjusting your search criteria"
              : "Create your first guide post to publish on /guides"}
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>New Guide Post</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredGuides}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.emerald[600]]}
            />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                {item.featuredImage ? (
                  <Image source={{ uri: item.featuredImage }} style={styles.cardThumb} />
                ) : (
                  <View style={styles.cardThumbPlaceholder}>
                    <BookOpen size={20} color={COLORS.slate[400]} />
                  </View>
                )}

                <View style={styles.cardInfo}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{item.category || "General"}</Text>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardSlug} numberOfLines={1}>
                    /guides/{item.slug}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.statusBadgeRow}>
                  <View
                    style={[
                      styles.statusPill,
                      item.status === "PUBLISHED"
                        ? styles.statusPublished
                        : item.status === "DRAFT"
                        ? styles.statusDraft
                        : styles.statusScheduled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        item.status === "PUBLISHED"
                          ? styles.statusTextPublished
                          : item.status === "DRAFT"
                          ? styles.statusTextDraft
                          : styles.statusTextScheduled,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>
                    {item.publishedAt
                      ? new Date(item.publishedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })
                      : ""}
                  </Text>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => openEditModal(item)}
                  >
                    <Edit2 size={16} color={COLORS.slate[600]} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionIconBtn, styles.actionDeleteBtn]}
                    onPress={() => handleDelete(item)}
                  >
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Editor Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <X size={22} color={COLORS.slate[700]} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>
              {editingGuide ? "Edit Guide Post" : "New Guide Post"}
            </Text>
            <TouchableOpacity
              onPress={() => setPreviewVisible(!previewVisible)}
              style={styles.previewToggleBtn}
            >
              <Eye size={16} color={COLORS.emerald[700]} />
              <Text style={styles.previewToggleText}>
                {previewVisible ? "Editor" : "Preview"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
            {previewVisible ? (
              /* Preview Mode */
              <View style={styles.previewBox}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{category}</Text>
                </View>
                <Text style={styles.previewTitle}>{title || "Untitled Post"}</Text>
                <Text style={styles.previewAuthor}>
                  By {authorName} • {readTime}
                </Text>
                {featuredImage ? (
                  <Image source={{ uri: featuredImage }} style={styles.previewFeaturedImg} />
                ) : null}
                {excerpt ? <Text style={styles.previewExcerpt}>{excerpt}</Text> : null}
                <Text style={styles.previewBody}>{content.replace(/<[^>]+>/g, " ")}</Text>
              </View>
            ) : (
              /* Editor Mode */
              <View style={styles.formContainer}>
                {/* Title */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Post Title *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., 2026 Buying Guide for Kitchen Tiles"
                    placeholderTextColor={COLORS.slate[400]}
                    value={title}
                    onChangeText={handleTitleChange}
                  />
                </View>

                {/* Slug */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>URL Slug *</Text>
                  <View style={styles.slugInputRow}>
                    <Text style={styles.slugPrefix}>/guides/</Text>
                    <TextInput
                      style={[styles.textInput, styles.slugInput]}
                      placeholder="kitchen-tiles-buying-guide"
                      placeholderTextColor={COLORS.slate[400]}
                      value={slug}
                      onChangeText={(val) =>
                        setSlug(
                          val
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "-")
                        )
                      }
                    />
                  </View>
                </View>

                {/* Category & Status */}
                <View style={styles.fieldRow}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                      {CATEGORIES.map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[
                            styles.categoryPill,
                            category === c && styles.categoryPillActive,
                          ]}
                          onPress={() => setCategory(c)}
                        >
                          <Text
                            style={[
                              styles.categoryPillText,
                              category === c && styles.categoryPillTextActive,
                            ]}
                          >
                            {c}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Status Toggle */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Status</Text>
                  <View style={styles.statusSelectRow}>
                    {(["PUBLISHED", "DRAFT", "SCHEDULED"] as const).map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.statusSelectBtn,
                          status === st && styles.statusSelectBtnActive,
                        ]}
                        onPress={() => setStatus(st)}
                      >
                        <Text
                          style={[
                            styles.statusSelectText,
                            status === st && styles.statusSelectTextActive,
                          ]}
                        >
                          {st}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Featured Image */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Featured Image URL *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="https://... or /api/uploads/..."
                    placeholderTextColor={COLORS.slate[400]}
                    value={featuredImage}
                    onChangeText={setFeaturedImage}
                  />
                  {featuredImage ? (
                    <Image source={{ uri: featuredImage }} style={styles.imagePreviewThumb} />
                  ) : null}
                </View>

                {/* Featured Image Alt Text */}
                <View style={styles.fieldGroup}>
                  <View style={styles.contentHeaderRow}>
                    <Text style={styles.fieldLabel}>Featured Image Alt Text *</Text>
                    <Text style={[styles.fieldHelper, { color: COLORS.emerald[700] }]}>Required for SEO</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Descriptive explanation for search engines..."
                    placeholderTextColor={COLORS.slate[400]}
                    value={featuredImageAlt}
                    onChangeText={setFeaturedImageAlt}
                  />
                </View>

                {/* Excerpt */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Excerpt / Short Summary</Text>
                  <TextInput
                    style={[styles.textInput, styles.textAreaSm]}
                    placeholder="Quick summary for card feeds..."
                    placeholderTextColor={COLORS.slate[400]}
                    multiline
                    numberOfLines={2}
                    value={excerpt}
                    onChangeText={setExcerpt}
                  />
                </View>

                {/* Keywords & Tags */}
                <View style={styles.fieldGroup}>
                  <View style={styles.contentHeaderRow}>
                    <Text style={styles.fieldLabel}>Keywords & Tags</Text>
                    <Text style={styles.fieldHelper}>Comma-separated</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. eco-friendly, green materials, 2026"
                    placeholderTextColor={COLORS.slate[400]}
                    value={keywords}
                    onChangeText={setKeywords}
                  />
                </View>

                {/* Content Body with Quick Tag Helpers */}
                <View style={styles.fieldGroup}>
                  <View style={styles.contentHeaderRow}>
                    <Text style={styles.fieldLabel}>Content Body *</Text>
                    <Text style={styles.fieldHelper}>HTML / Rich Text</Text>
                  </View>

                  {/* Format Quick Bars */}
                  <View style={styles.formatToolbar}>
                    <TouchableOpacity
                      style={styles.formatBtn}
                      onPress={() => insertFormatting("<h2>", "</h2>")}
                    >
                      <Text style={styles.formatBtnText}>H2</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.formatBtn}
                      onPress={() => insertFormatting("<h3>", "</h3>")}
                    >
                      <Text style={styles.formatBtnText}>H3</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.formatBtn}
                      onPress={() => insertFormatting("<strong>", "</strong>")}
                    >
                      <Text style={styles.formatBtnText}>Bold</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.formatBtn}
                      onPress={() => insertFormatting("<em>", "</em>")}
                    >
                      <Text style={styles.formatBtnText}>Italic</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.formatBtn}
                      onPress={() =>
                        insertFormatting(
                          '<a href="/shop/tiles">',
                          "Explore Tile Collection</a>"
                        )
                      }
                    >
                      <Text style={styles.formatBtnText}>+ Link</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.formatBtn}
                      onPress={() =>
                        insertFormatting(
                          '<img src="https://..." alt="Product Alt Text" />'
                        )
                      }
                    >
                      <Text style={styles.formatBtnText}>+ Image</Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={[styles.textInput, styles.textAreaLg]}
                    placeholder="Write your article body (HTML headings, paragraphs, lists)..."
                    placeholderTextColor={COLORS.slate[400]}
                    multiline
                    numberOfLines={10}
                    value={content}
                    onChangeText={setContent}
                  />
                </View>

                {/* SEO Meta Section */}
                <View style={styles.seoCard}>
                  <View style={styles.seoHeader}>
                    <Globe size={16} color={COLORS.emerald[600]} />
                    <Text style={styles.seoTitle}>SEO & Meta Tags</Text>
                  </View>

                  <View style={styles.fieldGroup}>
                    <View style={styles.labelCountRow}>
                      <Text style={styles.fieldLabel}>Meta Title</Text>
                      <Text
                        style={[
                          styles.charCount,
                          metaTitle.length > 60 && styles.charCountWarning,
                        ]}
                      >
                        {metaTitle.length}/60 chars
                      </Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Title tag displayed on Google"
                      placeholderTextColor={COLORS.slate[400]}
                      value={metaTitle}
                      onChangeText={setMetaTitle}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <View style={styles.labelCountRow}>
                      <Text style={styles.fieldLabel}>Meta Description</Text>
                      <Text
                        style={[
                          styles.charCount,
                          metaDescription.length > 160 && styles.charCountWarning,
                        ]}
                      >
                        {metaDescription.length}/160 chars
                      </Text>
                    </View>
                    <TextInput
                      style={[styles.textInput, styles.textAreaSm]}
                      placeholder="Google search summary snippet..."
                      placeholderTextColor={COLORS.slate[400]}
                      multiline
                      numberOfLines={2}
                      value={metaDescription}
                      onChangeText={setMetaDescription}
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Modal Footer Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.draftBtn}
              onPress={() => handleSave("DRAFT")}
              disabled={actionLoading}
            >
              <Text style={styles.draftBtnText}>Save Draft</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.publishBtn}
              onPress={() => handleSave("PUBLISHED")}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.publishBtnText}>
                  {editingGuide ? "Update & Publish" : "Publish Post"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[200],
  },
  backButton: {
    padding: 6,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.slate[900],
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.slate[500],
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.emerald[600],
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    height: 42,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.slate[900],
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.slate[200],
  },
  tabButtonActive: {
    backgroundColor: COLORS.slate[900],
    borderColor: COLORS.slate[900],
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.slate[600],
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    marginBottom: SPACING.xs,
  },
  cardRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  cardThumb: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.slate[100],
  },
  cardThumbPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.slate[100],
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.emerald[50],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginBottom: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.emerald[700],
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.slate[900],
    lineHeight: 18,
  },
  cardSlug: {
    fontSize: 11,
    fontFamily: "monospace",
    color: COLORS.slate[400],
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate[100],
  },
  statusBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusPublished: {
    backgroundColor: "#DCFCE7",
  },
  statusDraft: {
    backgroundColor: "#FEF3C7",
  },
  statusScheduled: {
    backgroundColor: "#E0F2FE",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusTextPublished: {
    color: "#166534",
  },
  statusTextDraft: {
    color: "#92400E",
  },
  statusTextScheduled: {
    color: "#075985",
  },
  dateText: {
    fontSize: 11,
    color: COLORS.slate[400],
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionIconBtn: {
    padding: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.slate[50],
  },
  actionDeleteBtn: {
    backgroundColor: "#FEE2E2",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.slate[500],
    marginTop: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.slate[800],
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.slate[500],
    textAlign: "center",
    marginTop: 4,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.emerald[600],
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.md,
  },
  emptyButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[200],
  },
  closeBtn: {
    padding: 4,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.slate[900],
  },
  previewToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.emerald[50],
  },
  previewToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.emerald[700],
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: SPACING.md,
  },
  formContainer: {
    gap: SPACING.md,
  },
  fieldGroup: {
    gap: 4,
  },
  fieldRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.slate[700],
    textTransform: "uppercase",
  },
  fieldHelper: {
    fontSize: 11,
    color: COLORS.slate[400],
  },
  contentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textInput: {
    backgroundColor: COLORS.slate[50],
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.slate[900],
  },
  textAreaSm: {
    height: 60,
    textAlignVertical: "top",
  },
  textAreaLg: {
    height: 180,
    textAlignVertical: "top",
    fontFamily: "monospace",
    fontSize: 12,
  },
  slugInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  slugPrefix: {
    fontSize: 12,
    color: COLORS.slate[500],
    fontFamily: "monospace",
    backgroundColor: COLORS.slate[100],
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopLeftRadius: RADIUS.lg,
    borderBottomLeftRadius: RADIUS.lg,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: COLORS.slate[200],
  },
  slugInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    fontFamily: "monospace",
    fontSize: 12,
  },
  pillScroll: {
    flexDirection: "row",
    marginTop: 4,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.slate[100],
    marginRight: 6,
  },
  categoryPillActive: {
    backgroundColor: COLORS.emerald[600],
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.slate[700],
  },
  categoryPillTextActive: {
    color: "#FFFFFF",
  },
  statusSelectRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    alignItems: "center",
  },
  statusSelectBtnActive: {
    backgroundColor: COLORS.slate[900],
    borderColor: COLORS.slate[900],
  },
  statusSelectText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.slate[600],
  },
  statusSelectTextActive: {
    color: "#FFFFFF",
  },
  imagePreviewThumb: {
    width: "100%",
    height: 120,
    borderRadius: RADIUS.lg,
    marginTop: 6,
    backgroundColor: COLORS.slate[100],
  },
  formatToolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: 6,
    backgroundColor: COLORS.slate[100],
    borderRadius: RADIUS.md,
  },
  formatBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
  },
  formatBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.slate[700],
  },
  seoCard: {
    backgroundColor: COLORS.slate[50],
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    gap: SPACING.sm,
  },
  seoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  seoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.slate[900],
  },
  labelCountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  charCount: {
    fontSize: 11,
    color: COLORS.slate[400],
  },
  charCountWarning: {
    color: "#D97706",
    fontWeight: "700",
  },
  previewBox: {
    gap: SPACING.sm,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.slate[900],
  },
  previewAuthor: {
    fontSize: 12,
    color: COLORS.slate[500],
  },
  previewFeaturedImg: {
    width: "100%",
    height: 180,
    borderRadius: RADIUS.lg,
  },
  previewExcerpt: {
    fontSize: 14,
    fontStyle: "italic",
    color: COLORS.slate[600],
    borderLeftWidth: 3,
    borderLeftColor: COLORS.emerald[600],
    paddingLeft: 8,
  },
  previewBody: {
    fontSize: 14,
    color: COLORS.slate[800],
    lineHeight: 22,
  },
  modalFooter: {
    flexDirection: "row",
    padding: SPACING.md,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate[200],
    backgroundColor: "#FFFFFF",
  },
  draftBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    alignItems: "center",
    justifyContent: "center",
  },
  draftBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slate[700],
  },
  publishBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.emerald[600],
    alignItems: "center",
    justifyContent: "center",
  },
  publishBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
