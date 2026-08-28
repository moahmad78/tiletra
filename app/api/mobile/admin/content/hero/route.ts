import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getHomepageHeroSettings, updateHomepageHeroSettings } from "@/lib/actions/settings";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const hero = await getHomepageHeroSettings();
    return mobileApiResponse({ success: true, hero });
  } catch (error: any) {
    console.error("[Mobile Admin Hero Get Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to fetch hero settings" },
      500
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const body = await req.json().catch(() => ({}));
    const res = await updateHomepageHeroSettings(body);

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: "Homepage hero content updated!",
      hero: res.hero,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Hero Update Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to update hero settings" },
      500
    );
  }
}
