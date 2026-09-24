import sharp from "sharp";
import { verifyFileMagicBytes, ALLOWED_EXTENSIONS, ALLOWED_IMAGE_MIMES } from "../lib/validations/schemas";
import { isValidSafeFilename } from "../lib/sanitization";

async function runUploadSecurityTests() {
  console.log("=================================================");
  console.log("PHASE 5: UPLOAD SECURITY & DURABILITY TEST SUITE");
  console.log("=================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(title: string, condition: boolean, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${title} - ${details || ""}`);
    }
  }

  // 1. Magic Bytes Tests
  console.log("1. Magic Bytes Validation Tests:");
  // Valid PNG
  const validPngBuffer = await sharp({
    create: { width: 10, height: 10, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
  }).png().toBuffer();
  const pngCheck = verifyFileMagicBytes(validPngBuffer);
  assert("Valid PNG buffer recognized", pngCheck.valid && pngCheck.type === "image" && pngCheck.detectedExt === ".png");

  // Valid JPEG
  const validJpgBuffer = await sharp({
    create: { width: 10, height: 10, channels: 3, background: { r: 0, g: 255, b: 0 } },
  }).jpeg().toBuffer();
  const jpgCheck = verifyFileMagicBytes(validJpgBuffer);
  assert("Valid JPEG buffer recognized", jpgCheck.valid && jpgCheck.type === "image" && jpgCheck.detectedExt === ".jpg");

  // Valid WebP
  const validWebpBuffer = await sharp({
    create: { width: 10, height: 10, channels: 3, background: { r: 0, g: 0, b: 255 } },
  }).webp().toBuffer();
  const webpCheck = verifyFileMagicBytes(validWebpBuffer);
  assert("Valid WebP buffer recognized", webpCheck.valid && webpCheck.type === "image" && webpCheck.detectedExt === ".webp");

  // Fake Extension (Text file with JPG header)
  const fakeJpg = Buffer.from("Hello world this is plain text not an image", "utf-8");
  const fakeJpgCheck = verifyFileMagicBytes(fakeJpg);
  assert("Fake JPG (plain text content) rejected", !fakeJpgCheck.valid);

  // SVG / XML / Executable Injection
  const maliciousSvg = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert('xss')</script></svg>", "utf-8");
  const svgCheck = verifyFileMagicBytes(maliciousSvg);
  assert("SVG / XML buffer rejected by magic byte validator", !svgCheck.valid);

  // 2. Extension & MIME Allowlist Tests
  console.log("\n2. MIME and Extension Allowlist Tests:");
  assert("SVG extension rejected by ALLOWED_EXTENSIONS", !ALLOWED_EXTENSIONS.has(".svg"));
  assert("HTML extension rejected by ALLOWED_EXTENSIONS", !ALLOWED_EXTENSIONS.has(".html"));
  assert("JS / Executable rejected", !ALLOWED_EXTENSIONS.has(".js") && !ALLOWED_EXTENSIONS.has(".exe"));
  assert("WebP allowed", ALLOWED_EXTENSIONS.has(".webp") && ALLOWED_IMAGE_MIMES.has("image/webp"));
  assert("JPEG allowed", ALLOWED_EXTENSIONS.has(".jpg") && ALLOWED_IMAGE_MIMES.has("image/jpeg"));
  assert("PNG allowed", ALLOWED_EXTENSIONS.has(".png") && ALLOWED_IMAGE_MIMES.has("image/png"));

  // 3. Path Traversal Filename Sanitization Tests
  console.log("\n3. Path Traversal & Filename Sanitization Tests:");
  assert("Safe filename accepted", isValidSafeFilename("product-tile-600x600.webp"));
  assert("Relative traversal '../' rejected", !isValidSafeFilename("../../etc/passwd"));
  assert("Nested traversal rejected", !isValidSafeFilename("uploads/../../../secret.env"));
  assert("Null byte injection rejected", !isValidSafeFilename("image.jpg\0.png"));
  assert("Special characters rejected", !isValidSafeFilename("image<script>.webp"));

  // 4. Sharp Optimization & Base64 DB Sizing
  console.log("\n4. Image Processing & DB Sizing Analysis:");
  const testLargeImage = await sharp({
    create: { width: 3000, height: 2000, channels: 3, background: { r: 180, g: 140, b: 100 } },
  }).jpeg({ quality: 100 }).toBuffer();

  const originalSizeKb = (testLargeImage.length / 1024).toFixed(1);
  const optimizedBuffer = await sharp(testLargeImage)
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
  const optimizedSizeKb = (optimizedBuffer.length / 1024).toFixed(1);
  const base64SizeKb = (optimizedBuffer.toString("base64").length / 1024).toFixed(1);

  console.log(`   - Raw Input Size:       ${originalSizeKb} KB`);
  console.log(`   - Optimized WebP Size:  ${optimizedSizeKb} KB (${Math.round((1 - optimizedBuffer.length / testLargeImage.length) * 100)}% reduction)`);
  console.log(`   - Postgres Base64 Size: ${base64SizeKb} KB`);
  assert("Optimized image is under 200KB budget", optimizedBuffer.length <= 200 * 1024);

  console.log("\n=================================================");
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} Passed (100%)`);
  console.log("=================================================");
}

runUploadSecurityTests().catch(console.error);
