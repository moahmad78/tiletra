import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Linking,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  User,
  MapPin,
  Heart,
  Bell,
  Headphones,
  PhoneCall,
  MessageCircle,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Edit2,
  Camera,
  X,
  Check,
} from "lucide-react-native";
import { useAuthStore } from "../../src/store/authStore";
import { getProfile, updateProfile, uploadAvatarImage } from "../../src/api/auth";
import { AddressModal } from "../../src/components/AddressModal";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, setUser, logout } = useAuthStore();
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [orderPushEnabled, setOrderPushEnabled] = useState(true);

  // Edit Profile Form State
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Sync latest user profile on mount if logged in
  useEffect(() => {
    if (isAuthenticated) {
      getProfile()
        .then((res) => {
          if (res.success && res.user) {
            setUser(res.user);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleOpenEditModal = () => {
    if (user) {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      const currentPhone =
        user.phone && !user.phone.startsWith("google_") && !user.phone.startsWith("email_")
          ? user.phone
          : "";
      setEditPhone(currentPhone);
      setEditAvatar(user.avatar || "");
      setEditProfileModalVisible(true);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Gallery permission is required to select a profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const asset = result.assets[0];
        setUploadingAvatar(true);
        const res = await uploadAvatarImage(
          asset.uri,
          asset.fileName || `avatar-${Date.now()}.jpg`,
          asset.mimeType || "image/jpeg"
        );
        setUploadingAvatar(false);

        if (res.success && res.url) {
          setEditAvatar(res.url);
        } else {
          Alert.alert("Upload Error", res.error || "Failed to upload photo.");
        }
      }
    } catch (e: any) {
      setUploadingAvatar(false);
      Alert.alert("Error", e?.message || "Could not pick image");
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Name Required", "Please enter your name.");
      return;
    }

    if (editPhone.trim()) {
      const digits = editPhone.trim().replace(/\D/g, "");
      if (digits.length !== 10) {
        Alert.alert("Invalid Phone", "Please enter a valid 10-digit mobile number.");
        return;
      }
    }

    setSavingProfile(true);
    try {
      const res = await updateProfile({
        name: editName.trim(),
        email: editEmail.trim() || undefined,
        phone: editPhone.trim() || undefined,
        avatar: editAvatar || undefined,
      });

      if (res.success && res.user) {
        setUser(res.user);
        setEditProfileModalVisible(false);
        Alert.alert("Profile Updated", "Your profile details have been saved successfully.");
      } else {
        Alert.alert("Update Failed", res.error || "Could not update profile details.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSupportCall = () => {
    Linking.openURL("tel:9264920211");
  };

  const handleSupportWhatsApp = () => {
    Linking.openURL("https://wa.me/919264920211?text=Hello%20Intrihub%20Support");
  };

  const handlePrivacyPolicy = () => {
    router.push("/privacy" as any);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        {isAuthenticated && user ? (
          <View style={[styles.userCard, SHADOWS.sm]}>
            <View style={styles.userCardMain}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : "U"}
                  </Text>
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name || "Intrihub Customer"}</Text>
                {user.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
                {user.phone && !user.phone.startsWith("google_") && !user.phone.startsWith("email_") ? (
                  <Text style={styles.userPhone}>+91 {user.phone}</Text>
                ) : null}
              </View>

              {/* Edit Profile Button */}
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={handleOpenEditModal}
                activeOpacity={0.8}
              >
                <Edit2 size={15} color={COLORS.primary} />
                <Text style={styles.editProfileBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.guestCard, SHADOWS.sm]}>
            <Text style={styles.guestTitle}>Sign In for the Best Experience</Text>
            <Text style={styles.guestSub}>
              Manage orders, save delivery addresses, and receive fast updates
            </Text>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push("/(auth)/login")}
            >
              <Text style={styles.loginBtnText}>Sign In / Register</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Section: Account Actions */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupTitle}>ACCOUNT & PREFERENCES</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/wishlist" as any)}
          >
            <View style={styles.menuLeft}>
              <Heart size={20} color={COLORS.accentOrange} />
              <Text style={styles.menuLabel}>My Wishlist</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              if (isAuthenticated) {
                setAddressModalVisible(true);
              } else {
                router.push("/(auth)/login");
              }
            }}
          >
            <View style={styles.menuLeft}>
              <MapPin size={20} color={COLORS.primary} />
              <Text style={styles.menuLabel}>Saved Delivery Addresses</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Bell size={20} color={COLORS.primary} />
              <Text style={styles.menuLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={orderPushEnabled}
              onValueChange={setOrderPushEnabled}
              trackColor={{ false: COLORS.surfaceTertiary, true: COLORS.primary }}
              thumbColor={COLORS.surface}
            />
          </View>
        </View>

        {/* Section: Help & Support */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupTitle}>HELP & CUSTOMER SUPPORT</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/support" as any)}
            activeOpacity={0.75}
          >
            <View style={styles.menuLeft}>
              <Headphones size={22} color={COLORS.accentGreen} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.menuLabel}>Customer Support 24*7</Text>
                <Text style={styles.supportSubText}>WhatsApp, Helpline & FAQs</Text>
              </View>
            </View>
            <View style={styles.badge247}>
              <Text style={styles.badge247Text}>24*7</Text>
              <ChevronRight size={16} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyPolicy}>
            <View style={styles.menuLeft}>
              <ShieldCheck size={20} color={COLORS.primary} />
              <Text style={styles.menuLabel}>Privacy Policy & Terms</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        {isAuthenticated && (
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
            <LogOut size={18} color={COLORS.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        )}

        <View style={styles.appInfo}>
          <Text style={styles.versionText}>Intrihub Mobile v1.0.0 (Android)</Text>
          <Text style={styles.copyrightText}>© 2026 Intrihub Technologies Private Limited</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editProfileModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => setEditProfileModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Avatar Picker */}
              <View style={styles.avatarPickerSection}>
                <TouchableOpacity
                  style={styles.avatarPickerWrapper}
                  onPress={handlePickAvatar}
                  disabled={uploadingAvatar}
                  activeOpacity={0.8}
                >
                  {editAvatar ? (
                    <Image source={{ uri: editAvatar }} style={styles.modalAvatarImg} contentFit="cover" />
                  ) : (
                    <View style={styles.modalAvatarPlaceholder}>
                      <Text style={styles.modalAvatarInitial}>
                        {editName ? editName.charAt(0).toUpperCase() : "U"}
                      </Text>
                    </View>
                  )}
                  <View style={styles.cameraIconBadge}>
                    {uploadingAvatar ? (
                      <ActivityIndicator size="small" color={COLORS.textWhite} />
                    ) : (
                      <Camera size={14} color={COLORS.textWhite} />
                    )}
                  </View>
                </TouchableOpacity>
                <Text style={styles.avatarPickerHint}>Tap to change photo</Text>
              </View>

              {/* Name Field */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Full Name</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.textMuted}
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>

              {/* Email Field */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Email Address</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="Enter your email address"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={editEmail}
                  onChangeText={setEditEmail}
                />
              </View>

              {/* Phone Field (Editable) */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Phone Number (+91)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={editPhone}
                  onChangeText={setEditPhone}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.modalSaveBtn, savingProfile && styles.modalSaveBtnDisabled]}
                onPress={handleSaveProfile}
                disabled={savingProfile}
                activeOpacity={0.85}
              >
                {savingProfile ? (
                  <ActivityIndicator size="small" color={COLORS.textWhite} />
                ) : (
                  <>
                    <Check size={18} color={COLORS.textWhite} />
                    <Text style={styles.modalSaveBtnText}>Save Profile Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Address Modal */}
      <AddressModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        onSelectAddress={() => {}}
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
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 10 : 16,
    paddingBottom: 14,
    paddingHorizontal: SPACING.lg,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textWhite,
  },
  scroll: {
    flex: 1,
  },
  userCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userCardMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
  },
  avatarInitial: {
    color: COLORS.textWhite,
    fontSize: 22,
    fontWeight: "800",
  },
  userInfo: {
    marginLeft: 14,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  userPhone: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },
  guestCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  guestTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  guestSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  loginBtnText: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: "800",
  },
  menuGroup: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: RADIUS.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginLeft: 12,
  },
  supportSubText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  badge247: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  badge247Text: {
    fontSize: 10,
    fontWeight: "900",
    color: "#16a34a",
  },
  supportHint: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
  },
  appInfo: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 40,
  },
  versionText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  copyrightText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },
  modalCloseBtn: {
    padding: 4,
  },
  avatarPickerSection: {
    alignItems: "center",
    marginVertical: SPACING.md,
  },
  avatarPickerWrapper: {
    position: "relative",
  },
  modalAvatarImg: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
  },
  modalAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalAvatarInitial: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.textWhite,
  },
  cameraIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.accentOrange,
    width: 26,
    height: 26,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  avatarPickerHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
    fontWeight: "600",
  },
  modalInputGroup: {
    marginBottom: SPACING.md,
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  modalTextInput: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  readOnlyInput: {
    color: COLORS.textMuted,
    backgroundColor: "#f8fafc",
  },
  modalSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    gap: 8,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  modalSaveBtnDisabled: {
    opacity: 0.6,
  },
  modalSaveBtnText: {
    color: COLORS.textWhite,
    fontSize: 15,
    fontWeight: "800",
  },
});
