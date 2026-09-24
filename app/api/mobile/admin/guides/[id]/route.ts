import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import {
  getGuidePostById,
  updateGuidePost,
  deleteGuidePost,
  GuidePostInput
} from "@/lib/actions/guides";

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
    const guide = await getGuidePostById(id);
    if (!guide) {
      return mobileApiResponse({ success: false, error: "Guide not found" }, 404);
    }

    return mobileApiResponse({
      success: true,
      guide,
    });
  } catch (err: any) {
    console.error("Mobile admin get guide error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch guide" },
      500
    );
  }
}

export async function PUT(
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
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      metaTitle,
      metaDescription,
      category,
      status,
      authorName,
      authorRole,
      readTime,
      publishedAt,
    } = body;

    const input: GuidePostInput = {
      title: title?.trim(),
      slug: slug?.trim(),
      excerpt: excerpt?.trim(),
      content,
      featuredImage: featuredImage?.trim(),
      metaTitle: metaTitle?.trim(),
      metaDescription: metaDescription?.trim(),
      category: category?.trim(),
      status,
      authorName: authorName?.trim(),
      authorRole: authorRole?.trim(),
      readTime: readTime?.trim(),
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : undefined,
    };

    const updated = await updateGuidePost(id, input);
    return mobileApiResponse({
      success: true,
      guide: updated,
      message: "Guide post updated successfully!",
    });
  } catch (err: any) {
    console.error("Mobile admin update guide error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to update guide post" },
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
    await deleteGuidePost(id);

    return mobileApiResponse({
      success: true,
      message: "Guide post deleted successfully!",
    });
  } catch (err: any) {
    console.error("Mobile admin delete guide error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to delete guide post" },
      500
    );
  }
}
