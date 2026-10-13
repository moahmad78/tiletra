import sharp from "sharp";
import path from "path";
import fs from "fs";

async function generateBulkCollage() {
  const outputDir = path.resolve(process.cwd(), "public", "images", "showcase");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "bulk-construction-materials-white.webp");
  const brainDir = "C:\\Users\\moahm\\.gemini\\antigravity-ide\\brain\\47e907f4-a32e-4b74-9652-63f7204742a4";

  // Use the verified pure-white background bulk item renders
  const cementPath = path.join(brainDir, "cement_concrete_white_1791852922705.jpg");
  const steelPath = path.join(brainDir, "steel_rebar_white_1791852946684.jpg");
  const bricksPath = path.join(brainDir, "bricks_blocks_white_1791852974437.jpg");
  const roofingPath = path.join(brainDir, "roofing_sheets_white_1791853021261.jpg");
  const sandPath = path.join(brainDir, "sand_aggregates_white_1791852997915.jpg");

  const canvasWidth = 1920;
  const canvasHeight = 1080;

  // Resize items to fit in a panoramic wholesale catalog studio composition on pure white (#FFFFFF)
  const [cementBuf, steelBuf, bricksBuf, roofingBuf, sandBuf] = await Promise.all([
    sharp(cementPath).resize(560, 440, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } }).toBuffer(),
    sharp(steelPath).resize(560, 440, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } }).toBuffer(),
    sharp(bricksPath).resize(560, 440, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } }).toBuffer(),
    sharp(roofingPath).resize(580, 440, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } }).toBuffer(),
    sharp(sandPath).resize(580, 440, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } }).toBuffer(),
  ]);

  await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      // Top row: Cement, Steel Rebar, Bricks
      { input: cementBuf, top: 80, left: 80 },
      { input: steelBuf, top: 80, left: 680 },
      { input: bricksBuf, top: 80, left: 1280 },
      // Bottom row: Roofing Sheets, Aggregates & M-Sand
      { input: roofingBuf, top: 560, left: 320 },
      { input: sandBuf, top: 560, left: 1020 },
    ])
    .webp({ quality: 92 })
    .toFile(outputPath);

  // Also copy to brain artifact dir
  const brainArtifactPath = path.join(brainDir, "bulk_construction_materials_white.webp");
  fs.copyFileSync(outputPath, brainArtifactPath);

  console.log(`[SUCCESS] 100% Pure White Background Bulk Construction Showcase generated at: ${outputPath}`);
}

generateBulkCollage().catch(console.error);
