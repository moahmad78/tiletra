import { prisma } from "@/lib/prisma";

export interface AppPlatformConfig {
  latestVersion: string;
  latestVersionCode?: number;
  minSupportedVersion: string;
  minSupportedVersionCode?: number;
  forceUpdate?: boolean;
  storeUrl: string;
  message?: string;
  title?: string;
  releaseNotes?: string[];
}

export interface AppVersionSettings {
  customer: {
    android: AppPlatformConfig;
    ios: AppPlatformConfig;
  };
  business: {
    android: AppPlatformConfig;
    ios: AppPlatformConfig;
  };
}

export const DEFAULT_APP_VERSION_SETTINGS: AppVersionSettings = {
  customer: {
    android: {
      latestVersion: "1.2.17",
      latestVersionCode: 36,
      minSupportedVersion: "1.2.0",
      minSupportedVersionCode: 30,
      forceUpdate: false,
      storeUrl: "https://play.google.com/store/apps/details?id=com.intrihub.app",
      message: "A fresh update of IntriHub is available with faster catalog browsing, smooth checkout, and bug fixes.",
      title: "New Update Available! 🚀",
      releaseNotes: [
        "Faster catalog & tiles browsing",
        "Smooth checkout and order tracking",
        "Performance & stability improvements",
      ],
    },
    ios: {
      latestVersion: "1.2.17",
      latestVersionCode: 36,
      minSupportedVersion: "1.2.0",
      minSupportedVersionCode: 30,
      forceUpdate: false,
      storeUrl: "https://apps.apple.com/app/id6470000000",
      message: "Update IntriHub on iOS for enhanced reliability and performance.",
      title: "iOS Update Available! 🍎",
      releaseNotes: ["Bug fixes and security updates", "Smoother navigation"],
    },
  },
  business: {
    android: {
      latestVersion: "1.0.27",
      latestVersionCode: 35,
      minSupportedVersion: "1.0.10",
      minSupportedVersionCode: 25,
      forceUpdate: false,
      storeUrl: "https://play.google.com/store/apps/details?id=com.intrihub.business",
      message: "Update Intrihub Business for instant order alerts, real-time stock sync, and vendor performance enhancements.",
      title: "Business Update Available! 📦",
      releaseNotes: [
        "Instant sound alerts for incoming customer orders",
        "Enhanced catalog & stock management",
        "Android 15 launch crash fix & performance stability",
      ],
    },
    ios: {
      latestVersion: "1.0.27",
      latestVersionCode: 35,
      minSupportedVersion: "1.0.10",
      minSupportedVersionCode: 25,
      forceUpdate: false,
      storeUrl: "https://apps.apple.com/app/id6470000001",
      message: "Update Intrihub Business for updated order workflows and stock sync.",
      title: "Business iOS Update Available! 📦",
      releaseNotes: ["Vendor catalog sync enhancements", "Stability and notification updates"],
    },
  },
};

export function isValidSemver(v?: string | null): boolean {
  if (!v) return false;
  return /^\d+(\.\d+){1,2}$/.test(v.trim());
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

/**
 * Shared engine to resolve app version update policy.
 * Compares both semantic versions (major.minor.patch) and numeric versionCodes.
 * If config is empty/unset, it gracefully returns updateAvailable: false (no false popups).
 */
export async function resolveAppVersionPolicy({
  app,
  platform = "android",
  installedVersion,
  installedVersionCode,
}: {
  app: "customer" | "business";
  platform?: "android" | "ios";
  installedVersion?: string | null;
  installedVersionCode?: number | null;
}) {
  const normPlatform: "android" | "ios" =
    platform.includes("ios") || platform.includes("apple") ? "ios" : "android";
  const normApp: "customer" | "business" =
    app.includes("biz") || app.includes("business") || app.includes("vendor")
      ? "business"
      : "customer";

  // Fetch configuration from StoreSettings in database
  let targetConfig: AppPlatformConfig | null = null;
  try {
    const settings = await prisma.storeSettings.findFirst({
      select: { appVersionConfig: true },
    });
    if (settings?.appVersionConfig) {
      const fullConfig = settings.appVersionConfig as unknown as AppVersionSettings;
      targetConfig = fullConfig?.[normApp]?.[normPlatform] || null;
    }
  } catch (err) {
    console.warn("[resolveAppVersionPolicy] Error reading DB storeSettings:", err);
  }

  // If no DB config exists, do NOT trigger false popups with arbitrary defaults
  if (!targetConfig || !targetConfig.latestVersion) {
    const defaultStoreUrl =
      normPlatform === "ios"
        ? "https://apps.apple.com/app/id6470000000"
        : `https://play.google.com/store/apps/details?id=${normApp === "business" ? "com.intrihub.business" : "com.intrihub.app"}`;

    return {
      success: true,
      app: normApp,
      platform: normPlatform,
      latestVersion: installedVersion || "0.0.0",
      latestVersionCode: installedVersionCode || null,
      minSupportedVersion: installedVersion || "0.0.0",
      minSupportedVersionCode: null,
      forceUpdate: false,
      updateAvailable: false,
      storeUrl: defaultStoreUrl,
      title: "App is Up to Date",
      message: "You are running the latest version of IntriHub.",
      releaseNotes: [],
      installedVersion: installedVersion || null,
      installedVersionCode: installedVersionCode || null,
      timestamp: new Date().toISOString(),
    };
  }

  const latestVersion = targetConfig.latestVersion.trim();
  const latestVersionCode =
    targetConfig.latestVersionCode !== undefined && targetConfig.latestVersionCode !== null
      ? Number(targetConfig.latestVersionCode)
      : null;

  const minSupportedVersion = targetConfig.minSupportedVersion
    ? targetConfig.minSupportedVersion.trim()
    : latestVersion;
  const minSupportedVersionCode =
    targetConfig.minSupportedVersionCode !== undefined && targetConfig.minSupportedVersionCode !== null
      ? Number(targetConfig.minSupportedVersionCode)
      : null;

  const storeUrl =
    targetConfig.storeUrl ||
    (normPlatform === "ios"
      ? "https://apps.apple.com/app/id6470000000"
      : `https://play.google.com/store/apps/details?id=${normApp === "business" ? "com.intrihub.business" : "com.intrihub.app"}`);

  const title =
    targetConfig.title ||
    (normApp === "business" ? "Business Update Available! 📦" : "New Update Available! 🚀");
  const message =
    targetConfig.message ||
    (normApp === "business"
      ? "Update Intrihub Business for instant order alerts, stock sync, and performance stability."
      : "A fresh update of IntriHub is available with faster catalog browsing and smooth checkout.");
  const releaseNotes = Array.isArray(targetConfig.releaseNotes) ? targetConfig.releaseNotes : [];

  // Compare installed vs latest
  let isSemverOutdated = false;
  if (installedVersion && isValidSemver(installedVersion) && isValidSemver(latestVersion)) {
    isSemverOutdated = compareSemver(installedVersion, latestVersion) < 0;
  }

  let isCodeOutdated = false;
  if (
    installedVersionCode !== undefined &&
    installedVersionCode !== null &&
    latestVersionCode !== null &&
    !isNaN(installedVersionCode)
  ) {
    isCodeOutdated = installedVersionCode < latestVersionCode;
  }

  const updateAvailable = isSemverOutdated || isCodeOutdated;

  // Compare installed vs minSupported & forceUpdate flag
  let isSemverBelowMin = false;
  if (installedVersion && isValidSemver(installedVersion) && isValidSemver(minSupportedVersion)) {
    isSemverBelowMin = compareSemver(installedVersion, minSupportedVersion) < 0;
  }

  let isCodeBelowMin = false;
  if (
    installedVersionCode !== undefined &&
    installedVersionCode !== null &&
    minSupportedVersionCode !== null &&
    !isNaN(installedVersionCode)
  ) {
    isCodeBelowMin = installedVersionCode < minSupportedVersionCode;
  }

  const forceUpdate = Boolean(targetConfig.forceUpdate) || isSemverBelowMin || isCodeBelowMin;

  return {
    success: true,
    app: normApp,
    platform: normPlatform,
    latestVersion,
    latestVersionCode,
    minSupportedVersion,
    minSupportedVersionCode,
    forceUpdate,
    updateAvailable,
    storeUrl,
    title,
    message,
    releaseNotes,
    installedVersion: installedVersion || null,
    installedVersionCode: installedVersionCode || null,
    timestamp: new Date().toISOString(),
  };
}
