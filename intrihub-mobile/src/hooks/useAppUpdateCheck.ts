import { useState, useEffect, useCallback, useRef } from "react";
import { Platform, AppState, AppStateStatus, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "../api/client";

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export interface UpdateInfo {
  latestVersion: string;
  minSupportedVersion: string;
  storeUrl: string;
  message: string;
  title: string;
  releaseNotes: string[];
  isForceUpdate: boolean;
}

export interface UseAppUpdateCheckOptions {
  app: "customer" | "business";
  installedVersion: string;
  storageKeyDismissedUntil?: string;
}

export function compareSemver(v1: string, v2: string): number {
  const p1 = (v1 || "").trim().split(".").map((n) => parseInt(n, 10) || 0);
  const p2 = (v2 || "").trim().split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(p1.length, p2.length);
  for (let i = 0; i < len; i++) {
    const num1 = p1[i] ?? 0;
    const num2 = p2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export function useAppUpdateCheck({
  app,
  installedVersion,
  storageKeyDismissedUntil = `intrihub_${app}_update_dismissed_until`,
}: UseAppUpdateCheckOptions) {
  const [modalVisible, setModalVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const isCheckingRef = useRef(false);

  const checkVersion = useCallback(async () => {
    if (isCheckingRef.current || Platform.OS === "web") return;
    isCheckingRef.current = true;

    try {
      const res = await apiClient.get<any>("/api/mobile/app-version", {
        params: {
          platform: Platform.OS,
          app,
          installedVersion,
        },
        timeout: 6000,
      });

      if (!res?.data?.success) {
        return;
      }

      const data = res.data;
      const latestVersion = data.latestVersion || installedVersion;
      const minSupportedVersion = data.minSupportedVersion || installedVersion;

      const isUpdateAvailable = compareSemver(installedVersion, latestVersion) < 0;
      const isForceUpdate = compareSemver(installedVersion, minSupportedVersion) < 0;

      // If up-to-date, ensure modal is closed
      if (!isUpdateAvailable && !isForceUpdate) {
        setModalVisible(false);
        setUpdateInfo(null);
        return;
      }

      const info: UpdateInfo = {
        latestVersion,
        minSupportedVersion,
        storeUrl: data.storeUrl || "",
        message:
          data.message ||
          "A fresh update of IntriHub is available with speed improvements, smoother checkout, and new features.",
        title: isForceUpdate
          ? "Critical Update Required ⚠️"
          : data.title || "New Update Available! 🚀",
        releaseNotes: Array.isArray(data.releaseNotes) ? data.releaseNotes : [],
        isForceUpdate,
      };

      setUpdateInfo(info);

      // Soft update: Check if user dismissed it within the last 2 days
      if (!isForceUpdate) {
        const dismissedUntil = await AsyncStorage.getItem(storageKeyDismissedUntil);
        if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
          // Suppressed for 2 days
          return;
        }
      }

      // Show update modal
      setModalVisible(true);
    } catch {
      // Gracefully handle offline or network errors silently without blocking app
    } finally {
      isCheckingRef.current = false;
    }
  }, [app, installedVersion, storageKeyDismissedUntil]);

  useEffect(() => {
    // 1. Initial check on mount / launch
    checkVersion();

    // 2. Check whenever returning to foreground from background
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active") {
        checkVersion();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkVersion]);

  const handleUpdatePress = useCallback(async () => {
    if (!updateInfo?.storeUrl) return;
    try {
      const supported = await Linking.canOpenURL(updateInfo.storeUrl);
      if (supported) {
        await Linking.openURL(updateInfo.storeUrl);
      } else {
        await Linking.openURL(updateInfo.storeUrl).catch(() => {});
      }
    } catch {
      await Linking.openURL(updateInfo.storeUrl).catch(() => {});
    }
  }, [updateInfo]);

  const handleLaterPress = useCallback(async () => {
    // Force update cannot be dismissed
    if (updateInfo?.isForceUpdate) return;

    // Suppress for 2 days
    const twoDaysLater = Date.now() + TWO_DAYS_MS;
    await AsyncStorage.setItem(storageKeyDismissedUntil, String(twoDaysLater));
    setModalVisible(false);
  }, [updateInfo, storageKeyDismissedUntil]);

  return {
    modalVisible,
    updateInfo,
    checkVersion,
    handleUpdatePress,
    handleLaterPress,
  };
}
