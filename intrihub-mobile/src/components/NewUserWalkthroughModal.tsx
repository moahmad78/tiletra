import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Truck,
  BadgePercent,
  Calculator,
  Navigation,
  ArrowRight,
  Check,
  Sparkles,
  X,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../constants/theme";

const STORAGE_KEY = "@intrihub_walkthrough_seen_v1";

interface WalkthroughStep {
  title: string;
  tagline: string;
  description: string;
  icon: any;
  color: string;
  bgLight: string;
}

const STEPS: WalkthroughStep[] = [
  {
    title: "60-Minute Site Delivery",
    tagline: "Never Let Your Project Stall",
    description:
      "Get tiles, plumbing, electricals, hardware, and cement delivered directly to your construction site across Bengaluru within 60 minutes.",
    icon: Truck,
    color: "#F26522",
    bgLight: "#FFF4EE",
  },
  {
    title: "Direct Factory Pricing",
    tagline: "Zero Middlemen Markups",
    description:
      "Access transparent factory-direct rates on 100% genuine ISI & ISO certified brands. Every order comes with a complete GST invoice for easy tax credit.",
    icon: BadgePercent,
    color: "#16A34A",
    bgLight: "#ECFDF5",
  },
  {
    title: "Smart Material Calculators",
    tagline: "Exact Boxes, Zero Wastage",
    description:
      "Enter your room dimensions to calculate exact tile boxes, adhesive bags, and grout requirements with industry-standard wastage buffer.",
    icon: Calculator,
    color: "#2563EB",
    bgLight: "#EFF6FF",
  },
  {
    title: "Live GPS Order Tracking",
    tagline: "Real-Time Telemetry to Site",
    description:
      "Track your delivery vehicle live on the map from warehouse pick to site drop-off, with secure OTP-verified handoff at your doorstep.",
    icon: Navigation,
    color: "#9333EA",
    bgLight: "#FAF5FF",
  },
];

export function NewUserWalkthroughModal() {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { width } = useWindowDimensions();

  useEffect(() => {
    checkFirstOpen();
  }, []);

  const checkFirstOpen = async () => {
    try {
      const seen = await AsyncStorage.getItem(STORAGE_KEY);
      if (!seen) {
        setVisible(true);
      }
    } catch {
      // Ignore storage errors on startup
    }
  };

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setVisible(false);
  };

  const handleNext = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  if (!visible) return null;

  const activeStep = STEPS[currentStep];
  const IconComponent = activeStep.icon;
  const isLast = currentStep === STEPS.length - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { maxWidth: Math.min(width - 32, 420) }]}>
          
          {/* Header Action Bar */}
          <View style={styles.headerBar}>
            <View style={styles.badgeContainer}>
              <Sparkles size={14} color="#F26522" />
              <Text style={styles.badgeText}>Welcome to IntriHub</Text>
            </View>
            <TouchableOpacity
              onPress={handleDismiss}
              style={styles.skipButton}
              accessibilityLabel="Skip walkthrough"
            >
              <Text style={styles.skipText}>Skip</Text>
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Visual Icon Hero */}
          <View style={[styles.iconWrapper, { backgroundColor: activeStep.bgLight }]}>
            <IconComponent size={44} color={activeStep.color} />
          </View>

          {/* Text Content */}
          <View style={styles.contentWrapper}>
            <Text style={[styles.tagline, { color: activeStep.color }]}>
              {activeStep.tagline}
            </Text>
            <h2 style={{ margin: 0, padding: 0 }}>
              <Text style={styles.title}>{activeStep.title}</Text>
            </h2>
            <Text style={styles.description}>{activeStep.description}</Text>
          </View>

          {/* Pagination Indicators */}
          <View style={styles.paginationRow}>
            {STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStep
                    ? [styles.activeDot, { backgroundColor: activeStep.color }]
                    : styles.inactiveDot,
                ]}
              />
            ))}
          </View>

          {/* Bottom Action Button */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: activeStep.color }]}
            onPress={handleNext}
            activeOpacity={0.88}
          >
            <Text style={styles.actionButtonText}>
              {isLast ? "Get Started" : "Next Step"}
            </Text>
            {isLast ? (
              <Check size={18} color="#FFFFFF" />
            ) : (
              <ArrowRight size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(2, 24, 48, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.md,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    ...SHADOWS.card,
    elevation: 10,
  },
  headerBar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9A3412",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 12,
  },
  contentWrapper: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  tagline: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 21,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 24,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: "#E2E8F0",
  },
  actionButton: {
    width: "100%",
    height: 50,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
