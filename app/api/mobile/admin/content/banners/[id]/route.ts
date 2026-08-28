import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { updateOfferBanner, deleteOfferBanner } from "@/lib/actions/settings";
import { prisma } from "@/lib/prisma";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { id } = await params;
    const banner = await prisma.offerBanner.findUnique({ where: { id } });

    if (!banner) {
      return mobileApiResponse({ success: false, error: "Banner not found" }, 404);
    }

    return mobileApiResponse({ success: true, banner });
  } catch (error: any) {
    console.error("[Mobile Admin Banner Get Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to fetch banner" },
      500
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.subtitle !== undefined) updateData.subtitle = body.subtitle.trim();
    if (body.badge !== undefined) updateData.badge = body.badge.trim();
    if (body.cta !== undefined) updateData.cta = body.cta.trim();
    if (body.href !== undefined) updateData.href = body.href.trim();
    if (body.image !== undefined) updateData.image = body.image.trim();
    if (body.bgGradient !== undefined) updateData.bgGradient = body.bgGradient.trim();
    if (body.order !== undefined) updateData.order = Number(body.order);
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    const res = await updateOfferBanner(id, updateData);

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: "Banner updated successfully!",
      banner: res.banner,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Banner Update Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to update banner" },
      500
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { id } = await params;
    const res = await deleteOfferBanner(id);

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: "Banner deleted successfully!",
    });
  } catch (error: any) {
    console.error("[Mobile Admin Banner Delete Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to delete banner" },
      500
    );
  }
}
