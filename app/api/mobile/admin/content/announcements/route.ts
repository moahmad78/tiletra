import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getHomepageAnnouncements, updateHomepageAnnouncements } from "@/lib/actions/settings";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const announcements = await getHomepageAnnouncements();
    return mobileApiResponse({ success: true, announcements });
  } catch (error: any) {
    console.error("[Mobile Admin Announcements Get Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to fetch announcements" },
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
    const res = await updateHomepageAnnouncements(body);

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: "Announcement banner updated!",
      announcements: res.announcements,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Announcements Update Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to update announcements" },
      500
    );
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}
