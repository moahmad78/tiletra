import sharp from "sharp";
import path from "path";
import fs from "fs";

async function generateAppIcons() {
  console.log("Generating production-ready white background app icons...");

  const webLogoSrcPath = path.join(__dirname, "../intrihub-mobile/assets/intri-web-logo.png");

  // Extract full truck (0 to 226 width, full 178 height)
  const truckBuffer = await sharp(webLogoSrcPath)
    .extract({ left: 0, top: 0, width: 226, height: 178 })
    .png()
    .toBuffer();

  // Extract full wordmark (226 to 600 width => 374 width, full 178 height)
  const wordmarkBuffer = await sharp(webLogoSrcPath)
    .extract({ left: 226, top: 0, width: 374, height: 178 })
    .png()
    .toBuffer();

  // 1. MASTER SQUARE ICON (1024x1024)
  // Truck width: 620px
  const truckResized = await sharp(truckBuffer)
    .resize(620, undefined, { fit: "contain" })
    .png()
    .toBuffer();
  const truckMeta = await sharp(truckResized).metadata();
  const truckH = truckMeta.height || 488;
  const truckW = truckMeta.width || 620;

  // Wordmark width: 520px
  const wordmarkResized = await sharp(wordmarkBuffer)
    .resize(520, undefined, { fit: "contain" })
    .png()
    .toBuffer();
  const wordmarkMeta = await sharp(wordmarkResized).metadata();
  const wordmarkH = wordmarkMeta.height || 247;
  const wordmarkW = wordmarkMeta.width || 520;

  const canvasSize = 1024;
  const spacing = 15;
  const totalContentHeight = truckH + spacing + wordmarkH;

  const topOffset = Math.round((canvasSize - totalContentHeight) / 2) - 10;
  const truckLeft = Math.round((canvasSize - truckW) / 2);
  const wordmarkLeft = Math.round((canvasSize - wordmarkW) / 2);
  const wordmarkTop = topOffset + truckH + spacing;

  console.log(`Master icon: Truck top=${topOffset}, height=${truckH}; Wordmark top=${wordmarkTop}, height=${wordmarkH}, totalContent=${totalContentHeight}`);

  const icon1024 = await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: truckResized, top: topOffset, left: truckLeft },
      { input: wordmarkResized, top: wordmarkTop, left: wordmarkLeft },
    ])
    .png()
    .toBuffer();

  // 2. ANDROID ADAPTIVE ICON (1024x1024)
  // Scaled down to fit within the 66% (675px) circular/squircle mask with safe margin
  const adaptiveTruckW = 480;
  const adaptiveTruckResized = await sharp(truckBuffer)
    .resize(adaptiveTruckW, undefined, { fit: "contain" })
    .png()
    .toBuffer();
  const adaptiveTruckMeta = await sharp(adaptiveTruckResized).metadata();
  const adaptiveTruckH = adaptiveTruckMeta.height || 378;

  const adaptiveWordmarkW = 400;
  const adaptiveWordmarkResized = await sharp(wordmarkBuffer)
    .resize(adaptiveWordmarkW, undefined, { fit: "contain" })
    .png()
    .toBuffer();
  const adaptiveWordmarkMeta = await sharp(adaptiveWordmarkResized).metadata();
  const adaptiveWordmarkH = adaptiveWordmarkMeta.height || 190;

  const adaptiveSpacing = 12;
  const adaptiveTotalH = adaptiveTruckH + adaptiveSpacing + adaptiveWordmarkH;
  const adaptiveTop = Math.round((canvasSize - adaptiveTotalH) / 2) - 8;
  const adaptiveTruckLeft = Math.round((canvasSize - adaptiveTruckW) / 2);
  const adaptiveWordmarkLeft = Math.round((canvasSize - adaptiveWordmarkW) / 2);
  const adaptiveWordmarkTop = adaptiveTop + adaptiveTruckH + adaptiveSpacing;

  console.log(`Adaptive icon: total height=${adaptiveTotalH}px (safe inside 675px circle)`);

  const adaptiveIcon1024 = await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: adaptiveTruckResized, top: adaptiveTop, left: adaptiveTruckLeft },
      { input: adaptiveWordmarkResized, top: adaptiveWordmarkTop, left: adaptiveWordmarkLeft },
    ])
    .png()
    .toBuffer();

  // 3. FAVICON (192x192)
  const favicon192 = await sharp(icon1024).resize(192, 192).png().toBuffer();

  // Write all icons to intrihub-mobile/assets
  const mobileAssets = path.join(__dirname, "../intrihub-mobile/assets");
  await fs.promises.writeFile(path.join(mobileAssets, "icon.png"), icon1024);
  await fs.promises.writeFile(path.join(mobileAssets, "adaptive-icon.png"), adaptiveIcon1024);
  await fs.promises.writeFile(path.join(mobileAssets, "favicon.png"), favicon192);

  // Clean up test file if present
  const testFile = path.join(mobileAssets, "test_truck.png");
  if (fs.existsSync(testFile)) {
    await fs.promises.unlink(testFile);
  }

  // Write all icons to intrihub-business/assets
  const businessAssets = path.join(__dirname, "../intrihub-business/assets");
  if (fs.existsSync(businessAssets)) {
    await fs.promises.writeFile(path.join(businessAssets, "icon.png"), icon1024);
    await fs.promises.writeFile(path.join(businessAssets, "adaptive-icon.png"), adaptiveIcon1024);
    await fs.promises.writeFile(path.join(businessAssets, "favicon.png"), favicon192);
  }

  // Write to public/ in root
  const publicDir = path.join(__dirname, "../public");
  if (fs.existsSync(publicDir)) {
    await fs.promises.writeFile(path.join(publicDir, "icon.png"), icon1024);
    await fs.promises.writeFile(path.join(publicDir, "apple-touch-icon.png"), icon1024);
  }

  console.log("SUCCESS: All production white background app icons generated successfully!");
}

generateAppIcons().catch((e) => {
  console.error("Error generating icons:", e);
  process.exit(1);
});
