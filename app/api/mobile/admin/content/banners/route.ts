import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getAllOfferBanners, createOfferBanner } from "@/lib/actions/settings";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const banners = await getAllOfferBanners();

    return mobileApiResponse({
      success: true,
      banners,
      total: banners.length,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Banners List Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to fetch banners" },
      500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const body = await req.json().catch(() => ({}));
    const {
      title,
      subtitle = "",
      badge = "Special Offer",
      cta = "Shop Now",
      href = "/shop",
      image,
      bgGradient,
    } = body;

    if (!title || !title.trim()) {
      return mobileApiResponse({ success: false, error: "Banner title is required" }, 400);
    }

    if (!image || !image.trim()) {
      return mobileApiResponse({ success: false, error: "Banner image is required" }, 400);
    }

    const res = await createOfferBanner({
      title: title.trim(),
      subtitle: subtitle.trim(),
      badge: badge.trim(),
      cta: cta.trim(),
      href: href.trim(),
      image: image.trim(),
      bgGradient: bgGradient?.trim() || undefined,
    });

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: "Offer banner published successfully!",
      banner: res.banner,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Create Banner Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to create banner" },
      500
    );
  }
}
