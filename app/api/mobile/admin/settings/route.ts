import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getStoreSettings, updateStoreSettings } from "@/lib/actions/settings";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const settings = await getStoreSettings();
    const { prisma } = await import("@/lib/prisma");

    const extraKeys = [
      "setting_support_timings",
      "setting_policy_help",
      "setting_policy_privacy",
      "setting_policy_terms",
      "setting_policy_returns",
      "setting_units_list",
      "setting_website_logo",
      "setting_app_icon",
      "setting_hero_headline",
      "setting_hero_tagline",
      "setting_trending_heading",
      "setting_trending_caption",
      "setting_bestsellers_heading",
      "setting_bestsellers_caption",
      "setting_new_arrivals_heading",
      "setting_new_arrivals_caption",
      "setting_deals_bar_text",
    ];

    const extraRecords = await prisma.setting.findMany({
      where: { key: { in: extraKeys } },
    });

    const extraMap: Record<string, string> = {};
    extraRecords.forEach((r) => {
      extraMap[r.key] = r.value;
    });

    return mobileApiResponse({
      success: true,
      settings: {
        ...settings,
        supportTimings: extraMap["setting_support_timings"] || "10:00 AM – 07:00 PM (Mon–Sat)",
        policyHelp: extraMap["setting_policy_help"] || "IntriHub Support: We are committed to providing premium building material procurement support.",
        policyPrivacy: extraMap["setting_policy_privacy"] || "IntriHub Privacy Policy: Your personal and commercial data is protected.",
        policyTerms: extraMap["setting_policy_terms"] || "IntriHub Terms of Service: Standard B2B/B2C marketplace terms.",
        policyReturns: extraMap["setting_policy_returns"] || "IntriHub Return & Refund Policy: 7-day hassle-free damage returns.",
        unitsList: extraMap["setting_units_list"] ? JSON.parse(extraMap["setting_units_list"]) : ["sqft", "box", "piece", "meter", "kg", "bag", "ton"],
        websiteLogo: extraMap["setting_website_logo"] || "",
        appIcon: extraMap["setting_app_icon"] || "",
        heroHeadline: extraMap["setting_hero_headline"] || "Direct-From-Factory Building Materials",
        heroTagline: extraMap["setting_hero_tagline"] || "Tiles, Granites, Sanitaryware & Paints Delivered to Your Site",
        trendingHeading: extraMap["setting_trending_heading"] || "Trending Now",
        trendingCaption: extraMap["setting_trending_caption"] || "Architect-approved curated designs for modern spaces",
        bestsellersHeading: extraMap["setting_bestsellers_heading"] || "Bestseller Collections",
        bestsellersCaption: extraMap["setting_bestsellers_caption"] || "Top-rated vitrified tiles & finishes trusted by 10,000+ builders",
        newArrivalsHeading: extraMap["setting_new_arrivals_heading"] || "New In Stock",
        newArrivalsCaption: extraMap["setting_new_arrivals_caption"] || "Latest luxury surfaces and hardware fresh from factory",
        dealsBarText: extraMap["setting_deals_bar_text"] || "Special Launch Offer: Extra 10% off with coupon code FESTIVE10",
      },
    });
  } catch (error: any) {
    console.error("[Mobile Admin Settings Get Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to fetch store settings" },
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
    const updateData: any = {};
    const { prisma } = await import("@/lib/prisma");

    if (body.storeName !== undefined) updateData.storeName = body.storeName.trim();
    if (body.gstNumber !== undefined) updateData.gstNumber = body.gstNumber.trim().toUpperCase();
    if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone.trim();
    if (body.whatsappNumber !== undefined) updateData.whatsappNumber = body.whatsappNumber.trim();
    if (body.email !== undefined) updateData.email = body.email.trim();
    if (body.address !== undefined) updateData.address = body.address.trim();

    if (body.freeDeliveryThreshold !== undefined) {
      const val = Number(body.freeDeliveryThreshold);
      if (isNaN(val) || val < 0) return mobileApiResponse({ success: false, error: "Invalid free delivery threshold" }, 400);
      updateData.freeDeliveryThreshold = val;
    }

    if (body.standardDeliveryFee !== undefined) {
      const val = Number(body.standardDeliveryFee);
      if (isNaN(val) || val < 0) return mobileApiResponse({ success: false, error: "Invalid standard delivery fee" }, 400);
      updateData.standardDeliveryFee = val;
    }

    if (body.deliveryFeeEnabled !== undefined) {
      updateData.deliveryFeeEnabled = Boolean(body.deliveryFeeEnabled);
    }

    if (body.bikeDeliveryRate !== undefined) {
      const val = Number(body.bikeDeliveryRate);
      if (isNaN(val) || val < 0) return mobileApiResponse({ success: false, error: "Invalid bike delivery rate" }, 400);
      updateData.bikeDeliveryRate = val;
    }

    if (body.fourWheelerDeliveryRate !== undefined) {
      const val = Number(body.fourWheelerDeliveryRate);
      if (isNaN(val) || val < 0) return mobileApiResponse({ success: false, error: "Invalid 4-wheeler delivery rate" }, 400);
      updateData.fourWheelerDeliveryRate = val;
    }

    if (body.weightThresholdKg !== undefined) {
      const val = Number(body.weightThresholdKg);
      if (isNaN(val) || val < 0) return mobileApiResponse({ success: false, error: "Invalid weight threshold" }, 400);
      updateData.weightThresholdKg = val;
    }

    if (body.lowStockThreshold !== undefined) {
      const val = Number(body.lowStockThreshold);
      if (isNaN(val) || val < 0) return mobileApiResponse({ success: false, error: "Invalid low stock threshold" }, 400);
      updateData.lowStockThreshold = val;
    }

    if (body.codEnabled !== undefined) {
      updateData.codEnabled = Boolean(body.codEnabled);
    }

    if (body.codMaxLimit !== undefined) {
      const val = Number(body.codMaxLimit);
      if (isNaN(val) || val < 0) return mobileApiResponse({ success: false, error: "Invalid COD max limit" }, 400);
      updateData.codMaxLimit = val;
    }

    if (body.codBlockedPincodes !== undefined) {
      if (Array.isArray(body.codBlockedPincodes)) {
        updateData.codBlockedPincodes = body.codBlockedPincodes.map((p: any) => String(p).trim()).filter(Boolean);
      } else if (typeof body.codBlockedPincodes === "string") {
        updateData.codBlockedPincodes = body.codBlockedPincodes.split(",").map((p: string) => p.trim()).filter(Boolean);
      }
    }

    const res = await updateStoreSettings(updateData);

    // Save extra policies/timings/units
    const extraUpdates: Promise<any>[] = [];
    if (body.supportTimings !== undefined) {
      extraUpdates.push(
        prisma.setting.upsert({
          where: { key: "setting_support_timings" },
          update: { value: String(body.supportTimings).trim() },
          create: { key: "setting_support_timings", value: String(body.supportTimings).trim() },
        })
      );
    }
    if (body.policyHelp !== undefined) {
      extraUpdates.push(
        prisma.setting.upsert({
          where: { key: "setting_policy_help" },
          update: { value: String(body.policyHelp).trim() },
          create: { key: "setting_policy_help", value: String(body.policyHelp).trim() },
        })
      );
    }
    if (body.policyPrivacy !== undefined) {
      extraUpdates.push(
        prisma.setting.upsert({
          where: { key: "setting_policy_privacy" },
          update: { value: String(body.policyPrivacy).trim() },
          create: { key: "setting_policy_privacy", value: String(body.policyPrivacy).trim() },
        })
      );
    }
    if (body.policyTerms !== undefined) {
      extraUpdates.push(
        prisma.setting.upsert({
          where: { key: "setting_policy_terms" },
          update: { value: String(body.policyTerms).trim() },
          create: { key: "setting_policy_terms", value: String(body.policyTerms).trim() },
        })
      );
    }
    if (body.policyReturns !== undefined) {
      extraUpdates.push(
        prisma.setting.upsert({
          where: { key: "setting_policy_returns" },
          update: { value: String(body.policyReturns).trim() },
          create: { key: "setting_policy_returns", value: String(body.policyReturns).trim() },
        })
      );
    }
    if (body.websiteLogo !== undefined) {
      extraUpdates.push(
        prisma.setting.upsert({
          where: { key: "setting_website_logo" },
          update: { value: String(body.websiteLogo).trim() },
          create: { key: "setting_website_logo", value: String(body.websiteLogo).trim() },
        })
      );
    }
    if (body.appIcon !== undefined) {
      extraUpdates.push(
        prisma.setting.upsert({
          where: { key: "setting_app_icon" },
          update: { value: String(body.appIcon).trim() },
          create: { key: "setting_app_icon", value: String(body.appIcon).trim() },
        })
      );
    }
    if (body.heroHeadline !== undefined) {
      extraUpdates.push(
        prisma.setting.upsert({
          where: { key: "setting_hero_headline" },
          update: { value: String(body.heroHeadline).trim() },
          create: { key: "setting_hero_headline", value: String(body.heroHeadline).trim() },
        })
      );
    }
    if (body.heroTagline !== undefined) {
      extraUpdates.push(
        prisma.setting.upsert({
          where: { key: "setting_hero_tagline" },
          update: { value: String(body.heroTagline).trim() },
          create: { key: "setting_hero_tagline", value: String(body.heroTagline).trim() },
        })
      );
    }
    if (body.trendingHeading !== undefined) {
      extraUpdates.push(
        prisma.setting.upsert({
          where: { key: "setting_trending_heading" },
          update: { value: String(body.trendingHeading).trim() },
          create: { key: "setting_trending_heading", value: String(body.trendingHeading).trim() },
        })
      );
    }
    if (body.trendingCaption !== undefined) {
      extraUpdates.push(
        prisma.setting.upsert({
          where: { key: "setting_trending_caption" },
          update: { value: String(body.trendingCaption).trim() },
          create: { key: "setting_trending_caption", value: String(body.trendingCaption).trim() },
        })
      );
    }
    if (body.bestsellersHeading !== undefined) {
      extraUpdates.push(
        prisma.setting.upsert({
          where: { key: "setting_bestsellers_heading" },
          update: { value: String(body.bestsellersHeading).trim() },
          create: { key: "setting_bestsellers_heading", value: String(body.bestsellersHeading).trim() },
        })
      );
    }
    if (body.bestsellersCaption !== undefined) {
      extraUpdates.push(
        prisma.setting.upsert({
          where: { key: "setting_bestsellers_caption" },
          update: { value: String(body.bestsellersCaption).trim() },
          create: { key: "setting_bestsellers_caption", value: String(body.bestsellersCaption).trim() },
        })
      );
    }
    if (body.newArrivalsHeading !== undefined) {
      extraUpdates.push(
        prisma.setting.upsert({
          where: { key: "setting_new_arrivals_heading" },
          update: { value: String(body.newArrivalsHeading).trim() },
          create: { key: "setting_new_arrivals_heading", value: String(body.newArrivalsHeading).trim() },
        })
      );
    }
    if (body.newArrivalsCaption !== undefined) {
      extraUpdates.push(
        prisma.setting.upsert({
          where: { key: "setting_new_arrivals_caption" },
          update: { value: String(body.newArrivalsCaption).trim() },
          create: { key: "setting_new_arrivals_caption", value: String(body.newArrivalsCaption).trim() },
        })
      );
    }
    if (body.dealsBarText !== undefined) {
      extraUpdates.push(
        prisma.setting.upsert({
          where: { key: "setting_deals_bar_text" },
          update: { value: String(body.dealsBarText).trim() },
          create: { key: "setting_deals_bar_text", value: String(body.dealsBarText).trim() },
        })
      );
    }

    if (extraUpdates.length > 0) {
      await Promise.all(extraUpdates);
    }

    return mobileApiResponse({
      success: true,
      message: "Global store settings & policy content updated successfully!",
      settings: res.settings,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Settings Update Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to update store settings" },
      500
    );
  }
}
