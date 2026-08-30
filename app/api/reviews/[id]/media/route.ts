import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import crypto from "crypto";
import { handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

const MAX_MEDIA_ITEMS = 5;
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    // 1. Fetch Review and check ownership
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        media: true,
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found." },
        { status: 404 }
      );
    }

    if (review.userId !== user.id && user.role !== "admin" && user.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "You can only upload media to your own reviews." },
        { status: 403 }
      );
    }

    // 2. Check total media limit
    const existingCount = review.media.length;
    if (existingCount >= MAX_MEDIA_ITEMS) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum of ${MAX_MEDIA_ITEMS} media items allowed per review.`,
        },
        { status: 400 }
      );
    }

    // 3. Parse formData
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;
    const allFiles = files.length > 0 ? files : singleFile ? [singleFile] : [];

    if (allFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "No media files provided." },
        { status: 400 }
      );
    }

    if (existingCount + allFiles.length > MAX_MEDIA_ITEMS) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot upload ${allFiles.length} file(s). Limit is ${MAX_MEDIA_ITEMS} total (${existingCount} already uploaded).`,
        },
        { status: 400 }
      );
    }

    const createdMedia: Array<any> = [];

    for (const file of allFiles) {
      const mime = file.type.toLowerCase();
      const isImage = mime.startsWith("image/");
      const isVideo = mime.startsWith("video/");

      if (!isImage && !isVideo) {
        return NextResponse.json(
          {
            success: false,
            error: `Unsupported file type: ${mime}. Only JPG, PNG, WEBP, MP4, and MOV files are allowed.`,
          },
          { status: 400 }
        );
      }

      // Check size limits
      if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          {
            success: false,
            error: `Image ${file.name} exceeds 8MB size limit.`,
          },
          { status: 400 }
        );
      }

      if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
        return NextResponse.json(
          {
            success: false,
            error: `Video ${file.name} exceeds 50MB size limit.`,
          },
          { status: 400 }
        );
      }

      // Extract file extension
      const originalExt = file.name.split(".").pop()?.toLowerCase() || (isImage ? "jpg" : "mp4");
      const cleanExt = ["jpg", "jpeg", "png", "webp", "mp4", "mov"].includes(originalExt)
        ? originalExt
        : isImage
        ? "jpg"
        : "mp4";

      const uniqueId = crypto.randomUUID();
      const blobPathname = `reviews/${reviewId}/${uniqueId}.${cleanExt}`;

      let mediaUrl = "";

      // Check if Vercel Blob token is present
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
      if (blobToken) {
        const blobResult = await put(blobPathname, file, {
          access: "public",
          token: blobToken,
        });
        mediaUrl = blobResult.url;
      } else {
        // Fallback for local testing if blob token is not configured
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        mediaUrl = `data:${mime};base64,${base64}`;
      }

      const mediaRecord = await prisma.reviewMedia.create({
        data: {
          reviewId,
          type: isVideo ? "VIDEO" : "IMAGE",
          url: mediaUrl,
          thumbnailUrl: isVideo ? null : undefined,
        },
      });

      createdMedia.push(mediaRecord);
    }

    const res = NextResponse.json({
      success: true,
      media: createdMedia,
      count: createdMedia.length,
      message: "Media uploaded successfully.",
    });

    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Id");
    return res;
  } catch (error: any) {
    console.error("[POST /api/reviews/:id/media Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to upload review media" },
      { status: 500 }
    );
  }
}
