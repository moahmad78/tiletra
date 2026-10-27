import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import {
  isValidSemver,
  DEFAULT_APP_VERSION_SETTINGS,
  AppVersionSettings,
  AppPlatformConfig,
} from "@/lib/semver";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

/**
 * Report error silently to Sentry without exposing or logging secrets
 */
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

/**
 * GET /api/mobile/admin/app-config
 * Returns current AppVersionSettings from DB or default
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
    if (auth.user.email?.toLowerCase().trim() !== allowedAdminEmail) {
      return mobileApiResponse(
        { success: false, error: "Access forbidden: authorized admin email required" },
        403
      );
    }

    let currentConfig = DEFAULT_APP_VERSION_SETTINGS;
    const settings = await prisma.storeSettings.findFirst({
      select: { id: true, appVersionConfig: true },
    });

    if (settings?.appVersionConfig) {
      currentConfig = {
        ...DEFAULT_APP_VERSION_SETTINGS,
        ...(settings.appVersionConfig as unknown as AppVersionSettings),
      };
    }

    return mobileApiResponse({
      success: true,
      config: currentConfig,
    });
  } catch (error: any) {
    reportErrorToSentry(error, { endpoint: "GET /api/mobile/admin/app-config" });
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to retrieve app configuration" },
      500
    );
  }
}

/**
 * POST /api/mobile/admin/app-config
 * Updates AppVersionSettings with validation & audit log
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
    if (auth.user.email?.toLowerCase().trim() !== allowedAdminEmail) {
      return mobileApiResponse(
        { success: false, error: "Access forbidden: authorized admin email required" },
        403
      );
    }

    const body = await req.json().catch(() => ({}));
    const { app, platform = "android", config: incomingConfig, fullConfig } = body;

    // Load or create current StoreSettings
    let settings = await prisma.storeSettings.findFirst();
    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          storeName: "Intrihub",
          appVersionConfig: DEFAULT_APP_VERSION_SETTINGS as any,
        },
      });
    }

    const oldConfig: AppVersionSettings = (settings.appVersionConfig as unknown as AppVersionSettings) || {
      ...DEFAULT_APP_VERSION_SETTINGS,
    };

    let updatedConfig: AppVersionSettings = JSON.parse(JSON.stringify(oldConfig));

    if (fullConfig && typeof fullConfig === "object") {
      // Validate customer.android
      for (const targetApp of ["customer", "business"] as const) {
        for (const targetPlat of ["android", "ios"] as const) {
          const cfg = fullConfig[targetApp]?.[targetPlat];
          if (cfg) {
            const validationErr = validatePlatformConfig(cfg);
            if (validationErr) {
              return mobileApiResponse(
                { success: false, error: `Invalid ${targetApp} ${targetPlat} config: ${validationErr}` },
                400
              );
            }
          }
        }
      }
      updatedConfig = {
        ...updatedConfig,
        ...fullConfig,
      };
    } else if (app && incomingConfig) {
      const normApp: "customer" | "business" =
        app.includes("biz") || app.includes("business") || app.includes("vendor")
          ? "business"
          : "customer";
      const normPlat: "android" | "ios" =
        platform.includes("ios") || platform.includes("apple") ? "ios" : "android";

      const validationErr = validatePlatformConfig(incomingConfig);
      if (validationErr) {
        return mobileApiResponse(
          { success: false, error: `Invalid ${normApp} ${normPlat} config: ${validationErr}` },
          400
        );
      }

      const existingTarget = updatedConfig[normApp]?.[normPlat] || DEFAULT_APP_VERSION_SETTINGS[normApp][normPlat];

      const cleanNotes = Array.isArray(incomingConfig.releaseNotes)
        ? incomingConfig.releaseNotes
        : typeof incomingConfig.releaseNotes === "string"
        ? incomingConfig.releaseNotes
            .split("\n")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : existingTarget.releaseNotes || [];

      updatedConfig[normApp][normPlat] = {
        ...existingTarget,
        latestVersion: String(incomingConfig.latestVersion).trim(),
        latestVersionCode:
          incomingConfig.latestVersionCode !== undefined && incomingConfig.latestVersionCode !== null
            ? Number(incomingConfig.latestVersionCode)
            : existingTarget.latestVersionCode,
        minSupportedVersion: incomingConfig.minSupportedVersion
          ? String(incomingConfig.minSupportedVersion).trim()
          : existingTarget.minSupportedVersion,
        minSupportedVersionCode:
          incomingConfig.minSupportedVersionCode !== undefined &&
          incomingConfig.minSupportedVersionCode !== null
            ? Number(incomingConfig.minSupportedVersionCode)
            : existingTarget.minSupportedVersionCode,
        forceUpdate: Boolean(incomingConfig.forceUpdate),
        storeUrl: incomingConfig.storeUrl?.trim() || existingTarget.storeUrl,
        title: incomingConfig.title?.trim() || existingTarget.title,
        message: incomingConfig.message?.trim() || existingTarget.message,
        releaseNotes: cleanNotes,
      };
    } else {
      return mobileApiResponse(
        { success: false, error: "Either (app, platform, config) or (fullConfig) must be provided." },
        400
      );
    }

    // Persist to database
    await prisma.storeSettings.update({
      where: { id: settings.id },
      data: {
        appVersionConfig: updatedConfig as any,
      },
    });

    // Create Audit Log (who, when, old and new values)
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId: auth.user.id,
          action: "UPDATE_APP_VERSION_CONFIG",
          entity: "StoreSettings",
          entityId: settings.id,
          actorRole: "ADMIN",
          before: oldConfig as any,
          after: updatedConfig as any,
          ip: clientIp,
        },
      });
    } catch (auditErr) {
      console.warn("[AdminAuditLog create notice]:", auditErr);
      try {
        await prisma.auditLog.create({
          data: {
            action: "UPDATE_APP_VERSION_CONFIG",
            entity: "StoreSettings",
            entityId: settings.id,
            userId: auth.user.id,
            details: {
              adminEmail: auth.user.email,
              adminName: auth.user.name,
              timestamp: new Date().toISOString(),
              before: oldConfig,
              after: updatedConfig,
            } as any,
            ipAddress: clientIp,
          },
        });
      } catch (e) {
        reportErrorToSentry(e, { step: "audit_log_write" });
      }
    }

    return mobileApiResponse({
      success: true,
      message: "App version configuration updated successfully",
      config: updatedConfig,
    });
  } catch (error: any) {
    reportErrorToSentry(error, { endpoint: "POST /api/mobile/admin/app-config" });
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to update app configuration" },
      500
    );
  }
}

function validatePlatformConfig(cfg: Partial<AppPlatformConfig>): string | null {
  if (!cfg.latestVersion || !isValidSemver(cfg.latestVersion)) {
    return `latestVersion must be a valid semver string (e.g., 1.2.17). Received: "${cfg.latestVersion}"`;
  }

  if (cfg.latestVersionCode !== undefined && cfg.latestVersionCode !== null) {
    const code = Number(cfg.latestVersionCode);
    if (!Number.isInteger(code) || code <= 0) {
      return `latestVersionCode must be a positive integer. Received: "${cfg.latestVersionCode}"`;
    }
  }

  if (cfg.minSupportedVersion && !isValidSemver(cfg.minSupportedVersion)) {
    return `minSupportedVersion must be a valid semver string (e.g., 1.2.0). Received: "${cfg.minSupportedVersion}"`;
  }

  if (cfg.minSupportedVersionCode !== undefined && cfg.minSupportedVersionCode !== null) {
    const code = Number(cfg.minSupportedVersionCode);
    if (!Number.isInteger(code) || code <= 0) {
      return `minSupportedVersionCode must be a positive integer. Received: "${cfg.minSupportedVersionCode}"`;
    }
  }

  return null;
}
