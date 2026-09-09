import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeFilename } from "@/lib/sanitization";
import {
  ALLOWED_IMAGE_MIMES,
  ALLOWED_DOC_MIMES,
  ALLOWED_EXTENSIONS,
  verifyFileMagicBytes,
} from "@/lib/validations/schemas";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

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

    const uploadDir = path.resolve(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Ignore directory creation errors on read-only serverless filesystems
    }

    const uploadedUrls: string[] = [];
    const base64List: string[] = [];

    for (const file of files) {
      if (!file.name) continue;

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { success: false, error: `File "${file.name}" exceeds maximum allowed size of 10MB.` },
          { status: 400 }
        );
      }

      const mimeCandidate = (file.type || "").toLowerCase().trim();
      const extCandidate = path.extname(file.name).toLowerCase();

      // Explicitly reject SVG / XML / HTML / Executables to prevent Stored XSS and execution
      if (
        mimeCandidate.includes("svg") ||
        mimeCandidate.includes("xml") ||
        mimeCandidate.includes("html") ||
        extCandidate === ".svg" ||
        extCandidate === ".xml" ||
        extCandidate === ".html" ||
        extCandidate === ".htm" ||
        extCandidate === ".js" ||
        extCandidate === ".php" ||
        !ALLOWED_EXTENSIONS.has(extCandidate)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Security validation failed: Only standard raster image formats (JPEG, PNG, WebP) and PDF documents are allowed. SVG and executable formats are prohibited.",
          },
          { status: 400 }
        );
      }

      const isImage = ALLOWED_IMAGE_MIMES.has(mimeCandidate);
      const isDoc = ALLOWED_DOC_MIMES.has(mimeCandidate);

      if (!isImage && !isDoc) {
        return NextResponse.json(
          {
            success: false,
            error: `Unsupported MIME type: ${mimeCandidate}. Only image/jpeg, image/png, image/webp, and application/pdf are accepted.`,
          },
          { status: 400 }
        );
      }

      const rawBytes = await file.arrayBuffer();
      const rawBuffer = Buffer.from(rawBytes);

      // Deep inspection: Binary Magic Bytes Verification
      const magicCheck = verifyFileMagicBytes(rawBuffer);
      if (!magicCheck.valid) {
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
      if (extCandidate === ".pdf" || mimeCandidate === "application/pdf") {
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
          mimeType = mimeCandidate || "image/jpeg";
          ext = extCandidate || ".jpg";
        }
      }

      const rawBase = path.basename(file.name, path.extname(file.name));
      const sanitizedBase = sanitizeFilename(rawBase)
        .replace(/[^a-zA-Z0-9]/g, "-")
        .toLowerCase()
        .slice(0, 30);
      const uniqueFileName = `${sanitizedBase || "upload"}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;

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
        // Verify path resolution stays in uploadDir
        if (filePath.startsWith(uploadDir)) {
          await writeFile(filePath, processedBuffer);
        }
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
