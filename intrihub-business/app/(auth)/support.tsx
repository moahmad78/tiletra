import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Headphones,
  PhoneCall,
  MessageSquare,
  Mail,
  Clock,
  ShieldCheck,
  Building2,
  ExternalLink,
  ChevronRight,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function PartnerSupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleCallExecutive = () => {
    Linking.openURL("tel:+919264920211").catch(() => {
      Alert.alert("Call Support", "Partner Helpline: +91 9264920211");
    });
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      "Hello Intrihub Partner Support, I am a vendor / store owner and need assistance with my account."
    );
    Linking.openURL(`https://wa.me/919264920211?text=${text}`).catch(() => {
      Alert.alert("WhatsApp", "Please message our support team on WhatsApp at +91 9264920211");
    });
  };

  const handleEmail = () => {
    Linking.openURL("mailto:support@intrihub.com?subject=Intrihub Business Support Query").catch(() => {
      Alert.alert("Email Support", "Email us at support@intrihub.com");
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner & Executive Desk</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <Headphones size={36} color={COLORS.accentOrange} />
          </View>
          <Text style={styles.heroTitle}>Dedicated Business Support</Text>
          <Text style={styles.heroSubtitle}>
            Our Key Account Managers and Partner Operations Executives are available 24/7 to assist with onboarding, catalogue listing, payouts, and order dispatch.
          </Text>

          <View style={styles.timingBadge}>
            <Clock size={14} color="#10B981" />
            <Text style={styles.timingBadgeText}>Executive Desk: Active 24/7</Text>
          </View>
        </View>

        {/* Contact Channels */}
        <Text style={styles.sectionHeading}>DIRECT EXECUTIVE CHANNELS</Text>

        {/* Phone Call */}
        <TouchableOpacity
          style={styles.channelCard}
          onPress={handleCallExecutive}
          activeOpacity={0.85}
        >
          <View style={[styles.channelIconBox, { backgroundColor: "rgba(5, 42, 81, 0.08)" }]}>
            <PhoneCall size={22} color="#052A51" />
          </View>
          <View style={styles.channelInfo}>
            <Text style={styles.channelTitle}>Call Key Account Manager</Text>
            <Text style={styles.channelDesc}>Immediate assistance for urgent dispatch & order issues</Text>
            <Text style={styles.channelContact}>+91 9264920211</Text>
          </View>
          <ChevronRight size={20} color={COLORS.textTertiary} />
        </TouchableOpacity>

        {/* WhatsApp Executive */}
        <TouchableOpacity
          style={styles.channelCard}
          onPress={handleWhatsApp}
          activeOpacity={0.85}
        >
          <View style={[styles.channelIconBox, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
            <MessageSquare size={22} color="#10B981" />
          </View>
          <View style={styles.channelInfo}>
            <Text style={styles.channelTitle}>WhatsApp Partner Desk</Text>
            <Text style={styles.channelDesc}>Fast resolution for product catalogs, pricing & stock</Text>
            <Text style={[styles.channelContact, { color: "#10B981" }]}>Chat on WhatsApp</Text>
          </View>
          <ChevronRight size={20} color={COLORS.textTertiary} />
        </TouchableOpacity>

        {/* Email Support */}
        <TouchableOpacity
          style={styles.channelCard}
          onPress={handleEmail}
          activeOpacity={0.85}
        >
          <View style={[styles.channelIconBox, { backgroundColor: "rgba(234, 88, 12, 0.1)" }]}>
            <Mail size={22} color={COLORS.accentOrange} />
          </View>
          <View style={styles.channelInfo}>
            <Text style={styles.channelTitle}>Partner Email Helpdesk</Text>
            <Text style={styles.channelDesc}>For agreements, GST reconciliation & bank payouts</Text>
            <Text style={[styles.channelContact, { color: COLORS.accentOrange }]}>support@intrihub.com</Text>
          </View>
          <ChevronRight size={20} color={COLORS.textTertiary} />
        </TouchableOpacity>

        {/* Apply Link Banner */}
        <View style={styles.applyBanner}>
          <Building2 size={24} color="#052A51" />
          <View style={{ flex: 1 }}>
            <Text style={styles.applyBannerTitle}>Not an onboarded partner yet?</Text>
            <Text style={styles.applyBannerDesc}>Submit your store details to start selling within 24 hours.</Text>
          </View>
          <TouchableOpacity
            style={styles.applyBannerBtn}
            onPress={() => router.push("/(auth)/apply-vendor" as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.applyBannerBtnText}>Apply Now</Text>
          </TouchableOpacity>
        </View>

        {/* Security & Verification Assurance */}
        <View style={styles.securityNote}>
          <ShieldCheck size={18} color={COLORS.textSecondary} />
          <Text style={styles.securityNoteText}>
            Intrihub Business uses encrypted communication channels. Official representatives will never ask for your account password or banking PINs.
          </Text>
        </View>
      </ScrollView>
    </View>
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
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    marginBottom: 20,
    ...SHADOWS.card,
  },
  heroIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(234, 88, 12, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
  },
  timingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  timingBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  channelCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    ...SHADOWS.card,
  },
  channelIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  channelInfo: {
    flex: 1,
  },
  channelTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  channelDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  channelContact: {
    fontSize: 13,
    fontWeight: "700",
    color: "#052A51",
    marginTop: 4,
  },
  applyBanner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  applyBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  applyBannerDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  applyBannerBtn: {
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  applyBannerBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: 14,
    borderRadius: 16,
    gap: 10,
  },
  securityNoteText: {
    flex: 1,
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 16,
  },
});
