import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { X, Sparkles, Clock, ArrowRight } from "lucide-react-native";
import { apiClient } from "../api/client";
import { handleWhitelistedDeepLink } from "../utils/deepLinkRouter";

const { width, height } = Dimensions.get("window");
const STORAGE_PREFIX = "@intrihub_popup_dismissed_";

export interface CampaignPopupData {
  id: string;
  title: string;
  body: string;
  accentColor: string;
  layout: "center_modal" | "bottom_sheet" | "top_banner";
  bgColor: string;
  imageUrl: string | null;
  ctaLabel: string;
  deepLink: string;
  countdownEndsAt: string | null;
}

export default function ServerCampaignPopup() {
  const [popup, setPopup] = useState<CampaignPopupData | null>(null);
  const [visible, setVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(300));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    let isMounted = true;

    async function checkActivePopup() {
      try {
        const res = await apiClient.get<{ success: boolean; popup: CampaignPopupData | null }>(
          "/api/mobile/campaigns/active-popup"
        );

        if (!isMounted || !res.data?.success || !res.data?.popup) return;

        const currentPopup = res.data.popup;
        const storageKey = `${STORAGE_PREFIX}${currentPopup.id}`;
        const lastDismissed = await AsyncStorage.getItem(storageKey);

        if (lastDismissed) {
          const dismissedTime = parseInt(lastDismissed, 10);
          const hoursSinceDismiss = (Date.now() - dismissedTime) / (1000 * 60 * 60);
          // 24 hour cooldown rule
          if (hoursSinceDismiss < 24) {
            return;
          }
        }

        setPopup(currentPopup);
        setVisible(true);

        // Entrance animation
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      } catch (err) {
        // Fail silently so user flow is never blocked
        console.warn("[ServerCampaignPopup] Failed to fetch popup:", err);
      }
    }

    const timer = setTimeout(checkActivePopup, 1200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleDismiss = async () => {
    if (!popup) return;
    try {
      await AsyncStorage.setItem(`${STORAGE_PREFIX}${popup.id}`, String(Date.now()));
    } catch (_) {}

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setPopup(null);
    });
  };

  const handleCtaPress = async () => {
    if (!popup) return;
    const targetLink = popup.deepLink;
    await handleDismiss();
    handleWhitelistedDeepLink(targetLink);
  };

  if (!visible || !popup) return null;

  // Center Modal Layout
  if (popup.layout === "center_modal") {
    return (
      <Modal transparent visible={visible} animationType="fade" onRequestClose={handleDismiss}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.centerCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* Optional Banner Image */}
            {popup.imageUrl && (
              <Image source={{ uri: popup.imageUrl }} style={styles.centerBannerImage} resizeMode="cover" />
            )}

            <View style={styles.cardContent}>
              <View style={styles.badgeRow}>
                <View style={[styles.badgePill, { backgroundColor: `${popup.accentColor || "#052a51"}15` }]}>
                  <Sparkles size={12} color={popup.accentColor || "#052a51"} />
                  <Text style={[styles.badgeText, { color: popup.accentColor || "#052a51" }]}>Special Offer</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>{popup.title}</Text>
              <Text style={styles.cardBody}>{popup.body}</Text>

              {/* Action Button */}
              <TouchableOpacity
                style={[styles.ctaButton, { backgroundColor: popup.accentColor || "#052a51" }]}
                onPress={handleCtaPress}
                activeOpacity={0.88}
              >
                <Text style={styles.ctaButtonText}>{popup.ctaLabel || "Shop Now"}</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  // Bottom Sheet Layout
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.bottomSheetOverlay}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={handleDismiss} />
        <Animated.View style={[styles.bottomSheetContainer, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sheetHandle} />

          {popup.imageUrl && (
            <Image source={{ uri: popup.imageUrl }} style={styles.sheetBannerImage} resizeMode="cover" />
          )}

          <View style={styles.sheetContent}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>{popup.title}</Text>
              <TouchableOpacity style={styles.closeBtnCircle} onPress={handleDismiss}>
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetBody}>{popup.body}</Text>

            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: popup.accentColor || "#052a51" }]}
              onPress={handleCtaPress}
              activeOpacity={0.88}
            >
              <Text style={styles.ctaButtonText}>{popup.ctaLabel || "Claim Offer"}</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  centerCard: {
    width: Math.min(width - 40, 360),
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 6,
  },
  centerBannerImage: {
    width: "100%",
    height: 160,
  },
  cardContent: {
    padding: 20,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#0F172A",
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    color: "#475569",
    lineHeight: 19,
    marginBottom: 18,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  ctaButtonText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#FFFFFF",
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdropTouch: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#CBD5E1",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  sheetBannerImage: {
    width: "100%",
    height: 150,
  },
  sheetContent: {
    padding: 20,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#0F172A",
    flex: 1,
  },
  closeBtnCircle: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    marginLeft: 8,
  },
  sheetBody: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    color: "#475569",
    lineHeight: 19,
    marginBottom: 18,
  },
});
