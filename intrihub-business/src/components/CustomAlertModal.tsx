import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import * as Haptics from "expo-haptics";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  X,
} from "lucide-react-native";
import { useAlertStore, AlertButtonConfig, AlertType } from "../store/alertStore";
import { COLORS, FONTS } from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CustomAlertModal() {
  const { currentAlert, hideAlert } = useAlertStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (currentAlert) {
      // Trigger subtle haptic based on alert type
      try {
        if (currentAlert.type === "success") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (currentAlert.type === "error") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else if (currentAlert.type === "warning") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch {
        // Safe fallback if haptics unavailable
      }

      fadeAnim.setValue(0);
      scaleAnim.setValue(0.85);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentAlert?.id]);

  if (!currentAlert) return null;

  const handleClose = (callback?: () => void) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hideAlert();
      if (callback) {
        callback();
      } else if (currentAlert.onDismiss) {
        currentAlert.onDismiss();
      }
    });
  };

  const handleBackdropPress = () => {
    if (currentAlert.cancelable === false) return;
    const cancelBtn = currentAlert.buttons?.find((b) => b.style === "cancel");
    handleClose(cancelBtn?.onPress);
  };

  const type: AlertType = currentAlert.type || "info";

  // Visual Theme Configuration
  const themeConfig = {
    success: {
      badgeBg: "#ECFDF5",
      badgeBorder: "#A7F3D0",
      iconColor: "#10B981",
      IconComponent: CheckCircle2,
      accentGlow: "rgba(16, 185, 129, 0.12)",
      primaryBtnBg: COLORS.accentOrange, // Keep primary brand action
      primaryBtnText: "#FFFFFF",
    },
    error: {
      badgeBg: "#FEF2F2",
      badgeBorder: "#FECACA",
      iconColor: "#EF4444",
      IconComponent: AlertCircle,
      accentGlow: "rgba(239, 68, 68, 0.12)",
      primaryBtnBg: "#EF4444",
      primaryBtnText: "#FFFFFF",
    },
    warning: {
      badgeBg: "#FFFBEB",
      badgeBorder: "#FDE68A",
      iconColor: "#F59E0B",
      IconComponent: AlertTriangle,
      accentGlow: "rgba(245, 158, 11, 0.12)",
      primaryBtnBg: COLORS.accentOrange,
      primaryBtnText: "#FFFFFF",
    },
    confirm: {
      badgeBg: "#EFF6FF",
      badgeBorder: "#BFDBFE",
      iconColor: "#2563EB",
      IconComponent: Sparkles,
      accentGlow: "rgba(37, 99, 235, 0.12)",
      primaryBtnBg: COLORS.accentOrange,
      primaryBtnText: "#FFFFFF",
    },
    info: {
      badgeBg: "#FFF7ED",
      badgeBorder: "#FED7AA",
      iconColor: COLORS.accentOrange,
      IconComponent: Sparkles,
      accentGlow: "rgba(242, 101, 34, 0.12)",
      primaryBtnBg: COLORS.accentOrange,
      primaryBtnText: "#FFFFFF",
    },
  }[type];

  const { IconComponent } = themeConfig;
  const buttons: AlertButtonConfig[] =
    currentAlert.buttons && currentAlert.buttons.length > 0
      ? currentAlert.buttons
      : [{ text: "OK", style: "default" }];

  const isMultiButton = buttons.length === 2;
  const isStackedButtons = buttons.length > 2;

  return (
    <Modal
      visible={Boolean(currentAlert)}
      transparent
      animationType="none"
      onRequestClose={handleBackdropPress}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.card,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Optional top-right close cross if cancelable */}
              {currentAlert.cancelable !== false && (
                <TouchableOpacity
                  style={styles.closeIconBtn}
                  onPress={() => handleBackdropPress()}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                >
                  <X size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}

              {/* Top Branded Icon Badge with Glow */}
              <View
                style={[
                  styles.badgeGlow,
                  { backgroundColor: themeConfig.accentGlow },
                ]}
              >
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: themeConfig.badgeBg,
                      borderColor: themeConfig.badgeBorder,
                    },
                  ]}
                >
                  <IconComponent
                    size={32}
                    color={themeConfig.iconColor}
                    strokeWidth={2.3}
                  />
                </View>
              </View>

              {/* Title */}
              {Boolean(currentAlert.title) && (
                <Text style={styles.title}>{currentAlert.title}</Text>
              )}

              {/* Message Body */}
              {Boolean(currentAlert.message) && (
                <ScrollView
                  style={styles.messageScroll}
                  contentContainerStyle={styles.messageContent}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.message}>{currentAlert.message}</Text>
                </ScrollView>
              )}

              {/* Action Buttons */}
              <View
                style={[
                  styles.buttonsContainer,
                  isMultiButton && styles.buttonsRow,
                  isStackedButtons && styles.buttonsStack,
                ]}
              >
                {buttons.map((btn, index) => {
                  const isCancel = btn.style === "cancel";
                  const isDestructive = btn.style === "destructive";

                  let btnBg = themeConfig.primaryBtnBg;
                  let btnTextColor = themeConfig.primaryBtnText;
                  let borderStyle = null;

                  if (isCancel) {
                    btnBg = "#F1F5F9";
                    btnTextColor = "#475569";
                    borderStyle = styles.cancelBorder;
                  } else if (isDestructive) {
                    btnBg = "#EF4444";
                    btnTextColor = "#FFFFFF";
                  }

                  return (
                    <TouchableOpacity
                      key={`alert-btn-${index}-${btn.text}`}
                      style={[
                        styles.button,
                        { backgroundColor: btnBg },
                        borderStyle,
                        isMultiButton && styles.flexButton,
                        index > 0 && isStackedButtons && styles.stackedSpacing,
                      ]}
                      activeOpacity={0.84}
                      onPress={() => handleClose(btn.onPress)}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          { color: btnTextColor },
                          isCancel && styles.cancelButtonText,
                        ]}
                        numberOfLines={1}
                      >
                        {btn.text || "OK"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(5, 42, 81, 0.65)", // Deep IntriHub Navy translucent backdrop
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: Math.min(SCREEN_WIDTH - 44, 380),
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    // Enhanced Soft Elevation
    shadowColor: "#052A51",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 20,
    position: "relative",
  },
  closeIconBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  badgeGlow: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  badge: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 18.5,
    color: "#0F172A",
    textAlign: "center",
    lineHeight: 25,
    paddingHorizontal: 8,
  },
  messageScroll: {
    maxHeight: 220,
    width: "100%",
    marginTop: 8,
  },
  messageContent: {
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  message: {
    fontFamily: FONTS.medium,
    fontSize: 14.5,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 21,
  },
  buttonsContainer: {
    width: "100%",
    marginTop: 20,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  buttonsStack: {
    flexDirection: "column",
  },
  flexButton: {
    flex: 1,
  },
  stackedSpacing: {
    marginTop: 10,
  },
  button: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    shadowColor: COLORS.accentOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  cancelBorder: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  cancelButtonText: {
    fontFamily: FONTS.semiBold,
  },
});
