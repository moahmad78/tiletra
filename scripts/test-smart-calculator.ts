import assert from "node:assert";

// Simulation of calculator calculation logic
function calculateEstimates(params: {
  unitOfSale: string;
  coverageRate?: number | null;
  piecesPerBox?: number | null;
  wastageFactor?: number | null;
  variantSqftPerBox?: number;
  categoryInputType?: "area" | "length" | "none";
  inputVal: number; // area in sqft or length in meters
  coats?: number;
}) {
  const unit = (params.unitOfSale || "box").toLowerCase().trim();

  // 1. Effective Coverage Rate
  let effectiveCoverageRate: number | null = null;
  if (params.coverageRate && params.coverageRate > 0) {
    effectiveCoverageRate = params.coverageRate;
  } else if (unit === "sqft") {
    effectiveCoverageRate = 1;
  } else if (unit === "box" && params.variantSqftPerBox && params.variantSqftPerBox > 0) {
    effectiveCoverageRate = params.variantSqftPerBox;
  }

  // 2. Input Type Resolution
  let inputType: "area" | "length" | "none" = "area";
  if (params.categoryInputType === "length") inputType = "length";
  else if (params.categoryInputType === "none") inputType = "none";
  else if (params.categoryInputType === "area") inputType = "area";
  else if (["meter", "coil", "running_meter", "foot", "feet", "yard", "m"].includes(unit)) {
    inputType = "length";
  }

  if (inputType === "none" || !effectiveCoverageRate || effectiveCoverageRate <= 0) {
    return null; // Calculator hidden
  }

  const wastage = params.wastageFactor && params.wastageFactor > 0 ? params.wastageFactor : 1.1;
  const isLength = inputType === "length";
  const isVolume = ["litre", "can", "bucket", "bottle", "liter", "l"].includes(unit);
  const isDirectSqft = unit === "sqft";
  const isBox = unit === "box";

  const safeCeil = (val: number) => Math.ceil(Math.round(val * 10000) / 10000);

  const grossRequirement = isVolume
    ? params.inputVal * (params.coats || 2) * wastage
    : params.inputVal * wastage;

  let unitsNeeded = 0;
  let piecesNeeded: number | null = null;
  let totalCoverage = 0;

  if (isLength) {
    unitsNeeded = params.inputVal > 0 ? Math.max(1, safeCeil(grossRequirement / effectiveCoverageRate)) : 0;
    totalCoverage = unitsNeeded * effectiveCoverageRate;
  } else if (isDirectSqft) {
    unitsNeeded = params.inputVal > 0 ? Math.max(1, safeCeil(grossRequirement)) : 0;
    totalCoverage = unitsNeeded;
  } else {
    unitsNeeded = params.inputVal > 0 ? Math.max(1, safeCeil(grossRequirement / effectiveCoverageRate)) : 0;
    totalCoverage = unitsNeeded * effectiveCoverageRate;

    if (isBox && params.piecesPerBox && params.piecesPerBox > 0 && params.inputVal > 0) {
      const sqftPerPiece = effectiveCoverageRate / params.piecesPerBox;
      piecesNeeded = safeCeil(grossRequirement / sqftPerPiece);
    }
  }

  return {
    inputType,
    unitsNeeded,
    piecesNeeded,
    totalCoverage,
  };
}

async function runTests() {
  console.log("🚀 Testing Fully Generalized Unit-Aware Calculator Engine...\n");

  // Test Case 1: Tiles with coverageRate (16 sqft/box) AND piecesPerBox (4 pieces)
  console.log("Test 1: Tiles with coverageRate=16 and piecesPerBox=4 for 100 sq.ft");
  const t1 = calculateEstimates({
    unitOfSale: "box",
    coverageRate: 16,
    piecesPerBox: 4,
    wastageFactor: 1.1,
    inputVal: 100,
  });
  assert(t1 !== null, "Test 1 failed: should return calculation");
  // 100 sqft * 1.1 = 110 sqft gross.
  // 110 / 16 = 6.875 -> 7 boxes.
  // sqftPerPiece = 16 / 4 = 4 sqft. 110 / 4 = 27.5 -> 28 pieces.
  assert.strictEqual(t1.unitsNeeded, 7, "Units needed should be 7 boxes");
  assert.strictEqual(t1.piecesNeeded, 28, "Pieces needed should be 28 pieces");
  assert.strictEqual(t1.totalCoverage, 112, "Total coverage should be 112 sq.ft");
  console.log("✅ Passed: 7 boxes (28 pieces) — covers 112 sq.ft\n");

  // Test Case 2: Tiles with coverageRate (16 sqft/box) and NO piecesPerBox (fallback/legacy)
  console.log("Test 2: Tiles with coverageRate=16 and NO piecesPerBox for 100 sq.ft");
  const t2 = calculateEstimates({
    unitOfSale: "box",
    coverageRate: 16,
    piecesPerBox: null,
    wastageFactor: 1.1,
    inputVal: 100,
  });
  assert(t2 !== null, "Test 2 failed: should return calculation");
  assert.strictEqual(t2.unitsNeeded, 7, "Units needed should be 7 boxes");
  assert.strictEqual(t2.piecesNeeded, null, "Pieces needed should be null");
  console.log("✅ Passed: 7 boxes (no pieces line)\n");

  // Test Case 3: Granite (unitOfSale: "sqft")
  console.log("Test 3: Granite (unitOfSale='sqft') for 100 sq.ft");
  const t3 = calculateEstimates({
    unitOfSale: "sqft",
    wastageFactor: 1.1,
    inputVal: 100,
  });
  assert(t3 !== null, "Test 3 failed: should return calculation");
  // 100 * 1.1 = 110 sq.ft
  assert.strictEqual(t3.unitsNeeded, 110, "Units needed should be 110 sq.ft");
  assert.strictEqual(t3.totalCoverage, 110, "Total coverage should be 110 sq.ft");
  console.log("✅ Passed: 110 sq.ft needed\n");

  // Test Case 4: Paint (unitOfSale: "litre", coverageRate: 120 sqft/L, 2 coats)
  console.log("Test 4: Paint (unitOfSale='litre', coverageRate=120, 2 coats) for 100 sq.ft");
  const t4 = calculateEstimates({
    unitOfSale: "litre",
    coverageRate: 120,
    coats: 2,
    wastageFactor: 1.1,
    inputVal: 100,
  });
  assert(t4 !== null, "Test 4 failed: should return calculation");
  // 100 * 2 coats * 1.1 = 220 gross sqft. 220 / 120 = 1.83 -> 2 litres.
  assert.strictEqual(t4.unitsNeeded, 2, "Units needed should be 2 litres");
  console.log("✅ Passed: 2 litres needed\n");

  // Test Case 5: Electrical Wire (unitOfSale: "coil", coverageRate: 90 meters)
  console.log("Test 5: Wire (unitOfSale='coil', coverageRate=90m) for 180 meters");
  const t5 = calculateEstimates({
    unitOfSale: "coil",
    coverageRate: 90,
    wastageFactor: 1.1,
    inputVal: 180,
  });
  assert(t5 !== null, "Test 5 failed: should return calculation");
  // 180 * 1.1 = 198 meters. 198 / 90 = 2.2 -> 3 coils.
  assert.strictEqual(t5.inputType, "length", "Input type should be length");
  assert.strictEqual(t5.unitsNeeded, 3, "Units needed should be 3 coils");
  assert.strictEqual(t5.totalCoverage, 270, "Total length covered should be 270 meters");
  console.log("✅ Passed: 3 coils (covers 270 meters)\n");

  // Test Case 6: Product with NO coverageRate (e.g. piece or hardware item) -> Should hide calculator
  console.log("Test 6: Hardware/Piece item with NO coverageRate");
  const t6 = calculateEstimates({
    unitOfSale: "piece",
    coverageRate: null,
    inputVal: 50,
  });
  assert.strictEqual(t6, null, "Calculator should be gracefully hidden (null)");
  console.log("✅ Passed: Calculator is gracefully hidden (returns null)\n");

  // Test Case 7: Wallpaper Roll (unitOfSale: "roll", coverageRate: 57 sqft/roll)
  console.log("Test 7: Wallpaper Roll (coverageRate=57) for 200 sq.ft");
  const t7 = calculateEstimates({
    unitOfSale: "roll",
    coverageRate: 57,
    wastageFactor: 1.1,
    inputVal: 200,
  });
  assert(t7 !== null, "Test 7 failed: should return calculation");
  // 200 * 1.1 = 220. 220 / 57 = 3.85 -> 4 rolls.
  assert.strictEqual(t7.unitsNeeded, 4, "Units needed should be 4 rolls");
  console.log("✅ Passed: 4 rolls needed\n");

  console.log("🎉 ALL CALCULATOR TEST CASES PASSED SUCCESSFULLY!");
}

runTests();
