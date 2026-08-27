import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  StatusBar,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Headphones,
  MessageCircle,
  PhoneCall,
  Mail,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck,
  HelpCircle,
  Truck,
  CreditCard,
  Calculator,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../src/constants/theme";

interface FAQItem {
  id: string;
  category: string;
  icon: any;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "1",
    category: "Delivery & Tracking",
    icon: Truck,
    question: "How do I track my order delivery in real time?",
    answer:
      "You can track your active orders by navigating to the 'Orders' tab. Each order displays live status updates (Confirmed, Processing, Dispatched, Out for Delivery, Delivered) along with courier tracking numbers.",
  },
  {
    id: "2",
    category: "Tiles & Area Calculation",
    icon: Calculator,
    question: "How do I calculate how many tile boxes I need for my room?",
    answer:
      "On every tile product page, tap 'Tile Calculator'. Enter your room length and width in feet or meters. The calculator automatically computes total square footage and adds recommended 10% cutting wastage to give exact box counts.",
  },
  {
    id: "3",
    category: "Payments & Invoices",
    icon: CreditCard,
    question: "What payment methods are supported on Intrihub?",
    answer:
      "We support all major payment options: UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, and Cash on Delivery (COD) for eligible locations.",
  },
  {
    id: "4",
    category: "Returns & Replacements",
    icon: RotateCcw,
    question: "What is the return or replacement policy for damaged tiles?",
    answer:
      "If you receive any damaged, defective, or incorrect material, report it within 48 hours of delivery via WhatsApp support (+91 92649 20211) with photos of the damaged items. Our team will arrange free replacement or immediate refund.",
  },
  {
    id: "5",
    category: "Bulk Site Orders",
    icon: Headphones,
    question: "Do you offer wholesale/bulk pricing for construction sites?",
    answer:
      "Yes! For architects, builders, contractors, and large residential projects, contact our dedicated B2B desk directly on WhatsApp or Call for volume discounts and specialized crane/forklift site unloading.",
  },
];

export default function CustomerSupportScreen() {
  const router = useRouter();
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("1");
  const [queryText, setQueryText] = useState("");
  const [sendingQuery, setSendingQuery] = useState(false);

  const handleWhatsApp = () => {
    Linking.openURL("https://wa.me/919264920211?text=Hello%20Intrihub%20Support,%20I%20need%20assistance%20with%20my%20order/product.");
  };

  const handleCall = () => {
    Linking.openURL("tel:9264920211");
  };

  const handleEmail = () => {
    Linking.openURL("mailto:support@intrihub.com?subject=Customer%20Support%20Inquiry");
  };

  const handleSendQuery = () => {
    if (!queryText.trim()) {
      Alert.alert("Message Required", "Please describe your question or issue.");
      return;
    }
    setSendingQuery(true);
    setTimeout(() => {
      setSendingQuery(false);
      setQueryText("");
      Alert.alert(
        "Query Received",
        "Thank you! Our customer support team has received your message and will respond via WhatsApp / Phone shortly.",
        [{ text: "OK" }]
      );
    }, 800);
  };

  const toggleFaq = (id: string) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={COLORS.textWhite} />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Customer Support 24*7</Text>
          <Text style={styles.headerSub}>Help center, quick contacts & FAQs</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Support Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroLeft}>
            <View style={styles.badge247}>
              <Sparkles size={12} color="#f97316" />
              <Text style={styles.badge247Text}>24*7 LIVE ASSISTANCE</Text>
            </View>
            <Text style={styles.heroHeading}>How can we assist you today?</Text>
            <Text style={styles.heroSub}>
              Connect with our construction material experts via WhatsApp, phone call, or explore quick solutions below.
            </Text>
          </View>
        </View>

        {/* Contact Channels Grid */}
        <Text style={styles.sectionHeading}>Contact Us Directly</Text>
        <View style={styles.contactGrid}>
          {/* WhatsApp Card */}
          <TouchableOpacity
            style={[styles.contactCard, styles.contactCardWhatsApp]}
            onPress={handleWhatsApp}
            activeOpacity={0.85}
          >
            <View style={[styles.channelIconWrapper, { backgroundColor: "#dcfce7" }]}>
              <MessageCircle size={24} color="#16a34a" />
            </View>
            <Text style={styles.contactCardTitle}>Chat on WhatsApp</Text>
            <Text style={styles.contactCardSub}>Instant reply in &lt;5 mins</Text>
            <View style={styles.contactActionBadge}>
              <Text style={styles.contactActionTextGreen}>+91 92649 20211</Text>
            </View>
          </TouchableOpacity>

          {/* Call Card */}
          <TouchableOpacity
            style={[styles.contactCard, styles.contactCardCall]}
            onPress={handleCall}
            activeOpacity={0.85}
          >
            <View style={[styles.channelIconWrapper, { backgroundColor: "#eff6ff" }]}>
              <PhoneCall size={24} color={COLORS.accentBlue} />
            </View>
            <Text style={styles.contactCardTitle}>Call Helpline</Text>
            <Text style={styles.contactCardSub}>Speak with an expert</Text>
            <View style={styles.contactActionBadge}>
              <Text style={styles.contactActionTextBlue}>10 AM - 7 PM</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Email Card (Full Width) */}
        <TouchableOpacity
          style={styles.emailCard}
          onPress={handleEmail}
          activeOpacity={0.85}
        >
          <View style={[styles.channelIconWrapper, { backgroundColor: "#fff7ed" }]}>
            <Mail size={22} color={COLORS.accentOrange} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.emailCardTitle}>Email Support Desk</Text>
            <Text style={styles.emailCardSub}>support@intrihub.com</Text>
          </View>
          <Text style={styles.emailActionText}>Send Email</Text>
        </TouchableOpacity>

        {/* FAQ / Q&A Section */}
        <View style={styles.faqSectionHeader}>
          <HelpCircle size={18} color={COLORS.primary} />
          <Text style={styles.sectionHeadingNoMargin}>Frequently Asked Questions (FAQ)</Text>
        </View>

        <View style={styles.faqList}>
          {FAQ_DATA.map((item) => {
            const isExpanded = expandedFaqId === item.id;
            const IconComp = item.icon;

            return (
              <View key={item.id} style={styles.faqItemCard}>
                <TouchableOpacity
                  style={styles.faqQuestionRow}
                  onPress={() => toggleFaq(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.faqIconBox}>
                    <IconComp size={16} color={COLORS.primary} />
                  </View>
                  <Text style={styles.faqQuestionText}>{item.question}</Text>
                  {isExpanded ? (
                    <ChevronUp size={18} color={COLORS.accentOrange} />
                  ) : (
                    <ChevronDown size={18} color={COLORS.textMuted} />
                  )}
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.faqAnswerBox}>
                    <Text style={styles.faqAnswerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Quick Message Submission Box */}
        <View style={styles.queryCard}>
          <Text style={styles.queryCardTitle}>Have another question?</Text>
          <Text style={styles.queryCardSub}>
            Type your message and our team will get back to you immediately.
          </Text>
          <TextInput
            style={styles.queryInput}
            placeholder="Type your question or delivery requirement here..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={queryText}
            onChangeText={setQueryText}
          />
          <TouchableOpacity
            style={styles.querySubmitBtn}
            onPress={handleSendQuery}
            disabled={sendingQuery}
            activeOpacity={0.85}
          >
            <Send size={15} color={COLORS.textWhite} />
            <Text style={styles.querySubmitText}>Submit Inquiry</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleCol: {
    flex: 1,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.textWhite,
  },
  headerSub: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 50,
  },
  heroBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  heroLeft: {
    flex: 1,
  },
  badge247: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7ed",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    alignSelf: "flex-start",
    gap: 4,
    marginBottom: 8,
  },
  badge247Text: {
    fontSize: 10,
    fontWeight: "900",
    color: "#c2410c",
    letterSpacing: 0.5,
  },
  heroHeading: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textWhite,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 17,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionHeadingNoMargin: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginLeft: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contactGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  contactCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    ...SHADOWS.sm,
  },
  contactCardWhatsApp: {
    borderColor: "#bbf7d0",
  },
  contactCardCall: {
    borderColor: "#bfdbfe",
  },
  channelIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  contactCardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  contactCardSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 8,
    textAlign: "center",
  },
  contactActionBadge: {
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  contactActionTextGreen: {
    fontSize: 11,
    fontWeight: "800",
    color: "#16a34a",
  },
  contactActionTextBlue: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.accentBlue,
  },
  emailCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "#fed7aa",
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  emailCardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },
  emailCardSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  emailActionText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.accentOrange,
  },
  faqSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  faqList: {
    gap: 10,
    marginBottom: SPACING.xl,
  },
  faqItemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  faqQuestionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
  },
  faqIconBox: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 18,
    paddingRight: 6,
  },
  faqAnswerBox: {
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderColor: COLORS.borderLight,
  },
  faqAnswerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  queryCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  queryCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  queryCardSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  queryInput: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 13,
    color: COLORS.text,
    minHeight: 70,
    marginBottom: SPACING.md,
  },
  querySubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  querySubmitText: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: "800",
  },
});
