import { useState, useEffect, useCallback, useRef } from "react";
import { Platform, AppState, AppStateStatus, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { apiClient } from "../api/client";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export interface UpdateInfo {
  latestVersion: string;
  latestVersionCode: number | null;
  minSupportedVersion: string;
  minSupportedVersionCode: number | null;
  storeUrl: string;
  message: string;
  title: string;
  releaseNotes: string[];
  isForceUpdate: boolean;
  installedVersion: string;
  installedVersionCode: number;
}

export interface UseAppUpdateCheckOptions {
  app: "customer" | "business";
  installedVersion?: string;
  installedVersionCode?: number;
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

function reportErrorToSentry(err: unknown, extra?: Record<string, any>) {
  try {
    const globalSentry = (globalThis as any).Sentry;
    if (globalSentry && typeof globalSentry.captureException === "function") {
      globalSentry.captureException(err, { extra });
    }
  } catch {
    // Suppress secondary reporting errors
  }
}

export function useAppUpdateCheck({
  app,
  installedVersion: propInstalledVersion,
  installedVersionCode: propInstalledVersionCode,
}: UseAppUpdateCheckOptions) {
  const [modalVisible, setModalVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const isCheckingRef = useRef(false);
  const sessionDismissedRef = useRef(false);

  // Read installed semver & native build versionCode from expo-application
  const currentInstalledVersion =
    propInstalledVersion ||
    Application.nativeApplicationVersion ||
    Constants.expoConfig?.version ||
    "1.0.0";

  const currentInstalledVersionCode =
    propInstalledVersionCode !== undefined
      ? propInstalledVersionCode
      : parseInt(
          Application.nativeBuildVersion ||
            String(Constants.expoConfig?.android?.versionCode || "0"),
          10
        ) || 0;

  const checkVersion = useCallback(
    async (isColdStart = false) => {
      if (isCheckingRef.current || Platform.OS === "web") return;

      const throttleKey = `intrihub_${app}_last_update_check_time`;

      // Throttle foreground checks: at most once every 6 hours
      if (!isColdStart) {
        if (sessionDismissedRef.current) {
          return; // User dismissed for this session
        }
        try {
          const lastCheckTime = await AsyncStorage.getItem(throttleKey);
          if (lastCheckTime) {
            const elapsed = Date.now() - parseInt(lastCheckTime, 10);
            if (elapsed < SIX_HOURS_MS) {
              return; // Throttled
            }
          }
        } catch {
          // If storage read fails, continue check safely
        }
      }

      isCheckingRef.current = true;

      try {
        const res = await apiClient.get<any>("/api/mobile/app-config", {
          params: {
            platform: Platform.OS,
            app,
            version: currentInstalledVersion,
            versionCode: currentInstalledVersionCode,
          },
          timeout: 8000,
        });

        // Record check timestamp
        await AsyncStorage.setItem(throttleKey, String(Date.now())).catch(() => {});

        if (!res?.data?.success) {
          return;
        }

        const data = res.data;
        const latestVersion = (data.latestVersion || currentInstalledVersion).trim();
        const latestVersionCode =
          data.latestVersionCode !== undefined && data.latestVersionCode !== null
            ? Number(data.latestVersionCode)
            : null;

        const minSupportedVersion = (data.minSupportedVersion || latestVersion).trim();
        const minSupportedVersionCode =
          data.minSupportedVersionCode !== undefined && data.minSupportedVersionCode !== null
            ? Number(data.minSupportedVersionCode)
            : null;

        // Compare installed vs latest (both semver and build versionCode)
        const isSemverOutdated = compareSemver(currentInstalledVersion, latestVersion) < 0;
        const isCodeOutdated =
          latestVersionCode !== null && currentInstalledVersionCode < latestVersionCode;
        const isUpdateAvailable = Boolean(data.updateAvailable) || isSemverOutdated || isCodeOutdated;

        // Check force update conditions
        const isSemverBelowMin = compareSemver(currentInstalledVersion, minSupportedVersion) < 0;
        const isCodeBelowMin =
          minSupportedVersionCode !== null && currentInstalledVersionCode < minSupportedVersionCode;
        const isForceUpdate = Boolean(data.forceUpdate) || isSemverBelowMin || isCodeBelowMin;

        // If up-to-date, close modal and clear
        if (!isUpdateAvailable && !isForceUpdate) {
          setModalVisible(false);
          setUpdateInfo(null);
          return;
        }

        const info: UpdateInfo = {
          latestVersion,
          latestVersionCode,
          minSupportedVersion,
          minSupportedVersionCode,
          storeUrl: data.storeUrl || "",
          message:
            data.message ||
            "A fresh update of IntriHub is available with faster catalog browsing, smooth checkout, and bug fixes.",
          title: isForceUpdate
            ? "Critical Update Required ⚠️"
            : data.title || "New Update Available! 🚀",
          releaseNotes: Array.isArray(data.releaseNotes) ? data.releaseNotes : [],
          isForceUpdate,
          installedVersion: currentInstalledVersion,
          installedVersionCode: currentInstalledVersionCode,
        };

        setUpdateInfo(info);

        // Every time user opens app (cold start), popup will show until updated
        if (!isForceUpdate && !isColdStart && sessionDismissedRef.current) {
          return;
        }

        // Show update modal
        setModalVisible(true);
      } catch (err) {
        reportErrorToSentry(err, {
          action: "check_version_failure",
          app,
          platform: Platform.OS,
          installedVersion: currentInstalledVersion,
          installedVersionCode: currentInstalledVersionCode,
        });
      } finally {
        isCheckingRef.current = false;
      }
    },
    [app, currentInstalledVersion, currentInstalledVersionCode]
  );

  useEffect(() => {
    // 1. Initial cold-start check on mount
    checkVersion(true);

    // 2. Foreground check throttled to every 6 hours
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active") {
        checkVersion(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkVersion]);

  // "Update Now" handler: market:// protocol first with fallback to https://
  const handleUpdatePress = useCallback(async () => {
    if (!updateInfo?.storeUrl) return;
    const rawStoreUrl = updateInfo.storeUrl.trim();

    if (Platform.OS === "android") {
      const match = rawStoreUrl.match(/id=([a-zA-Z0-9._]+)/);
      const pkg = match ? match[1] : app === "business" ? "com.intrihub.business" : "com.intrihub.app";
      const marketUrl = `market://details?id=${pkg}`;
      const webFallbackUrl = `https://play.google.com/store/apps/details?id=${pkg}`;

      try {
        const canOpenMarket = await Linking.canOpenURL(marketUrl);
        if (canOpenMarket) {
          await Linking.openURL(marketUrl);
          return;
        }
      } catch {
        // Fall back to https://
      }

      try {
        await Linking.openURL(webFallbackUrl);
      } catch (err) {
        reportErrorToSentry(err, { action: "open_store_url_fallback", app, pkg });
      }
      return;
    }

    // iOS / other platforms
    try {
      const canOpen = await Linking.canOpenURL(rawStoreUrl);
      if (canOpen) {
        await Linking.openURL(rawStoreUrl);
      } else {
        await Linking.openURL(rawStoreUrl).catch(() => {});
      }
    } catch (err) {
      reportErrorToSentry(err, { action: "open_store_url", app, rawStoreUrl });
    }
  }, [updateInfo, app]);

  // "Later" handler: dismisses for current session; reappears every time app is closed & reopened
  const handleLaterPress = useCallback(async () => {
    if (updateInfo?.isForceUpdate) return;
    sessionDismissedRef.current = true;
    setModalVisible(false);
  }, [updateInfo]);

  return {
    modalVisible,
    updateInfo,
    checkVersion,
    handleUpdatePress,
    handleLaterPress,
  };
}
