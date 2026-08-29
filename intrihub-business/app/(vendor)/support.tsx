import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Headphones,
  PhoneCall,
  MessageCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck,
  Building2,
  Truck,
  CreditCard,
  Package,
  RotateCcw,
  Send,
  Sparkles,
  HelpCircle,
  FileText,
  MapPin,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

interface FAQItem {
  id: string;
  category: string;
  icon: any;
  question: string;
  answer: string;
}

const VENDOR_FAQS: FAQItem[] = [
  {
    id: "1",
    category: "Payouts & Settlements",
    icon: CreditCard,
    question: "How and when do I receive payment for delivered orders?",
    answer:
      "Payouts are calculated after deducting the platform commission rate (e.g. 15%) and transferred directly to your registered bank account / UPI ID based on your settlement schedule (1, 3, or 7 days post-delivery).",
  },
  {
    id: "2",
    category: "Catalog & Approvals",
    icon: Package,
    question: "How long does it take for my new product listings to go live?",
    answer:
      "If your store has '⚡ Direct Live (Auto-Upload)' mode activated by the Super Admin, your items go live immediately! Otherwise, listings enter the Moderation Queue and are reviewed by our quality team within 2-4 business hours.",
  },
  {
    id: "3",
    category: "Dispatch & Logistics",
    icon: Truck,
    question: "How does order pickup and courier delivery work?",
    answer:
      "When a new order split is assigned, prepare and pack the material in your warehouse. IntriHub logistics fleet will arrive for pickup, or you can assign your chosen courier with the tracking/AWB number directly in the Orders tab.",
  },
  {
    id: "4",
    category: "Damaged Material & Returns",
    icon: RotateCcw,
    question: "What is the procedure if a customer reports broken tiles on arrival?",
    answer:
      "Customer damage claims must be submitted within 48 hours with unloading photos. Our QC team verifies the transit condition. Transit insurance covers genuine breakage during transit so your store remains protected.",
  },
  {
    id: "5",
    category: "GST & Invoices",
    icon: FileText,
    question: "Where can I view monthly platform commission and GST invoices?",
    answer:
      "Digital tax invoices and payout statements are generated automatically for every settlement cycle and can be downloaded anytime from your Earnings statement or requested via our finance desk.",
  },
  {
    id: "6",
    category: "Store Profile & Stock",
    icon: Building2,
    question: "How do I update my warehouse location or change out-of-stock items?",
    answer:
      "Navigate to 'My Products' to toggle stock availability (In Stock / Out of Stock) or update box counts instantly. To update your warehouse pickup address or store logo, visit the 'Store Profile' tab.",
  },
];

export default function VendorPartnerSupportScreen() {
  const router = useRouter();
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("1");
  const [queryCategory, setQueryCategory] = useState("General Support");
  const [queryMessage, setQueryMessage] = useState("");
  const [sendingQuery, setSendingQuery] = useState(false);

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      "Hello Intrihub Partner Support Desk, I am an onboarded vendor partner and need operational assistance."
    );
    Linking.openURL(`https://wa.me/919264920211?text=${text}`).catch(() => {
      Alert.alert("WhatsApp Helpline", "Message our Partner Support Desk at +91 9264920211");
    });
  };

  const handleCallExecutive = () => {
    Linking.openURL("tel:+919264920211").catch(() => {
      Alert.alert("Call Support", "Partner Hotline: +91 9264920211");
    });
  };

  const handleEmail = () => {
    Linking.openURL("mailto:support@intrihub.com?subject=Vendor%20Partner%20Operational%20Inquiry").catch(() => {
      Alert.alert("Email Support", "Email us at support@intrihub.com");
    });
  };

  const handleSendTicket = () => {
    if (!queryMessage.trim()) {
      Alert.alert("Message Required", "Please describe your query or operational issue.");
      return;
    }

    setSendingQuery(true);
    setTimeout(() => {
      setSendingQuery(false);
      setQueryMessage("");
      Alert.alert(
        "Ticket Submitted 🎉",
        "Your priority partner ticket has been logged. Our Key Account Executive will contact you via WhatsApp / Phone within 30 minutes.",
        [{ text: "OK" }]
      );
    }, 700);
  };

  const toggleFaq = (id: string) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Partner Support Desk 24*7</Text>
          <Text style={styles.headerSub}>Dedicated executive helpline & operations center</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Support Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.badge247}>
            <Sparkles size={12} color="#f97316" />
            <Text style={styles.badge247Text}>PRIORITY PARTNER DESK</Text>
          </View>
          <Text style={styles.heroHeading}>How can our Operations Team assist you?</Text>
          <Text style={styles.heroSubText}>
            Dedicated Key Account Managers & Merchant Support Executives available 24/7 for order dispatch, inventory sync, and payout settlements.
          </Text>

          <View style={styles.timingBadge}>
            <Clock size={13} color="#10B981" />
            <Text style={styles.timingBadgeText}>Executive Desk: Active 24/7 • Fast Response</Text>
          </View>
        </View>

        {/* 3 Quick Contact Channel Cards */}
        <Text style={styles.sectionTitle}>DIRECT EXECUTIVE CHANNELS</Text>
        <View style={styles.channelGrid}>
          {/* WhatsApp Direct */}
          <TouchableOpacity style={styles.channelCard} onPress={handleWhatsApp} activeOpacity={0.85}>
            <View style={[styles.channelIconBox, { backgroundColor: "#DCFCE7" }]}>
              <MessageCircle size={22} color="#16A34A" />
            </View>
            <Text style={styles.channelName}>WhatsApp Chat</Text>
            <Text style={styles.channelDesc}>Instant response for live order queries</Text>
            <View style={[styles.channelActionBtn, { backgroundColor: "#16A34A" }]}>
              <Text style={styles.channelActionBtnText}>Chat on WhatsApp</Text>
            </View>
          </TouchableOpacity>

          {/* Priority Phone Call */}
          <TouchableOpacity style={styles.channelCard} onPress={handleCallExecutive} activeOpacity={0.85}>
            <View style={[styles.channelIconBox, { backgroundColor: "#EFF6FF" }]}>
              <PhoneCall size={22} color="#1D4ED8" />
            </View>
            <Text style={styles.channelName}>Priority Hotline</Text>
            <Text style={styles.channelDesc}>+91 9264920211 (Toll-Free Helpline)</Text>
            <View style={[styles.channelActionBtn, { backgroundColor: "#052A51" }]}>
              <Text style={styles.channelActionBtnText}>Call Executive</Text>
            </View>
          </TouchableOpacity>

          {/* Official Email Desk */}
          <TouchableOpacity style={styles.channelCard} onPress={handleEmail} activeOpacity={0.85}>
            <View style={[styles.channelIconBox, { backgroundColor: "#FEF3C7" }]}>
              <Mail size={22} color="#D97706" />
            </View>
            <Text style={styles.channelName}>Official Email</Text>
            <Text style={styles.channelDesc}>support@intrihub.com for accounts & tax</Text>
            <View style={[styles.channelActionBtn, { backgroundColor: "#D97706" }]}>
              <Text style={styles.channelActionBtnText}>Send Email</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Direct Ticket Submission Form */}
        <View style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <HelpCircle size={20} color={COLORS.accentOrange} />
            <Text style={styles.ticketTitle}>Submit a Partner Support Ticket</Text>
          </View>
          <Text style={styles.ticketSub}>
            Have an urgent issue with an order split, inventory listing, or payout? Leave a message below:
          </Text>

          {/* Category Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {["General Support", "Order Dispatch", "Payouts & Bank", "Product Approval", "Damage / Returns"].map(
              (cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, queryCategory === cat && styles.categoryChipActive]}
                  onPress={() => setQueryCategory(cat)}
                >
                  <Text style={[styles.categoryChipText, queryCategory === cat && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>

          <TextInput
            style={styles.queryInput}
            multiline
            numberOfLines={4}
            value={queryMessage}
            onChangeText={setQueryMessage}
            placeholder="Type your message or order ID here (e.g. Need courier pickup for order #ORD-166009)..."
            placeholderTextColor={COLORS.textTertiary}
          />

          <TouchableOpacity
            style={styles.sendTicketBtn}
            onPress={handleSendTicket}
            disabled={sendingQuery}
            activeOpacity={0.85}
          >
            {sendingQuery ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Send size={16} color="#FFFFFF" />
                <Text style={styles.sendTicketBtnText}>Submit Priority Ticket</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Vendor Partner FAQs Accordion */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={styles.faqList}>
          {VENDOR_FAQS.map((faq) => {
            const isExpanded = expandedFaqId === faq.id;
            const IconComponent = faq.icon;
            return (
              <View key={faq.id} style={[styles.faqCard, isExpanded && styles.faqCardExpanded]}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleFaq(faq.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.faqIconBox}>
                    <IconComponent size={18} color={COLORS.accentOrange} />
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.faqCategory}>{faq.category.toUpperCase()}</Text>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={20} color={COLORS.accentOrange} />
                  ) : (
                    <ChevronDown size={20} color={COLORS.textTertiary} />
                  )}
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.faqBody}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Headquarters & Escrow Guarantee Footer */}
        <View style={styles.footerCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Building2 size={18} color="#052A51" />
            <Text style={styles.footerTitle}>IntriHub Commercial Operations HQ</Text>
          </View>
          <Text style={styles.footerAddress}>
            📍 Kumari Elite, Beguru, Landmark: Bommanahalli, Bengaluru, Karnataka - 560068
          </Text>
          <View style={styles.footerDivider} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <ShieldCheck size={16} color="#16A34A" />
            <Text style={styles.footerShieldText}>
              Official 100% Verified Merchant Escrow & Transit Insurance Protected
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    fontFamily: "Outfit-Bold",
  },
  headerSub: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroBanner: {
    backgroundColor: "#052A51",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    ...SHADOWS.md,
  },
  badge247: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(249, 115, 22, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.4)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 6,
    marginBottom: 10,
  },
  badge247Text: {
    color: "#F97316",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  heroHeading: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 24,
    marginBottom: 8,
  },
  heroSubText: {
    fontSize: 12,
    color: "#CBD5E1",
    lineHeight: 18,
    marginBottom: 14,
  },
  timingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    alignSelf: "flex-start",
  },
  timingBadgeText: {
    fontSize: 11,
    color: "#A7F3D0",
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  channelGrid: {
    gap: 12,
    marginBottom: 20,
  },
  channelCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...SHADOWS.sm,
  },
  channelIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  channelName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#052A51",
    marginBottom: 4,
  },
  channelDesc: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 12,
  },
  channelActionBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  channelActionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  ticketCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...SHADOWS.sm,
  },
  ticketHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  ticketTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#052A51",
  },
  ticketSub: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 17,
    marginBottom: 12,
  },
  categoryScroll: {
    flexDirection: "row",
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#FFF7ED",
    borderColor: "#F97316",
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  categoryChipTextActive: {
    color: "#C2410C",
    fontWeight: "800",
  },
  queryInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: "#0F172A",
    textAlignVertical: "top",
    minHeight: 80,
    marginBottom: 12,
  },
  sendTicketBtn: {
    backgroundColor: "#F26522",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sendTicketBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  faqList: {
    gap: 10,
    marginBottom: 20,
  },
  faqCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  faqCardExpanded: {
    borderColor: "#FED7AA",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  faqIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  faqCategory: {
    fontSize: 9,
    fontWeight: "800",
    color: "#EA580C",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 18,
  },
  faqBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  faqAnswer: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
    marginTop: 8,
  },
  footerCard: {
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
  },
  footerAddress: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
    marginBottom: 8,
  },
  footerDivider: {
    height: 1,
    backgroundColor: "#CBD5E1",
    marginVertical: 6,
  },
  footerShieldText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#166534",
    flex: 1,
  },
});
