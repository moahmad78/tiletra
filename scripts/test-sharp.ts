import sharp from "sharp";
import path from "path";

async function check() {
  const file = path.join(__dirname, "../intrihub-mobile/assets/intri-web-logo.png");
  const img = sharp(file);
  const meta = await img.metadata();
  console.log("Metadata:", meta);

  // Let's test extract
  const truck = await sharp(file)
    .extract({ left: 0, top: 0, width: 200, height: 150 })
    .png()
    .toFile(path.join(__dirname, "../intrihub-mobile/assets/test_truck.png"));
  console.log("Extracted test truck:", truck);
}

check().catch(console.error);
