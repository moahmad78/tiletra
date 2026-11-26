import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, X, Package, Clock } from "lucide-react-native";
import { WebView } from "react-native-webview";
import { useOrderAlertStore } from "../store/orderAlertStore";
import { updateVendorOrderStatus, rejectVendorOrder } from "../api/vendor";
import { dismissOrderAlarm } from "../utils/orderAlarm";
import { socketService } from "../store/socketStore";
import { apiClient } from "../api/client";
import RotatingOrderItemImage from "./RotatingOrderItemImage";

export default function IncomingOrderAlertModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { alert, isOpen, isRinging, closeAlert, stopRinging } = useOrderAlertStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(600); // 10 minutes SLA timer
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringingIntervalRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const webAudioRef = useRef<any>(null);

  // 1. Countdown timer effect (10 min acceptance SLA)
  useEffect(() => {
    if (isOpen && alert) {
      setCountdownSeconds(600);
      countdownIntervalRef.current = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            stopRinging();
            dismissOrderAlarm();
            closeAlert();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-send ACK heartbeat to backend to acknowledge alarm received (skip simulated test alerts)
      if (alert.orderId && !String(alert.orderId).startsWith("TEST-")) {
        apiClient.post(`/api/mobile/vendor/orders/${alert.orderId}/ack`).catch(() => {});
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [isOpen, alert?.orderId]);

  // 2. Multi-device dismissal via Socket
  useEffect(() => {
    if (!isOpen || !alert?.orderId) return;

    const handleDismissFromOtherDevice = (data: any) => {
      const targetOrderId = String(data?.orderId || data?.id || "");
      if (targetOrderId === String(alert.orderId)) {
        console.log(`[OrderAlert] Order #${alert.orderId} action taken on another device. Dismissing.`);
        stopRinging();
        dismissOrderAlarm();
        closeAlert();
      }
    };

    const unsubStatus = socketService.subscribe("order-status-updated", handleDismissFromOtherDevice);
    const unsubAck = socketService.subscribe("order-alert-acknowledged", handleDismissFromOtherDevice);

    return () => {
      unsubStatus();
      unsubAck();
    };
  }, [isOpen, alert?.orderId]);

  // 3. Ringing / Haptics loop + Web audio fallback
  useEffect(() => {
    if (isOpen) {
      if (Platform.OS === "web") {
        try {
          const audio = new Audio("https://www.intrihub.com/sounds/ring.mp3");
          audio.loop = true;
          audio.play().catch(() => {});
          webAudioRef.current = audio;
        } catch {}
      }

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      const triggerHaptic = () => {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch {}
      };
      triggerHaptic();
      ringingIntervalRef.current = setInterval(triggerHaptic, 1500);
    } else {
      if (webAudioRef.current) {
        try {
          webAudioRef.current.pause();
          webAudioRef.current.currentTime = 0;
        } catch {}
        webAudioRef.current = null;
      }
    }

    return () => {
      if (ringingIntervalRef.current) {
        clearInterval(ringingIntervalRef.current);
        ringingIntervalRef.current = null;
      }
      if (webAudioRef.current) {
        try {
          webAudioRef.current.pause();
        } catch {}
        webAudioRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen || !alert) return null;

  const isTestAlert = String(alert.orderId || "").startsWith("TEST-");

  const handleDismissModal = () => {
    stopRinging();
    dismissOrderAlarm();
    closeAlert();
  };

  const handleAccept = async () => {
    stopRinging();
    dismissOrderAlarm();
    if (isTestAlert) {
      closeAlert();
      return;
    }
    setIsSubmitting(true);
    try {
      const splitOrOrderId = alert.splitId || alert.orderId;
      await updateVendorOrderStatus(splitOrOrderId, "confirmed");
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      closeAlert();
      router.push({
        pathname: "/(vendor)/order/[id]",
        params: { id: splitOrOrderId },
      } as any);
    } catch (err: any) {
      console.warn("Failed to accept order:", err);
      closeAlert();
      router.push({
        pathname: "/(vendor)/order/[id]",
        params: { id: alert.splitId || alert.orderId },
      } as any);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    stopRinging();
    dismissOrderAlarm();
    if (isTestAlert) {
      closeAlert();
      return;
    }
    setIsSubmitting(true);
    try {
      const splitOrOrderId = alert.splitId || alert.orderId;
      await rejectVendorOrder(splitOrOrderId, "insufficient_stock");
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      closeAlert();
    } catch (err: any) {
      console.warn("Failed to reject order:", err);
      closeAlert();
    } finally {
      setIsSubmitting(false);
    }
  };

  const minutesLeft = Math.floor(countdownSeconds / 60);
  const secondsMod = countdownSeconds % 60;
  const timerDisplay = `${minutesLeft.toString().padStart(2, "0")}:${secondsMod.toString().padStart(2, "0")}`;
  const isUrgentTimer = countdownSeconds <= 120; // 2 min warning

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleDismissModal}
      statusBarTranslucent
    >
      {Platform.OS !== "web" && isOpen && (
        <View style={{ width: 0, height: 0, opacity: 0, position: "absolute" }}>
          <WebView
            source={{
              html: `
                <!DOCTYPE html>
                <html>
                  <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
                  <body style="background:transparent;margin:0;padding:0;">
                    <audio id="ring" src="https://www.intrihub.com/sounds/ring.mp3" autoplay loop playsinline></audio>
                    <script>
                      var el = document.getElementById('ring');
                      var fallbackTimer = null;
                      function startFallbackChime() {
                        if (fallbackTimer) return;
                        try {
                          var AudioCtx = window.AudioContext || window.webkitAudioContext;
                          if (!AudioCtx) return;
                          var ctx = new AudioCtx();
                          function playPulse() {
                            try {
                              if (ctx.state === 'suspended') ctx.resume();
                              var now = ctx.currentTime;
                              var osc = ctx.createOscillator();
                              var gain = ctx.createGain();
                              osc.type = 'triangle';
                              osc.frequency.setValueAtTime(880, now);
                              osc.frequency.exponentialRampToValueAtTime(1760, now + 0.14);
                              gain.gain.setValueAtTime(0.9, now);
                              gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
                              osc.connect(gain);
                              gain.connect(ctx.destination);
                              osc.start(now);
                              osc.stop(now + 0.45);
                            } catch (e) {}
                          }
                          playPulse();
                          fallbackTimer = setInterval(playPulse, 1300);
                        } catch (e) {}
                      }
                      function stopFallbackChime() {
                        if (fallbackTimer) { clearInterval(fallbackTimer); fallbackTimer = null; }
                      }
                      el.addEventListener('playing', stopFallbackChime);
                      el.addEventListener('error', startFallbackChime);
                      el.play().catch(function() {
                        startFallbackChime();
                        window.addEventListener('touchstart', function() { el.play().catch(function() {}); }, { once: true });
                      });
                    </script>
                  </body>
                </html>
              `,
            }}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            style={{ width: 1, height: 1 }}
          />
        </View>
      )}
      <View style={styles.overlay}>
        {/* Backdrop touch to dismiss */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleDismissModal}
        />

        {/* Bottom Sheet Card */}
        <View style={styles.sheetCard}>
          {/* Top Grab Handle */}
          <View style={styles.handleBar} />

          {/* Close button (top right) */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleDismissModal}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={20} color="#64748B" />
          </TouchableOpacity>

          {/* Concentric Sound-Wave Glowing Bell Icon */}
          <View style={styles.bellOuterGlow}>
            <View style={styles.bellInnerGlow}>
              <Animated.View style={[styles.bellBadge, { transform: [{ scale: pulseAnim }] }]}>
                <Bell size={28} color="#EA580C" fill="#F97316" />
              </Animated.View>
            </View>
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title} numberOfLines={1}>
            New Order Received!
          </Text>
          <Text style={styles.orderIdSubtitle} numberOfLines={1}>
            Order #{alert.orderId}
          </Text>

          {/* 10-Minute SLA Expiry Countdown Badge */}
          <View style={[styles.timerBadge, isUrgentTimer && styles.timerBadgeUrgent]}>
            <Clock size={15} color={isUrgentTimer ? "#DC2626" : "#EA580C"} />
            <Text style={[styles.timerText, isUrgentTimer && styles.timerTextUrgent]}>
              {timerDisplay} remaining to accept
            </Text>
          </View>

          {/* Soft Cream Order Details Box */}
          <View style={styles.orderInfoBox}>
            <RotatingOrderItemImage
              images={(alert as any).images || ((alert as any).itemImages || ((alert as any).image ? [(alert as any).image] : []))}
              fallbackImage={(alert as any).image}
              size={54}
              borderRadius={10}
            />
            <View style={styles.boxTextContent}>
              <Text style={styles.boxItemsPrice} numberOfLines={1}>
                {alert.itemsCount || 12} items • ₹{(alert.totalAmount || 4850).toLocaleString("en-IN")}
              </Text>
              <Text style={styles.boxCustomerName} numberOfLines={1}>
                {alert.customerName || "Amit Verma"}
              </Text>
              <Text style={styles.boxCustomerAddress} numberOfLines={1}>
                {alert.warning || "HSR Layout, Bangalore"}
              </Text>
            </View>
          </View>

          {/* Action Buttons: Reject & Accept Order */}
          {isSubmitting ? (
            <ActivityIndicator size="large" color="#0066FF" style={{ marginVertical: 14 }} />
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={handleReject}
                activeOpacity={0.8}
              >
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={handleAccept}
                activeOpacity={0.88}
              >
                <Text style={styles.acceptBtnText}>Accept Order</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(5, 15, 30, 0.55)",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  sheetCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
    position: "relative",
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 16,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 18,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  bellOuterGlow: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  bellInnerGlow: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FED7AA",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 4,
  },
  orderIdSubtitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 8,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 16,
  },
  timerBadgeUrgent: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  timerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EA580C",
  },
  timerTextUrgent: {
    color: "#DC2626",
  },
  orderInfoBox: {
    width: "100%",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FEF3C7",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 22,
  },
  boxIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  boxTextContent: {
    flex: 1,
    gap: 2,
  },
  boxItemsPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  boxCustomerName: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "500",
  },
  boxCustomerAddress: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "400",
  },
  buttonRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#EF4444",
  },
  acceptBtn: {
    flex: 1.5,
    height: 48,
    backgroundColor: "#0066FF",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0066FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
