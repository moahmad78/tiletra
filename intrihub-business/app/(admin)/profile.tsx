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
} from "lucide-react-native";
import { useAuthStore } from "../../src/store/authStore";
import { updateProfile as apiUpdateProfile } from "../../src/api/auth";
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

  // Modal Visibility States
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [storeInfoModalOpen, setStoreInfoModalOpen] = useState(false);
  const [policiesModalOpen, setPoliciesModalOpen] = useState(false);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [unitsModalOpen, setUnitsModalOpen] = useState(false);
  const [cmsModalOpen, setCmsModalOpen] = useState(false);
  const [couponsModalOpen, setCouponsModalOpen] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);

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

  // Units Form
  const [unitsList, setUnitsList] = useState<string[]>(["sqft", "box", "piece", "meter", "kg", "bag", "ton"]);
  const [newUnitInput, setNewUnitInput] = useState("");

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

  // Initialize store settings state
  React.useEffect(() => {
    if (settingsData?.settings) {
      const s = settingsData.settings;
      setStoreName(s.storeName || "Intrihub");
      setGstNumber(s.gstNumber || "");
      setSupportPhone(s.contactPhone || "9264920211");
      setSupportEmail(s.email || "support@intrihub.com");
      setWhatsappNumber(s.whatsappNumber || "9264920211");
      setSupportTimings(s.supportTimings || "10:00 AM – 07:00 PM (Mon–Sat)");
      setStoreAddress(s.address || "Bengaluru, Karnataka, India");
      setPolicyHelp(s.policyHelp || "");
      setPolicyPrivacy(s.policyPrivacy || "");
      setPolicyTerms(s.policyTerms || "");
      setPolicyReturns(s.policyReturns || "");
      if (s.unitsList && Array.isArray(s.unitsList)) {
        setUnitsList(s.unitsList);
      }
    }
  }, [settingsData]);

  // Handle Save Profile
  const handleSaveProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const res = await apiUpdateProfile({
        name: name.trim(),
        phone: phone.trim(),
        avatar: avatarUrl.trim() || undefined,
      });
      setIsUpdatingProfile(false);
      if (res.success && res.user) {
        setUser(res.user);
        setProfileModalOpen(false);
        Alert.alert("Profile Updated", "Admin personal details updated!");
      } else {
        Alert.alert("Error", res.error || "Failed to update profile");
      }
    } catch (e: any) {
      setIsUpdatingProfile(false);
      Alert.alert("Error", e?.message || "Failed to update profile");
    }
  };

  // Handle Save Store & Support Info
  const handleSaveStoreInfo = async () => {
    setSavingSettings(true);
    try {
      const res = await updateAdminStoreSettings({
        storeName: storeName.trim(),
        gstNumber: gstNumber.trim(),
        contactPhone: supportPhone.trim(),
        email: supportEmail.trim(),
        whatsappNumber: whatsappNumber.trim(),
        supportTimings: supportTimings.trim(),
        address: storeAddress.trim(),
      });
      setSavingSettings(false);
      if (res.success) {
        setStoreInfoModalOpen(false);
        Alert.alert("Store Details Saved 🎉", "Contact details and support timings updated!");
        refetchSettings();
      } else {
        Alert.alert("Error", res.error || "Failed to save");
      }
    } catch (e: any) {
      setSavingSettings(false);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  // Handle Save Policy Text
  const handleSavePolicies = async () => {
    setSavingSettings(true);
    try {
      const res = await updateAdminStoreSettings({
        policyHelp: policyHelp.trim(),
        policyPrivacy: policyPrivacy.trim(),
        policyTerms: policyTerms.trim(),
        policyReturns: policyReturns.trim(),
      });
      setSavingSettings(false);
      if (res.success) {
        setPoliciesModalOpen(false);
        Alert.alert("Policies Updated 🎉", "Legal and support content saved!");
        refetchSettings();
      } else {
        Alert.alert("Error", res.error || "Failed to save policies");
      }
    } catch (e: any) {
      setSavingSettings(false);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  // Handle Units Save
  const handleAddUnit = async () => {
    if (!newUnitInput.trim()) return;
    const updated = [...unitsList, newUnitInput.trim().toLowerCase()];
    setUnitsList(updated);
    setNewUnitInput("");
    await updateAdminStoreSettings({ unitsList: updated });
    refetchSettings();
  };

  const handleDeleteUnit = async (unitToRemove: string) => {
    const updated = unitsList.filter((u) => u !== unitToRemove);
    setUnitsList(updated);
    await updateAdminStoreSettings({ unitsList: updated });
    refetchSettings();
  };

  // Handle Category Creation
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      Alert.alert("Validation Error", "Category name is required.");
      return;
    }
    const slug = newCatSlug.trim() || newCatName.toLowerCase().replace(/\s+/g, "-");
    try {
      const res = await createAdminCategory({
        name: newCatName.trim(),
        slug,
        description: newCatDesc.trim() || undefined,
        image: newCatImage.trim() || undefined,
        calculatorType: newCatHasCalc ? "tile" : "none",
      });
      if (res.success) {
        setNewCatName("");
        setNewCatSlug("");
        setNewCatDesc("");
        setNewCatImage("");
        refetchCats();
        Alert.alert("Category Created", `Category "${newCatName}" added!`);
      } else {
        Alert.alert("Error", res.error || "Failed to create category");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  const handleDeleteCategory = (id: string, catName: string) => {
    Alert.alert("Delete Category", `Permanently delete category "${catName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAdminCategory(id);
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

  const handleDeleteCoupon = (id: string, code: string) => {
    Alert.alert("Delete Coupon", `Delete coupon "${code}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAdminCoupon(id);
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

  const handleDeleteBanner = (id: string) => {
    Alert.alert("Delete Banner", "Remove this banner from homepage?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAdminContentBanner(id);
            refetchBanners();
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to delete");
          }
        },
      },
    ]);
  };

  const categories = (categoriesData as any)?.categories || [];
  const coupons = (couponsData as any)?.coupons || [];
  const banners = (bannersData as any)?.banners || [];
  const reviews = (reviewsData as any)?.reviews || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Profile Identity Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarRow}>
          <Image
            source={avatarUrl ? { uri: avatarUrl } : require("../../assets/intri-icon.png")}
            style={styles.avatarImage}
            contentFit="cover"
          />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{user?.name || "Super Admin"}</Text>
              <Shield size={16} color="#F26522" />
            </View>
            <Text style={styles.profileEmail}>admin@intrihub.com</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>FULL PLATFORM ROOT ACCESS</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => setProfileModalOpen(true)}
          activeOpacity={0.85}
        >
          <Edit2 size={14} color="#052A51" />
          <Text style={styles.editProfileBtnText}>Edit Identity & Photo</Text>
        </TouchableOpacity>
      </View>

      {/* MASTER SETTINGS & CONTROLS SECTION */}
      <Text style={styles.sectionHeaderTitle}>Master Store & Platform Settings</Text>

      {/* 1. Store & Support Info */}
      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => setStoreInfoModalOpen(true)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconBox, { backgroundColor: "#EFF6FF" }]}>
          <Building2 size={20} color="#2563EB" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.menuTitle}>Store Details & Support Timing</Text>
          <Text style={styles.menuSub}>Phone, Email, WhatsApp, GSTIN, Support Hours ({supportTimings || "10 AM - 7 PM"})</Text>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </TouchableOpacity>

      {/* 2. Legal Policies & Customer Support Copy */}
      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => setPoliciesModalOpen(true)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconBox, { backgroundColor: "#FEF3C7" }]}>
          <FileText size={20} color="#D97706" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.menuTitle}>Website Policies & Help Content</Text>
          <Text style={styles.menuSub}>Privacy, Terms, Returns & Refunds, Customer Support guide</Text>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </TouchableOpacity>

      {/* 3. Categories Master */}
      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => setCategoriesModalOpen(true)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconBox, { backgroundColor: "#F3E8FF" }]}>
          <Layers size={20} color="#9333EA" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.menuTitle}>Categories & Tile Calculators ({categories.length})</Text>
          <Text style={styles.menuSub}>Manage taxonomy, category banners, area calculators</Text>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </TouchableOpacity>

      {/* 4. Units of Sale Master */}
      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => setUnitsModalOpen(true)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconBox, { backgroundColor: "#DCFCE7" }]}>
          <Boxes size={20} color="#16A34A" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.menuTitle}>Units of Sale Master ({unitsList.length})</Text>
          <Text style={styles.menuSub}>Configure allowed sale units (sqft, box, piece, meter, ton)</Text>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </TouchableOpacity>

      {/* 5. Homepage CMS & Offer Banners */}
      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => setCmsModalOpen(true)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconBox, { backgroundColor: "#FFE4E6" }]}>
          <ImageIcon size={20} color="#E11D48" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.menuTitle}>Homepage CMS & Offer Banners ({banners.length})</Text>
          <Text style={styles.menuSub}>Hero headline, promotional carousel slides, CTA links</Text>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </TouchableOpacity>

      {/* 6. Coupons & Promotional Rules */}
      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => setCouponsModalOpen(true)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconBox, { backgroundColor: "#E0E7FF" }]}>
          <Tag size={20} color="#4F46E5" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.menuTitle}>Coupons & Promo Codes ({coupons.length})</Text>
          <Text style={styles.menuSub}>Flat/percentage discount codes, min cart threshold</Text>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </TouchableOpacity>

      {/* 7. Reviews Moderation */}
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
              <TextInput style={styles.inputBox} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Profile Picture / Avatar URL</Text>
              <TextInput style={styles.inputBox} value={avatarUrl} onChangeText={setAvatarUrl} placeholder="https://..." />

              <View style={styles.lockedRow}>
                <Lock size={14} color="#64748B" />
                <Text style={styles.lockedText}>Locked Admin Email: admin@intrihub.com</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveProfile} disabled={isUpdatingProfile}>
              {isUpdatingProfile ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveActionBtnText}>Save Profile Identity</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* 2. Store Details & Support Timing Modal */}
      <Modal visible={storeInfoModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Store & Customer Support Details</Text>
            <TouchableOpacity onPress={() => setStoreInfoModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Store / Platform Name</Text>
              <TextInput style={styles.inputBox} value={storeName} onChangeText={setStoreName} />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Customer Support Timings *</Text>
              <TextInput style={styles.inputBox} value={supportTimings} onChangeText={setSupportTimings} placeholder="e.g. 10:00 AM – 07:00 PM (Mon–Sat)" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Customer Support Phone</Text>
              <TextInput style={styles.inputBox} value={supportPhone} onChangeText={setSupportPhone} keyboardType="phone-pad" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Official Support Email</Text>
              <TextInput style={styles.inputBox} value={supportEmail} onChangeText={setSupportEmail} keyboardType="email-address" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Support WhatsApp Number</Text>
              <TextInput style={styles.inputBox} value={whatsappNumber} onChangeText={setWhatsappNumber} keyboardType="phone-pad" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Business GSTIN</Text>
              <TextInput style={styles.inputBox} value={gstNumber} onChangeText={setGstNumber} />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Central Warehouse / Office Address</Text>
              <TextInput style={[styles.inputBox, { height: 60, textAlignVertical: "top", paddingTop: 8 }]} multiline value={storeAddress} onChangeText={setStoreAddress} />
            </View>

            <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveStoreInfo} disabled={savingSettings}>
              {savingSettings ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveActionBtnText}>Save Store & Support Info</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* 3. Website Policies Modal */}
      <Modal visible={policiesModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Website Policies & Help Editor</Text>
            <TouchableOpacity onPress={() => setPoliciesModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Customer Help & Support Guide Copy</Text>
              <TextInput style={[styles.inputBox, { height: 80, textAlignVertical: "top", paddingTop: 8 }]} multiline value={policyHelp} onChangeText={setPolicyHelp} />

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Privacy Policy</Text>
              <TextInput style={[styles.inputBox, { height: 80, textAlignVertical: "top", paddingTop: 8 }]} multiline value={policyPrivacy} onChangeText={setPolicyPrivacy} />

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Terms & Conditions</Text>
              <TextInput style={[styles.inputBox, { height: 80, textAlignVertical: "top", paddingTop: 8 }]} multiline value={policyTerms} onChangeText={setPolicyTerms} />

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Returns & Refund Policy</Text>
              <TextInput style={[styles.inputBox, { height: 80, textAlignVertical: "top", paddingTop: 8 }]} multiline value={policyReturns} onChangeText={setPolicyReturns} />
            </View>

            <TouchableOpacity style={styles.saveActionBtn} onPress={handleSavePolicies} disabled={savingSettings}>
              {savingSettings ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveActionBtnText}>Save Policy Texts</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* 4. Units Master Modal */}
      <Modal visible={unitsModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Units of Sale Master</Text>
            <TouchableOpacity onPress={() => setUnitsModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Add New Sale / Packaging Unit</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput style={[styles.inputBox, { flex: 1 }]} value={newUnitInput} onChangeText={setNewUnitInput} placeholder="e.g. sqft, box, piece, bundle, ton" />
                <TouchableOpacity style={[styles.saveActionBtn, { width: 80, marginTop: 0 }]} onPress={handleAddUnit}>
                  <Text style={styles.saveActionBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Active Measurement Units ({unitsList.length})</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                {unitsList.map((u) => (
                  <View key={u} style={styles.unitChip}>
                    <Text style={styles.unitChipText}>{u.toUpperCase()}</Text>
                    <TouchableOpacity onPress={() => handleDeleteUnit(u)}>
                      <X size={14} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* 5. Categories Master Modal */}
      <Modal visible={categoriesModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Categories & Calculators Master</Text>
            <TouchableOpacity onPress={() => setCategoriesModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Create New Category</Text>
              <TextInput style={styles.inputBox} value={newCatName} onChangeText={setNewCatName} placeholder="Category Name (e.g. Tiles & Stone)" />
              <TextInput style={[styles.inputBox, { marginTop: 8 }]} value={newCatSlug} onChangeText={setNewCatSlug} placeholder="Slug (optional, e.g. tiles-stone)" />
              <TextInput style={[styles.inputBox, { marginTop: 8 }]} value={newCatImage} onChangeText={setNewCatImage} placeholder="Banner Image URL" />
              
              <TouchableOpacity style={styles.checkRow} onPress={() => setNewCatHasCalc(!newCatHasCalc)}>
                <View style={[styles.checkbox, newCatHasCalc && styles.checkboxActive]}>
                  {newCatHasCalc && <CheckCircle2 size={14} color="#FFF" />}
                </View>
                <Text style={styles.checkLabel}>Enable Tile Area-to-Box Calculator</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.saveActionBtn, { marginTop: 12 }]} onPress={handleCreateCategory}>
                <Text style={styles.saveActionBtnText}>+ Add Category</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Existing Categories ({categories.length})</Text>
            {categories.map((c) => (
              <View key={c.id} style={styles.listCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{c.name}</Text>
                  <Text style={styles.itemSub}>{c.slug} • {c.productsCount || 0} products</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteCategory(c.id, c.name)}>
                  <Trash2 size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* 6. Coupons Modal */}
      <Modal visible={couponsModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Coupons & Promo Codes</Text>
            <TouchableOpacity onPress={() => setCouponsModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Create New Coupon</Text>
              <TextInput style={styles.inputBox} value={newCouponCode} onChangeText={setNewCouponCode} placeholder="COUPON CODE (e.g. INTRI500)" autoCapitalize="characters" />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <TextInput style={[styles.inputBox, { flex: 1 }]} value={newCouponValue} onChangeText={setNewCouponValue} placeholder="Discount Value (₹ or %)" keyboardType="decimal-pad" />
                <TextInput style={[styles.inputBox, { flex: 1 }]} value={newCouponMinOrder} onChangeText={setNewCouponMinOrder} placeholder="Min Cart (₹)" keyboardType="decimal-pad" />
              </View>

              <TouchableOpacity style={[styles.saveActionBtn, { marginTop: 12 }]} onPress={handleCreateCoupon}>
                <Text style={styles.saveActionBtnText}>+ Create Coupon</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Active Coupons ({coupons.length})</Text>
            {coupons.map((cp: any) => (
              <View key={cp.id} style={styles.listCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{cp.code}</Text>
                  <Text style={styles.itemSub}>{cp.discountType === "percentage" ? `${cp.value}% OFF` : `₹${cp.value} FLAT OFF`} • Min Order ₹{cp.minOrderAmount || 0}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteCoupon(cp.id, cp.code)}>
                  <Trash2 size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* 7. CMS & Banners Modal */}
      <Modal visible={cmsModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Homepage Offer Banners</Text>
            <TouchableOpacity onPress={() => setCmsModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Create Promotional Banner</Text>
              <TextInput style={styles.inputBox} value={newBannerTitle} onChangeText={setNewBannerTitle} placeholder="Banner Headline" />
              <TextInput style={[styles.inputBox, { marginTop: 8 }]} value={newBannerSubtitle} onChangeText={setNewBannerSubtitle} placeholder="Subtitle copy" />
              <TextInput style={[styles.inputBox, { marginTop: 8 }]} value={newBannerImage} onChangeText={setNewBannerImage} placeholder="Banner Image URL" />
              <TextInput style={[styles.inputBox, { marginTop: 8 }]} value={newBannerCta} onChangeText={setNewBannerCta} placeholder="Destination CTA Link (e.g. /shop/tiles)" />

              <TouchableOpacity style={[styles.saveActionBtn, { marginTop: 12 }]} onPress={handleCreateBanner}>
                <Text style={styles.saveActionBtnText}>+ Publish Banner</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Live Banners ({banners.length})</Text>
            {banners.map((b: any) => (
              <View key={b.id} style={styles.listCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{b.title}</Text>
                  <Text style={styles.itemSub}>{b.subtitle || b.linkUrl}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteBanner(b.id)}>
                  <Trash2 size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* 8. Reviews Modal */}
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
              <View style={{ padding: 24, alignItems: "center" }}>
                <Text style={{ color: "#64748B", fontSize: 13 }}>No pending customer reviews to moderate.</Text>
              </View>
            ) : (
              reviews.map((r: any) => (
                <View key={r.id} style={styles.listCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{r.product?.name || "Product"}</Text>
                    <Text style={styles.itemSub}>Rating: {r.rating} ⭐ • By {r.user?.name || "Customer"}</Text>
                    <Text style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>"{r.comment}"</Text>
                  </View>
                  <TouchableOpacity onPress={async () => { await deleteAdminReview(r.id); refetchReviews(); }}>
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))
            )}
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
  contentContainer: {
    padding: SPACING.md,
    paddingTop: 54,
    gap: 12,
    paddingBottom: 50,
  },
  profileHeaderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...SHADOWS.sm,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#F1F5F9",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#052A51",
  },
  profileEmail: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#1E40AF",
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    gap: 6,
    marginTop: 14,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#052A51",
    marginTop: 10,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
    ...SHADOWS.sm,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#052A51",
  },
  menuSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutBtnText: {
    fontSize: 14,
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
  closeBtn: {
    padding: 6,
  },
  modalContent: {
    padding: 16,
    gap: 12,
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
  lockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    backgroundColor: "#F1F5F9",
    padding: 10,
    borderRadius: 8,
  },
  lockedText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  saveActionBtn: {
    backgroundColor: "#052A51",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  saveActionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  unitChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  unitChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
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
});
