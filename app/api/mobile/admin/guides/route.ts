import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import {
  getGuidePosts,
  createGuidePost,
  seedInitialGuidesIfEmpty,
  GuidePostInput
} from "@/lib/actions/guides";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    await seedInitialGuidesIfEmpty();
    const data = await getGuidePosts();
    return mobileApiResponse({
      success: true,
      guides: data.posts,
      count: data.total,
    });
  } catch (err: any) {
    console.error("Mobile admin guides list error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch guides" },
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

    if (!title || !title.trim()) {
      return mobileApiResponse({ success: false, error: "Title is required" }, 400);
    }
    if (!content || !content.trim()) {
      return mobileApiResponse({ success: false, error: "Content body is required" }, 400);
    }

    const input: GuidePostInput = {
      title: title.trim(),
      slug: slug ? slug.trim() : undefined,
      excerpt: excerpt ? excerpt.trim() : undefined,
      content,
      featuredImage: featuredImage ? featuredImage.trim() : undefined,
      metaTitle: metaTitle ? metaTitle.trim() : undefined,
      metaDescription: metaDescription ? metaDescription.trim() : undefined,
      category: category ? category.trim() : "Tiles",
      status: status || "PUBLISHED",
      authorName: authorName ? authorName.trim() : "Intrihub Editorial Team",
      authorRole: authorRole ? authorRole.trim() : undefined,
      readTime: readTime ? readTime.trim() : "5 min read",
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
    };

    const newGuide = await createGuidePost(input);
    return mobileApiResponse({
      success: true,
      guide: newGuide,
      message: "Guide post published successfully!",
    });
  } catch (err: any) {
    console.error("Mobile admin create guide error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to create guide post" },
      500
    );
  }
}
