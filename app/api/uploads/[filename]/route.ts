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

    // Helper function to generate safe response headers
    const getSafeMediaHeaders = (mimeType: string, isStaticPlaceholder: boolean = false) => {
      const isSafeImage = ["image/webp", "image/jpeg", "image/jpg", "image/png", "image/gif", "image/avif"].includes(mimeType);
      
      return {
        "Content-Type": mimeType,
        "Cache-Control": isStaticPlaceholder ? "public, max-age=86400" : "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        "Content-Disposition": isSafeImage ? "inline" : "attachment",
      };
    };

    // 1. Try local disk first (for localhost & cached container images)
    try {
      const localFilePath = path.join(process.cwd(), "public", "uploads", filename);
      const fileBuffer = await readFile(localFilePath);
      const ext = path.extname(filename).toLowerCase();
      const mimeType =
        ext === ".webp"
          ? "image/webp"
          : ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".gif"
          ? "image/gif"
          : ext === ".avif"
          ? "image/avif"
          : "application/octet-stream";

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: getSafeMediaHeaders(mimeType),
      });
    } catch {
      // Local disk read failed or running in serverless / live production environment
    }

    // 2. Query Neon PostgreSQL database for permanent persistent media
    const dbFile = await (prisma as any).uploadedFile.findUnique({
      where: { fileName: filename },
    });

    if (dbFile && dbFile.dataBase64) {
      const imageBuffer = Buffer.from(dbFile.dataBase64, "base64");
      const safeMime = dbFile.mimeType === "image/svg+xml" ? "application/octet-stream" : (dbFile.mimeType || "image/webp");
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: getSafeMediaHeaders(safeMime),
      });
    }

    // 3. Fallback to placeholder if not found
    try {
      const placeholderPath = path.join(process.cwd(), "public", "placeholders", "product.svg");
      const placeholderBuffer = await readFile(placeholderPath);
      return new NextResponse(placeholderBuffer, {
        status: 200,
        headers: getSafeMediaHeaders("image/svg+xml", true),
      });
    } catch {
      return new NextResponse(FALLBACK_WEBP, {
        status: 200,
        headers: { "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff" },
      });
    }
  } catch (error: any) {
    console.error("[Media Route Error]:", error);
    return new NextResponse(FALLBACK_WEBP, {
      status: 200,
      headers: { "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff" },
    });
  }
}
