export interface AppPlatformConfig {
  latestVersion: string;
  minSupportedVersion: string;
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
      latestVersion: "1.2.5",
      minSupportedVersion: "1.2.0",
      storeUrl: "https://play.google.com/store/apps/details?id=com.intrihub.app",
      message: "A fresh update of IntriHub is here with faster loading, smooth checkout, and new features.",
      title: "New Update Available! 🚀",
      releaseNotes: [
        "Faster catalog & tiles browsing",
        "Instant live order tracking",
        "Performance & stability improvements",
      ],
    },
    ios: {
      latestVersion: "1.2.5",
      minSupportedVersion: "1.2.0",
      storeUrl: "https://apps.apple.com/app/id6470000000",
      message: "Update IntriHub on iOS for enhanced reliability and performance.",
      title: "iOS Update Available! 🍎",
      releaseNotes: [
        "Bug fixes and security updates",
        "Smoother navigation",
      ],
    },
  },
  business: {
    android: {
      latestVersion: "1.0.13",
      minSupportedVersion: "1.0.10",
      storeUrl: "https://play.google.com/store/apps/details?id=com.intrihub.business",
      message: "Update Intrihub Business for instant order chimes, real-time stock sync, and vendor performance enhancements.",
      title: "Business Update Available! 📦",
      releaseNotes: [
        "Instant sound alerts for incoming customer orders",
        "Enhanced catalog & stock management",
        "Android 15 launch crash fix & performance stability",
      ],
    },
    ios: {
      latestVersion: "1.0.13",
      minSupportedVersion: "1.0.10",
      storeUrl: "https://apps.apple.com/app/id6470000001",
      message: "Update Intrihub Business for updated order workflows and stock sync.",
      title: "Business iOS Update Available! 📦",
      releaseNotes: [
        "Vendor catalog sync enhancements",
        "Stability and notification updates",
      ],
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
