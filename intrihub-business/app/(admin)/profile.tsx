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
  Platform,
  Image as RNImage,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  User,
  Shield,
  ShieldCheck,
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

const getCleanPhone = (phone?: string | null) => {
  if (!phone) return "";
  const str = String(phone).trim();
  const lower = str.toLowerCase();
  if (
    lower.startsWith("email_") ||
    lower.startsWith("google_") ||
    lower.includes("email") ||
    lower.includes("gmail") ||
    lower.includes("yahoo") ||
    lower.includes("@") ||
    lower.includes("_") ||
    /[a-zA-Z]/.test(str)
  ) {
    return "";
  }
  const digits = str.replace(/\D/g, "");
  if (digits.length < 7) return "";
  return digits.length > 10 ? digits.slice(-10) : digits;
};

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
  const [cmsModalOpen, setCmsModalOpen] = useState(false);
  const [activeCmsTab, setActiveCmsTab] = useState<"store" | "invoice" | "policies" | "banners" | "coupons" | "logos" | "headings" | null>(null);
  const [storeInfoModalOpen, setStoreInfoModalOpen] = useState(false);
  const [invoicePdfModalOpen, setInvoicePdfModalOpen] = useState(false);
  const [policiesModalOpen, setPoliciesModalOpen] = useState(false);
  const [bannersModalOpen, setBannersModalOpen] = useState(false);
  const [couponsModalOpen, setCouponsModalOpen] = useState(false);
  const [logosModalOpen, setLogosModalOpen] = useState(false);
  const [headingsModalOpen, setHeadingsModalOpen] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [trashSubTab, setTrashSubTab] = useState<"products" | "orders">("products");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTrashItem, setSelectedTrashItem] = useState<any | null>(null);
  const [settlementsModalOpen, setSettlementsModalOpen] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  // Tax Invoice & Bill PDF CMS Form
  const [invGstNumber, setInvGstNumber] = useState("29AAAAA0000A1Z5");
  const [invSupportPhone, setInvSupportPhone] = useState("+91 9264920211");
  const [invSupportEmail, setInvSupportEmail] = useState("support@intrihub.com");
  const [invSigText, setInvSigText] = useState("INTRIHUB");
  const [invSigTitle, setInvSigTitle] = useState("Authorized Signatory");
  const [invDigitalBadge, setInvDigitalBadge] = useState("✔ Digitally Signed");
  const [invTermsNotes, setInvTermsNotes] = useState("• Computer-generated tax invoice verified by IntriHub.\n• Everything, Every Place • www.intrihub.com");
  const [invFooterTagline, setInvFooterTagline] = useState("This is an official computer-generated tax invoice verified by IntriHub.");
  const [invWatermarkUrl, setInvWatermarkUrl] = useState("https://www.intrihub.com/logo/intri-web-logo.png");

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

      if (s.gstNumber) setInvGstNumber(s.gstNumber);
      if (s.contactPhone) setInvSupportPhone(s.contactPhone);
      if (s.email) setInvSupportEmail(s.email);
      if (s.invoiceSignatureText) setInvSigText(s.invoiceSignatureText);
      if (s.invoiceSignatureTitle) setInvSigTitle(s.invoiceSignatureTitle);
      if (s.invoiceDigitalBadge) setInvDigitalBadge(s.invoiceDigitalBadge);
      if (s.invoiceTermsNotes) setInvTermsNotes(s.invoiceTermsNotes);
      if (s.invoiceFooterTagline) setInvFooterTagline(s.invoiceFooterTagline);
      if (s.invoiceWatermarkUrl) setInvWatermarkUrl(s.invoiceWatermarkUrl);
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
        mediaTypes: ["images"],
        allowsEditing: false,
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

  const handleLogout = () => {
    Alert.alert(
      "Secure Sign Out",
      "Are you sure you want to sign out of the Super Admin Console?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              queryClient.clear();
              router.replace("/(auth)/login" as any);
            } catch {
              router.replace("/(auth)/login" as any);
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
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: "rgba(255,255,255,0.18)",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.35)",
            zIndex: 10,
          }}
          onPress={() => setProfileModalOpen(true)}
          activeOpacity={0.8}
        >
          <Edit2 size={16} color="#FFFFFF" />
        </TouchableOpacity>

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
            <Text style={styles.userName}>{user?.name || "Super Admin"}</Text>
            {getCleanPhone(user?.phone) ? (
              <Text style={styles.userPhone}>+91 {getCleanPhone(user?.phone)}</Text>
            ) : null}
            {user?.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
          </View>
        </View>
      </View>

      <Text style={styles.sectionHeader}>STORE & HOMEPAGE CMS CONTROL</Text>

      {/* CMS Control Center Card */}
      <TouchableOpacity
        style={[styles.menuCard, { borderColor: "#BFDBFE", backgroundColor: "#EFF6FF" }]}
        onPress={() => {
          setActiveCmsTab(null);
          setCmsModalOpen(true);
        }}
        activeOpacity={0.85}
      >
        <View style={[styles.iconBox, { backgroundColor: "#DBEAFE" }]}>
          <Sparkles size={20} color="#1D4ED8" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[styles.menuTitle, { color: "#1E3A8A" }]}>CMS Control</Text>
            <View style={[styles.trashCountPill, { backgroundColor: "#2563EB" }]}>
              <Text style={styles.trashCountPillText}>7 MODULES</Text>
            </View>
          </View>
          <Text style={styles.menuSub}>
            Store Info, Tax Invoice PDF, Policies, Banners, Coupons, Logos & Headings
          </Text>
        </View>
        <ChevronRight size={18} color="#1D4ED8" />
      </TouchableOpacity>

      <Text style={[styles.sectionHeader, { marginTop: 18 }]}>OPERATIONS & AUDIT</Text>

      {/* 8. Vendor Settlements & Commission Engine */}
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
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
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
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TextInput
                  style={[styles.inputBox, { flex: 1 }]}
                  value={avatarUrl}
                  onChangeText={setAvatarUrl}
                  placeholder="https://..."
                />
                <TouchableOpacity
                  style={styles.uploadMiniBtn}
                  onPress={() => handlePickAndUploadImage((url) => setAvatarUrl(url))}
                  disabled={uploadingImage}
                >
                  <Camera size={14} color="#052A51" />
                  <Text style={styles.uploadMiniBtnText}>Upload</Text>
                </TouchableOpacity>
              </View>
              {avatarUrl ? (
                <View style={styles.attachedImageRow}>
                  <Image source={{ uri: avatarUrl }} style={[styles.attachedImageThumb, { borderRadius: 20 }]} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.attachedImageLabel}>Avatar Image Attached</Text>
                    <Text style={styles.attachedImageSub} numberOfLines={1}>{avatarUrl}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.doneImageBtn}
                    onPress={() => Alert.alert("Confirmed 🎉", "Profile Avatar image confirmed & saved!")}
                  >
                    <CheckCircle2 size={12} color="#FFFFFF" />
                    <Text style={styles.doneImageBtnText}>Done</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setAvatarUrl("")}
                  >
                    <X size={12} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ) : null}

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

      {/* 1B. UNIFIED CMS CONTROL CENTER MODAL */}
      <Modal visible={cmsModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>CMS Control Center</Text>
              <Text style={styles.modalSubtitle}>Store Info, Invoice CMS, Policies, Banners & Branding</Text>
            </View>
            <TouchableOpacity onPress={() => setCmsModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Module 1 */}
            <TouchableOpacity
              style={[styles.menuCard, { borderColor: "#BFDBFE", backgroundColor: "#F8FAFC" }]}
              onPress={() => setStoreInfoModalOpen(true)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconBox, { backgroundColor: "#DBEAFE" }]}>
                <Building2 size={20} color="#1D4ED8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: "#1E3A8A" }]}>Store Details & Support Helpline</Text>
                <Text style={styles.menuSub}>Brand name, GSTIN, Support phone, WhatsApp, timings & warehouse address</Text>
              </View>
              <ChevronRight size={18} color="#2563EB" />
            </TouchableOpacity>

            {/* Module 2 */}
            <TouchableOpacity
              style={[styles.menuCard, { borderColor: "#FED7AA", backgroundColor: "#FFF7ED" }]}
              onPress={() => setInvoicePdfModalOpen(true)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconBox, { backgroundColor: "#FFEDD5" }]}>
                <FileText size={20} color="#EA580C" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={[styles.menuTitle, { color: "#9A3412" }]}>Tax Invoice & Bill PDF CMS</Text>
                  <View style={[styles.trashCountPill, { backgroundColor: "#EA580C" }]}>
                    <Text style={styles.trashCountPillText}>PDF BILL</Text>
                  </View>
                </View>
                <Text style={styles.menuSub}>
                  Customize GSTIN, Support Phone, Digital Signature Name, Terms & Watermark Logo
                </Text>
              </View>
              <ChevronRight size={18} color="#EA580C" />
            </TouchableOpacity>

            {/* Module 3 */}
            <TouchableOpacity
              style={[styles.menuCard, { borderColor: "#DDD6FE", backgroundColor: "#F5F3FF" }]}
              onPress={() => setPoliciesModalOpen(true)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconBox, { backgroundColor: "#EDE9FE" }]}>
                <ShieldCheck size={20} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: "#5B21B6" }]}>Customer Policies & Legal Texts</Text>
                <Text style={styles.menuSub}>Help Center, Privacy Policy, Terms, 7-Day Returns Guarantee</Text>
              </View>
              <ChevronRight size={18} color="#7C3AED" />
            </TouchableOpacity>

            {/* Module 4 */}
            <TouchableOpacity
              style={[styles.menuCard, { borderColor: "#BAE6FD", backgroundColor: "#F0F9FF" }]}
              onPress={() => setBannersModalOpen(true)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconBox, { backgroundColor: "#E0F2FE" }]}>
                <ImageIcon size={20} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={[styles.menuTitle, { color: "#0369A1" }]}>Hero Banners & Carousel Slides</Text>
                  <View style={[styles.trashCountPill, { backgroundColor: "#0284C7" }]}>
                    <Text style={styles.trashCountPillText}>{banners.length} SLIDES</Text>
                  </View>
                </View>
                <Text style={styles.menuSub}>Upload, arrange, and manage promotional hero banners</Text>
              </View>
              <ChevronRight size={18} color="#0284C7" />
            </TouchableOpacity>

            {/* Module 5 */}
            <TouchableOpacity
              style={[styles.menuCard, { borderColor: "#FDE68A", backgroundColor: "#FEFCE8" }]}
              onPress={() => setCouponsModalOpen(true)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconBox, { backgroundColor: "#FEF3C7" }]}>
                <Tag size={20} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={[styles.menuTitle, { color: "#B45309" }]}>Promo Coupons & Discount Engine</Text>
                  <View style={[styles.trashCountPill, { backgroundColor: "#D97706" }]}>
                    <Text style={styles.trashCountPillText}>{coupons.length} COUPS</Text>
                  </View>
                </View>
                <Text style={styles.menuSub}>Create discount codes, set min order amounts & expiry</Text>
              </View>
              <ChevronRight size={18} color="#D97706" />
            </TouchableOpacity>

            {/* Module 6 */}
            <TouchableOpacity
              style={[styles.menuCard, { borderColor: "#E9D5FF", backgroundColor: "#FAF5FF" }]}
              onPress={() => setLogosModalOpen(true)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconBox, { backgroundColor: "#F3E8FF" }]}>
                <Smartphone size={20} color="#9333EA" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: "#6B21A8" }]}>App & Website Branding Logos</Text>
                <Text style={styles.menuSub}>Update dark/light header logos, favicon, and brand assets</Text>
              </View>
              <ChevronRight size={18} color="#9333EA" />
            </TouchableOpacity>

            {/* Module 7 */}
            <TouchableOpacity
              style={[styles.menuCard, { borderColor: "#CBD5E1", backgroundColor: "#F8FAFC" }]}
              onPress={() => setHeadingsModalOpen(true)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconBox, { backgroundColor: "#E2E8F0" }]}>
                <Type size={20} color="#475569" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: "#334155" }]}>Storefront Headings & Captions</Text>
                <Text style={styles.menuSub}>Section titles, subheadings, hero taglines & banners</Text>
              </View>
              <ChevronRight size={18} color="#475569" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* 2. Store Info Modal */}
      <Modal visible={storeInfoModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Store Details & Support Helpline</Text>
              <Text style={styles.modalSubtitle}>Configure Store Info, Support Phone, Email & Warehouse</Text>
            </View>
            <TouchableOpacity onPress={() => setStoreInfoModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
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
              style={[styles.saveActionBtn, { marginTop: 16 }]}
              onPress={handleSaveStoreSettings}
              disabled={savingSettings}
            >
              {savingSettings ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveActionBtnText}>Save Store & Support Details</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* 2B. Tax Invoice PDF Modal */}
      <Modal visible={invoicePdfModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Tax Invoice & Bill PDF CMS</Text>
              <Text style={styles.modalSubtitle}>GSTIN, Signature Name, Terms & Watermark Logo</Text>
            </View>
            <TouchableOpacity onPress={() => setInvoicePdfModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#052a51", marginBottom: 12 }}>
                📄 Company & Header Details
              </Text>

              <Text style={styles.inputLabel}>Company GSTIN</Text>
              <TextInput style={styles.inputBox} value={invGstNumber} onChangeText={setInvGstNumber} placeholder="29AAAAA0000A1Z5" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Bill Support Phone</Text>
              <TextInput style={styles.inputBox} value={invSupportPhone} onChangeText={setInvSupportPhone} placeholder="+91 9264920211" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Bill Support Email</Text>
              <TextInput style={styles.inputBox} value={invSupportEmail} onChangeText={setInvSupportEmail} placeholder="support@intrihub.com" />
            </View>

            <View style={[styles.modalCard, { marginTop: 14 }]}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#052a51", marginBottom: 12 }}>
                ✍️ Authorized Signature & Branding
              </Text>

              <Text style={styles.inputLabel}>Digital Signature Name / Text</Text>
              <TextInput style={styles.inputBox} value={invSigText} onChangeText={setInvSigText} placeholder="INTRIHUB" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Signature Subtitle / Title</Text>
              <TextInput style={styles.inputBox} value={invSigTitle} onChangeText={setInvSigTitle} placeholder="Authorized Signatory" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Verification Badge Text</Text>
              <TextInput style={styles.inputBox} value={invDigitalBadge} onChangeText={setInvDigitalBadge} placeholder="✔ Digitally Signed" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Watermark & Header Logo URL</Text>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TextInput
                  style={[styles.inputBox, { flex: 1 }]}
                  value={invWatermarkUrl}
                  onChangeText={setInvWatermarkUrl}
                  placeholder="https://www.intrihub.com/logo/intri-web-logo.png"
                />
                <TouchableOpacity
                  style={styles.uploadMiniBtn}
                  onPress={() => handlePickAndUploadImage((url) => setInvWatermarkUrl(url))}
                  disabled={uploadingImage}
                >
                  <Camera size={14} color="#052A51" />
                  <Text style={styles.uploadMiniBtnText}>Upload</Text>
                </TouchableOpacity>
              </View>
              {invWatermarkUrl ? (
                <View style={styles.attachedImageRow}>
                  <Image source={{ uri: invWatermarkUrl }} style={styles.attachedImageThumb} contentFit="contain" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.attachedImageLabel}>Logo Attached & Active</Text>
                    <Text style={styles.attachedImageSub} numberOfLines={1}>{invWatermarkUrl}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.doneImageBtn}
                    onPress={() => Alert.alert("Confirmed 🎉", "Invoice Watermark Logo confirmed & ready!")}
                  >
                    <CheckCircle2 size={12} color="#FFFFFF" />
                    <Text style={styles.doneImageBtnText}>Done</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setInvWatermarkUrl("")}
                  >
                    <X size={12} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            <View style={[styles.modalCard, { marginTop: 14 }]}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#052a51", marginBottom: 12 }}>
                📜 Terms, Notes & Footer
              </Text>

              <Text style={styles.inputLabel}>Invoice Terms & Notes (One per line)</Text>
              <TextInput
                style={[styles.inputBox, { height: 80, textAlignVertical: "top" }]}
                multiline
                numberOfLines={3}
                value={invTermsNotes}
                onChangeText={setInvTermsNotes}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Footer Tagline Text</Text>
              <TextInput style={styles.inputBox} value={invFooterTagline} onChangeText={setInvFooterTagline} />
            </View>

            <TouchableOpacity
              style={[styles.saveActionBtn, { backgroundColor: "#EA580C", marginTop: 16 }]}
              onPress={async () => {
                try {
                  setIsUpdatingSettings(true);
                  const res = await updateAdminStoreSettings({
                    gstNumber: invGstNumber,
                    contactPhone: invSupportPhone,
                    email: invSupportEmail,
                    invoiceSignatureText: invSigText,
                    invoiceSignatureTitle: invSigTitle,
                    invoiceDigitalBadge: invDigitalBadge,
                    invoiceTermsNotes: invTermsNotes,
                    invoiceFooterTagline: invFooterTagline,
                    invoiceWatermarkUrl: invWatermarkUrl,
                  });
                  if (res.success) {
                    Alert.alert("Success", "Tax Invoice & Bill PDF CMS settings updated successfully!");
                    refetchSettings();
                  } else {
                    Alert.alert("Error", res.error || "Failed to update invoice settings");
                  }
                } catch (err: any) {
                  Alert.alert("Error", err.message || "Failed to save settings");
                } finally {
                  setIsUpdatingSettings(false);
                }
              }}
              disabled={isUpdatingSettings}
            >
              {isUpdatingSettings ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveActionBtnText}>Save Invoice & Bill CMS Settings</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* 4. Hero Banners Modal */}
      <Modal visible={bannersModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Hero Banners & Carousel Slides</Text>
              <Text style={styles.modalSubtitle}>Manage Promotional Carousel Slides ({banners.length})</Text>
            </View>
            <TouchableOpacity onPress={() => setBannersModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#052a51", marginBottom: 8 }}>
                ➕ Add New Banner Slide
              </Text>
              <TextInput
                style={styles.inputBox}
                value={newBannerTitle}
                onChangeText={setNewBannerTitle}
                placeholder="Banner Title (e.g. Festival Super Sale)"
              />
              <Text style={[styles.inputLabel, { marginTop: 8 }]}>Banner Image URL</Text>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TextInput
                  style={[styles.inputBox, { flex: 1 }]}
                  value={newBannerImage}
                  onChangeText={setNewBannerImage}
                  placeholder="Banner Image URL (https://...)"
                />
                <TouchableOpacity
                  style={styles.uploadMiniBtn}
                  onPress={() => handlePickAndUploadImage((url) => setNewBannerImage(url))}
                  disabled={uploadingImage}
                >
                  <Camera size={14} color="#052A51" />
                  <Text style={styles.uploadMiniBtnText}>Upload</Text>
                </TouchableOpacity>
              </View>
              {newBannerImage ? (
                <View style={styles.attachedImageRow}>
                  <Image source={{ uri: newBannerImage }} style={styles.attachedImageThumb} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.attachedImageLabel}>Slide Image Attached</Text>
                    <Text style={styles.attachedImageSub} numberOfLines={1}>{newBannerImage}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.doneImageBtn}
                    onPress={() => Alert.alert("Confirmed 🎉", "Banner slide image confirmed & ready!")}
                  >
                    <CheckCircle2 size={12} color="#FFFFFF" />
                    <Text style={styles.doneImageBtnText}>Done</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setNewBannerImage("")}
                  >
                    <X size={12} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ) : null}

              <TextInput
                style={[styles.inputBox, { marginTop: 8 }]}
                value={newBannerCta}
                onChangeText={setNewBannerCta}
                placeholder="Click Link Target (e.g. /category/tiles)"
              />
              <TouchableOpacity
                style={[styles.saveActionBtn, { marginTop: 12, backgroundColor: "#0284C7" }]}
                onPress={handleCreateBanner}
              >
                <Text style={styles.saveActionBtnText}>Add Banner Slide</Text>
              </TouchableOpacity>
            </View>

            {banners.map((b: any) => (
              <View key={b.id || String(Math.random())} style={[styles.modalCard, { marginTop: 10, flexDirection: "row", alignItems: "center" }]}>
                {b.image ? (
                  <Image source={{ uri: b.image }} style={{ width: 64, height: 40, borderRadius: 6, backgroundColor: "#F1F5F9" }} contentFit="cover" />
                ) : null}
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#052A51" }}>{b.title || "Banner Slide"}</Text>
                  <Text style={{ fontSize: 10, color: "#64748B" }}>Target: {b.href || b.linkUrl || "None"}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteBanner(b.id)}
                  style={{ padding: 6, backgroundColor: "#FEE2E2", borderRadius: 6 }}
                >
                  <Trash2 size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* 5. Coupons Modal */}
      <Modal visible={couponsModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Promo Coupons & Discount Engine</Text>
              <Text style={styles.modalSubtitle}>Manage Store Discount Codes ({coupons.length})</Text>
            </View>
            <TouchableOpacity onPress={() => setCouponsModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#052a51", marginBottom: 8 }}>
                ➕ Create New Coupon Code
              </Text>
              <TextInput
                style={styles.inputBox}
                value={newCouponCode}
                onChangeText={(t) => setNewCouponCode(t.toUpperCase())}
                placeholder="Coupon Code (e.g. INTRI100)"
              />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <TextInput
                  style={[styles.inputBox, { flex: 1 }]}
                  value={newCouponValue}
                  onChangeText={setNewCouponValue}
                  placeholder="Discount Amount (₹)"
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.inputBox, { flex: 1 }]}
                  value={newCouponMinOrder}
                  onChangeText={setNewCouponMinOrder}
                  placeholder="Min Order Amount (₹)"
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity
                style={[styles.saveActionBtn, { marginTop: 12, backgroundColor: "#D97706" }]}
                onPress={handleCreateCoupon}
              >
                <Text style={styles.saveActionBtnText}>Create Coupon Code</Text>
              </TouchableOpacity>
            </View>

            {coupons.map((c: any) => (
              <View key={c.id || String(Math.random())} style={[styles.modalCard, { marginTop: 10, flexDirection: "row", alignItems: "center" }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "900", color: "#D97706" }}>{c.code}</Text>
                  <Text style={{ fontSize: 10, color: "#64748B" }}>
                    Flat ₹{c.value || c.discountValue} OFF on orders above ₹{c.minOrderValue || 0}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteCoupon(c.id, c.code)}
                  style={{ padding: 6, backgroundColor: "#FEE2E2", borderRadius: 6 }}
                >
                  <Trash2 size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* 6. Logos Modal */}
      <Modal visible={logosModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>App & Website Branding Logos</Text>
              <Text style={styles.modalSubtitle}>Header Logos, Favicon & Brand Assets</Text>
            </View>
            <TouchableOpacity onPress={() => setLogosModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Main Website Logo URL</Text>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TextInput
                  style={[styles.inputBox, { flex: 1 }]}
                  value={websiteLogo}
                  onChangeText={setWebsiteLogo}
                  placeholder="https://..."
                />
                <TouchableOpacity
                  style={styles.uploadMiniBtn}
                  onPress={() => handlePickAndUploadImage((url) => setWebsiteLogo(url))}
                  disabled={uploadingImage}
                >
                  <Camera size={14} color="#052A51" />
                  <Text style={styles.uploadMiniBtnText}>Upload</Text>
                </TouchableOpacity>
              </View>
              {websiteLogo ? (
                <View style={styles.attachedImageRow}>
                  <Image source={{ uri: websiteLogo }} style={styles.attachedImageThumb} contentFit="contain" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.attachedImageLabel}>Website Logo Attached</Text>
                    <Text style={styles.attachedImageSub} numberOfLines={1}>{websiteLogo}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.doneImageBtn}
                    onPress={() => Alert.alert("Confirmed 🎉", "Website Logo confirmed & saved!")}
                  >
                    <CheckCircle2 size={12} color="#FFFFFF" />
                    <Text style={styles.doneImageBtnText}>Done</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setWebsiteLogo("")}
                  >
                    <X size={12} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ) : null}

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Mobile App Icon URL</Text>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TextInput
                  style={[styles.inputBox, { flex: 1 }]}
                  value={appIcon}
                  onChangeText={setAppIcon}
                  placeholder="https://..."
                />
                <TouchableOpacity
                  style={styles.uploadMiniBtn}
                  onPress={() => handlePickAndUploadImage((url) => setAppIcon(url))}
                  disabled={uploadingImage}
                >
                  <Camera size={14} color="#052A51" />
                  <Text style={styles.uploadMiniBtnText}>Upload</Text>
                </TouchableOpacity>
              </View>
              {appIcon ? (
                <View style={styles.attachedImageRow}>
                  <Image source={{ uri: appIcon }} style={[styles.attachedImageThumb, { borderRadius: 10 }]} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.attachedImageLabel}>App Icon Attached</Text>
                    <Text style={styles.attachedImageSub} numberOfLines={1}>{appIcon}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.doneImageBtn}
                    onPress={() => Alert.alert("Confirmed 🎉", "App Launcher Icon confirmed & ready!")}
                  >
                    <CheckCircle2 size={12} color="#FFFFFF" />
                    <Text style={styles.doneImageBtnText}>Done</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setAppIcon("")}
                  >
                    <X size={12} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.saveActionBtn, { backgroundColor: "#9333EA", marginTop: 16 }]}
              onPress={handleSaveCmsSettings}
              disabled={savingSettings}
            >
              {savingSettings ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveActionBtnText}>Save Brand Logos & Assets</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* 7. Headings Modal */}
      <Modal visible={headingsModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Storefront Headings & Captions</Text>
              <Text style={styles.modalSubtitle}>Homepage Section Titles, Taglines & Subheadings</Text>
            </View>
            <TouchableOpacity onPress={() => setHeadingsModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Homepage Main Hero Headline</Text>
              <TextInput style={styles.inputBox} value={heroHeadline} onChangeText={setHeroHeadline} />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Hero Tagline / Subtitle</Text>
              <TextInput style={styles.inputBox} value={heroTagline} onChangeText={setHeroTagline} />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Top Announcement / Deals Bar</Text>
              <TextInput style={styles.inputBox} value={dealsBarText} onChangeText={setDealsBarText} />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Trending Products Heading</Text>
              <TextInput style={styles.inputBox} value={trendingHeading} onChangeText={setTrendingHeading} />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Bestsellers Heading</Text>
              <TextInput style={styles.inputBox} value={bestsellersHeading} onChangeText={setBestsellersHeading} />
            </View>

            <TouchableOpacity
              style={[styles.saveActionBtn, { backgroundColor: "#475569", marginTop: 16 }]}
              onPress={handleSaveCmsSettings}
              disabled={savingSettings}
            >
              {savingSettings ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveActionBtnText}>Save Headings & Captions</Text>
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

      {/* 8. Tax Invoice & Bill PDF CMS Modal */}
      <Modal visible={invoicePdfModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Tax Invoice & Bill PDF CMS</Text>
              <Text style={styles.modalSubtitle}>Customize Invoice GSTIN, Support Phone, Signature, Terms & Notes</Text>
            </View>
            <TouchableOpacity onPress={() => setInvoicePdfModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#052a51", marginBottom: 12 }}>
                📄 Company & Header Details
              </Text>
              
              <Text style={styles.inputLabel}>Company GSTIN</Text>
              <TextInput style={styles.inputBox} value={invGstNumber} onChangeText={setInvGstNumber} placeholder="29AAAAA0000A1Z5" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Bill Support Phone</Text>
              <TextInput style={styles.inputBox} value={invSupportPhone} onChangeText={setInvSupportPhone} placeholder="+91 9264920211" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Bill Support Email</Text>
              <TextInput style={styles.inputBox} value={invSupportEmail} onChangeText={setInvSupportEmail} placeholder="support@intrihub.com" />
            </View>

            <View style={[styles.modalCard, { marginTop: 14 }]}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#052a51", marginBottom: 12 }}>
                ✍️ Authorized Signature & Branding
              </Text>

              <Text style={styles.inputLabel}>Digital Signature Name / Text</Text>
              <TextInput style={styles.inputBox} value={invSigText} onChangeText={setInvSigText} placeholder="INTRIHUB" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Signature Subtitle / Title</Text>
              <TextInput style={styles.inputBox} value={invSigTitle} onChangeText={setInvSigTitle} placeholder="Authorized Signatory" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Verification Badge Text</Text>
              <TextInput style={styles.inputBox} value={invDigitalBadge} onChangeText={setInvDigitalBadge} placeholder="✔ Digitally Signed" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Watermark & Header Logo URL</Text>
              <TextInput style={styles.inputBox} value={invWatermarkUrl} onChangeText={setInvWatermarkUrl} placeholder="https://www.intrihub.com/logo/intri-web-logo.png" />
            </View>

            <View style={[styles.modalCard, { marginTop: 14 }]}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#052a51", marginBottom: 12 }}>
                📜 Terms, Notes & Footer
              </Text>

              <Text style={styles.inputLabel}>Invoice Terms & Notes (One per line)</Text>
              <TextInput
                style={[styles.inputBox, { height: 80, textAlignVertical: "top" }]}
                multiline
                numberOfLines={3}
                value={invTermsNotes}
                onChangeText={setInvTermsNotes}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Footer Tagline Text</Text>
              <TextInput style={styles.inputBox} value={invFooterTagline} onChangeText={setInvFooterTagline} />
            </View>

            <TouchableOpacity
              style={[styles.saveActionBtn, { backgroundColor: "#EA580C" }]}
              onPress={async () => {
                try {
                  setIsUpdatingSettings(true);
                  const res = await updateAdminStoreSettings({
                    gstNumber: invGstNumber,
                    contactPhone: invSupportPhone,
                    email: invSupportEmail,
                    invoiceSignatureText: invSigText,
                    invoiceSignatureTitle: invSigTitle,
                    invoiceDigitalBadge: invDigitalBadge,
                    invoiceTermsNotes: invTermsNotes,
                    invoiceFooterTagline: invFooterTagline,
                    invoiceWatermarkUrl: invWatermarkUrl,
                  });
                  if (res.success) {
                    Alert.alert("Success", "Tax Invoice & Bill PDF CMS settings updated successfully!");
                    refetchSettings();
                    setInvoicePdfModalOpen(false);
                  } else {
                    Alert.alert("Error", res.error || "Failed to update invoice settings");
                  }
                } catch (err: any) {
                  Alert.alert("Error", err.message || "Failed to save settings");
                } finally {
                  setIsUpdatingSettings(false);
                }
              }}
              disabled={isUpdatingSettings}
            >
              {isUpdatingSettings ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveActionBtnText}>Save Invoice & Bill CMS Settings</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
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
    paddingTop: Platform.OS === "ios" ? 54 : 48,
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
    height: 42,
    gap: 4,
  },
  uploadMiniBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#052A51",
  },
  attachedImageRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
    gap: 8,
  },
  attachedImageThumb: {
    width: 42,
    height: 42,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  attachedImageLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#166534",
  },
  attachedImageSub: {
    fontSize: 10,
    color: "#15803D",
    marginTop: 2,
  },
  doneImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16A34A",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  doneImageBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  removeImageBtn: {
    padding: 6,
    backgroundColor: "#FEE2E2",
    borderRadius: 6,
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
