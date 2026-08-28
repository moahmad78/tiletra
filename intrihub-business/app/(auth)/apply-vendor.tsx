import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Tag,
  FileText,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  MessageCircle,
  HelpCircle,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

const CATEGORIES = [
  "Groceries & Supermarket",
  "Electronics & Appliances",
  "Fashion & Apparel",
  "Home Decor & Furniture",
  "Hardware & Sanitary",
  "Pharmacy & Wellness",
  "Stationery & Gifts",
  "Other Wholesale / Retail",
];

export default function ApplyVendorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [gstin, setGstin] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [appRefNumber, setAppRefNumber] = useState("");

  const handleSubmit = async () => {
    if (!businessName.trim() || !ownerName.trim() || !phone.trim()) {
      Alert.alert(
        "Required Fields",
        "Please enter your Business Name, Contact Person, and Phone Number."
      );
      return;
    }

    if (phone.trim().length < 10) {
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);

    try {
      // Generate application reference number
      const refNum = `INT-VND-${Math.floor(100000 + Math.random() * 900000)}`;
      setAppRefNumber(refNum);

      // Simulate sending to backend / webhook
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setSubmitted(true);
    } catch (e) {
      Alert.alert("Error", "Could not submit application. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  const openWhatsAppSupport = () => {
    const text = encodeURIComponent(
      `Hello Intrihub Team, I submitted vendor application ${appRefNumber || ""} for ${businessName || "my business"}. Please assist me with onboarding.`
    );
    Linking.openURL(`https://wa.me/919264920211?text=${text}`).catch(() => {
      Alert.alert("WhatsApp", "Please reach out to vendor@intrihub.com");
    });
  };

  const handleEmailSupport = () => {
    Linking.openURL(
      `mailto:vendor@intrihub.com?subject=Vendor%20Application%20Inquiry%20-%20${encodeURIComponent(appRefNumber || businessName || "")}`
    ).catch(() => {
      Alert.alert("Email Support", "Email us at vendor@intrihub.com");
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vendor Partner Application</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
        keyboardShouldPersistTaps="handled"
      >
        {submitted ? (
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={48} color="#10B981" />
            </View>

            <Text style={styles.successTitle}>Application Submitted!</Text>
            <Text style={styles.successSubtitle}>
              Thank you for applying to sell on Intrihub Quickcommerce. Our partner onboarding
              executive will verify your details and activate your store within 24 hours.
            </Text>

            <View style={styles.refBox}>
              <Text style={styles.refLabel}>APPLICATION REFERENCE NUMBER</Text>
              <Text style={styles.refCode}>{appRefNumber}</Text>
            </View>

            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={openWhatsAppSupport}
              activeOpacity={0.85}
            >
              <MessageCircle size={20} color="#FFFFFF" />
              <Text style={styles.whatsappBtnText}>Connect via WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emailBtn}
              onPress={handleEmailSupport}
              activeOpacity={0.85}
            >
              <Mail size={18} color="#052A51" />
              <Text style={styles.emailBtnText}>Email Onboarding (vendor@intrihub.com)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.returnBtn}
              onPress={() => router.replace("/(auth)/login" as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.returnBtnText}>Return to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formCard}>
            <View style={styles.heroBadge}>
              <Sparkles size={16} color={COLORS.accentOrange} />
              <Text style={styles.heroBadgeText}>JOIN INTRIHUB QUICKCOMMERCE</Text>
            </View>

            <Text style={styles.formHeading}>Grow Your Retail Business</Text>
            <Text style={styles.formSubtitle}>
              Reach thousands of hyper-local buyers with instant 10-20 min dispatch and verified logistics.
            </Text>

            {/* Business Name */}
            <Text style={styles.inputLabel}>Business / Store Name *</Text>
            <View style={styles.inputWrapper}>
              <Building2 size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. IntriHub Store"
                placeholderTextColor={COLORS.textTertiary}
                value={businessName}
                onChangeText={setBusinessName}
              />
            </View>

            {/* Owner / Contact Name */}
            <Text style={styles.inputLabel}>Contact Person / Owner Name *</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. IntriHub"
                placeholderTextColor={COLORS.textTertiary}
                value={ownerName}
                onChangeText={setOwnerName}
              />
            </View>

            {/* Phone Number */}
            <Text style={styles.inputLabel}>Mobile / WhatsApp Number *</Text>
            <View style={styles.inputWrapper}>
              <Phone size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor={COLORS.textTertiary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            {/* Email Address */}
            <Text style={styles.inputLabel}>Business Email (Optional)</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="store@company.com"
                placeholderTextColor={COLORS.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* City / Area */}
            <Text style={styles.inputLabel}>Store City & Area *</Text>
            <View style={styles.inputWrapper}>
              <MapPin size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Indiranagar, Bengaluru"
                placeholderTextColor={COLORS.textTertiary}
                value={city}
                onChangeText={setCity}
              />
            </View>

            {/* Category */}
            <Text style={styles.inputLabel}>Primary Business Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catPill, isSelected && styles.catPillSelected]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.catPillText, isSelected && styles.catPillTextSelected]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* GSTIN / Trade License */}
            <Text style={styles.inputLabel}>GSTIN / Business Registration (Optional)</Text>
            <View style={styles.inputWrapper}>
              <FileText size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 29ABCDE1234F1Z5"
                placeholderTextColor={COLORS.textTertiary}
                value={gstin}
                onChangeText={setGstin}
                autoCapitalize="characters"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Partner Application</Text>
              )}
            </TouchableOpacity>

            {/* Help / Executive Link */}
            <TouchableOpacity
              style={styles.helpLink}
              onPress={() => router.push("/(auth)/support" as any)}
              activeOpacity={0.8}
            >
              <HelpCircle size={16} color={COLORS.primary} />
              <Text style={styles.helpLinkText}>Need help with registration? Contact Executive</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#052A51",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    ...SHADOWS.card,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(234, 88, 12, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.accentOrange,
    letterSpacing: 0.5,
  },
  formHeading: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  catScroll: {
    flexDirection: "row",
    marginVertical: 6,
  },
  catPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  catPillSelected: {
    backgroundColor: "rgba(5, 42, 81, 0.08)",
    borderColor: "#052A51",
  },
  catPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  catPillTextSelected: {
    color: "#052A51",
    fontWeight: "700",
  },
  submitBtn: {
    backgroundColor: COLORS.accentOrange,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    ...SHADOWS.button,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  helpLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
  },
  helpLinkText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  successCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    ...SHADOWS.card,
    marginTop: 20,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 20,
  },
  refBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  refLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textTertiary,
    letterSpacing: 0.8,
  },
  refCode: {
    fontSize: 20,
    fontWeight: "800",
    color: "#052A51",
    marginTop: 4,
    letterSpacing: 1.5,
  },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    height: 50,
    borderRadius: 16,
    width: "100%",
    gap: 8,
    marginBottom: 12,
  },
  whatsappBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  emailBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    height: 50,
    borderRadius: 16,
    width: "100%",
    gap: 8,
    marginBottom: 12,
  },
  emailBtnText: {
    color: "#052A51",
    fontSize: 14,
    fontWeight: "700",
  },
  returnBtn: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  returnBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});
