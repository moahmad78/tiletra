import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";

// Fallback 1x1 transparent WebP pixel
const FALLBACK_WEBP = Buffer.from(
  "UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoB+AA/v30f////9v///7/7///vf/3/73/9/+//vf/3/70A",
  "base64"
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    if (!filename) {
      return new NextResponse(FALLBACK_WEBP, {
        status: 404,
        headers: { "Content-Type": "image/webp" },
      });
    }

    // 1. Try local disk first
    try {
      const localFilePath = path.join(process.cwd(), "public", "uploads", filename);
      const fileBuffer = await readFile(localFilePath);
      const ext = path.extname(filename).toLowerCase();
      const mimeType =
        ext === ".webp"
          ? "image/webp"
          : ext === ".png"
          ? "image/png"
          : ext === ".svg"
          ? "image/svg+xml"
          : "image/jpeg";

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Disposition": "inline",
        },
      });
    } catch {
      // Local disk read failed or running in cloud serverless
    }

    // 2. Query Neon PostgreSQL database for permanent persistent media
    const dbFile = await (prisma as any).uploadedFile.findUnique({
      where: { fileName: filename },
    });

    if (dbFile && dbFile.dataBase64) {
      const imageBuffer = Buffer.from(dbFile.dataBase64, "base64");
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          "Content-Type": dbFile.mimeType || "image/webp",
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Disposition": "inline",
        },
      });
    }

    // 3. Fallback to placeholder
    try {
      const placeholderPath = path.join(process.cwd(), "public", "placeholders", "product.svg");
      const placeholderBuffer = await readFile(placeholderPath);
      return new NextResponse(placeholderBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      return new NextResponse(FALLBACK_WEBP, {
        status: 200,
        headers: { "Content-Type": "image/webp" },
      });
    }
  } catch (error: any) {
    console.error("[Uploads Route Error]:", error);
    return new NextResponse(FALLBACK_WEBP, {
      status: 200,
      headers: { "Content-Type": "image/webp" },
    });
  }
}
