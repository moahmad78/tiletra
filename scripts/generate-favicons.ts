import fs from "fs";
import path from "path";
import sharp from "sharp";

async function generateFavicons() {
  const sourceIcon = path.join(process.cwd(), "public/logo/intri-icon.png");
  const sourceWebLogo = path.join(process.cwd(), "public/logo/intri-web-logo.png");

  if (!fs.existsSync(sourceIcon)) {
    throw new Error(`Source icon not found at ${sourceIcon}`);
  }

  console.log("Reading source icon from:", sourceIcon);

  // 1. Generate PNGs with small safe padding (10% padding) to ensure crisp, unclipped edges
  const sizes = [
    { name: "favicon-16x16.png", size: 16, paddingPercent: 0.05 },
    { name: "favicon-32x32.png", size: 32, paddingPercent: 0.06 },
    { name: "favicon-48x48.png", size: 48, paddingPercent: 0.08 },
    { name: "apple-touch-icon.png", size: 180, paddingPercent: 0.1 },
    { name: "icon-192.png", size: 192, paddingPercent: 0.1 },
    { name: "icon-512.png", size: 512, paddingPercent: 0.1 },
  ];

  const pngBuffers: { size: number; buffer: Buffer }[] = [];

  for (const item of sizes) {
    const innerSize = Math.round(item.size * (1 - item.paddingPercent * 2));
    const pad = Math.round((item.size - innerSize) / 2);

    const resizedLogo = await sharp(sourceIcon)
      .resize(innerSize, innerSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const outputBuffer = await sharp({
      create: {
        width: item.size,
        height: item.size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: resizedLogo, top: pad, left: pad }])
      .png()
      .toBuffer();

    const publicDest = path.join(process.cwd(), "public", item.name);
    fs.writeFileSync(publicDest, outputBuffer);
    console.log(`✓ Generated: public/${item.name} (${item.size}x${item.size})`);

    if ([16, 32, 48].includes(item.size)) {
      pngBuffers.push({ size: item.size, buffer: outputBuffer });
    }
  }

  // Also update Next.js app directory conventions
  const appIcon32 = await sharp(path.join(process.cwd(), "public/favicon-32x32.png")).toBuffer();
  fs.writeFileSync(path.join(process.cwd(), "app/icon.png"), appIcon32);

  const appApple180 = await sharp(path.join(process.cwd(), "public/apple-touch-icon.png")).toBuffer();
  fs.writeFileSync(path.join(process.cwd(), "app/apple-icon.png"), appApple180);

  // 2. Generate multi-resolution favicon.ico (16, 32, 48)
  const icoBuffer = createIcoFromPngs(pngBuffers);
  fs.writeFileSync(path.join(process.cwd(), "public/favicon.ico"), icoBuffer);
  fs.writeFileSync(path.join(process.cwd(), "app/favicon.ico"), icoBuffer);
  console.log("✓ Generated multi-resolution: public/favicon.ico and app/favicon.ico");

  // 3. Generate 1200x630 Open Graph preview banner (og-image.png)
  if (fs.existsSync(sourceWebLogo)) {
    const ogWidth = 1200;
    const ogHeight = 630;

    // Center the 600x178 logo with clean white card & dark navy branding
    const logoResized = await sharp(sourceWebLogo)
      .resize(560, 166, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    // Create an elegant gradient background canvas
    const svgOverlay = `
      <svg width="${ogWidth}" height="${ogHeight}" viewBox="0 0 ${ogWidth} ${ogHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#02152b"/>
            <stop offset="50%" stop-color="#052a51"/>
            <stop offset="100%" stop-color="#08386a"/>
          </linearGradient>
        </defs>
        <rect width="${ogWidth}" height="${ogHeight}" fill="url(#bgGrad)"/>
        <!-- Ambient glow circles -->
        <circle cx="100" cy="100" r="250" fill="#F26522" opacity="0.12"/>
        <circle cx="1100" cy="530" r="280" fill="#2F7A4F" opacity="0.15"/>
        
        <!-- White Logo Card -->
        <rect x="320" y="160" width="560" height="200" rx="24" fill="#ffffff" filter="drop-shadow(0 20px 30px rgba(0,0,0,0.3))"/>
        
        <!-- Tagline & Highlights -->
        <text x="600" y="420" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="900" letter-spacing="1">
          INDIA'S BUILDING &amp; INTERIOR MATERIALS MARKETPLACE
        </text>
        <text x="600" y="465" text-anchor="middle" fill="#F26522" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700">
          ⚡ 60-Minute Site Delivery • Wholesale Factory Rates • 20+ Categories
        </text>
        <text x="600" y="520" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500">
          Tiles • Granite • Electrical • Plumbing • Sanitaryware • Hardware • Begur, Bengaluru
        </text>
      </svg>
    `;

    const ogBanner = await sharp(Buffer.from(svgOverlay))
      .composite([
        {
          input: logoResized,
          top: 177,
          left: 320,
        },
      ])
      .png({ quality: 95 })
      .toBuffer();

    fs.writeFileSync(path.join(process.cwd(), "public/og-image.png"), ogBanner);
    console.log("✓ Generated OpenGraph banner: public/og-image.png (1200x630)");
  }

  console.log("\n🎉 All favicons and OpenGraph preview images generated successfully!");
}

function createIcoFromPngs(images: { size: number; buffer: Buffer }[]): Buffer {
  const numImages = images.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = headerSize + dirEntrySize * numImages;

  let currentOffset = dirSize;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(numImages, 4); // Number of images

  const dirEntries: Buffer[] = [];
  const imageBuffers: Buffer[] = [];

  for (const img of images) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0); // Width
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Image size in bytes
    entry.writeUInt32LE(currentOffset, 12); // Offset of image data

    dirEntries.push(entry);
    imageBuffers.push(img.buffer);
    currentOffset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageBuffers]);
}

generateFavicons().catch((err) => {
  console.error(err);
  process.exit(1);
});
