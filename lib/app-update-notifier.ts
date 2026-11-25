import { prisma } from "@/lib/prisma";
import {
  AppVersionSettings,
  DEFAULT_APP_VERSION_SETTINGS,
  compareSemver,
  isValidSemver,
} from "@/lib/semver";
import { sendExpoPushNotification } from "@/lib/push-notifications";

export const UPDATE_NOTIFICATION_TYPE = "app_update";
export const UPDATE_CHANNEL_ID = "app_update_ring_v1";
export const OFFICIAL_RINGTONE_SOUND = "ring.mp3";

const MIN_CUSTOM_UI_VERSION = {
  customer: "1.2.21",
  business: "1.0.36",
} as const;

// 50-minute cooldown prevents skipping an hourly run due to second-level cron jitter
const HOURLY_COOLDOWN_MS = 50 * 60 * 1000;
const PUSH_BATCH_SIZE = 50;

export interface AppUpdateReminderResult {
  checkedTokens: number;
  eligibleOutdated: number;
  skippedUpToDate: number;
  skippedCooldown: number;
  dispatchedCustomDataOnly: number;
  dispatchedLegacy: number;
  failedBatches: number;
  dryRun: boolean;
  latestVersions: {
    customerAndroid: string;
    businessAndroid: string;
  };
}

interface CandidateToken {
  userId: string;
  token: string;
  role: string;
  platform: string;
  appVersion: string | null;
}

function isExpoToken(token: string | null | undefined): token is string {
  return (
    typeof token === "string" &&
    (token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken["))
  );
}

function inferTargetApp(role: string, appVersion: string | null): "customer" | "business" {
  const normVersion = (appVersion || "").trim();
  if (normVersion.startsWith("1.0.")) return "business";
  if (normVersion.startsWith("1.2.")) return "customer";
  const normRole = (role || "").toLowerCase();
  if (normRole === "vendor") return "business";
  return "customer";
}

function stripRocket(text: string): string {
  return text.replace(/\uD83D\uDE80/g, "").replace(/\s{2,}/g, " ").trim();
}

/**
 * Hourly recurring notifier: sends Play Store update push with IntriHub's official ringtone
 * (`ring.mp3`) to users whose registered app version is missing or older than the latest release.
 * Stops automatically once a device registers the latest app version via `/api/mobile/push-token`.
 */
export async function runHourlyAppUpdateReminder(options?: {
  force?: boolean;
  dryRun?: boolean;
  includeUpdated?: boolean;
}): Promise<AppUpdateReminderResult> {
  const force = Boolean(options?.force);
  const dryRun = Boolean(options?.dryRun);
  const includeUpdated = Boolean(options?.includeUpdated);

  const settingsRow = await prisma.storeSettings.findFirst({
    select: { appVersionConfig: true },
  });

  const storedConfig = (settingsRow?.appVersionConfig || {}) as Partial<AppVersionSettings>;
  const customerAndroid = {
    ...DEFAULT_APP_VERSION_SETTINGS.customer.android,
    ...(storedConfig.customer?.android || {}),
  };
  const businessAndroid = {
    ...DEFAULT_APP_VERSION_SETTINGS.business.android,
    ...(storedConfig.business?.android || {}),
  };

  // Collect all registered tokens across DeviceToken (primary), MobilePushToken, and User.pushToken
  const [deviceTokens, mobileTokens, usersWithToken] = await Promise.all([
    prisma.deviceToken.findMany({
      where: { platform: { notIn: ["web", "ios_voip"] } },
      select: { userId: true, role: true, platform: true, token: true, appVersion: true },
    }),
    prisma.mobilePushToken.findMany({
      select: {
        userId: true,
        platform: true,
        token: true,
        user: { select: { role: true } },
      },
    }),
    prisma.user.findMany({
      where: { pushToken: { not: null } },
      select: { id: true, role: true, pushToken: true },
    }),
  ]);

  const tokenMap = new Map<string, CandidateToken>();

  for (const row of deviceTokens) {
    if (!isExpoToken(row.token)) continue;
    tokenMap.set(row.token, {
      userId: row.userId,
      token: row.token,
      role: row.role,
      platform: row.platform || "android",
      appVersion: row.appVersion || null,
    });
  }

  for (const row of mobileTokens) {
    if (!isExpoToken(row.token) || tokenMap.has(row.token)) continue;
    tokenMap.set(row.token, {
      userId: row.userId,
      token: row.token,
      role: row.user?.role || "customer",
      platform: row.platform || "android",
      appVersion: null,
    });
  }

  for (const row of usersWithToken) {
    if (!isExpoToken(row.pushToken) || tokenMap.has(row.pushToken)) continue;
    tokenMap.set(row.pushToken, {
      userId: row.id,
      token: row.pushToken,
      role: row.role || "customer",
      platform: "android",
      appVersion: null,
    });
  }

  const allCandidates = Array.from(tokenMap.values());
  let skippedUpToDate = 0;

  interface DispatchTarget extends CandidateToken {
    targetApp: "customer" | "business";
    latestVersion: string;
    supportsCustomRemoteViews: boolean;
    packageName: string;
    storeUrl: string;
    webUrl: string;
    title: string;
    body: string;
  }

  const outdatedTargets: DispatchTarget[] = [];
  const updatedDeviceUsersByApp = new Set<string>();

  for (const candidate of allCandidates) {
    const targetApp = inferTargetApp(candidate.role, candidate.appVersion);
    const platformConfig = targetApp === "business" ? businessAndroid : customerAndroid;
    const latestVersion = (platformConfig.latestVersion || "").trim();
    if (
      candidate.appVersion &&
      isValidSemver(candidate.appVersion) &&
      isValidSemver(latestVersion) &&
      compareSemver(candidate.appVersion, latestVersion) >= 0
    ) {
      updatedDeviceUsersByApp.add(`${candidate.userId}:${targetApp}`);
    }
  }

  for (const candidate of allCandidates) {
    const targetApp = inferTargetApp(candidate.role, candidate.appVersion);
    const platformConfig = targetApp === "business" ? businessAndroid : customerAndroid;
    const latestVersion = (platformConfig.latestVersion || "").trim();

    if (!includeUpdated && updatedDeviceUsersByApp.has(`${candidate.userId}:${targetApp}`)) {
      if (
        !candidate.appVersion ||
        (isValidSemver(candidate.appVersion) &&
          isValidSemver(latestVersion) &&
          compareSemver(candidate.appVersion, latestVersion) >= 0)
      ) {
        skippedUpToDate++;
        continue;
      }
    }

    const packageName = targetApp === "business" ? "com.intrihub.business" : "com.intrihub.app";
    const storeUrl = `market://details?id=${packageName}`;
    const webUrl =
      platformConfig.storeUrl || `https://play.google.com/store/apps/details?id=${packageName}`;
    const supportsCustomRemoteViews =
      candidate.platform.toLowerCase().includes("android") &&
      Boolean(
        candidate.appVersion &&
          isValidSemver(candidate.appVersion) &&
          compareSemver(candidate.appVersion, MIN_CUSTOM_UI_VERSION[targetApp]) >= 0
      );

    const rawTitle = stripRocket(platformConfig.title || "Update Available!") || "Update Available!";
    const body =
      platformConfig.message ||
      (targetApp === "business"
        ? "Update IntriHub Business on Play Store for the latest features and order alerts."
        : "Update IntriHub on Play Store for faster performance and new features.");

    outdatedTargets.push({
      ...candidate,
      targetApp,
      latestVersion,
      supportsCustomRemoteViews,
      packageName,
      storeUrl,
      webUrl,
      title: rawTitle === "New Update Available!" ? "Update Available!" : rawTitle,
      body,
    });
  }

  // Filter out users who already received an update reminder within the cooldown window
  let skippedCooldown = 0;
  let eligibleTargets = outdatedTargets;

  if (!force && outdatedTargets.length > 0) {
    const cutoff = new Date(Date.now() - HOURLY_COOLDOWN_MS);
    const recentLogs = await prisma.notificationLog.findMany({
      where: {
        type: UPDATE_NOTIFICATION_TYPE,
        status: "sent",
        createdAt: { gte: cutoff },
        userId: { in: Array.from(new Set(outdatedTargets.map((t) => t.userId))) },
      },
      select: { userId: true },
    });
    const recentlyNotifiedUsers = new Set(recentLogs.map((r) => r.userId));

    eligibleTargets = outdatedTargets.filter((target) => {
      if (recentlyNotifiedUsers.has(target.userId)) {
        skippedCooldown++;
        return false;
      }
      return true;
    });
  }

  let dispatchedCustomDataOnly = 0;
  let dispatchedLegacy = 0;
  let failedBatches = 0;

  if (!dryRun && eligibleTargets.length > 0) {
    // Group by dispatch profile: (targetApp, supportsCustomRemoteViews)
    const groups = new Map<string, DispatchTarget[]>();
    for (const target of eligibleTargets) {
      const key = `${target.targetApp}:${target.supportsCustomRemoteViews ? "custom" : "legacy"}`;
      const list = groups.get(key) || [];
      list.push(target);
      groups.set(key, list);
    }

    const notifiedUsers = new Map<string, string>(); // userId -> platform

    for (const [, groupTargets] of groups) {
      const sample = groupTargets[0];
      for (let i = 0; i < groupTargets.length; i += PUSH_BATCH_SIZE) {
        const chunk = groupTargets.slice(i, i + PUSH_BATCH_SIZE);
        const tokens = chunk.map((c) => c.token);

        const pushRes = sample.supportsCustomRemoteViews
          ? await sendExpoPushNotification({
              to: tokens,
              dataOnly: true,
              _contentAvailable: true,
              priority: "high",
              channelId: UPDATE_CHANNEL_ID,
              sound: OFFICIAL_RINGTONE_SOUND,
              data: {
                type: UPDATE_NOTIFICATION_TYPE,
                customLayout: "update_banner_v1",
                appName: "IntriHub",
                title: "Update Available!",
                ctaLabel: "Update Now",
                timestampLabel: "now",
                storeUrl: sample.storeUrl,
                webUrl: sample.webUrl,
                version: sample.latestVersion,
                channelId: UPDATE_CHANNEL_ID,
                sound: OFFICIAL_RINGTONE_SOUND,
              },
            })
          : await sendExpoPushNotification({
              to: tokens,
              title: "Update Available!",
              body: sample.body,
              priority: "high",
              // Existing vendor builds already map `orders_high_importance` to `ring.mp3`
              channelId:
                sample.targetApp === "business" ? "orders_high_importance" : UPDATE_CHANNEL_ID,
              sound: OFFICIAL_RINGTONE_SOUND,
              data: {
                type: UPDATE_NOTIFICATION_TYPE,
                appName: "IntriHub",
                ctaLabel: "Update Now",
                storeUrl: sample.storeUrl,
                webUrl: sample.webUrl,
                version: sample.latestVersion,
                channelId:
                  sample.targetApp === "business" ? "orders_high_importance" : UPDATE_CHANNEL_ID,
                sound: OFFICIAL_RINGTONE_SOUND,
              },
            });

        if (pushRes.success) {
          if (sample.supportsCustomRemoteViews) {
            dispatchedCustomDataOnly += chunk.length;
          } else {
            dispatchedLegacy += chunk.length;
          }
          for (const item of chunk) {
            if (!notifiedUsers.has(item.userId)) {
              notifiedUsers.set(item.userId, item.platform);
            }
          }
        } else {
          failedBatches++;
        }
      }
    }

    if (notifiedUsers.size > 0) {
      await prisma.notificationLog.createMany({
        data: Array.from(notifiedUsers.entries()).map(([userId, platform]) => ({
          userId,
          type: UPDATE_NOTIFICATION_TYPE,
          platform,
          status: "sent",
        })),
      });
    }
  }

  return {
    checkedTokens: allCandidates.length,
    eligibleOutdated: eligibleTargets.length,
    skippedUpToDate,
    skippedCooldown,
    dispatchedCustomDataOnly,
    dispatchedLegacy,
    failedBatches,
    dryRun,
    latestVersions: {
      customerAndroid: customerAndroid.latestVersion,
      businessAndroid: businessAndroid.latestVersion,
    },
  };
}
