import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  AppState,
  AppStateStatus,
  ScrollView,
} from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DownloadCloud, ArrowUpCircle, CheckCircle2, X } from "lucide-react-native";
import { apiClient } from "../api/client";
import { APP_VERSION, APP_VERSION_CODE, PACKAGE_NAME } from "../constants/config";
import { COLORS } from "../constants/theme";

const STORAGE_KEY_LAST_NOTIFIED_VERSION = "intrihub_last_notified_update_version_code";
const STORAGE_KEY_DISMISSED_UNTIL = "intrihub_update_dismissed_until";

interface UpdateConfig {
  updateAvailable: boolean;
  forceUpdate: boolean;
  latestVersion: string;
  latestVersionCode: number;
  title: string;
  message: string;
  releaseNotes: string[];
  storeUrl: string;
  webUrl: string;
}

export default function AppUpdateModal() {
  const [modalVisible, setModalVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateConfig | null>(null);
  const isCheckingRef = useRef(false);

  const checkVersion = useCallback(async () => {
    if (isCheckingRef.current || Platform.OS === "web") return;
    isCheckingRef.current = true;

    try {
      const res = await apiClient.get<UpdateConfig>("/api/mobile/version-check", {
        params: {
          app: "customer",
          currentVersionCode: APP_VERSION_CODE,
        },
        timeout: 8000,
      });

      if (!res.data || !res.data.updateAvailable) {
        setModalVisible(false);
        return;
      }

      const info = res.data;
      setUpdateInfo(info);

      // Check if this update was dismissed temporarily by the user
      if (!info.forceUpdate) {
        const dismissedUntil = await AsyncStorage.getItem(STORAGE_KEY_DISMISSED_UNTIL);
        if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
          // Temporarily suppressed for a few hours
          return;
        }
      }

      // Show in-app update popup
      setModalVisible(true);

      // Trigger local push notification if not notified for this version yet
      const lastNotifiedCode = await AsyncStorage.getItem(STORAGE_KEY_LAST_NOTIFIED_VERSION);
      if (lastNotifiedCode !== String(info.latestVersionCode)) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: info.title || "🚀 Update Available!",
              body:
                info.message ||
                `IntriHub v${info.latestVersion} is now available with new features. Tap to update!`,
              data: {
                type: "app_update",
                storeUrl: info.storeUrl || `market://details?id=${PACKAGE_NAME}`,
                webUrl: info.webUrl,
                latestVersion: info.latestVersion,
              },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null, // deliver immediately
          });

          await AsyncStorage.setItem(
            STORAGE_KEY_LAST_NOTIFIED_VERSION,
            String(info.latestVersionCode)
          );
        } catch (notifErr) {
          console.warn("[AppUpdateModal] Local notification error:", notifErr);
        }
      }
    } catch (e) {
      // Gracefully ignore network errors on version check
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Initial check on mount
    checkVersion();

    // Check again whenever the user brings the app back to foreground
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active") {
        checkVersion();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkVersion]);

  const handleUpdatePress = async () => {
    if (!updateInfo) return;
    const storeUrl = updateInfo.storeUrl || `market://details?id=${PACKAGE_NAME}`;
    const webUrl =
      updateInfo.webUrl || `https://play.google.com/store/apps/details?id=${PACKAGE_NAME}`;

    try {
      const supported = await Linking.canOpenURL(storeUrl);
      if (supported) {
        await Linking.openURL(storeUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      await Linking.openURL(webUrl).catch(() => {});
    }
  };

  const handleDismiss = async () => {
    if (updateInfo?.forceUpdate) return;
    // Dismiss for 4 hours
    const fourHoursLater = Date.now() + 4 * 60 * 60 * 1000;
    await AsyncStorage.setItem(STORAGE_KEY_DISMISSED_UNTIL, String(fourHoursLater));
    setModalVisible(false);
  };

  if (!modalVisible || !updateInfo) return null;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="fade"
      onRequestClose={updateInfo.forceUpdate ? () => {} : handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Icon / Badge */}
          <View style={styles.badgeWrapper}>
            <View style={styles.badgeCircle}>
              <ArrowUpCircle size={36} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <View style={styles.sparkleIcon}>
              <CheckCircle2 size={16} color="#10B981" strokeWidth={2.2} />
            </View>
          </View>

          {/* Close button if not forced */}
          {!updateInfo.forceUpdate && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleDismiss}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          )}

          {/* Title & Version Tag */}
          <Text style={styles.title}>{updateInfo.title || "New Update Available!"}</Text>
          <View style={styles.versionTagContainer}>
            <Text style={styles.currentVersionText}>Current: v{APP_VERSION}</Text>
            <Text style={styles.versionArrow}>→</Text>
            <View style={styles.newVersionBadge}>
              <Text style={styles.newVersionText}>Latest: v{updateInfo.latestVersion}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.message}>
            {updateInfo.message ||
              "A brand new version of IntriHub is ready with speed improvements, smoother checkout, and new features."}
          </Text>

          {/* Release Notes */}
          {updateInfo.releaseNotes && updateInfo.releaseNotes.length > 0 && (
            <View style={styles.releaseNotesBox}>
              <Text style={styles.releaseNotesHeader}>What's New:</Text>
              <ScrollView
                style={styles.notesScroll}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {updateInfo.releaseNotes.map((note, index) => (
                  <View key={index} style={styles.noteRow}>
                    <CheckCircle2 size={15} color="#10B981" style={styles.noteIcon} />
                    <Text style={styles.noteText}>{note}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.updateBtn}
              onPress={handleUpdatePress}
              activeOpacity={0.88}
            >
              <DownloadCloud size={20} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.updateBtnText}>Update Now</Text>
            </TouchableOpacity>

            {!updateInfo.forceUpdate && (
              <TouchableOpacity
                style={styles.laterBtn}
                onPress={handleDismiss}
                activeOpacity={0.7}
              >
                <Text style={styles.laterBtnText}>Maybe Later</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(5, 15, 30, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 20,
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  badgeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#052A51",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#052A51",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  sparkleIcon: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FEF3C7",
    padding: 5,
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  versionTagContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    gap: 8,
  },
  currentVersionText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_500Medium",
    color: "#64748B",
  },
  versionArrow: {
    fontSize: 12,
    color: "#94A3B8",
  },
  newVersionBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  newVersionText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#1D4ED8",
  },
  message: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#475569",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 16,
  },
  releaseNotesBox: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  releaseNotesHeader: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1E293B",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notesScroll: {
    maxHeight: 120,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  noteIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "PlusJakartaSans_500Medium",
    color: "#334155",
    lineHeight: 17,
  },
  actionsContainer: {
    width: "100%",
    gap: 10,
  },
  updateBtn: {
    width: "100%",
    height: 50,
    backgroundColor: "#052A51",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#052A51",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  updateBtnText: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  laterBtn: {
    width: "100%",
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  laterBtnText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#64748B",
  },
});
