import { prisma } from "@/lib/prisma";
import { formatProduct } from "@/lib/formatters";
import type { ExtractedProductInfo } from "@/lib/lens/ocr-engine";
import type { Product } from "@/lib/data/products";

export interface ScanMatchResult {
  matched: boolean;
  confidence: number;
  extractedInfo: ExtractedProductInfo;
  matchedProduct: Product | null;
  alternatives: Product[];
  message: string;
}

/**
 * Calculates a match score (0.0 - 1.0) between extracted OCR info and a catalog product
 */
function scoreProductMatch(product: any, info: ExtractedProductInfo): number {
  let score = 0;
  const prodName = (product.name || "").toLowerCase();
  const prodBrand = (product.brand || "").toLowerCase();
  const prodSlug = (product.slug || "").toLowerCase();
  const prodDesc = (product.description || "").toLowerCase();

  const brand = info.detectedBrand ? info.detectedBrand.toLowerCase() : null;
  const series = info.detectedSeries ? info.detectedSeries.toLowerCase() : null;
  const packaging = info.detectedPackaging ? info.detectedPackaging.toLowerCase().replace(/\s+/g, "") : null;

  // 1. Brand Match (Weight: 0.35)
  if (brand) {
    if (prodBrand.includes(brand) || prodName.includes(brand) || prodSlug.includes(brand)) {
      score += 0.35;
    }
  }

  // 2. Series / Grade Match (Weight: 0.40)
  if (series) {
    // Check specific grade codes (e.g. "t01", "t02", "ppc", "nsa")
    const seriesTokens = series.split(/\s+/).filter(t => t.length > 1);
    let matchedTokenCount = 0;
    for (const token of seriesTokens) {
      if (prodName.includes(token) || prodDesc.includes(token) || prodSlug.includes(token)) {
        matchedTokenCount++;
      }
    }
    if (matchedTokenCount > 0) {
      score += Math.min(0.40, (matchedTokenCount / seriesTokens.length) * 0.40);
    }
  }

  // 3. Packaging / Weight / Volume Match (Weight: 0.15)
  if (packaging) {
    const cleanProd = prodName.replace(/\s+/g, "");
    if (cleanProd.includes(packaging) || prodDesc.replace(/\s+/g, "").includes(packaging)) {
      score += 0.15;
    }
  }

  // 4. Salient Keyword Overlap (Weight: 0.10)
  if (info.keywords && info.keywords.length > 0) {
    let keywordHits = 0;
    for (const kw of info.keywords) {
      const lowerKw = kw.toLowerCase();
      if (prodName.includes(lowerKw) || prodBrand.includes(lowerKw)) {
        keywordHits++;
      }
    }
    score += Math.min(0.10, (keywordHits / Math.max(1, info.keywords.length)) * 0.10);
  }

  return Math.min(1.0, score);
}

/**
 * Searches the catalog for a match against OCR extracted product information
 */
export async function matchCatalogProducts(
  extractedInfo: ExtractedProductInfo,
  userId?: string | null
): Promise<ScanMatchResult> {
  try {
    // 1. Fetch potential candidates from database
    const allDbProducts = await prisma.product.findMany({
      where: {
        status: { not: "draft" },
      },
      include: {
        variants: {
          orderBy: { createdAt: "asc" },
        },
      },
      take: 100,
    });

    // 2. Score each product
    const scoredProducts = allDbProducts
      .map((p) => ({
        rawProduct: p,
        score: scoreProductMatch(p, extractedInfo),
      }))
      .filter((item) => item.score > 0.35)
      .sort((a, b) => b.score - a.score);

    const topCandidate = scoredProducts[0];

    // 3. Threshold Check for Exact Match (Confidence >= 0.70 for MVP)
    if (topCandidate && topCandidate.score >= 0.70) {
      const formatted = formatProduct(topCandidate.rawProduct);
      return {
        matched: true,
        confidence: topCandidate.score,
        extractedInfo,
        matchedProduct: formatted,
        alternatives: [],
        message: `Found exact match: ${formatted.name}`,
      };
    }

    // 4. No Match / Low Confidence -> Surface In-Stock Alternatives from same category
    const categoryFilter = extractedInfo.categoryGuess || "tiles-stone";
    const rawAlternatives = await prisma.product.findMany({
      where: {
        status: { not: "draft" },
        OR: [
          { categorySlug: categoryFilter },
          { categorySlug: "tiles-stone" },
          { categorySlug: "flooring" },
        ],
      },
      include: {
        variants: {
          orderBy: { createdAt: "asc" },
        },
      },
      take: 6,
      orderBy: { rating: "desc" },
    });

    const formattedAlternatives = rawAlternatives.map((p) => formatProduct(p));

    // 5. Asynchronously log unmatched scan to UnmatchedScanLog for Demand Intelligence
    try {
      await prisma.unmatchedScanLog.create({
        data: {
          extractedText: extractedInfo.rawText || extractedInfo.cleanQuery || "Empty Scan",
          detectedBrand: extractedInfo.detectedBrand,
          categoryGuess: extractedInfo.categoryGuess,
          userId: userId || null,
        },
      });
    } catch (logErr) {
      console.error("Failed to log unmatched scan:", logErr);
    }

    const brandDisplay = extractedInfo.detectedBrand || "The scanned product";
    return {
      matched: false,
      confidence: topCandidate ? topCandidate.score : 0,
      extractedInfo,
      matchedProduct: null,
      alternatives: formattedAlternatives,
      message: `${brandDisplay} is not available on IntriHub right now. Here are verified in-stock alternatives:`,
    };
  } catch (err) {
    console.error("Error matching catalog products:", err);
    return {
      matched: false,
      confidence: 0,
      extractedInfo,
      matchedProduct: null,
      alternatives: [],
      message: "An error occurred while matching the product. Please try again.",
    };
  }
}
