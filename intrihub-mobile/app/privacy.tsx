import React, { useState } from "react";
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
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  PhoneCall,
  Scale,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Zap,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../src/constants/theme";
import { SUPPORT_PHONE } from "../src/constants/config";

type PolicyTab = "privacy" | "terms" | "returns" | "delivery";

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PolicyTab>("privacy");

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
          <Text style={styles.headerTitle}>Legal &amp; Policies</Text>
          <Text style={styles.headerSubtitle}>Intrihub Marketplace • Pan-India</Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "privacy" && styles.tabButtonActive]}
            onPress={() => setActiveTab("privacy")}
            activeOpacity={0.8}
          >
            <ShieldCheck size={14} color={activeTab === "privacy" ? "#FFFFFF" : COLORS.textSecondary} />
            <Text style={[styles.tabButtonText, activeTab === "privacy" && styles.tabButtonTextActive]}>
              Privacy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "terms" && styles.tabButtonActive]}
            onPress={() => setActiveTab("terms")}
            activeOpacity={0.8}
          >
            <Scale size={14} color={activeTab === "terms" ? "#FFFFFF" : COLORS.textSecondary} />
            <Text style={[styles.tabButtonText, activeTab === "terms" && styles.tabButtonTextActive]}>
              Terms
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "returns" && styles.tabButtonActive]}
            onPress={() => setActiveTab("returns")}
            activeOpacity={0.8}
          >
            <RotateCcw size={14} color={activeTab === "returns" ? "#FFFFFF" : COLORS.textSecondary} />
            <Text style={[styles.tabButtonText, activeTab === "returns" && styles.tabButtonTextActive]}>
              Returns
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "delivery" && styles.tabButtonActive]}
            onPress={() => setActiveTab("delivery")}
            activeOpacity={0.8}
          >
            <Truck size={14} color={activeTab === "delivery" ? "#FFFFFF" : COLORS.textSecondary} />
            <Text style={[styles.tabButtonText, activeTab === "delivery" && styles.tabButtonTextActive]}>
              Delivery
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TAB 1: PRIVACY POLICY */}
        {activeTab === "privacy" && (
          <>
            <View style={[styles.bannerCard, SHADOWS.sm]}>
              <View style={styles.shieldCircle}>
                <ShieldCheck size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.bannerHeading}>Privacy &amp; Data Protection</Text>
              <Text style={styles.bannerSub}>
                Effective: September 2026 • Version 2.0 (DPDPA Compliant)
              </Text>
              <Text style={styles.bannerDescription}>
                IntriHub&apos;s only official website is www.intrihub.com. We adhere to India&apos;s Digital Personal Data Protection Act and never sell or rent your personal data.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Eye size={18} color={COLORS.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>1. Information We Collect</Text>
              </View>
              <Text style={styles.sectionBody}>
                We collect information provided directly by you when creating an account, browsing products, or placing construction supply orders:
              </Text>
              <Text style={styles.bulletPoint}>• Full Name and optional Business/Firm Name</Text>
              <Text style={styles.bulletPoint}>• Delivery Address, Site Landmark, and Delivery Pincode</Text>
              <Text style={styles.bulletPoint}>• Contact Phone Number and Verified Email Address</Text>
              <Text style={styles.bulletPoint}>• Order history and technical material specifications</Text>
              <Text style={styles.noteBox}>
                <Lock size={14} color={COLORS.accentGreen} style={{ marginRight: 4 }} />
                Payment credentials (Card / UPI / NetBanking) are processed directly through 256-bit SSL encrypted PCI-DSS certified gateways (Razorpay) and are never stored on IntriHub servers.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <FileText size={18} color={COLORS.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>2. How We Use Your Data</Text>
              </View>
              <Text style={styles.sectionBody}>
                Your information is used strictly for core marketplace operations:
              </Text>
              <Text style={styles.bulletPoint}>• Fast order processing, pallet packaging, and dispatch routing</Text>
              <Text style={styles.bulletPoint}>• Automated SMS, WhatsApp, and push tracking notifications</Text>
              <Text style={styles.bulletPoint}>• Responsive customer support and transit damage claims</Text>
              <Text style={styles.bulletPoint}>• Fraud prevention and secure authentication</Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Building2 size={18} color={COLORS.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>3. Vendor Partner &amp; 3PL Logistics Data Sharing</Text>
              </View>
              <Text style={styles.sectionBody}>
                For Pan-India orders fulfilled via our nationwide network, delivery details (name, delivery address, phone number, and order contents) are shared securely with verified local vendor partners and 3PL carriers solely for the purpose of crate packaging, transit, and site drop-off.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Lock size={18} color={COLORS.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>4. Security &amp; Data Localization</Text>
              </View>
              <Text style={styles.sectionBody}>
                All network communication is encrypted using enterprise-grade 256-bit SSL/TLS 1.3 encryption. Customer data is securely maintained in Indian cloud infrastructure in compliance with the DPDPA.
              </Text>
            </View>
          </>
        )}

        {/* TAB 2: TERMS OF SERVICE */}
        {activeTab === "terms" && (
          <>
            <View style={[styles.bannerCard, SHADOWS.sm]}>
              <View style={styles.shieldCircle}>
                <Scale size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.bannerHeading}>Terms &amp; Conditions</Text>
              <Text style={styles.bannerSub}>
                Commercial Terms • Updated September 2026
              </Text>
              <Text style={styles.bannerDescription}>
                These Terms govern your purchases on the IntriHub mobile application across Bengaluru and Pan-India.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Truck size={18} color={COLORS.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>1. Pan-India Delivery Timelines</Text>
              </View>
              <Text style={styles.sectionBody}>
                IntriHub operates a dual delivery model:
              </Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Bengaluru</Text>: 60-minute instant delivery via local micro-dark stores.</Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Rest of India</Text>: 3 to 7 business days standard delivery nationwide, transitioning city-by-city to 60-minute delivery as local vendor partners go live.</Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Building2 size={18} color={COLORS.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>2. Vendor Partner Fulfillment</Text>
              </View>
              <Text style={styles.sectionBody}>
                In regions outside Bengaluru, orders may be fulfilled by certified vendor partners. IntriHub maintains platform-wide quality controls, GST invoice generation, and transit damage guarantees.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <AlertTriangle size={18} color={COLORS.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>3. Order Cancellation Windows</Text>
              </View>
              <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Bengaluru Instant Orders</Text>: Can be cancelled within 10 minutes prior to dark-store vehicle dispatch.</Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Pan-India (3–7 Day) Orders</Text>: Can be cancelled within 12 hours prior to factory crate packaging and 3PL carrier pickup.</Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Scale size={18} color={COLORS.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>4. Governing Law &amp; Jurisdiction</Text>
              </View>
              <Text style={styles.sectionBody}>
                All commercial transactions shall be governed by the laws of India. Any legal proceedings shall be subject to the exclusive jurisdiction of the competent courts in <Text style={styles.boldText}>Bengaluru, Karnataka</Text>.
              </Text>
            </View>
          </>
        )}

        {/* TAB 3: RETURNS & REPLACEMENTS */}
        {activeTab === "returns" && (
          <>
            <View style={[styles.bannerCard, SHADOWS.sm]}>
              <View style={styles.shieldCircle}>
                <RotateCcw size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.bannerHeading}>Returns &amp; Replacements</Text>
              <Text style={styles.bannerSub}>
                100% Damage Protection Guarantee
              </Text>
              <Text style={styles.bannerDescription}>
                Any materials damaged during transit are replaced free of charge or refunded immediately upon photo/video verification.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <CheckCircle2 size={18} color={COLORS.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>1. 7-Day Return Window</Text>
              </View>
              <Text style={styles.sectionBody}>
                Unopened, full boxes of materials in their original manufacturer packaging can be returned within <Text style={styles.boldText}>7 calendar days</Text> of delivery. Opened or partially used cartons cannot be returned.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <ShieldCheck size={18} color={COLORS.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>2. Transit Damage Claims (48 Hours)</Text>
              </View>
              <Text style={styles.sectionBody}>
                If materials arrive damaged, take clear photos or a short video and share via WhatsApp (+91 {SUPPORT_PHONE}) within <Text style={styles.boldText}>48 hours</Text>. We immediately dispatch free replacement consignments.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <AlertTriangle size={18} color={COLORS.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>3. Bulky Material Exceptions</Text>
              </View>
              <Text style={styles.sectionBody}>
                Custom-cut stone, tinted paint mixes, and opened tile boxes are non-returnable outside Bengaluru once delivered damage-free.
              </Text>
            </View>
          </>
        )}

        {/* TAB 4: DELIVERY POLICY */}
        {activeTab === "delivery" && (
          <>
            <View style={[styles.bannerCard, SHADOWS.sm]}>
              <View style={styles.shieldCircle}>
                <Truck size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.bannerHeading}>Pan-India Delivery</Text>
              <Text style={styles.bannerSub}>
                Nationwide Building Materials Logistics
              </Text>
              <Text style={styles.bannerDescription}>
                We deliver building &amp; interior materials across all Indian states and Union Territories.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Zap size={18} color={COLORS.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>⚡ 60-Minute Delivery in Bengaluru</Text>
              </View>
              <Text style={styles.sectionBody}>
                Hyperlocal instant site delivery powered by our network of local micro-dark stores and direct manufacturer dispatch hubs across Bengaluru.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Truck size={18} color={COLORS.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>🚚 Pan-India Delivery — 3 to 7 Days</Text>
              </View>
              <Text style={styles.sectionBody}>
                Outside Bengaluru, we deliver factory-direct across all 28 states and Union Territories within 3 to 7 business days with pallet protection and live tracking.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Building2 size={18} color={COLORS.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>🏗️ City-by-City Expansion</Text>
              </View>
              <Text style={styles.sectionBody}>
                We are actively onboarding regional vendor partners nationwide. As local fulfillment goes live in each city, delivery accelerates to 60 minutes.
              </Text>
            </View>
          </>
        )}

        {/* Support & Contact Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <PhoneCall size={18} color={COLORS.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Support &amp; Contact</Text>
          </View>
          <Text style={styles.sectionBody}>
            For legal inquiries, returns assistance, or bulk order delivery timelines:
          </Text>
          <Text style={styles.contactLine}>
            <Text style={styles.contactLabel}>Phone / WhatsApp: </Text>
            +91 {SUPPORT_PHONE}
          </Text>
          <Text style={styles.contactLine}>
            <Text style={styles.contactLabel}>Customer Support: </Text>
            support@intrihub.com
          </Text>
          <Text style={styles.contactLine}>
            <Text style={styles.contactLabel}>Corporate Legal: </Text>
            info@intrihub.com
          </Text>
          <Text style={styles.contactLine}>
            <Text style={styles.contactLabel}>Website: </Text>
            https://www.intrihub.com
          </Text>
        </View>

        <View style={{ height: 40 }} />
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
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  tabContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
  },
  tabScrollContent: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  bannerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  shieldCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(242, 101, 34, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  bannerHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  bannerSub: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "700",
    marginTop: 2,
    marginBottom: 8,
    textAlign: "center",
  },
  bannerDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    flex: 1,
  },
  sectionBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bulletPoint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    paddingLeft: 4,
  },
  boldText: {
    fontWeight: "700",
    color: COLORS.text,
  },
  noteBox: {
    backgroundColor: "rgba(30, 158, 107, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(30, 158, 107, 0.2)",
    borderRadius: RADIUS.md,
    padding: 10,
    fontSize: 12,
    color: "#065f46",
    lineHeight: 18,
    marginTop: 6,
  },
  contactLine: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  contactLabel: {
    fontWeight: "700",
    color: COLORS.primary,
  },
});
