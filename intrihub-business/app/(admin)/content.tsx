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
  Image,
  Alert,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Layout,
  Megaphone,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Upload,
  CheckCircle2,
} from "lucide-react-native";
import {
  fetchAdminBanners,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
  fetchAdminHero,
  updateAdminHero,
  fetchAdminAnnouncements,
  updateAdminAnnouncements,
} from "../../src/api/admin";
import { uploadBusinessImage } from "../../src/api/auth";
import { OfferBanner, AdminHeroContent, AnnouncementConfig } from "../../src/types";
import { COLORS, SPACING, RADIUS } from "../../src/constants/theme";

const CONTENT_SECTIONS = [
  { key: "banners", label: "Promo Banners" },
  { key: "hero", label: "Homepage Hero" },
  { key: "announcements", label: "Announcement Bar" },
];

export default function AdminContentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeSection, setActiveSection] = useState<"banners" | "hero" | "announcements">("banners");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Banners State
  const [banners, setBanners] = useState<OfferBanner[]>([]);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<OfferBanner | null>(null);
  const [bTitle, setBTitle] = useState("");
  const [bSubtitle, setBSubtitle] = useState("");
  const [bBadge, setBBadge] = useState("Special Offer");
  const [bCta, setBCta] = useState("Shop Now");
  const [bHref, setBHref] = useState("/shop");
  const [bImage, setBImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Hero State
  const [hero, setHero] = useState<AdminHeroContent>({
    headline: "",
    subheadline: "",
    badge: "",
    ctaText: "",
    ctaHref: "",
    bgImage: "",
  });

  // Announcement State
  const [announcements, setAnnouncements] = useState<AnnouncementConfig>({
    enabled: true,
    text: "",
    linkText: "",
    linkHref: "",
  });

  const loadData = useCallback(async () => {
    try {
      if (activeSection === "banners") {
        const res = await fetchAdminBanners();
        if (res.success && res.banners) {
          setBanners(res.banners);
        }
      } else if (activeSection === "hero") {
        const res = await fetchAdminHero();
        if (res.success && res.hero) {
          setHero(res.hero);
        }
      } else if (activeSection === "announcements") {
        const res = await fetchAdminAnnouncements();
        if (res.success && res.announcements) {
          setAnnouncements(res.announcements);
        }
      }
    } catch (err) {
      console.error("Error fetching content:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeSection]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // --- Banner Actions ---
  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBTitle("");
    setBSubtitle("");
    setBBadge("Special Offer");
    setBCta("Shop Now");
    setBHref("/shop");
    setBImage("");
    setBannerModalOpen(true);
  };

  const handleOpenEditBanner = (item: OfferBanner) => {
    setEditingBanner(item);
    setBTitle(item.title);
    setBSubtitle(item.subtitle || "");
    setBBadge(item.badge || "Special Offer");
    setBCta(item.cta || "Shop Now");
    setBHref(item.href || "/shop");
    setBImage(item.image);
    setBannerModalOpen(true);
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Gallery permission is required to upload banners.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setUploadingImage(true);
        const res = await uploadBusinessImage(result.assets[0].uri);
        setUploadingImage(false);

        if (res.success && res.url) {
          setBImage(res.url);
        } else {
          Alert.alert("Upload Error", res.error || "Failed to upload image.");
        }
      }
    } catch (e: any) {
      setUploadingImage(false);
      Alert.alert("Error", e?.message || "Failed to pick image.");
    }
  };

  const handleSaveBanner = async () => {
    if (!bTitle.trim()) {
      Alert.alert("Validation Error", "Please enter a banner title.");
      return;
    }
    if (!bImage.trim()) {
      Alert.alert("Validation Error", "Please upload a banner image.");
      return;
    }

    setActionLoading(true);
    try {
      if (editingBanner) {
        const res = await updateAdminBanner(editingBanner.id, {
          title: bTitle.trim(),
          subtitle: bSubtitle.trim(),
          badge: bBadge.trim(),
          cta: bCta.trim(),
          href: bHref.trim(),
          image: bImage.trim(),
        });

        if (res.success) {
          setBannerModalOpen(false);
          Alert.alert("Banner Updated", "Changes published to web & mobile!");
          loadData();
        } else {
          Alert.alert("Update Failed", res.error || "Could not update banner.");
        }
      } else {
        const res = await createAdminBanner({
          title: bTitle.trim(),
          subtitle: bSubtitle.trim(),
          badge: bBadge.trim(),
          cta: bCta.trim(),
          href: bHref.trim(),
          image: bImage.trim(),
        });

        if (res.success) {
          setBannerModalOpen(false);
          Alert.alert("Banner Created", "New banner is now live on homepage!");
          loadData();
        } else {
          Alert.alert("Creation Failed", res.error || "Could not create banner.");
        }
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBannerActive = async (banner: OfferBanner) => {
    try {
      const nextState = !banner.isActive;
      const res = await updateAdminBanner(banner.id, { isActive: nextState });
      if (res.success) {
        loadData();
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  const handleReorderBanner = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const currentBanner = banners[index];
    const targetBanner = banners[targetIndex];

    try {
      await updateAdminBanner(currentBanner.id, { order: targetIndex });
      await updateAdminBanner(targetBanner.id, { order: index });
      loadData();
    } catch (e) {
      console.error("Reorder failed:", e);
    }
  };

  const handleDeleteBanner = (banner: OfferBanner) => {
    Alert.alert("Delete Banner", `Delete "${banner.title}" from the homepage?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await deleteAdminBanner(banner.id);
            if (res.success) {
              loadData();
            } else {
              Alert.alert("Error", res.error || "Failed to delete banner.");
            }
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Something went wrong.");
          }
        },
      },
    ]);
  };

  // --- Hero Actions ---
  const handleSaveHero = async () => {
    setActionLoading(true);
    try {
      const res = await updateAdminHero(hero);
      if (res.success) {
        Alert.alert("Hero Updated", "Desktop homepage hero content has been updated!");
      } else {
        Alert.alert("Error", res.error || "Failed to update hero.");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  // --- Announcements Actions ---
  const handleSaveAnnouncements = async () => {
    setActionLoading(true);
    try {
      const res = await updateAdminAnnouncements(announcements);
      if (res.success) {
        Alert.alert("Announcements Updated", "Top bar announcement ticker updated!");
      } else {
        Alert.alert("Error", res.error || "Failed to update announcements.");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const renderBannerItem = ({ item, index }: { item: OfferBanner; index: number }) => {
    return (
      <View style={styles.bannerCard}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.bannerThumbnail} resizeMode="cover" />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <ImageIcon size={32} color={COLORS.textTertiary} />
          </View>
        )}

        <View style={styles.bannerBody}>
          <View style={styles.bannerMetaRow}>
            {item.badge ? (
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>{item.badge}</Text>
              </View>
            ) : null}
            <Text style={styles.orderLabel}>Priority #{index + 1}</Text>
          </View>

          <Text style={styles.bannerTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.subtitle ? (
            <Text style={styles.bannerSub} numberOfLines={1}>
              {item.subtitle}
            </Text>
          ) : null}

          <View style={styles.ctaRow}>
            <Text style={styles.ctaText}>
              CTA: <Text style={{ fontWeight: "700" }}>{item.cta || "Shop Now"}</Text> → {item.href}
            </Text>
          </View>

          {/* Action Row */}
          <View style={styles.bannerCardActions}>
            <View style={styles.reorderGroup}>
              <TouchableOpacity
                style={[styles.reorderBtn, index === 0 && { opacity: 0.3 }]}
                disabled={index === 0}
                onPress={() => handleReorderBanner(index, "up")}
              >
                <ArrowUp size={14} color="#052A51" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reorderBtn, index === banners.length - 1 && { opacity: 0.3 }]}
                disabled={index === banners.length - 1}
                onPress={() => handleReorderBanner(index, "down")}
              >
                <ArrowDown size={14} color="#052A51" />
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Active</Text>
              <Switch
                value={item.isActive}
                onValueChange={() => handleToggleBannerActive(item)}
                trackColor={{ false: "#CBD5E1", true: "#10B981" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.btnGroup}>
              <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEditBanner(item)}>
                <Edit2 size={13} color={COLORS.accentBlue} />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.delBtn} onPress={() => handleDeleteBanner(item)}>
                <Trash2 size={13} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Homepage CMS</Text>
          <Text style={styles.headerSub}>Banners, Hero messaging & Announcements</Text>
        </View>
        {activeSection === "banners" && (
          <TouchableOpacity style={styles.addHeaderBtn} onPress={handleOpenAddBanner}>
            <Plus size={18} color="#052A51" />
            <Text style={styles.addHeaderBtnText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Section Tabs */}
      <View style={styles.tabsRow}>
        {CONTENT_SECTIONS.map((sec) => {
          const active = activeSection === sec.key;
          return (
            <TouchableOpacity
              key={sec.key}
              style={[styles.sectionTab, active && styles.sectionTabActive]}
              onPress={() => setActiveSection(sec.key as any)}
            >
              <Text style={[styles.sectionTabText, active && styles.sectionTabTextActive]}>
                {sec.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Body Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.accentBlue} />
        </View>
      ) : activeSection === "banners" ? (
        <FlatList
          data={banners}
          keyExtractor={(item) => item.id}
          renderItem={renderBannerItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accentBlue]} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ImageIcon size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No Promo Banners</Text>
              <Text style={styles.emptySubtitle}>Tap "+ Add" to create the first promotional slider.</Text>
            </View>
          }
        />
      ) : activeSection === "hero" ? (
        <ScrollView contentContainerStyle={styles.formScroll}>
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>Desktop Hero Headline</Text>
            <Text style={styles.inputLabel}>Badge Tag:</Text>
            <TextInput
              style={styles.inputBox}
              value={hero.badge}
              onChangeText={(t) => setHero({ ...hero, badge: t })}
              placeholder="e.g. Direct Factory Pricing"
              placeholderTextColor={COLORS.textTertiary}
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Headline Title:</Text>
            <TextInput
              style={[styles.inputBox, { height: 60 }]}
              multiline
              value={hero.headline}
              onChangeText={(t) => setHero({ ...hero, headline: t })}
              placeholder="Main title on homepage"
              placeholderTextColor={COLORS.textTertiary}
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Subtitle Description:</Text>
            <TextInput
              style={[styles.inputBox, { height: 80 }]}
              multiline
              value={hero.subheadline}
              onChangeText={(t) => setHero({ ...hero, subheadline: t })}
              placeholder="Supporting description..."
              placeholderTextColor={COLORS.textTertiary}
            />

            <View style={styles.grid2}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>CTA Button Label:</Text>
                <TextInput
                  style={styles.inputBox}
                  value={hero.ctaText}
                  onChangeText={(t) => setHero({ ...hero, ctaText: t })}
                  placeholder="e.g. Explore Tile Catalog"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>CTA Target URL:</Text>
                <TextInput
                  style={styles.inputBox}
                  value={hero.ctaHref}
                  onChangeText={(t) => setHero({ ...hero, ctaHref: t })}
                  placeholder="e.g. /shop"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveSectionBtn}
              onPress={handleSaveHero}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <ShieldCheck size={18} color="#FFFFFF" />
                  <Text style={styles.saveSectionBtnText}>Save Hero Content</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.formScroll}>
          <View style={styles.formCard}>
            <View style={styles.announcementToggleRow}>
              <View>
                <Text style={styles.formHeading}>Top Announcement Ticker</Text>
                <Text style={styles.formSub}>Appears on the top of the storefront</Text>
              </View>
              <Switch
                value={announcements.enabled}
                onValueChange={(v) => setAnnouncements({ ...announcements, enabled: v })}
                trackColor={{ false: "#CBD5E1", true: "#10B981" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Ticker Message:</Text>
            <TextInput
              style={[styles.inputBox, { height: 70 }]}
              multiline
              value={announcements.text}
              onChangeText={(t) => setAnnouncements({ ...announcements, text: t })}
              placeholder="e.g. 🚚 Free Doorstep Pallet Freight on Orders Above ₹15,000"
              placeholderTextColor={COLORS.textTertiary}
            />

            <View style={styles.grid2}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Action Link Label:</Text>
                <TextInput
                  style={styles.inputBox}
                  value={announcements.linkText || ""}
                  onChangeText={(t) => setAnnouncements({ ...announcements, linkText: t })}
                  placeholder="e.g. Shop Deals"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Link Route:</Text>
                <TextInput
                  style={styles.inputBox}
                  value={announcements.linkHref || ""}
                  onChangeText={(t) => setAnnouncements({ ...announcements, linkHref: t })}
                  placeholder="e.g. /shop"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveSectionBtn}
              onPress={handleSaveAnnouncements}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <ShieldCheck size={18} color="#FFFFFF" />
                  <Text style={styles.saveSectionBtnText}>Save Announcement Bar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Add / Edit Banner Modal */}
      <Modal
        visible={bannerModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBannerModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{editingBanner ? "Edit Promo Banner" : "New Promo Banner"}</Text>
              <Text style={styles.modalSub}>Displayed in top carousel of website & mobile app</Text>
            </View>
            <TouchableOpacity onPress={() => setBannerModalOpen(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Image Picker & URL */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionHeading}>Banner Creative / Image (Upload or URL)</Text>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <TextInput
                  style={[styles.inputBox, { flex: 1 }]}
                  value={bImage}
                  onChangeText={setBImage}
                  placeholder="Paste Image URL or Upload below..."
                  placeholderTextColor={COLORS.textTertiary}
                />
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#EFF6FF",
                    borderWidth: 1,
                    borderColor: "#BFDBFE",
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    height: 44,
                    gap: 4,
                  }}
                  onPress={handlePickImage}
                  disabled={uploadingImage}
                >
                  <Upload size={14} color="#052A51" />
                  <Text style={{ fontSize: 11, fontWeight: "800", color: "#052A51" }}>Upload</Text>
                </TouchableOpacity>
              </View>

              {bImage ? (
                <View style={styles.previewImageContainer}>
                  <Image source={{ uri: bImage }} style={styles.previewImage} resizeMode="cover" />
                  <View style={{ flexDirection: "row", gap: 8, position: "absolute", bottom: 10, right: 10 }}>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#16A34A",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        gap: 4,
                      }}
                      onPress={() => Alert.alert("Confirmed 🎉", "Banner image confirmed & ready!")}
                    >
                      <CheckCircle2 size={13} color="#FFFFFF" />
                      <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}>Done</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.changeImgBtn} onPress={handlePickImage}>
                      <Upload size={14} color="#FFFFFF" />
                      <Text style={styles.changeImgBtnText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadPlaceholder}
                  onPress={handlePickImage}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color={COLORS.accentBlue} />
                  ) : (
                    <>
                      <Upload size={28} color={COLORS.accentBlue} />
                      <Text style={styles.uploadPlaceholderText}>Upload Banner Image (16:9)</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Banner Copy */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionHeading}>Banner Content & Links</Text>

              <Text style={styles.inputLabel}>Badge Label:</Text>
              <TextInput
                style={styles.inputBox}
                value={bBadge}
                onChangeText={setBBadge}
                placeholder="e.g. Limited Deal, 15% OFF"
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Headline Title:</Text>
              <TextInput
                style={styles.inputBox}
                value={bTitle}
                onChangeText={setBTitle}
                placeholder="e.g. Flat 15% Off Bathroom Tiles"
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Subtitle / Description:</Text>
              <TextInput
                style={styles.inputBox}
                value={bSubtitle}
                onChangeText={setBSubtitle}
                placeholder="e.g. Waterproof & anti-slip glazed ceramic looks"
                placeholderTextColor={COLORS.textTertiary}
              />

              <View style={[styles.grid2, { marginTop: 10 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>CTA Text:</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={bCta}
                    onChangeText={setBCta}
                    placeholder="e.g. Shop Now"
                    placeholderTextColor={COLORS.textTertiary}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Target URL / Route:</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={bHref}
                    onChangeText={setBHref}
                    placeholder="e.g. /shop/bathroom-tiles"
                    placeholderTextColor={COLORS.textTertiary}
                  />
                </View>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveSectionBtn}
              onPress={handleSaveBanner}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <ShieldCheck size={18} color="#FFFFFF" />
                  <Text style={styles.saveSectionBtnText}>
                    {editingBanner ? "Update Banner" : "Publish Banner Live"}
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
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#052A51",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  headerSub: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  addHeaderBtn: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  addHeaderBtnText: {
    color: "#052A51",
    fontSize: 13,
    fontWeight: "800",
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 12,
  },
  sectionTab: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  sectionTabActive: {
    borderBottomColor: "#052A51",
  },
  sectionTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  sectionTabTextActive: {
    color: "#052A51",
    fontWeight: "800",
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bannerThumbnail: {
    width: "100%",
    height: 140,
    backgroundColor: "#F1F5F9",
  },
  bannerPlaceholder: {
    width: "100%",
    height: 140,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerBody: {
    padding: 14,
  },
  bannerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  badgePill: {
    backgroundColor: "rgba(242, 101, 34, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.accentOrange,
    textTransform: "uppercase",
  },
  orderLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: "700",
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#052A51",
  },
  bannerSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ctaRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },
  ctaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bannerCardActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  reorderGroup: {
    flexDirection: "row",
    gap: 4,
  },
  reorderBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  btnGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    gap: 4,
  },
  editBtnText: {
    color: COLORS.accentBlue,
    fontSize: 12,
    fontWeight: "700",
  },
  delBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
  },
  formScroll: {
    padding: 16,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  formHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#052A51",
  },
  formSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  announcementToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 4,
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
  grid2: {
    flexDirection: "row",
    gap: 10,
  },
  saveSectionBtn: {
    backgroundColor: "#052A51",
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
  },
  saveSectionBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: 4,
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
    fontSize: 18,
    fontWeight: "800",
    color: "#052A51",
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.accentBlue,
  },
  modalContent: {
    padding: 16,
    gap: 14,
  },
  modalSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  previewImageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#F1F5F9",
  },
  changeImgBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  changeImgBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  uploadPlaceholder: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadPlaceholderText: {
    fontSize: 13,
    color: COLORS.accentBlue,
    fontWeight: "700",
  },
});
