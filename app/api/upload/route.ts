import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("file") as File[];

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

    for (const file of files) {
      if (!file.name) continue;

      const rawBytes = await file.arrayBuffer();
      const rawBuffer = Buffer.from(rawBytes);

      let processedBuffer: Buffer = rawBuffer;
      let mimeType = file.type || "image/jpeg";
      let ext = ".webp";

      const isSvg = file.type === "image/svg+xml" || file.name.endsWith(".svg");

      if (!isSvg) {
        try {
          // Optimize image with sharp: resize large photos & convert to webp (compact & fast loading)
          processedBuffer = await sharp(rawBuffer)
            .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 85 })
            .toBuffer();
          mimeType = "image/webp";
          ext = ".webp";
        } catch (sharpError) {
          console.warn("[Upload] Sharp optimization fallback to original:", sharpError);
          processedBuffer = rawBuffer;
          ext = path.extname(file.name) || ".jpg";
        }
      } else {
        mimeType = "image/svg+xml";
        ext = ".svg";
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
