import sharp from "sharp";
import fs from "fs";
import path from "path";

async function generateFavicons() {
  const src = path.join(process.cwd(), "public/logo/intri-icon.png");

  console.log("Source icon:", src);
  if (!fs.existsSync(src)) {
    throw new Error("Source icon not found at " + src);
  }

  // 1. Generate PNGs of standard sizes
  const sizes = [
    { size: 16, dest: "public/favicon-16x16.png" },
    { size: 32, dest: "public/favicon-32x32.png" },
    { size: 48, dest: "public/favicon-48x48.png" },
    { size: 180, dest: "public/apple-touch-icon.png" },
    { size: 180, dest: "app/apple-icon.png" },
    { size: 32, dest: "app/icon.png" },
    { size: 192, dest: "public/icon-192.png" },
    { size: 512, dest: "public/icon-512.png" },
    { size: 64, dest: "public/favicon.png" },
  ];

  for (const { size, dest } of sizes) {
    const destPath = path.join(process.cwd(), dest);
    await sharp(src)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(destPath);
    console.log(`Generated ${dest} (${size}x${size})`);
  }

  // 2. Generate a valid .ico file
  // An ICO file starts with a 6-byte header, followed by directory entries (16 bytes each), then the image data (PNG format in modern ICO)
  const iconSizes = [16, 32, 48];
  const pngBuffers: Buffer[] = [];

  for (const size of iconSizes) {
    const buf = await sharp(src)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    pngBuffers.push(buf);
  }

  // Construct ICO binary
  const count = iconSizes.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  let offset = 6 + count * 16;
  const dirEntries: Buffer[] = [];

  for (let i = 0; i < count; i++) {
    const size = iconSizes[i];
    const data = pngBuffers[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // Width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(data.length, 8); // Image size in bytes
    entry.writeUInt32LE(offset, 12); // Image offset
    dirEntries.push(entry);
    offset += data.length;
  }

  const icoBuffer = Buffer.concat([header, ...dirEntries, ...pngBuffers]);
  fs.writeFileSync(path.join(process.cwd(), "public/favicon.ico"), icoBuffer);
  fs.writeFileSync(path.join(process.cwd(), "app/favicon.ico"), icoBuffer);
  console.log("Generated valid multi-size public/favicon.ico and app/favicon.ico");

  // 3. Web manifest
  const manifest = {
    name: "Intrihub",
    short_name: "Intrihub",
    icons: [
      { src: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    theme_color: "#052a51",
    background_color: "#ffffff",
    display: "standalone",
  };
  fs.writeFileSync(path.join(process.cwd(), "public/site.webmanifest"), JSON.stringify(manifest, null, 2));
  console.log("Generated public/site.webmanifest");
}

generateFavicons()
  .then(() => console.log("SUCCESS: Favicons generated!"))
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  });
