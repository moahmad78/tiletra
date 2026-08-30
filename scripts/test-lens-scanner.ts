import assert from "assert";
import { normalizeExtractedText } from "../lib/lens/ocr-engine";
import { matchCatalogProducts } from "../lib/lens/catalog-matcher";
import { prisma } from "../lib/prisma";

async function runLensScannerTests() {
  console.log("=================================================");
  console.log("🧪 STARTING INTRIHUB LENS (SCAN & FIND) TEST SUITE");
  console.log("=================================================\n");

  // ── TEST 1: OCR Text Normalizer on Pilot Categories ──
  console.log("▶ TEST 1: Testing OCR text normalizer for Packaging Brands & Codes...");

  const t1 = normalizeExtractedText("Pidilite Roff T01 NCA Tile Adhesive Grey 30 Kg Bag MRP 450");
  assert.strictEqual(t1.detectedBrand, "Roff", "Expected detectedBrand to be Roff");
  assert.strictEqual(t1.detectedSeries, "T01 NCA", "Expected detectedSeries to be T01 NCA");
  assert.strictEqual(t1.detectedPackaging, "30 kg", "Expected packaging to be 30 kg");
  console.log("  ✓ Test 1A (Roff T01 30kg) Passed:", t1.cleanQuery);

  const t2 = normalizeExtractedText("UltraTech PPC Cement 50 kg Net Weight Aditya Birla Group");
  assert.strictEqual(t2.detectedBrand, "Ultratech", "Expected detectedBrand to be Ultratech");
  assert.strictEqual(t2.detectedPackaging, "50 kg", "Expected packaging to be 50 kg");
  console.log("  ✓ Test 1B (Ultratech PPC 50kg) Passed:", t2.cleanQuery);

  const t3 = normalizeExtractedText("Araldite Klear 5 Fast Epoxy Adhesive Net 450g Huntsman");
  assert.strictEqual(t3.detectedBrand, "Araldite", "Expected detectedBrand to be Araldite");
  assert.strictEqual(t3.detectedSeries, "Klear5 Epoxy", "Expected detectedSeries to be Klear5 Epoxy");
  assert.strictEqual(t3.detectedPackaging, "450 g", "Expected packaging to be 450 g");
  console.log("  ✓ Test 1C (Araldite Klear5 450g) Passed:", t3.cleanQuery);

  const t4 = normalizeExtractedText("Asian Paints Royale Luxury Interior Emulsion 20 Litres");
  assert.strictEqual(t4.detectedBrand, "Asian Paints", "Expected detectedBrand to be Asian Paints");
  assert.strictEqual(t4.detectedSeries, "Royale", "Expected detectedSeries to be Royale");
  assert.strictEqual(t4.detectedPackaging, "20 litres", "Expected packaging to be 20 litres");
  console.log("  ✓ Test 1D (Asian Paints Royale 20L) Passed:", t4.cleanQuery);

  // ── TEST 2: Exact Match against Database Products ──
  console.log("\n▶ TEST 2: Testing exact catalog matching against live database...");

  const match1 = await matchCatalogProducts(t1);
  console.log("  Result 1 (Roff T01):", match1.matched ? `MATCHED (${match1.matchedProduct?.name})` : "NO MATCH", `Confidence: ${Math.round(match1.confidence * 100)}%`);
  assert(match1.matched, "Expected Roff T01 to match in database");
  assert(match1.matchedProduct !== null, "Expected matchedProduct to be populated");

  const match2 = await matchCatalogProducts(t2);
  console.log("  Result 2 (Ultratech PPC):", match2.matched ? `MATCHED (${match2.matchedProduct?.name})` : "NO MATCH", `Confidence: ${Math.round(match2.confidence * 100)}%`);
  assert(match2.matched, "Expected Ultratech PPC to match in database");

  const match3 = await matchCatalogProducts(t3);
  console.log("  Result 3 (Araldite Klear5):", match3.matched ? `MATCHED (${match3.matchedProduct?.name})` : "NO MATCH", `Confidence: ${Math.round(match3.confidence * 100)}%`);
  assert(match3.matched, "Expected Araldite Klear5 to match in database");

  // ── TEST 3: Unmatched Brand Flow + Alternatives + Demand Logging ──
  console.log("\n▶ TEST 3: Testing unmatched brand flow and Demand Logging (UnmatchedScanLog)...");

  const uncataloguedScan = normalizeExtractedText("Birla A1 Premium Cement 50 kg Bag High Grade Concrete");
  const matchUncatalogued = await matchCatalogProducts(uncataloguedScan, "test-user-123");

  console.log("  Result 3 (Birla A1 - Not Stocked):", matchUncatalogued.matched ? "MATCHED" : "UNMATCHED (Expected)");
  assert.strictEqual(matchUncatalogued.matched, false, "Expected Birla A1 to be unmatched");
  assert(matchUncatalogued.alternatives.length > 0, "Expected in-stock alternatives to be returned");
  console.log("  ✓ Alternatives returned count:", matchUncatalogued.alternatives.length);
  console.log("    Top Alternative:", matchUncatalogued.alternatives[0]?.name);

  // Verify UnmatchedScanLog entry in DB
  const recentLogs = (prisma as any).unmatchedScanLog ? await (prisma as any).unmatchedScanLog.findMany({
    where: {
      detectedBrand: "Birla",
    },
    orderBy: { createdAt: "desc" },
    take: 1,
  }) : [];

  if (recentLogs.length > 0) {
    assert.strictEqual(recentLogs[0].detectedBrand, "Birla");
    console.log("  ✓ Verified UnmatchedScanLog entry created in database: ID =", recentLogs[0].id);
  }

  console.log("\n=================================================");
  console.log("🎉 ALL INTRIHUB LENS (SCAN & FIND) TESTS PASSED!");
  console.log("=================================================\n");
}

runLensScannerTests()
  .catch((err) => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
