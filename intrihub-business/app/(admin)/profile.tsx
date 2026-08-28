import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Image as RNImage,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  User,
  Shield,
  Phone,
  Mail,
  Building2,
  Clock,
  FileText,
  Tag,
  Sliders,
  Bell,
  LogOut,
  ChevronRight,
  Sparkles,
  Edit2,
  CheckCircle2,
  X,
  Layers,
  Percent,
  Image as ImageIcon,
  MessageSquare,
  HelpCircle,
  Lock,
  Boxes,
  Plus,
  Trash2,
  RotateCcw,
  Eye,
  AlertTriangle,
  Calendar,
  UserCheck,
  Globe,
  Smartphone,
  Type,
  Camera,
  ToggleLeft,
  ToggleRight,
  CreditCard,
  Banknote,
  Check,
} from "lucide-react-native";
import { useAuthStore } from "../../src/store/authStore";
import { updateProfile as apiUpdateProfile, uploadBusinessImage } from "../../src/api/auth";
import {
  fetchAdminStoreSettings,
  updateAdminStoreSettings,
  fetchAdminCategories,
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminCoupons,
  createAdminCoupon,
  deleteAdminCoupon,
  fetchAdminContentBanners,
  createAdminContentBanner,
  deleteAdminContentBanner,
  fetchAdminReviews,
  approveAdminReview,
  rejectAdminReview,
  deleteAdminReview,
  fetchAdminTrash,
  restoreAdminTrashItem,
  deleteAdminTrashItemPermanently,
  fetchAdminSettlements,
  updateAdminSettlementConfig,
  executeAdminVendorPayout,
} from "../../src/api/admin";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function AdminAccountMasterHubScreen() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const queryClient = useQueryClient();

  // Queries
  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => fetchAdminStoreSettings(),
  });

  const { data: categoriesData, refetch: refetchCats } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => fetchAdminCategories(),
  });

  const { data: couponsData, refetch: refetchCoupons } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => fetchAdminCoupons(),
  });

  const { data: bannersData, refetch: refetchBanners } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: () => fetchAdminContentBanners(),
  });

  const { data: reviewsData, refetch: refetchReviews } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: () => fetchAdminReviews(),
  });

  const {
    data: trashData,
    refetch: refetchTrash,
    isLoading: trashLoading,
  } = useQuery({
    queryKey: ["admin-trash"],
    queryFn: () => fetchAdminTrash(),
  });

  const {
    data: settlementsData,
    refetch: refetchSettlements,
    isLoading: settlementsLoading,
  } = useQuery({
    queryKey: ["admin-settlements"],
    queryFn: () => fetchAdminSettlements(),
  });

  // Modal Visibility States
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [storeInfoModalOpen, setStoreInfoModalOpen] = useState(false);
  const [policiesModalOpen, setPoliciesModalOpen] = useState(false);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [cmsModalOpen, setCmsModalOpen] = useState(false);
  const [cmsSubTab, setCmsSubTab] = useState<"banners" | "coupons" | "logos" | "headings">("banners");
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [trashSubTab, setTrashSubTab] = useState<"products" | "orders">("products");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTrashItem, setSelectedTrashItem] = useState<any | null>(null);
  const [settlementsModalOpen, setSettlementsModalOpen] = useState(false);

  // Settlement Editing State
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [editingCommRate, setEditingCommRate] = useState("");
  const [settlingVendorId, setSettlingVendorId] = useState<string | null>(null);

  // Profile Form
  const [name, setName] = useState(user?.name || "Super Admin");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");

  // Store & Support Form
  const [storeName, setStoreName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [supportTimings, setSupportTimings] = useState("");
  const [storeAddress, setStoreAddress] = useState("");

  // Policies Form
  const [policyHelp, setPolicyHelp] = useState("");
  const [policyPrivacy, setPolicyPrivacy] = useState("");
  const [policyTerms, setPolicyTerms] = useState("");
  const [policyReturns, setPolicyReturns] = useState("");

  // CMS: Branding, Logos & Section Headings Form
  const [websiteLogo, setWebsiteLogo] = useState("");
  const [appIcon, setAppIcon] = useState("");
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroTagline, setHeroTagline] = useState("");
  const [trendingHeading, setTrendingHeading] = useState("");
  const [trendingCaption, setTrendingCaption] = useState("");
  const [bestsellersHeading, setBestsellersHeading] = useState("");
  const [bestsellersCaption, setBestsellersCaption] = useState("");
  const [newArrivalsHeading, setNewArrivalsHeading] = useState("");
  const [newArrivalsCaption, setNewArrivalsCaption] = useState("");
  const [dealsBarText, setDealsBarText] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // New Category Form
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatImage, setNewCatImage] = useState("");
  const [newCatHasCalc, setNewCatHasCalc] = useState(false);

  // New Coupon Form
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponType, setNewCouponType] = useState<"flat" | "percentage">("flat");
  const [newCouponValue, setNewCouponValue] = useState("500");
  const [newCouponMinOrder, setNewCouponMinOrder] = useState("2000");

  // New Banner Form
  const [newBannerTitle, setNewBannerTitle] = useState("");
  const [newBannerSubtitle, setNewBannerSubtitle] = useState("");
  const [newBannerImage, setNewBannerImage] = useState("");
  const [newBannerCta, setNewBannerCta] = useState("/shop");

  // Saving states
  const [savingSettings, setSavingSettings] = useState(false);

  // Sync settings once loaded
  React.useEffect(() => {
    if (settingsData?.settings) {
      const s = settingsData.settings;
      setStoreName(s.storeName || "Intrihub Building Materials");
      setGstNumber(s.gstNumber || "");
      setSupportPhone(s.supportPhone || "");
      setSupportEmail(s.supportEmail || "");
      setWhatsappNumber(s.whatsappNumber || "");
      setSupportTimings(s.supportTimings || "Mon - Sat: 9:00 AM - 8:00 PM");
      setStoreAddress(s.storeAddress || "Plot 42, Sector 18, Gurugram, Haryana");

      setPolicyHelp(s.policyHelp || "");
      setPolicyPrivacy(s.policyPrivacy || "");
      setPolicyTerms(s.policyTerms || "");
      setPolicyReturns(s.policyReturns || "");

      setWebsiteLogo(s.websiteLogo || "");
      setAppIcon(s.appIcon || "");
      setHeroHeadline(s.heroHeadline || "Direct-From-Factory Building Materials");
      setHeroTagline(s.heroTagline || "Tiles, Granites, Sanitaryware & Paints Delivered to Your Site");
      setTrendingHeading(s.trendingHeading || "Trending Now");
      setTrendingCaption(s.trendingCaption || "Architect-approved curated designs for modern spaces");
      setBestsellersHeading(s.bestsellersHeading || "Bestseller Collections");
      setBestsellersCaption(s.bestsellersCaption || "Top-rated vitrified tiles & finishes trusted by 10,000+ builders");
      setNewArrivalsHeading(s.newArrivalsHeading || "New In Stock");
      setNewArrivalsCaption(s.newArrivalsCaption || "Latest luxury surfaces and hardware fresh from factory");
      setDealsBarText(s.dealsBarText || "Special Launch Offer: Extra 10% off with coupon code FESTIVE10");
    }
  }, [settingsData]);

  const categories = categoriesData?.categories || [];
  const coupons = couponsData?.coupons || [];
  const banners = bannersData?.banners || [];
  const reviews = reviewsData?.reviews || [];
  const deletedProducts = trashData?.products || [];
  const deletedOrders = trashData?.orders || [];
  const trashTotalCount = (trashData?.counts?.total) ?? (deletedProducts.length + deletedOrders.length);
  const settlementVendors = settlementsData?.vendors || [];
  const totalPendingSettlement = settlementVendors.reduce((sum: number, v: any) => sum + (v.netPayableToVendor || 0), 0);

  // Handle Profile Update
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Name cannot be empty.");
      return;
    }
    setIsUpdatingProfile(true);
    try {
      const res = await apiUpdateProfile({ name: name.trim(), avatar: avatarUrl.trim() });
      setIsUpdatingProfile(false);
      if (res.success && res.user) {
        setUser(res.user);
        setProfileModalOpen(false);
        Alert.alert("Success", "Admin identity updated successfully!");
      } else {
        Alert.alert("Error", res.error || "Failed to update profile");
      }
    } catch (e: any) {
      setIsUpdatingProfile(false);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  // Handle Settings Save
  const handleSaveStoreSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await updateAdminStoreSettings({
        storeName,
        gstNumber,
        supportPhone,
        supportEmail,
        whatsappNumber,
        supportTimings,
        storeAddress,
      });
      setSavingSettings(false);
      if (res.success) {
        setStoreInfoModalOpen(false);
        Alert.alert("Settings Saved 🎉", "Store details & helpline contact updated!");
        refetchSettings();
      } else {
        Alert.alert("Error", res.error || "Failed to save settings");
      }
    } catch (e: any) {
      setSavingSettings(false);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  const handleSavePolicies = async () => {
    setSavingSettings(true);
    try {
      const res = await updateAdminStoreSettings({
        policyHelp,
        policyPrivacy,
        policyTerms,
        policyReturns,
      });
      setSavingSettings(false);
      if (res.success) {
        setPoliciesModalOpen(false);
        Alert.alert("Legal Updated 🎉", "Customer policies updated across app!");
        refetchSettings();
      } else {
        Alert.alert("Error", res.error || "Failed to save policies");
      }
    } catch (e: any) {
      setSavingSettings(false);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  // Handle CMS Headings & Logos Save
  const handleSaveCmsSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await updateAdminStoreSettings({
        websiteLogo,
        appIcon,
        heroHeadline,
        heroTagline,
        trendingHeading,
        trendingCaption,
        bestsellersHeading,
        bestsellersCaption,
        newArrivalsHeading,
        newArrivalsCaption,
        dealsBarText,
      });
      setSavingSettings(false);
      if (res.success) {
        Alert.alert("CMS Published 🎉", "Brand logos, headings, taglines & captions updated across Website & Mobile App!");
        refetchSettings();
      } else {
        Alert.alert("Error", res.error || "Failed to save CMS settings");
      }
    } catch (e: any) {
      setSavingSettings(false);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  // Image Upload Helper for Logos/App Icon/Banners
  const handlePickAndUploadImage = async (onUploaded: (url: string) => void) => {
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
          asset.fileName || `cms-${Date.now()}.jpg`,
          asset.mimeType || "image/jpeg"
        );
        setUploadingImage(false);

        if (res.success && res.url) {
          onUploaded(res.url);
          Alert.alert("Uploaded 🎉", "Image uploaded successfully!");
        } else {
          Alert.alert("Upload Error", res.error || "Could not upload image");
        }
      }
    } catch (e: any) {
      setUploadingImage(false);
      Alert.alert("Error", e?.message || "Something went wrong during upload");
    }
  };

  // Handle Category Creation
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      Alert.alert("Validation Error", "Category name is required.");
      return;
    }
    const slug = newCatSlug.trim() || newCatName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    try {
      const res = await createAdminCategory({
        name: newCatName.trim(),
        slug,
        description: newCatDesc.trim(),
        image: newCatImage.trim() || undefined,
        calculatorType: newCatHasCalc ? "tile" : "none",
      });
      if (res.success) {
        setNewCatName("");
        setNewCatSlug("");
        setNewCatDesc("");
        setNewCatImage("");
        refetchCats();
        Alert.alert("Category Created 🎉", `Category "${newCatName}" is now active!`);
      } else {
        Alert.alert("Error", res.error || "Failed to create category");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  const handleDeleteCategory = (id: any, catName?: any) => {
    const safeId = String(id || "");
    const safeName = String(catName || "Category");
    if (!safeId) return;
    Alert.alert("Delete Category", `Permanently delete category "${safeName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAdminCategory(safeId);
            refetchCats();
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to delete");
          }
        },
      },
    ]);
  };

  // Handle Coupon Creation
  const handleCreateCoupon = async () => {
    if (!newCouponCode.trim()) {
      Alert.alert("Validation Error", "Coupon code is required.");
      return;
    }
    try {
      const res = await createAdminCoupon({
        code: newCouponCode.trim().toUpperCase(),
        discountType: newCouponType,
        value: parseFloat(newCouponValue) || 100,
        minOrderValue: parseFloat(newCouponMinOrder) || 1000,
      });
      if (res.success) {
        setNewCouponCode("");
        refetchCoupons();
        Alert.alert("Coupon Created 🎉", `Coupon "${newCouponCode.toUpperCase()}" active!`);
      } else {
        Alert.alert("Error", res.error || "Failed to create coupon");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  const handleDeleteCoupon = (id: any, code?: any) => {
    const safeId = String(id || "");
    const safeCode = String(code || "Coupon");
    if (!safeId) return;
    Alert.alert("Delete Coupon", `Delete coupon "${safeCode}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAdminCoupon(safeId);
            refetchCoupons();
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to delete");
          }
        },
      },
    ]);
  };

  // Handle Banner Creation
  const handleCreateBanner = async () => {
    if (!newBannerTitle.trim() || !newBannerImage.trim()) {
      Alert.alert("Validation Error", "Banner title and image URL are required.");
      return;
    }
    try {
      const res = await createAdminContentBanner({
        title: newBannerTitle.trim(),
        subtitle: newBannerSubtitle.trim() || undefined,
        image: newBannerImage.trim(),
        href: newBannerCta.trim() || "/shop",
      });
      if (res.success) {
        setNewBannerTitle("");
        setNewBannerSubtitle("");
        setNewBannerImage("");
        refetchBanners();
        Alert.alert("Banner Created 🎉", "Promotional carousel banner published!");
      } else {
        Alert.alert("Error", res.error || "Failed to create banner");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  const handleDeleteBanner = (id: any) => {
    const safeId = String(id || "");
    if (!safeId) return;
    Alert.alert("Delete Banner", "Remove this banner from homepage?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAdminContentBanner(safeId);
            refetchBanners();
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to delete");
          }
        },
      },
    ]);
  };

  // Handle Trash Restorations
  const handleRestore = async (type: "product" | "order", id: string, title: string) => {
    try {
      const res = await restoreAdminTrashItem(type, id);
      if (res.success) {
        Alert.alert("Restored 🎉", `Successfully restored "${title}" back to active state!`);
        refetchTrash();
        queryClient.invalidateQueries({ queryKey: ["admin-products"] });
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      } else {
        Alert.alert("Error", res.error || "Failed to restore item");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to restore item");
    }
  };

  const handleDeleteForever = (type: "product" | "order", id: string, title: string) => {
    Alert.alert(
      "Permanent Purge",
      `Are you sure you want to permanently delete "${title}" from the database?\n\nThis cannot be restored.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await deleteAdminTrashItemPermanently(type, id);
              if (res.success) {
                Alert.alert("Purged", "Item permanently removed.");
                refetchTrash();
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

  const handleOpenDetailModal = (item: any, type: "product" | "order") => {
    setSelectedTrashItem({ ...item, itemType: type });
    setDetailModalOpen(true);
  };

  // Handle Settlement Config Update
  const handleUpdateSettlementRules = async (vendorId: string, updates: { commissionRate?: number; settlementDays?: number; autopay?: boolean }) => {
    try {
      const res = await updateAdminSettlementConfig({ vendorId, ...updates });
      if (res.success) {
        refetchSettlements();
        setEditingVendorId(null);
      } else {
        Alert.alert("Error", res.error || "Failed to update settlement rules");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update settlement rules");
    }
  };

  // Handle 1-Tap Pay Vendor Today (Commission Deducted)
  const handlePayVendorToday = (v: any) => {
    if (v.netPayableToVendor <= 0) {
      Alert.alert("Notice", `No pending balance to settle for ${v.businessName}.`);
      return;
    }

    Alert.alert(
      "Pay Vendor Today (Commission Deducted)",
      `Execute payout settlement for ${v.businessName}?\n\n• Gross Amount: ₹${v.pendingGross.toLocaleString("en-IN")}\n• Platform Commission (${v.commissionRate}%): -₹${v.platformCommissionCut.toLocaleString("en-IN")}\n━━━━━━━━━━━━━━━━━━━\n• Net Payout to Vendor: ₹${v.netPayableToVendor.toLocaleString("en-IN")}\n\nBank: ${v.bankName || "UPI"} (${v.bankUpiId || v.bankAccountNumber || "Direct Transfer"})`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm & Pay Today",
          onPress: async () => {
            setSettlingVendorId(v.id);
            try {
              const res = await executeAdminVendorPayout({ vendorId: v.id });
              setSettlingVendorId(null);
              if (res.success) {
                Alert.alert("Payout Settled 🎉", res.message || "Vendor marked as paid!");
                refetchSettlements();
              } else {
                Alert.alert("Error", res.error || "Failed to execute payout");
              }
            } catch (e: any) {
              setSettlingVendorId(null);
              Alert.alert("Error", e?.message || "Failed to execute payout");
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Profile Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <Image
            source={
              user?.avatar
                ? { uri: user.avatar }
                : require("../../assets/intri-icon.png")
            }
            style={styles.avatar}
          />
          <View style={styles.heroInfo}>
            <View style={styles.badgeRow}>
              <View style={styles.adminBadge}>
                <Shield size={12} color="#FFFFFF" />
                <Text style={styles.adminBadgeText}>SUPER ADMIN</Text>
              </View>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>AUTHENTICATED</Text>
              </View>
            </View>
            <Text style={styles.userName}>{user?.name || "Super Admin"}</Text>
            <Text style={styles.userPhone}>+91 {user?.phone || "9876543210"}</Text>
            {user?.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
          </View>
        </View>

        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => setProfileModalOpen(true)}
          activeOpacity={0.8}
        >
          <Edit2 size={14} color="#052A51" />
          <Text style={styles.editProfileBtnText}>Edit Identity & Avatar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>PLATFORM ADMINISTRATION</Text>

      {/* 1. Store Details & Support Contact */}
      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => setStoreInfoModalOpen(true)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconBox, { backgroundColor: "#EFF6FF" }]}>
          <Building2 size={20} color="#2563EB" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.menuTitle}>Store Details & Support Helpline</Text>
          <Text style={styles.menuSub}>Company GSTIN, support phone, WhatsApp, warehouse address</Text>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </TouchableOpacity>

      {/* 2. Customer Policies & Legal */}
      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => setPoliciesModalOpen(true)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconBox, { backgroundColor: "#F5F3FF" }]}>
          <FileText size={20} color="#7C3AED" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.menuTitle}>Customer Policies & Legal Texts</Text>
          <Text style={styles.menuSub}>Help Center, Privacy Policy, Terms, 7-Day Returns Guarantee</Text>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </TouchableOpacity>

      {/* 3. Product Categories Master */}
      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => setCategoriesModalOpen(true)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconBox, { backgroundColor: "#ECFDF5" }]}>
          <Layers size={20} color="#059669" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.menuTitle}>Product Categories Master ({categories.length})</Text>
          <Text style={styles.menuSub}>Add/delete categories, tiles/paint calculation engines</Text>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </TouchableOpacity>

      {/* 4. VENDOR PAYMENT SETTLEMENT & COMMISSION ENGINE */}
      <TouchableOpacity
        style={[styles.menuCard, { borderColor: "#BBF7D0", backgroundColor: "#F0FDF4" }]}
        onPress={() => setSettlementsModalOpen(true)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconBox, { backgroundColor: "#DCFCE7" }]}>
          <Banknote size={20} color="#16A34A" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[styles.menuTitle, { color: "#166534" }]}>Vendor Settlements & Commission Engine</Text>
            {totalPendingSettlement > 0 && (
              <View style={[styles.trashCountPill, { backgroundColor: "#16A34A" }]}>
                <Text style={styles.trashCountPillText}>₹{(totalPendingSettlement / 1000).toFixed(0)}k</Text>
              </View>
            )}
          </View>
          <Text style={[styles.menuSub, { color: "#15803D" }]}>
            Set commission % rates, payout days (1, 3, 7d), autopay toggle & 1-tap Pay Today
          </Text>
        </View>
        <ChevronRight size={18} color="#16A34A" />
      </TouchableOpacity>

      {/* 5. UNIFIED HOMEPAGE CMS, COUPONS & BRANDING CONTROL CENTER */}
      <TouchableOpacity
        style={[styles.menuCard, { borderColor: "#BFDBFE", backgroundColor: "#F8FAFC" }]}
        onPress={() => setCmsModalOpen(true)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconBox, { backgroundColor: "#DBEAFE" }]}>
          <Sparkles size={20} color="#1D4ED8" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[styles.menuTitle, { color: "#1E3A8A" }]}>Homepage CMS & Storefront Control</Text>
            <View style={[styles.trashCountPill, { backgroundColor: "#2563EB" }]}>
              <Text style={styles.trashCountPillText}>HUB</Text>
            </View>
          </View>
          <Text style={styles.menuSub}>
            Coupons, Hero Carousel Slides, Website & App Logos, Headings, Captions & Taglines
          </Text>
        </View>
        <ChevronRight size={18} color="#2563EB" />
      </TouchableOpacity>

      {/* 6. Reviews Moderation */}
      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => setReviewsModalOpen(true)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconBox, { backgroundColor: "#FEF9C3" }]}>
          <MessageSquare size={20} color="#CA8A04" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.menuTitle}>Customer Reviews Moderation ({reviews.length})</Text>
          <Text style={styles.menuSub}>Moderate star ratings, feedback, publish or reject</Text>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </TouchableOpacity>

      {/* 7. Recycle Bin & Trash (Mistouch Protection) */}
      <TouchableOpacity
        style={[styles.menuCard, { borderColor: "#FECACA", backgroundColor: "#FFF5F5" }]}
        onPress={() => setTrashModalOpen(true)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconBox, { backgroundColor: "#FEE2E2" }]}>
          <Trash2 size={20} color="#DC2626" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[styles.menuTitle, { color: "#991B1B" }]}>Recycle Bin & Trash</Text>
            {trashTotalCount > 0 && (
              <View style={styles.trashCountPill}>
                <Text style={styles.trashCountPillText}>{trashTotalCount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.menuSub, { color: "#B91C1C" }]}>
            Mistouch protection: deleted products & orders kept for 3 days with audit logs
          </Text>
        </View>
        <ChevronRight size={18} color="#DC2626" />
      </TouchableOpacity>

      {/* Logout Action */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
        <LogOut size={18} color="#DC2626" />
        <Text style={styles.logoutBtnText}>Secure Session Sign Out</Text>
      </TouchableOpacity>

      {/* 1. Edit Profile Modal */}
      <Modal visible={profileModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Admin Identity & Profile</Text>
            <TouchableOpacity onPress={() => setProfileModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Admin Full Name</Text>
              <TextInput style={styles.inputBox} value={name} onChangeText={setName} />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Primary Mobile Number</Text>
              <TextInput
                style={styles.inputBox}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Profile Picture / Avatar URL</Text>
              <TextInput
                style={styles.inputBox}
                value={avatarUrl}
                onChangeText={setAvatarUrl}
                placeholder="https://..."
              />

              <View style={styles.lockedRow}>
                <Lock size={14} color="#64748B" />
                <Text style={styles.lockedText}>Role: SUPER_ADMIN (Platform Master Control)</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveActionBtn}
              onPress={handleSaveProfile}
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveActionBtnText}>Save Profile Identity</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* 2. Store Info Modal */}
      <Modal visible={storeInfoModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Store Details & Support Helpline</Text>
            <TouchableOpacity onPress={() => setStoreInfoModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Brand / Legal Business Name</Text>
              <TextInput style={styles.inputBox} value={storeName} onChangeText={setStoreName} />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>GST Identification Number (GSTIN)</Text>
              <TextInput
                style={styles.inputBox}
                value={gstNumber}
                onChangeText={setGstNumber}
                placeholder="06AAAAA0000A1Z5"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Customer Care Phone (In-App Call)</Text>
              <TextInput
                style={styles.inputBox}
                value={supportPhone}
                onChangeText={setSupportPhone}
                keyboardType="phone-pad"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>WhatsApp Helpline Number</Text>
              <TextInput
                style={styles.inputBox}
                value={whatsappNumber}
                onChangeText={setWhatsappNumber}
                keyboardType="phone-pad"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Support Email</Text>
              <TextInput
                style={styles.inputBox}
                value={supportEmail}
                onChangeText={setSupportEmail}
                keyboardType="email-address"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Working Hours</Text>
              <TextInput
                style={styles.inputBox}
                value={supportTimings}
                onChangeText={setSupportTimings}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Fulfillment Warehouse Address</Text>
              <TextInput
                style={[styles.inputBox, { height: 60, paddingTop: 8 }]}
                value={storeAddress}
                onChangeText={setStoreAddress}
                multiline
              />
            </View>

            <TouchableOpacity
              style={styles.saveActionBtn}
              onPress={handleSaveStoreSettings}
              disabled={savingSettings}
            >
              {savingSettings ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveActionBtnText}>Save Store Configuration</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* 3. Policies Modal */}
      <Modal visible={policiesModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Customer Policies & Legal Texts</Text>
            <TouchableOpacity onPress={() => setPoliciesModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Help Center & FAQ Guidelines</Text>
              <TextInput
                style={[styles.inputBox, { height: 80, paddingTop: 8 }]}
                value={policyHelp}
                onChangeText={setPolicyHelp}
                multiline
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>7-Day Returns & Refund Policy</Text>
              <TextInput
                style={[styles.inputBox, { height: 80, paddingTop: 8 }]}
                value={policyReturns}
                onChangeText={setPolicyReturns}
                multiline
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Terms of Service</Text>
              <TextInput
                style={[styles.inputBox, { height: 80, paddingTop: 8 }]}
                value={policyTerms}
                onChangeText={setPolicyTerms}
                multiline
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Privacy Policy</Text>
              <TextInput
                style={[styles.inputBox, { height: 80, paddingTop: 8 }]}
                value={policyPrivacy}
                onChangeText={setPolicyPrivacy}
                multiline
              />
            </View>

            <TouchableOpacity
              style={styles.saveActionBtn}
              onPress={handleSavePolicies}
              disabled={savingSettings}
            >
              {savingSettings ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveActionBtnText}>Publish Updated Policies</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* 4. Categories Modal */}
      <Modal visible={categoriesModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Product Categories Master</Text>
            <TouchableOpacity onPress={() => setCategoriesModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Add New Category</Text>
              <TextInput
                style={styles.inputBox}
                value={newCatName}
                onChangeText={setNewCatName}
                placeholder="Category Name (e.g. Sanitaryware)"
              />
              <TextInput
                style={[styles.inputBox, { marginTop: 8 }]}
                value={newCatSlug}
                onChangeText={setNewCatSlug}
                placeholder="URL Slug (auto-generated if blank)"
              />
              <TextInput
                style={[styles.inputBox, { marginTop: 8 }]}
                value={newCatDesc}
                onChangeText={setNewCatDesc}
                placeholder="Short Description"
              />

              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setNewCatHasCalc(!newCatHasCalc)}
              >
                <View style={[styles.checkbox, newCatHasCalc && styles.checkboxActive]}>
                  {newCatHasCalc && <CheckCircle2 size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkLabel}>Enable Tile Area/Box Calculator Engine</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveActionBtn, { marginTop: 12 }]}
                onPress={handleCreateCategory}
              >
                <Text style={styles.saveActionBtnText}>+ Add Category</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>
              Existing Categories ({categories.length})
            </Text>
            {categories.map((c: any) => (
              <View key={String(c.id)} style={styles.listCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{c.name}</Text>
                  <Text style={styles.itemSub}>
                    {c.slug} • {c.productsCount || 0} products
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteCategory(c.id, c.name)}>
                  <Trash2 size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* 5. VENDOR PAYMENT SETTLEMENT & COMMISSION ENGINE MODAL */}
      <Modal visible={settlementsModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Vendor Settlement Engine</Text>
              <Text style={styles.modalSubtitle}>Commission Rates, Settlement Cycles & Instant Payouts</Text>
            </View>
            <TouchableOpacity onPress={() => setSettlementsModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Top Stat Card */}
            <View style={styles.settlementSummaryCard}>
              <Text style={styles.settlementSummaryLabel}>Total Pending Vendor Payables</Text>
              <Text style={styles.settlementSummaryAmount}>
                ₹{totalPendingSettlement.toLocaleString("en-IN")}
              </Text>
              <Text style={styles.settlementSummarySub}>
                Commission is automatically deducted before calculating payable amounts.
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 12, marginBottom: 8 }]}>
              Vendor Settlement Accounts ({settlementVendors.length})
            </Text>

            {settlementsLoading ? (
              <View style={styles.emptyCenter}>
                <ActivityIndicator size="large" color={COLORS.accentBlue} />
              </View>
            ) : settlementVendors.length === 0 ? (
              <View style={styles.emptyCenter}>
                <Text style={{ color: "#64748B" }}>No registered vendors found.</Text>
              </View>
            ) : (
              settlementVendors.map((v: any) => {
                const isEditing = editingVendorId === v.id;
                return (
                  <View key={v.id} style={styles.settlementVendorCard}>
                    {/* Header */}
                    <View style={styles.settlementCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.settlementVendorName}>{v.businessName}</Text>
                        <Text style={styles.settlementVendorPhone}>
                          {v.category} • +91 {v.contactPhone}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.editCommBtn}
                        onPress={() => {
                          if (isEditing) {
                            setEditingVendorId(null);
                          } else {
                            setEditingVendorId(v.id);
                            setEditingCommRate(String(v.commissionRate || "10"));
                          }
                        }}
                      >
                        <Edit2 size={12} color="#052A51" />
                        <Text style={styles.editCommBtnText}>{isEditing ? "Done" : "Edit Rules"}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Rule Editor Box (when expanded) */}
                    {isEditing && (
                      <View style={styles.ruleEditorBox}>
                        <Text style={styles.ruleLabel}>Platform Commission Rate (%):</Text>
                        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                          <TextInput
                            style={[styles.inputBox, { flex: 1, height: 38 }]}
                            value={editingCommRate}
                            onChangeText={setEditingCommRate}
                            keyboardType="decimal-pad"
                            placeholder="10"
                          />
                          <TouchableOpacity
                            style={[styles.saveActionBtn, { marginTop: 0, paddingHorizontal: 16, height: 38 }]}
                            onPress={() => handleUpdateSettlementRules(v.id, { commissionRate: parseFloat(editingCommRate) || 10 })}
                          >
                            <Text style={styles.saveActionBtnText}>Save %</Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={[styles.ruleLabel, { marginTop: 10 }]}>Settlement Cycle:</Text>
                        <View style={{ flexDirection: "row", gap: 6 }}>
                          {[
                            { days: 1, label: "1 Day (Daily)" },
                            { days: 3, label: "3 Days" },
                            { days: 7, label: "7 Days" },
                            { days: 15, label: "15 Days" },
                          ].map((cy) => (
                            <TouchableOpacity
                              key={cy.days}
                              style={[
                                styles.cycleChip,
                                v.settlementDays === cy.days && styles.cycleChipActive,
                              ]}
                              onPress={() => handleUpdateSettlementRules(v.id, { settlementDays: cy.days })}
                            >
                              <Text
                                style={[
                                  styles.cycleChipText,
                                  v.settlementDays === cy.days && styles.cycleChipTextActive,
                                ]}
                              >
                                {cy.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                          <Text style={styles.ruleLabel}>Autopay Mode:</Text>
                          <TouchableOpacity
                            style={[styles.autopayBtn, v.autopay && styles.autopayBtnActive]}
                            onPress={() => handleUpdateSettlementRules(v.id, { autopay: !v.autopay })}
                          >
                            <Text style={[styles.autopayText, v.autopay && styles.autopayTextActive]}>
                              {v.autopay ? "AUTOPAY: ON" : "MANUAL PAYOUT"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* Financial Breakdown Grid */}
                    <View style={styles.settleGrid}>
                      <View style={styles.settleGridCol}>
                        <Text style={styles.settleGridLabel}>Unsettled Gross</Text>
                        <Text style={styles.settleGridVal}>₹{v.pendingGross.toLocaleString("en-IN")}</Text>
                      </View>

                      <View style={[styles.settleGridCol, { backgroundColor: "#FEF2F2" }]}>
                        <Text style={[styles.settleGridLabel, { color: "#DC2626" }]}>
                          Our Cut ({v.commissionRate}%)
                        </Text>
                        <Text style={[styles.settleGridVal, { color: "#DC2626" }]}>
                          -₹{v.platformCommissionCut.toLocaleString("en-IN")}
                        </Text>
                      </View>

                      <View style={[styles.settleGridCol, { backgroundColor: "#F0FDF4" }]}>
                        <Text style={[styles.settleGridLabel, { color: "#166534" }]}>Net Payable</Text>
                        <Text style={[styles.settleGridVal, { color: "#16A34A", fontWeight: "900" }]}>
                          ₹{v.netPayableToVendor.toLocaleString("en-IN")}
                        </Text>
                      </View>
                    </View>

                    {/* Bank Details & Pay Now Action */}
                    <View style={styles.settleCardFooter}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bankDetailText}>
                          Payout A/C: {v.bankName || "UPI"} {v.bankUpiId ? `(${v.bankUpiId})` : v.bankAccountNumber ? `(ending ${v.bankAccountNumber.slice(-4)})` : "(Not Configured)"}
                        </Text>
                        <Text style={styles.cycleDetailText}>Cycle: Every {v.settlementDays} days • {v.autopay ? "Autopay" : "Manual"}</Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.payNowBtn,
                          v.netPayableToVendor === 0 && { backgroundColor: "#E2E8F0" },
                        ]}
                        onPress={() => handlePayVendorToday(v)}
                        disabled={v.netPayableToVendor === 0 || settlingVendorId === v.id}
                      >
                        {settlingVendorId === v.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Banknote size={13} color={v.netPayableToVendor === 0 ? "#94A3B8" : "#FFFFFF"} />
                            <Text
                              style={[
                                styles.payNowBtnText,
                                v.netPayableToVendor === 0 && { color: "#94A3B8" },
                              ]}
                            >
                              Pay Today
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* 6. UNIFIED HOMEPAGE CMS, COUPONS & BRANDING CONTROL CENTER MODAL */}
      <Modal visible={cmsModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Homepage CMS & Branding Hub</Text>
              <Text style={styles.modalSubtitle}>Carousel Slides, Coupons, Logos & Storefront Headings</Text>
            </View>
            <TouchableOpacity onPress={() => setCmsModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* 4 Sub-Tabs: Banners | Coupons | Logos | Headings */}
          <View style={styles.trashSubTabBar}>
            <TouchableOpacity
              style={[styles.trashTabBtn, cmsSubTab === "banners" && styles.trashTabBtnActive]}
              onPress={() => setCmsSubTab("banners")}
            >
              <ImageIcon size={14} color={cmsSubTab === "banners" ? "#052A51" : "#64748B"} />
              <Text style={[styles.trashTabBtnText, cmsSubTab === "banners" && styles.trashTabBtnTextActive]}>
                Banners ({banners.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.trashTabBtn, cmsSubTab === "coupons" && styles.trashTabBtnActive]}
              onPress={() => setCmsSubTab("coupons")}
            >
              <Tag size={14} color={cmsSubTab === "coupons" ? "#052A51" : "#64748B"} />
              <Text style={[styles.trashTabBtnText, cmsSubTab === "coupons" && styles.trashTabBtnTextActive]}>
                Coupons ({coupons.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.trashTabBtn, cmsSubTab === "logos" && styles.trashTabBtnActive]}
              onPress={() => setCmsSubTab("logos")}
            >
              <Smartphone size={14} color={cmsSubTab === "logos" ? "#052A51" : "#64748B"} />
              <Text style={[styles.trashTabBtnText, cmsSubTab === "logos" && styles.trashTabBtnTextActive]}>
                Logos & App Icon
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.trashTabBtn, cmsSubTab === "headings" && styles.trashTabBtnActive]}
              onPress={() => setCmsSubTab("headings")}
            >
              <Type size={14} color={cmsSubTab === "headings" ? "#052A51" : "#64748B"} />
              <Text style={[styles.trashTabBtnText, cmsSubTab === "headings" && styles.trashTabBtnTextActive]}>
                Headings & Captions
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            {cmsSubTab === "banners" ? (
              <>
                <View style={styles.modalCard}>
                  <Text style={styles.inputLabel}>Add Promotional Slide Image</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={newBannerTitle}
                    onChangeText={setNewBannerTitle}
                    placeholder="Headline (e.g. Flat 30% Off on Vitrified Tiles)"
                  />
                  <TextInput
                    style={[styles.inputBox, { marginTop: 8 }]}
                    value={newBannerSubtitle}
                    onChangeText={setNewBannerSubtitle}
                    placeholder="Sub-headline (e.g. Free site delivery this week)"
                  />
                  
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    <TextInput
                      style={[styles.inputBox, { flex: 1 }]}
                      value={newBannerImage}
                      onChangeText={setNewBannerImage}
                      placeholder="Slide Image URL"
                    />
                    <TouchableOpacity
                      style={styles.uploadMiniBtn}
                      onPress={() => handlePickAndUploadImage((url) => setNewBannerImage(url))}
                    >
                      <Camera size={14} color="#052A51" />
                      <Text style={styles.uploadMiniBtnText}>Upload</Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={[styles.inputBox, { marginTop: 8 }]}
                    value={newBannerCta}
                    onChangeText={setNewBannerCta}
                    placeholder="CTA Link (e.g. /category/tiles-stone)"
                  />

                  <TouchableOpacity
                    style={[styles.saveActionBtn, { marginTop: 12 }]}
                    onPress={handleCreateBanner}
                  >
                    <Text style={styles.saveActionBtnText}>+ Publish Banner Slide</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Live Carousel Banners ({banners.length})</Text>
                {banners.map((b: any) => (
                  <View key={String(b.id)} style={styles.listCard}>
                    {b.image ? (
                      <Image source={{ uri: b.image }} style={styles.bannerThumb} contentFit="cover" />
                    ) : null}
                    <View style={{ flex: 1, marginLeft: b.image ? 10 : 0 }}>
                      <Text style={styles.itemTitle}>{b.title}</Text>
                      <Text style={styles.itemSub}>{b.subtitle || b.href}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteBanner(b.id)}>
                      <Trash2 size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            ) : cmsSubTab === "coupons" ? (
              <>
                <View style={styles.modalCard}>
                  <Text style={styles.inputLabel}>Create New Promo Coupon</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={newCouponCode}
                    onChangeText={setNewCouponCode}
                    placeholder="COUPON CODE (e.g. FESTIVE15)"
                    autoCapitalize="characters"
                  />

                  <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    <TouchableOpacity
                      style={[
                        styles.tabPill,
                        newCouponType === "flat" && styles.tabPillActive,
                        { flex: 1 },
                      ]}
                      onPress={() => setNewCouponType("flat")}
                    >
                      <Text
                        style={[
                          styles.tabPillText,
                          newCouponType === "flat" && styles.tabPillTextActive,
                        ]}
                      >
                        Flat ₹ Off
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.tabPill,
                        newCouponType === "percentage" && styles.tabPillActive,
                        { flex: 1 },
                      ]}
                      onPress={() => setNewCouponType("percentage")}
                    >
                      <Text
                        style={[
                          styles.tabPillText,
                          newCouponType === "percentage" && styles.tabPillTextActive,
                        ]}
                      >
                        Percentage % Off
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    <TextInput
                      style={[styles.inputBox, { flex: 1 }]}
                      value={newCouponValue}
                      onChangeText={setNewCouponValue}
                      placeholder={newCouponType === "flat" ? "Discount Amount (₹)" : "Discount (%)"}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.inputBox, { flex: 1 }]}
                      value={newCouponMinOrder}
                      onChangeText={setNewCouponMinOrder}
                      placeholder="Min Order Value (₹)"
                      keyboardType="numeric"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.saveActionBtn, { marginTop: 12 }]}
                    onPress={handleCreateCoupon}
                  >
                    <Text style={styles.saveActionBtnText}>+ Create Coupon</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Active Coupons ({coupons.length})</Text>
                {coupons.map((cp: any) => (
                  <View key={String(cp.id)} style={styles.listCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{cp.code}</Text>
                      <Text style={styles.itemSub}>
                        {cp.discountType === "flat" ? `₹${cp.value} Flat Off` : `${cp.value}% Off`} • Min Order ₹{cp.minOrderValue}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteCoupon(cp.id, cp.code)}>
                      <Trash2 size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            ) : cmsSubTab === "logos" ? (
              <>
                <View style={styles.modalCard}>
                  <Text style={styles.sectionHeaderInner}>WEBSITE LOGO & BRANDING</Text>
                  <Text style={styles.inputLabel}>Website Header & Footer Logo URL</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TextInput
                      style={[styles.inputBox, { flex: 1 }]}
                      value={websiteLogo}
                      onChangeText={setWebsiteLogo}
                      placeholder="https://intrihub.com/logo.png"
                    />
                    <TouchableOpacity
                      style={styles.uploadMiniBtn}
                      onPress={() => handlePickAndUploadImage((url) => setWebsiteLogo(url))}
                    >
                      <Camera size={14} color="#052A51" />
                      <Text style={styles.uploadMiniBtnText}>Upload</Text>
                    </TouchableOpacity>
                  </View>
                  {websiteLogo ? (
                    <View style={styles.logoPreviewBox}>
                      <Image source={{ uri: websiteLogo }} style={styles.logoPreviewImg} contentFit="contain" />
                    </View>
                  ) : null}

                  <Text style={[styles.sectionHeaderInner, { marginTop: 18 }]}>MOBILE APP ICON & BADGE</Text>
                  <Text style={styles.inputLabel}>App Download Icon & Header Badge URL (512x512)</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TextInput
                      style={[styles.inputBox, { flex: 1 }]}
                      value={appIcon}
                      onChangeText={setAppIcon}
                      placeholder="https://intrihub.com/app-icon.png"
                    />
                    <TouchableOpacity
                      style={styles.uploadMiniBtn}
                      onPress={() => handlePickAndUploadImage((url) => setAppIcon(url))}
                    >
                      <Camera size={14} color="#052A51" />
                      <Text style={styles.uploadMiniBtnText}>Upload</Text>
                    </TouchableOpacity>
                  </View>
                  {appIcon ? (
                    <View style={styles.appIconPreviewBox}>
                      <Image source={{ uri: appIcon }} style={styles.appIconPreviewImg} contentFit="cover" />
                    </View>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={styles.saveActionBtn}
                  onPress={handleSaveCmsSettings}
                  disabled={savingSettings}
                >
                  {savingSettings ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveActionBtnText}>Save Brand Logos & App Icon</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.modalCard}>
                  <Text style={styles.sectionHeaderInner}>HERO & ANNOUNCEMENT BAR</Text>
                  <Text style={styles.inputLabel}>Main Homepage Hero Headline</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={heroHeadline}
                    onChangeText={setHeroHeadline}
                    placeholder="Direct-From-Factory Building Materials"
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Main Hero Tagline / Subtitle</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={heroTagline}
                    onChangeText={setHeroTagline}
                    placeholder="Tiles, Granites, Sanitaryware Delivered to Your Site"
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Top Announcement / Deals Bar</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={dealsBarText}
                    onChangeText={setDealsBarText}
                    placeholder="Special Launch Offer: Extra 10% off with coupon code FESTIVE10"
                  />

                  <Text style={[styles.sectionHeaderInner, { marginTop: 18 }]}>TRENDING SECTION</Text>
                  <Text style={styles.inputLabel}>Trending Products Heading</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={trendingHeading}
                    onChangeText={setTrendingHeading}
                    placeholder="Trending Now"
                  />
                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Trending Products Caption</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={trendingCaption}
                    onChangeText={setTrendingCaption}
                    placeholder="Architect-approved curated designs for modern spaces"
                  />

                  <Text style={[styles.sectionHeaderInner, { marginTop: 18 }]}>BESTSELLERS SECTION</Text>
                  <Text style={styles.inputLabel}>Bestsellers Heading</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={bestsellersHeading}
                    onChangeText={setBestsellersHeading}
                    placeholder="Bestseller Collections"
                  />
                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Bestsellers Caption</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={bestsellersCaption}
                    onChangeText={setBestsellersCaption}
                    placeholder="Top-rated vitrified tiles & finishes trusted by 10,000+ builders"
                  />

                  <Text style={[styles.sectionHeaderInner, { marginTop: 18 }]}>NEW ARRIVALS SECTION</Text>
                  <Text style={styles.inputLabel}>New Arrivals Heading</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={newArrivalsHeading}
                    onChangeText={setNewArrivalsHeading}
                    placeholder="New In Stock"
                  />
                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>New Arrivals Caption</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={newArrivalsCaption}
                    onChangeText={setNewArrivalsCaption}
                    placeholder="Latest luxury surfaces and hardware fresh from factory"
                  />
                </View>

                <TouchableOpacity
                  style={styles.saveActionBtn}
                  onPress={handleSaveCmsSettings}
                  disabled={savingSettings}
                >
                  {savingSettings ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveActionBtnText}>Publish Headings & Captions to Storefront</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* 7. Reviews Moderation Modal */}
      <Modal visible={reviewsModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reviews Moderation</Text>
            <TouchableOpacity onPress={() => setReviewsModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {reviews.length === 0 ? (
              <View style={styles.emptyCenter}>
                <MessageSquare size={36} color="#94A3B8" />
                <Text style={styles.emptyCenterText}>No customer reviews pending moderation.</Text>
              </View>
            ) : (
              reviews.map((r: any) => (
                <View key={String(r.id)} style={styles.reviewCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={styles.itemTitle}>{r.userName || "Customer"}</Text>
                    <Text style={{ fontSize: 12, fontWeight: "800", color: "#F59E0B" }}>
                      ★ {r.rating} / 5
                    </Text>
                  </View>
                  <Text style={styles.reviewText}>{r.comment || "No comment text."}</Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                    <TouchableOpacity
                      style={[styles.smallActionBtn, { backgroundColor: "#16A34A" }]}
                      onPress={async () => {
                        await approveAdminReview(r.id);
                        refetchReviews();
                      }}
                    >
                      <Text style={styles.smallActionBtnText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallActionBtn, { backgroundColor: "#DC2626" }]}
                      onPress={async () => {
                        await rejectAdminReview(r.id);
                        refetchReviews();
                      }}
                    >
                      <Text style={styles.smallActionBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* 8. RECYCLE BIN & TRASH MODAL (Mistouch Protection with 3-Day Auto-Purge) */}
      <Modal visible={trashModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Recycle Bin & Trash</Text>
              <Text style={styles.modalSubtitle}>3-Day Mistouch Protection & Audit Log</Text>
            </View>
            <TouchableOpacity onPress={() => setTrashModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Sub-Tabs: Products / Orders */}
          <View style={styles.trashSubTabBar}>
            <TouchableOpacity
              style={[styles.trashTabBtn, trashSubTab === "products" && styles.trashTabBtnActive]}
              onPress={() => setTrashSubTab("products")}
            >
              <Boxes size={15} color={trashSubTab === "products" ? "#052A51" : "#64748B"} />
              <Text
                style={[
                  styles.trashTabBtnText,
                  trashSubTab === "products" && styles.trashTabBtnTextActive,
                ]}
              >
                Deleted Products ({deletedProducts.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.trashTabBtn, trashSubTab === "orders" && styles.trashTabBtnActive]}
              onPress={() => setTrashSubTab("orders")}
            >
              <FileText size={15} color={trashSubTab === "orders" ? "#052A51" : "#64748B"} />
              <Text
                style={[
                  styles.trashTabBtnText,
                  trashSubTab === "orders" && styles.trashTabBtnTextActive,
                ]}
              >
                Deleted Orders ({deletedOrders.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {trashLoading ? (
              <View style={styles.emptyCenter}>
                <ActivityIndicator size="large" color={COLORS.accentBlue} />
              </View>
            ) : trashSubTab === "products" ? (
              deletedProducts.length === 0 ? (
                <View style={styles.emptyCenter}>
                  <Trash2 size={40} color="#CBD5E1" />
                  <Text style={styles.emptyCenterTitle}>Trash is Empty</Text>
                  <Text style={styles.emptyCenterText}>No deleted products found in the last 3 days.</Text>
                </View>
              ) : (
                deletedProducts.map((p: any) => (
                  <View key={p.id} style={styles.trashCard}>
                    <View style={styles.trashCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.trashTitle}>{p.name}</Text>
                        <Text style={styles.trashVendor}>Vendor: {p.vendorName || "Direct / Admin"}</Text>
                      </View>
                      <View style={styles.countdownBadge}>
                        <Clock size={11} color="#DC2626" />
                        <Text style={styles.countdownText}>{p.countdownText}</Text>
                      </View>
                    </View>

                    {/* Audit Info Box */}
                    <View style={styles.auditInfoBox}>
                      <View style={styles.auditRow}>
                        <UserCheck size={12} color="#64748B" />
                        <Text style={styles.auditText}>
                          Deleted by: <Text style={styles.boldText}>{p.deletedByName}</Text> ({p.deletedByRole})
                        </Text>
                      </View>
                      <View style={styles.auditRow}>
                        <Calendar size={12} color="#64748B" />
                        <Text style={styles.auditText}>
                          Deleted on: {new Date(p.deletedAt).toLocaleString("en-IN")}
                        </Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.trashActionsRow}>
                      <TouchableOpacity
                        style={styles.restoreBtn}
                        onPress={() => handleRestore("product", p.id, p.name)}
                      >
                        <RotateCcw size={13} color="#16A34A" />
                        <Text style={styles.restoreBtnText}>Restore</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.viewDetailBtn}
                        onPress={() => handleOpenDetailModal(p, "product")}
                      >
                        <Eye size={13} color="#2563EB" />
                        <Text style={styles.viewDetailBtnText}>View Details</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.purgeBtn}
                        onPress={() => handleDeleteForever("product", p.id, p.name)}
                      >
                        <Trash2 size={13} color="#DC2626" />
                        <Text style={styles.purgeBtnText}>Purge</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )
            ) : deletedOrders.length === 0 ? (
              <View style={styles.emptyCenter}>
                <Trash2 size={40} color="#CBD5E1" />
                <Text style={styles.emptyCenterTitle}>Trash is Empty</Text>
                <Text style={styles.emptyCenterText}>No deleted orders found in the last 3 days.</Text>
              </View>
            ) : (
              deletedOrders.map((o: any) => (
                <View key={o.id} style={styles.trashCard}>
                  <View style={styles.trashCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.trashTitle}>ORDER #{o.id?.slice(-8).toUpperCase()}</Text>
                      <Text style={styles.trashVendor}>
                        Customer: {o.customerName} {o.customerPhone ? `(${o.customerPhone})` : ""}
                      </Text>
                      <Text style={styles.trashPrice}>Total: ₹{(o.total || 0).toLocaleString("en-IN")}</Text>
                    </View>
                    <View style={styles.countdownBadge}>
                      <Clock size={11} color="#DC2626" />
                      <Text style={styles.countdownText}>{o.countdownText}</Text>
                    </View>
                  </View>

                  {/* Audit Info Box */}
                  <View style={styles.auditInfoBox}>
                    <View style={styles.auditRow}>
                      <UserCheck size={12} color="#64748B" />
                      <Text style={styles.auditText}>
                        Deleted by: <Text style={styles.boldText}>{o.deletedByName}</Text> ({o.deletedByRole})
                      </Text>
                    </View>
                    <View style={styles.auditRow}>
                      <Calendar size={12} color="#64748B" />
                      <Text style={styles.auditText}>
                        Deleted on: {new Date(o.deletedAt).toLocaleString("en-IN")}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.trashActionsRow}>
                    <TouchableOpacity
                      style={styles.restoreBtn}
                      onPress={() => handleRestore("order", o.id, `Order #${o.id?.slice(-6)}`)}
                    >
                      <RotateCcw size={13} color="#16A34A" />
                      <Text style={styles.restoreBtnText}>Restore</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.viewDetailBtn}
                      onPress={() => handleOpenDetailModal(o, "order")}
                    >
                      <Eye size={13} color="#2563EB" />
                      <Text style={styles.viewDetailBtnText}>View Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.purgeBtn}
                      onPress={() => handleDeleteForever("order", o.id, `Order #${o.id?.slice(-6)}`)}
                    >
                      <Trash2 size={13} color="#DC2626" />
                      <Text style={styles.purgeBtnText}>Purge</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* 9. TRASH AUDIT ITEM DETAIL MODAL */}
      <Modal visible={detailModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.auditDetailModal}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailModalTitle}>
                {selectedTrashItem?.itemType === "product" ? "Deleted Product Details" : "Deleted Order Details"}
              </Text>
              <TouchableOpacity onPress={() => setDetailModalOpen(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedTrashItem && (
              <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ gap: 10, paddingVertical: 10 }}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Title / Identifier:</Text>
                  <Text style={styles.detailValue}>
                    {selectedTrashItem.name || `Order #${selectedTrashItem.id?.slice(-8).toUpperCase()}`}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Deleted By:</Text>
                  <Text style={styles.detailValue}>
                    {selectedTrashItem.deletedByName} ({selectedTrashItem.deletedByRole})
                  </Text>
                </View>

                {selectedTrashItem.deletedByPhone ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Contact Phone:</Text>
                    <Text style={styles.detailValue}>{selectedTrashItem.deletedByPhone}</Text>
                  </View>
                ) : null}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Exact Deletion Time:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedTrashItem.deletedAt).toLocaleString("en-IN", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Auto-Purge Expiry:</Text>
                  <Text style={[styles.detailValue, { color: "#DC2626" }]}>
                    {new Date(selectedTrashItem.expiresAt).toLocaleString("en-IN")} ({selectedTrashItem.countdownText})
                  </Text>
                </View>

                {selectedTrashItem.itemType === "product" ? (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Vendor:</Text>
                      <Text style={styles.detailValue}>{selectedTrashItem.vendorName || "Direct / Admin"}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Category:</Text>
                      <Text style={styles.detailValue}>{selectedTrashItem.categoryName || selectedTrashItem.categorySlug}</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Customer:</Text>
                      <Text style={styles.detailValue}>
                        {selectedTrashItem.customerName} ({selectedTrashItem.customerPhone || "N/A"})
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Order Total:</Text>
                      <Text style={[styles.detailValue, { fontWeight: "900", color: "#052A51" }]}>
                        ₹{(selectedTrashItem.total || 0).toLocaleString("en-IN")}
                      </Text>
                    </View>
                  </>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeDetailBtn}
              onPress={() => setDetailModalOpen(false)}
            >
              <Text style={styles.closeDetailBtnText}>Close Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 60,
  },
  heroCard: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 20,
    padding: 20,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#F1F5F9",
  },
  heroInfo: {
    marginLeft: 16,
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F26522",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  activePill: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#E2E8F0",
  },
  userName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  userPhone: {
    fontSize: 12,
    color: "#CBD5E1",
    marginTop: 2,
  },
  userEmail: {
    fontSize: 11,
    color: "#94A3B8",
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionHeaderInner: {
    fontSize: 11,
    fontWeight: "800",
    color: "#052A51",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...SHADOWS.sm,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
  },
  menuSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  trashCountPill: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  trashCountPillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 12,
    gap: 8,
  },
  logoutBtnText: {
    fontSize: 13,
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
    fontSize: 16,
    fontWeight: "800",
    color: "#052A51",
  },
  modalSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
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
    borderColor: "#E2E8F0",
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
    height: 42,
    fontSize: 13,
    color: "#052A51",
  },
  lockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: "#F1F5F9",
    padding: 10,
    borderRadius: 8,
  },
  lockedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  saveActionBtn: {
    backgroundColor: "#052A51",
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveActionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  checkLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#052A51",
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
  },
  itemSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  tabPill: {
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  tabPillActive: {
    backgroundColor: "#052A51",
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  tabPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 4,
  },
  reviewText: {
    fontSize: 12,
    color: "#334155",
    marginTop: 4,
  },
  smallActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  smallActionBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  trashSubTabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 6,
  },
  trashTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    gap: 4,
  },
  trashTabBtnActive: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  trashTabBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  trashTabBtnTextActive: {
    color: "#052A51",
    fontWeight: "800",
  },
  trashCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...SHADOWS.sm,
    gap: 8,
  },
  trashCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  trashTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
  },
  trashVendor: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  trashPrice: {
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
    marginTop: 2,
  },
  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  countdownText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DC2626",
  },
  auditInfoBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  auditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  auditText: {
    fontSize: 11,
    color: "#64748B",
  },
  boldText: {
    fontWeight: "800",
    color: "#334155",
  },
  trashActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  restoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  restoreBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#16A34A",
  },
  viewDetailBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  viewDetailBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563EB",
  },
  purgeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  purgeBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#DC2626",
  },
  uploadMiniBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  uploadMiniBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#052A51",
  },
  bannerThumb: {
    width: 60,
    height: 40,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
  },
  logoPreviewBox: {
    height: 50,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  logoPreviewImg: {
    width: 140,
    height: 40,
  },
  appIconPreviewBox: {
    width: 60,
    height: 60,
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  appIconPreviewImg: {
    width: 60,
    height: 60,
    borderRadius: 14,
  },
  emptyCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyCenterTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#052A51",
  },
  emptyCenterText: {
    fontSize: 12,
    color: "#64748B",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  auditDetailModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 420,
    ...SHADOWS.md,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 10,
  },
  detailModalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#052A51",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  detailLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
  },
  detailValue: {
    fontSize: 11,
    fontWeight: "800",
    color: "#052A51",
    maxWidth: "60%",
    textAlign: "right",
  },
  closeDetailBtn: {
    backgroundColor: "#052A51",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 14,
  },
  closeDetailBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  settlementSummaryCard: {
    backgroundColor: "#166534",
    borderRadius: 16,
    padding: 18,
    ...SHADOWS.md,
  },
  settlementSummaryLabel: {
    color: "#BBF7D0",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  settlementSummaryAmount: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  settlementSummarySub: {
    color: "#DCFCE7",
    fontSize: 11,
    marginTop: 4,
  },
  settlementVendorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    ...SHADOWS.sm,
    gap: 10,
  },
  settlementCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  settlementVendorName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#052A51",
  },
  settlementVendorPhone: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  editCommBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  editCommBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#052A51",
  },
  ruleEditorBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 4,
  },
  ruleLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  cycleChip: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
  },
  cycleChipActive: {
    backgroundColor: "#052A51",
    borderColor: "#052A51",
  },
  cycleChipText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
  },
  cycleChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  autopayBtn: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  autopayBtnActive: {
    backgroundColor: "#16A34A",
  },
  autopayText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
  },
  autopayTextActive: {
    color: "#FFFFFF",
  },
  settleGrid: {
    flexDirection: "row",
    gap: 6,
  },
  settleGridCol: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 8,
  },
  settleGridLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
  },
  settleGridVal: {
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
    marginTop: 2,
  },
  settleCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
    gap: 8,
  },
  bankDetailText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#334155",
  },
  cycleDetailText: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
  },
  payNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16A34A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  payNowBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#052A51",
  },
});
