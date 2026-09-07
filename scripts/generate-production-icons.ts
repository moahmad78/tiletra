import sharp from "sharp";
import path from "path";
import fs from "fs";

async function generateProductionIcons() {
  console.log("Generating production-ready mobile app icons...");

  const rawTruckPath = path.join(__dirname, "scratch-truck-raw.png");
  if (!fs.existsSync(rawTruckPath)) {
    await sharp(path.join(__dirname, "../public/logo/intri-web-logo.png"))
      .extract({ left: 0, top: 0, width: 226, height: 178 })
      .toFile(rawTruckPath);
  }

  const { data, info } = await sharp(rawTruckPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 1. High contrast white truck body on navy background (#052A51)
  const outData = Buffer.from(data);
  for (let i = 0; i < outData.length; i += info.channels) {
    const r = outData[i];
    const g = outData[i + 1];
    const b = outData[i + 2];
    const a = outData[i + 3];
    if (a > 50) {
      if (r < 40 && g < 60 && b < 90) {
        // Dark navy truck body -> Crisp clean white
        outData[i] = 255;
        outData[i + 1] = 255;
        outData[i + 2] = 255;
      } else if (r > 230 && g > 230 && b > 230) {
        // White windshield & wheel hubs -> Brand navy (#052A51)
        outData[i] = 5;
        outData[i + 1] = 42;
        outData[i + 2] = 81;
      }
    }
  }

  // Width 520px fits perfectly in 66% safe zone circle (diameter 675px)
  const truckResized = await sharp(outData, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .resize(520, null, { fit: "contain" })
    .png()
    .toBuffer();

  const NAVY_BG = { r: 5, g: 42, b: 81, alpha: 1 };

  // 1. Master iOS App Icon (1024x1024, solid navy #052A51, no alpha/transparency)
  const iosMaster1024 = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: NAVY_BG,
    },
  })
    .composite([{ input: truckResized, gravity: "center" }])
    .removeAlpha()
    .png()
    .toBuffer();

  // 2. Android Adaptive Icon Foreground (1024x1024, transparent background, centered)
  const androidForeground1024 = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: truckResized, gravity: "center" }])
    .png()
    .toBuffer();

  // 3. Android Adaptive Full Composite (1024x1024, navy background)
  const androidAdaptive1024 = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: NAVY_BG,
    },
  })
    .composite([{ input: truckResized, gravity: "center" }])
    .png()
    .toBuffer();

  // Save to intrihub-mobile/assets
  const mobileAssets = path.join(__dirname, "../intrihub-mobile/assets");
  await fs.promises.writeFile(path.join(mobileAssets, "icon.png"), iosMaster1024);
  await fs.promises.writeFile(path.join(mobileAssets, "adaptive-icon.png"), androidForeground1024);
  await fs.promises.writeFile(path.join(mobileAssets, "intri-icon.png"), iosMaster1024);

  // Save to intrihub-business/assets
  const businessAssets = path.join(__dirname, "../intrihub-business/assets");
  if (fs.existsSync(businessAssets)) {
    await fs.promises.writeFile(path.join(businessAssets, "icon.png"), iosMaster1024);
    await fs.promises.writeFile(path.join(businessAssets, "adaptive-icon.png"), androidForeground1024);
    await fs.promises.writeFile(path.join(businessAssets, "intri-icon.png"), iosMaster1024);
  }

  // Save to public/
  const publicDir = path.join(__dirname, "../public");
  await fs.promises.writeFile(path.join(publicDir, "icon.png"), iosMaster1024);
  await fs.promises.writeFile(path.join(publicDir, "apple-touch-icon.png"), iosMaster1024);
  await fs.promises.writeFile(path.join(publicDir, "logo/intri-icon.png"), iosMaster1024);

  // Generate Mask Previews for Verification
  const circleSvg = Buffer.from(
    '<svg width="1024" height="1024"><circle cx="512" cy="512" r="337.5" fill="#fff"/></svg>'
  );
  const circleMask = await sharp(circleSvg).png().toBuffer();
  await sharp(iosMaster1024)
    .composite([{ input: circleMask, blend: "dest-in" }])
    .toFile(path.join(__dirname, "preview-circle-masked.png"));

  const squircleSvg = Buffer.from(
    '<svg width="1024" height="1024"><rect x="64" y="64" width="896" height="896" rx="200" ry="200" fill="#fff"/></svg>'
  );
  const squircleMask = await sharp(squircleSvg).png().toBuffer();
  await sharp(iosMaster1024)
    .composite([{ input: squircleMask, blend: "dest-in" }])
    .toFile(path.join(__dirname, "preview-squircle-masked.png"));

  // Generate Android Mipmaps for android/app/src/main/res
  const androidRes = path.join(__dirname, "../intrihub-mobile/android/app/src/main/res");
  if (fs.existsSync(androidRes)) {
    const densities = [
      { folder: "mipmap-mdpi", size: 48, fgSize: 108 },
      { folder: "mipmap-hdpi", size: 72, fgSize: 162 },
      { folder: "mipmap-xhdpi", size: 96, fgSize: 216 },
      { folder: "mipmap-xxhdpi", size: 144, fgSize: 324 },
      { folder: "mipmap-xxxhdpi", size: 192, fgSize: 432 },
    ];

    for (const d of densities) {
      const dir = path.join(androidRes, d.folder);
      if (fs.existsSync(dir)) {
        // ic_launcher
        const launcherImg = await sharp(androidAdaptive1024).resize(d.size, d.size).webp({ quality: 100 }).toBuffer();
        await fs.promises.writeFile(path.join(dir, "ic_launcher.webp"), launcherImg);

        // ic_launcher_round
        const roundSvg = Buffer.from(
          `<svg width="${d.size}" height="${d.size}"><circle cx="${d.size / 2}" cy="${d.size / 2}" r="${d.size / 2}" fill="#fff"/></svg>`
        );
        const roundMask = await sharp(roundSvg).png().toBuffer();
        const roundImg = await sharp(androidAdaptive1024)
          .resize(d.size, d.size)
          .composite([{ input: roundMask, blend: "dest-in" }])
          .webp({ quality: 100 })
          .toBuffer();
        await fs.promises.writeFile(path.join(dir, "ic_launcher_round.webp"), roundImg);

        // ic_launcher_foreground
        const fgImg = await sharp(androidForeground1024).resize(d.fgSize, d.fgSize).webp({ quality: 100 }).toBuffer();
        await fs.promises.writeFile(path.join(dir, "ic_launcher_foreground.webp"), fgImg);
      }
    }
  }

  console.log("SUCCESS: All master icons and android mipmaps successfully generated!");
}

generateProductionIcons().catch((e) => {
  console.error("Error generating production icons:", e);
  process.exit(1);
});
