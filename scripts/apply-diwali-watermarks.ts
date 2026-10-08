import sharp from "sharp";
import fs from "fs";
import path from "path";

async function createWatermarkBadge(): Promise<Buffer> {
  const logoPath = path.join(process.cwd(), "public/logo/intri-web-logo.png");
  
  // Badge dimensions
  const badgeWidth = 200;
  const badgeHeight = 56;
  const logoWidth = 150;
  const logoHeight = Math.round((178 / 600) * logoWidth); // ~44px

  // Resize the official IntriHub logo
  const resizedLogo = await sharp(logoPath)
    .resize(logoWidth, logoHeight, { fit: "contain" })
    .toBuffer();

  // Create an elegant SVG pill badge background with soft drop shadow and subtle border
  const svgPill = `
    <svg width="${badgeWidth}" height="${badgeHeight}" viewBox="0 0 ${badgeWidth} ${badgeHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#052A51" flood-opacity="0.15" />
        </filter>
      </defs>
      <rect x="3" y="3" width="${badgeWidth - 6}" height="${badgeHeight - 6}" rx="25" fill="#FFFFFF" fill-opacity="0.94" stroke="#052A51" stroke-opacity="0.18" stroke-width="1.5" filter="url(#badgeShadow)" />
    </svg>
  `;

  const badgeBackground = await sharp(Buffer.from(svgPill)).png().toBuffer();

  const logoLeft = Math.round((badgeWidth - logoWidth) / 2);
  const logoTop = Math.round((badgeHeight - logoHeight) / 2);

  const finalBadge = await sharp(badgeBackground)
    .composite([
      {
        input: resizedLogo,
        left: logoLeft,
        top: logoTop,
      },
    ])
    .png()
    .toBuffer();

  return finalBadge;
}

async function main() {
  console.log("==========================================================================");
  console.log("APPLYING INTRIHUB WATERMARK & LIGHT MOOD TO DIWALI GUIDE IMAGES");
  console.log("==========================================================================");

  const badgeBuffer = await createWatermarkBadge();
  console.log("✓ Created IntriHub branded watermark badge (200x56)");

  const artifactsDir = "C:\\Users\\moahm\\.gemini\\antigravity-ide\\brain\\8e3b0fea-74b4-48e7-ac5f-08af6a436ae4";
  const outputDir = path.join(process.cwd(), "public/images/guides");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const tasks = [
    {
      name: "Hero Image (Light Mood)",
      input: path.join(artifactsDir, "diwali_light_hero_1791431478014.jpg"),
      output: path.join(outputDir, "diwali-renovation-hero.jpg"),
      pos: { left: 36, top: 36 }, // Top-left
    },
    {
      name: "Timeline Graphic (Light Mood)",
      input: path.join(artifactsDir, "diwali_light_timeline_1791431500753.jpg"),
      output: path.join(outputDir, "diwali-renovation-timeline.jpg"),
      pos: { left: 36, top: 32 }, // Top-left
    },
    {
      name: "Materials Flat Lay (Light Mood)",
      input: path.join(artifactsDir, "diwali_light_materials_1791431529442.jpg"),
      output: path.join(outputDir, "diwali-renovation-materials.jpg"),
      pos: { left: 36, top: 36 }, // Top-left
    },
  ];

  for (const task of tasks) {
    console.log(`Processing: ${task.name}...`);
    const inputMeta = await sharp(task.input).metadata();
    console.log(`  Source: ${task.input} (${inputMeta.width}x${inputMeta.height})`);

    await sharp(task.input)
      .composite([
        {
          input: badgeBuffer,
          left: task.pos.left,
          top: task.pos.top,
        },
      ])
      .jpeg({ quality: 92, mozjpeg: true })
      .toFile(task.output);

    const outStat = fs.statSync(task.output);
    console.log(`  ✓ Saved watermarked image: ${task.output} (${Math.round(outStat.size / 1024)} KB)`);
  }

  console.log("\n==========================================================================");
  console.log("🎉 ALL 3 LIGHT-MOOD IMAGES WATERMARKED & SAVED IN public/images/guides/");
  console.log("==========================================================================");
}

main().catch((err) => {
  console.error("Error applying watermarks:", err);
  process.exit(1);
});
