import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

/**
 * Validates file buffer magic bytes against authorized binary signatures
 */
function isValidMagicBytes(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return true;
  }

  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return true;
  }

  // WebP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return true;
  }

  // PDF: %PDF (25 50 44 46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return true;
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anonymous";
    const rateCheck = checkRateLimit(`upload:${ip}`, 30, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Upload rate limit exceeded. Please wait before uploading more files." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const files = (formData.getAll("file") as unknown) as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: "No files provided" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Ignore directory creation errors on read-only serverless filesystems
    }

    const uploadedUrls: string[] = [];
    const base64List: string[] = [];

    const ALLOWED_MIME_TYPES = new Set([
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
      "application/pdf",
    ]);

    for (const file of files) {
      if (!file.name) continue;

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { success: false, error: `File "${file.name}" exceeds maximum allowed size of 10MB.` },
          { status: 400 }
        );
      }

      const mimeTypeCandidate = file.type?.toLowerCase() || "";
      const extCandidate = path.extname(file.name).toLowerCase();

      // Explicitly reject SVG / XML / HTML to prevent Stored XSS
      if (
        mimeTypeCandidate.includes("svg") ||
        mimeTypeCandidate.includes("xml") ||
        mimeTypeCandidate.includes("html") ||
        extCandidate === ".svg" ||
        extCandidate === ".xml" ||
        extCandidate === ".html" ||
        extCandidate === ".htm" ||
        !ALLOWED_MIME_TYPES.has(mimeTypeCandidate)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Security validation failed: Only standard raster image formats (JPEG, PNG, WebP) and PDF documents are allowed. SVG and executable formats are prohibited.",
          },
          { status: 400 }
        );
      }

      const rawBytes = await file.arrayBuffer();
      const rawBuffer = Buffer.from(rawBytes);

      // Deep inspection: Magic Bytes Verification
      if (!isValidMagicBytes(rawBuffer)) {
        return NextResponse.json(
          {
            success: false,
            error: "Security validation failed: File binary header does not match authorized image/document signatures.",
          },
          { status: 400 }
        );
      }

      let processedBuffer: Buffer = rawBuffer;
      let mimeType = "image/webp";
      let ext = ".webp";

      // If PDF document, keep original buffer and mime
      if (extCandidate === ".pdf" || mimeTypeCandidate === "application/pdf") {
        processedBuffer = rawBuffer;
        mimeType = "application/pdf";
        ext = ".pdf";
      } else {
        try {
          // Optimize raster image with sharp
          processedBuffer = await sharp(rawBuffer)
            .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 85 })
            .toBuffer();
          mimeType = "image/webp";
          ext = ".webp";
        } catch (sharpError) {
          console.warn("[Upload] Sharp optimization fallback to original:", sharpError);
          processedBuffer = rawBuffer;
          mimeType = mimeTypeCandidate || "image/jpeg";
          ext = extCandidate || ".jpg";
        }
      }

      const sanitizedBase = path.basename(file.name, path.extname(file.name))
        .replace(/[^a-zA-Z0-9]/g, "-")
        .toLowerCase()
        .slice(0, 30);
      const uniqueFileName = `${sanitizedBase}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;

      const base64String = processedBuffer.toString("base64");
      const dataUri = `data:${mimeType};base64,${base64String}`;
      base64List.push(dataUri);

      // 1. Save permanently to Neon PostgreSQL Database
      try {
        await (prisma as any).uploadedFile.upsert({
          where: { fileName: uniqueFileName },
          update: {
            mimeType,
            dataBase64: base64String,
            sizeBytes: processedBuffer.length,
          },
          create: {
            fileName: uniqueFileName,
            mimeType,
            dataBase64: base64String,
            sizeBytes: processedBuffer.length,
          },
        });
      } catch (dbError) {
        console.error("[Upload] Failed to persist file to Neon DB:", dbError);
      }

      // 2. Also save to local disk if writable (e.g. localhost)
      try {
        const filePath = path.join(uploadDir, uniqueFileName);
        await writeFile(filePath, processedBuffer);
      } catch {
        // Ephemeral / serverless disk write ignore
      }

      // Return live route URL
      uploadedUrls.push(`/api/uploads/${uniqueFileName}`);
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      url: uploadedUrls[0] || "",
      dataUris: base64List,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "File upload failed" },
      { status: 500 }
    );
  }
}
