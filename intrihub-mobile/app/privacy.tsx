import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, PhoneCall } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../src/constants/theme";
import { SUPPORT_PHONE } from "../src/constants/config";

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <Text style={styles.headerSubtitle}>Intrihub Marketplace</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Card */}
        <View style={[styles.bannerCard, SHADOWS.sm]}>
          <View style={styles.shieldCircle}>
            <ShieldCheck size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.bannerHeading}>Your Privacy Matters</Text>
          <Text style={styles.bannerSub}>
            Effective Date: August 2026 • Version 1.0
          </Text>
          <Text style={styles.bannerDescription}>
            At Intrihub, we respect your personal data and ensure all interior supply transactions and delivery details remain encrypted and secure.
          </Text>
        </View>

        {/* Policy Content Sections */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Eye size={18} color={COLORS.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          </View>
          <Text style={styles.sectionBody}>
            We collect information provided directly by you when creating an account, browsing products, or placing construction supply orders, including:
          </Text>
          <Text style={styles.bulletPoint}>• Full Name and optional Business/Firm Name</Text>
          <Text style={styles.bulletPoint}>• Delivery Address, Site Landmark, and Pincode</Text>
          <Text style={styles.bulletPoint}>• Contact Phone Number and Verified Email Address</Text>
          <Text style={styles.bulletPoint}>• Order history and product specifications (size, finish, tile area)</Text>
          <Text style={styles.noteBox}>
            <Lock size={14} color={COLORS.accentGreen} style={{ marginRight: 4 }} />
            Payment credentials (Card / UPI / NetBanking) are processed securely directly through RBI-authorized payment gateways (Razorpay) and are never stored on our servers.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <FileText size={18} color={COLORS.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>2. How We Use Your Data</Text>
          </View>
          <Text style={styles.sectionBody}>
            Your information is strictly used for core marketplace operations:
          </Text>
          <Text style={styles.bulletPoint}>• Fast order processing, material packaging, and freight dispatch</Text>
          <Text style={styles.bulletPoint}>• Direct coordination between local verified drivers and your delivery site</Text>
          <Text style={styles.bulletPoint}>• Real-time SMS, WhatsApp, and push notifications for order progress</Text>
          <Text style={styles.bulletPoint}>• Dedicated customer support and returns/exchange verification</Text>
          <Text style={styles.sectionBody}>
            We do not sell, rent, or trade your personal information to third-party telemarketers or advertising networks.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Lock size={18} color={COLORS.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>3. Security & Data Protection</Text>
          </View>
          <Text style={styles.sectionBody}>
            All network communication between the Intrihub mobile app and our servers is secured using enterprise-grade 256-bit SSL/TLS encryption. Sensitive authentication tokens are stored securely in your device's native hardware-backed keystore.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <PhoneCall size={18} color={COLORS.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>4. Contact & Support</Text>
          </View>
          <Text style={styles.sectionBody}>
            If you have questions regarding this Privacy Policy or wish to request data updates, please contact our support team:
          </Text>
          <Text style={styles.contactLine}>
            <Text style={{ fontWeight: "700", color: COLORS.primary }}>Phone / WhatsApp: </Text>
            +91 {SUPPORT_PHONE}
          </Text>
          <Text style={styles.contactLine}>
            <Text style={{ fontWeight: "700", color: COLORS.primary }}>Customer Support: </Text>
            support@intrihub.com
          </Text>
          <Text style={styles.contactLine}>
            <Text style={{ fontWeight: "700", color: COLORS.primary }}>Corporate Info: </Text>
            info@intrihub.com
          </Text>
          <Text style={styles.contactLine}>
            <Text style={{ fontWeight: "700", color: COLORS.primary }}>Website: </Text>
            https://www.intrihub.com
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 8 : 16,
    paddingBottom: 14,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  bannerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    alignItems: "center",
  },
  shieldCircle: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(5, 42, 81, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  bannerHeading: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.accentOrange,
    marginBottom: 10,
  },
  bannerDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 19,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },
  sectionBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 12.5,
    color: COLORS.text,
    lineHeight: 20,
    marginLeft: 6,
    marginBottom: 4,
  },
  noteBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "rgba(5, 150, 105, 0.08)",
    borderRadius: RADIUS.md,
    fontSize: 12,
    color: "#065f46",
    lineHeight: 18,
    fontWeight: "600",
  },
  contactLine: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
});
