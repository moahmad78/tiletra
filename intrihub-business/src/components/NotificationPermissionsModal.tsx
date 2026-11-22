import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
} from "react-native";
import {
  X,
  ShieldCheck,
  Bell,
  BatteryCharging,
  Maximize2,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Play,
  VolumeX,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { useOrderAlertStore } from "../store/orderAlertStore";
import { playOrderAlarm, dismissOrderAlarm } from "../utils/orderAlarm";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationPermissionsModal({ visible, onClose }: Props) {
  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);
  const [testingAlarm, setTestingAlarm] = useState(false);
  const { triggerAlert } = useOrderAlertStore();

  useEffect(() => {
    if (visible) {
      checkPermissions();
    } else {
      if (testingAlarm) {
        dismissOrderAlarm();
        setTestingAlarm(false);
      }
    }
  }, [visible]);

  const checkPermissions = async () => {
    try {
      if (Platform.OS !== "web") {
        const Notifications = require("expo-notifications");
        const { status } = await Notifications.getPermissionsAsync();
        setNotifGranted(status === "granted");
      } else {
        setNotifGranted(true);
      }
    } catch {
      setNotifGranted(false);
    }
  };

  const handleRequestPermission = async () => {
    try {
      if (Platform.OS !== "web") {
        const Notifications = require("expo-notifications");
        const { status } = await Notifications.requestPermissionsAsync();
        setNotifGranted(status === "granted");
        if (status !== "granted") {
          Linking.openSettings().catch(() => {});
        }
      }
    } catch {
      Linking.openSettings().catch(() => {});
    }
  };

  const handleTestSiren = async () => {
    if (testingAlarm) {
      dismissOrderAlarm();
      setTestingAlarm(false);
      return;
    }

    setTestingAlarm(true);
    // Play loud order alarm loop
    playOrderAlarm();

    // Trigger preview alert popup
    triggerAlert({
      orderId: "TEST-9999",
      customerName: "Siren Audio Test (10s)",
      totalAmount: 4999,
      itemsCount: 3,
      isAutoAccepted: false,
      warning: "Audio Siren Test — Accept to stop ring",
    });

    // Auto-stop after 10 seconds if not dismissed
    setTimeout(() => {
      dismissOrderAlarm();
      setTestingAlarm(false);
    }, 10000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconBox}>
              <ShieldCheck size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title}>Order Alert Permissions</Text>
              <Text style={styles.subtitle}>Critical settings to never miss high-value orders</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Siren Test Card */}
            <View style={styles.testCard}>
              <View style={styles.testCardLeft}>
                <View style={[styles.testIconBox, testingAlarm && styles.testIconBoxActive]}>
                  {testingAlarm ? <VolumeX size={20} color="#DC2626" /> : <Volume2 size={20} color="#EA580C" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.testCardTitle}>
                    {testingAlarm ? "Siren Playing (Looping)..." : "Test Loud Order Siren"}
                  </Text>
                  <Text style={styles.testCardSub}>
                    {testingAlarm ? "Tap button to stop alarm" : "Simulate loud Rapido-style incoming order ring"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.testActionBtn, testingAlarm && styles.testActionBtnActive]}
                onPress={handleTestSiren}
                activeOpacity={0.8}
              >
                <Play size={14} color="#FFF" style={testingAlarm ? { display: "none" } : undefined} />
                <Text style={styles.testActionBtnText}>{testingAlarm ? "Stop" : "Test Siren"}</Text>
              </TouchableOpacity>
            </View>

            {/* Checklist Section */}
            <Text style={styles.sectionHeader}>REQUIRED SYSTEM PERMISSIONS</Text>

            {/* 1. Push Notification Permission */}
            <View style={styles.checkItem}>
              <View style={styles.checkIconCol}>
                {notifGranted ? (
                  <CheckCircle2 size={20} color="#16A34A" />
                ) : (
                  <AlertTriangle size={20} color="#EA580C" />
                )}
              </View>
              <View style={styles.checkInfoCol}>
                <View style={styles.checkRow}>
                  <Text style={styles.checkTitle}>Push Notifications</Text>
                  <View style={[styles.badge, notifGranted ? styles.badgeSuccess : styles.badgeWarn]}>
                    <Text style={[styles.badgeText, notifGranted ? styles.badgeTextSuccess : styles.badgeTextWarn]}>
                      {notifGranted ? "ACTIVE" : "ACTION REQUIRED"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.checkDesc}>
                  Allows delivery orders, customer updates, and payouts to reach your phone screen immediately.
                </Text>
                {!notifGranted && (
                  <TouchableOpacity style={styles.actionLink} onPress={handleRequestPermission}>
                    <Text style={styles.actionLinkText}>Enable Notifications Now</Text>
                    <ExternalLink size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 2. Full-Screen Intent (Lock Screen Alerts) */}
            <View style={styles.checkItem}>
              <View style={styles.checkIconCol}>
                <Maximize2 size={20} color={COLORS.primary} />
              </View>
              <View style={styles.checkInfoCol}>
                <View style={styles.checkRow}>
                  <Text style={styles.checkTitle}>Full-Screen Lock Alerts</Text>
                  <View style={[styles.badge, styles.badgeSuccess]}>
                    <Text style={[styles.badgeText, styles.badgeTextSuccess]}>SUPPORTED</Text>
                  </View>
                </View>
                <Text style={styles.checkDesc}>
                  On Android 14+ devices, allow IntriHub Business to show full-screen order alerts when your screen is locked.
                </Text>
                <TouchableOpacity style={styles.actionLink} onPress={() => Linking.openSettings().catch(() => {})}>
                  <Text style={styles.actionLinkText}>Check Special App Access in Settings</Text>
                  <ExternalLink size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. Battery Optimization (Unrestricted Mode) */}
            <View style={styles.checkItem}>
              <View style={styles.checkIconCol}>
                <BatteryCharging size={20} color="#0284C7" />
              </View>
              <View style={styles.checkInfoCol}>
                <View style={styles.checkRow}>
                  <Text style={styles.checkTitle}>Battery Unrestricted</Text>
                  <View style={[styles.badge, styles.badgeInfo]}>
                    <Text style={[styles.badgeText, styles.badgeTextInfo]}>RECOMMENDED</Text>
                  </View>
                </View>
                <Text style={styles.checkDesc}>
                  Xiaomi (MIUI), Vivo, Oppo, and Samsung phones kill background apps by default. Set Battery Usage to &quot;Unrestricted&quot; or &quot;No restrictions&quot; so orders ring even after 2 hours idle.
                </Text>
                <TouchableOpacity style={styles.actionLink} onPress={() => Linking.openSettings().catch(() => {})}>
                  <Text style={styles.actionLinkText}>Open Battery Settings</Text>
                  <ExternalLink size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. DND (Do Not Disturb) Override */}
            <View style={styles.checkItem}>
              <View style={styles.checkIconCol}>
                <Bell size={20} color="#7C3AED" />
              </View>
              <View style={styles.checkInfoCol}>
                <View style={styles.checkRow}>
                  <Text style={styles.checkTitle}>Do Not Disturb Override</Text>
                  <View style={[styles.badge, styles.badgeSuccess]}>
                    <Text style={[styles.badgeText, styles.badgeTextSuccess]}>BYPASS ENABLED</Text>
                  </View>
                </View>
                <Text style={styles.checkDesc}>
                  Critical order channels (new_order_ring_v1) are configured with maximum importance to ring even when silent or DND is on.
                </Text>
              </View>
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  testCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  testCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
    gap: 12,
  },
  testIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
  },
  testIconBoxActive: {
    backgroundColor: "#FEE2E2",
  },
  testCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#9A3412",
  },
  testCardSub: {
    fontSize: 11,
    color: "#C2410C",
    marginTop: 2,
  },
  testActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EA580C",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  testActionBtnActive: {
    backgroundColor: "#DC2626",
  },
  testActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  checkItem: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
    gap: 12,
  },
  checkIconCol: {
    paddingTop: 2,
  },
  checkInfoCol: {
    flex: 1,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  checkTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeSuccess: {
    backgroundColor: "#DCFCE7",
  },
  badgeWarn: {
    backgroundColor: "#FEF3C7",
  },
  badgeInfo: {
    backgroundColor: "#E0F2FE",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  badgeTextSuccess: {
    color: "#166534",
  },
  badgeTextWarn: {
    color: "#92400E",
  },
  badgeTextInfo: {
    color: "#0369A1",
  },
  checkDesc: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 18,
  },
  actionLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  doneBtn: {
    backgroundColor: "#0F172A",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
