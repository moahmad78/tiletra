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
import { ArrowLeft, FileText, ShieldCheck, Users, AlertTriangle, Scale, Ban } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../src/constants/theme";
import { SUPPORT_PHONE } from "../src/constants/config";

export default function TermsOfUseScreen() {
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
          <Text style={styles.headerTitle}>Terms of Use</Text>
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
          <View style={styles.iconCircle}>
            <FileText size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.bannerHeading}>Terms of Use</Text>
          <Text style={styles.bannerSub}>
            Effective Date: August 2026 • Version 1.0
          </Text>
          <Text style={styles.bannerDescription}>
            By accessing and using the Intrihub mobile application, you agree to be bound by these Terms of Use. Please read them carefully before using our platform.
          </Text>
        </View>

        {/* Section 1 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Users size={18} color={COLORS.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>1. Account & Eligibility</Text>
          </View>
          <Text style={styles.sectionBody}>
            You must be at least 18 years old to use Intrihub. By creating an account, you represent that all information you provide is accurate and current.
          </Text>
          <Text style={styles.bulletPoint}>• One account per individual or business entity</Text>
          <Text style={styles.bulletPoint}>• You are responsible for maintaining account security</Text>
          <Text style={styles.bulletPoint}>• Sharing login credentials is not permitted</Text>
        </View>

        {/* Section 2 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Scale size={18} color={COLORS.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>2. Orders & Transactions</Text>
          </View>
          <Text style={styles.sectionBody}>
            All orders placed through Intrihub are subject to product availability and vendor confirmation. Prices displayed are in Indian Rupees (₹) and may vary based on vendor, quantity, and location.
          </Text>
          <Text style={styles.bulletPoint}>• Prices are subject to change without prior notice</Text>
          <Text style={styles.bulletPoint}>• Payment must be completed to confirm an order</Text>
          <Text style={styles.bulletPoint}>• Delivery timelines are estimates and may vary</Text>
        </View>

        {/* Section 3 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ShieldCheck size={18} color={COLORS.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>3. Product Information</Text>
          </View>
          <Text style={styles.sectionBody}>
            Intrihub strives to provide accurate product descriptions, images, and specifications. However, slight variations in color, texture, and dimensions may occur due to manufacturing processes and display settings.
          </Text>
          <Text style={styles.bulletPoint}>• Product images are for illustration purposes</Text>
          <Text style={styles.bulletPoint}>• Specifications are provided by manufacturers/vendors</Text>
          <Text style={styles.bulletPoint}>• We recommend verifying critical dimensions before purchase</Text>
        </View>

        {/* Section 4 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={18} color={COLORS.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>4. Returns & Cancellations</Text>
          </View>
          <Text style={styles.sectionBody}>
            Returns and cancellations are subject to vendor policies. Intrihub facilitates communication between buyers and vendors for dispute resolution.
          </Text>
          <Text style={styles.bulletPoint}>• Cancellation requests must be made within 24 hours of order placement</Text>
          <Text style={styles.bulletPoint}>• Damaged or defective items can be reported within 48 hours of delivery</Text>
          <Text style={styles.bulletPoint}>• Custom-made or cut-to-size products may not be returnable</Text>
        </View>

        {/* Section 5 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ban size={18} color={COLORS.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>5. Prohibited Activities</Text>
          </View>
          <Text style={styles.sectionBody}>
            Users shall not engage in any activity that disrupts or interferes with the functioning of the Intrihub platform.
          </Text>
          <Text style={styles.bulletPoint}>• Fraudulent orders or misrepresentation of identity</Text>
          <Text style={styles.bulletPoint}>• Unauthorized scraping, copying, or data extraction</Text>
          <Text style={styles.bulletPoint}>• Harassment of vendors, delivery partners, or other users</Text>
        </View>

        {/* Contact Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <FileText size={18} color={COLORS.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>6. Contact Us</Text>
          </View>
          <Text style={styles.sectionBody}>
            For questions regarding these Terms of Use, reach out to our support team:
          </Text>
          <Text style={styles.contactLine}>📞  Support: {SUPPORT_PHONE}</Text>
          <Text style={styles.contactLine}>📧  Customer Support: support@intrihub.com</Text>
          <Text style={styles.contactLine}>🏢  Corporate & Legal: info@intrihub.com</Text>
          <Text style={[styles.noteBox as any]}>
            Intrihub reserves the right to modify these Terms at any time. Continued use of the application after changes constitutes acceptance of the revised terms.
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
  iconCircle: {
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
