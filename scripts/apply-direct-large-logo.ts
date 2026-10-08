import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("==========================================================================");
  console.log("APPLYING DIRECT TRANSPARENT LOGO (ZERO BACKGROUND, LARGER SIZE)");
  console.log("==========================================================================");

  const logoPath = path.join(process.cwd(), "public/logo/intri-web-logo.png");
  const artifactsDir = "C:\\Users\\moahm\\.gemini\\antigravity-ide\\brain\\8e3b0fea-74b4-48e7-ac5f-08af6a436ae4";
  const outputDir = path.join(process.cwd(), "public/images/guides");

  // 1. Hero Image (Direct logo, top-left, 300px wide, zero background)
  {
    const logoBuf = await sharp(logoPath).trim().resize({ width: 300 }).png().toBuffer();
    const input = path.join(artifactsDir, "diwali_light_hero_1791431478014.jpg");
    const output = path.join(outputDir, "diwali-renovation-hero.jpg");

    await sharp(input)
      .composite([{ input: logoBuf, left: 45, top: 38 }])
      .jpeg({ quality: 94, mozjpeg: true })
      .toFile(output);

    console.log(`✓ Hero image updated: ${output} (300px direct logo at top-left)`);
  }

  // 2. Timeline Graphic (Direct logo, centered above title, zero text overlap, zero background)
  {
    const logoBuf = await sharp(logoPath).trim().resize({ width: 215 }).png().toBuffer();
    const logoMeta = await sharp(logoBuf).metadata();
    const input = path.join(artifactsDir, "diwali_light_timeline_1791431500753.jpg");
    const output = path.join(outputDir, "diwali-renovation-timeline.jpg");
    const leftPos = Math.round((1376 - (logoMeta.width || 215)) / 2);

    await sharp(input)
      .composite([{ input: logoBuf, left: leftPos, top: 10 }])
      .jpeg({ quality: 94, mozjpeg: true })
      .toFile(output);

    console.log(`✓ Timeline graphic updated: ${output} (215px direct logo centered above title with zero overlap)`);
  }

  // 3. Materials Flat Lay (Direct logo, top-left, 300px wide, zero background)
  {
    const logoBuf = await sharp(logoPath).trim().resize({ width: 300 }).png().toBuffer();
    const input = path.join(artifactsDir, "diwali_light_materials_1791431529442.jpg");
    const output = path.join(outputDir, "diwali-renovation-materials.jpg");

    await sharp(input)
      .composite([{ input: logoBuf, left: 45, top: 38 }])
      .jpeg({ quality: 94, mozjpeg: true })
      .toFile(output);

    console.log(`✓ Materials flat lay updated: ${output} (300px direct logo at top-left)`);
  }

  // Clean up any test images
  for (const f of ["test-hero-direct.jpg", "test-timeline-header.jpg"]) {
    const p = path.join(outputDir, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  console.log("\n==========================================================================");
  console.log("🎉 ALL 3 IMAGES UPDATED WITH DIRECT LARGE LOGO (ZERO BACKGROUND)!");
  console.log("==========================================================================");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
