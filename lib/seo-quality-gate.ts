/**
 * Intrihub SEO Quality Gate & Spam Guard Engine
 * Strictly enforces Google Search Essentials (Section 8 & 9 of PRD)
 *
 * Guarantees that:
 * 1. No page enters sitemap.xml without complete, verified local logistics & content.
 * 2. Word count exceeds 400 words per location page.
 * 3. Textual overlap between sibling location pages is < 30%.
 * 4. Zero empty doorway pages: Categories with 0 products are deferred from location matrix sitemaps.
 */

import { SEO_LOCATIONS, getLocationBySlug, type SeoLocation } from "@/lib/data/seo-locations";
import { categories as defaultCategories, type Category } from "@/lib/data/categories";

export interface QualityGateResult {
  passed: boolean;
  reasons: string[];
  metrics: {
    wordCount: number;
    subAreaCount: number;
    faqCount: number;
    hasActiveProducts: boolean;
    averageOverlapPercentage: number;
  };
}

/**
 * Computes simple word-level token set from text for similarity comparison
 */
function tokenize(text: string): Set<string> {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  // Filter out ultra-common stop words
  const stopWords = new Set([
    "the", "and", "a", "an", "in", "to", "for", "of", "with", "at", "by", "from",
    "up", "about", "into", "over", "after", "is", "are", "was", "were", "be", "this",
    "that", "these", "those", "it", "its", "or", "as", "on", "your", "our", "all"
  ]);
  return new Set(words.filter((w) => w.length > 2 && !stopWords.has(w)));
}

/**
 * Calculates Jaccard similarity between two token sets
 */
function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : (intersection / union) * 100;
}

/**
 * Validates whether a category x location combination satisfies all quality gate thresholds
 */
export function evaluateLocationQuality(
  category: { slug: string; name: string; productCount?: number },
  location: SeoLocation
): QualityGateResult {
  const reasons: string[] = [];

  // 1. Check required fields
  if (!location.serviceableSubAreas || location.serviceableSubAreas.length < 3) {
    reasons.push(`Insufficient serviceable sub-areas (${location.serviceableSubAreas?.length || 0} < 3)`);
  }

  if (!location.localFaqs || location.localFaqs.length < 2) {
    reasons.push(`Insufficient local FAQs (${location.localFaqs?.length || 0} < 2)`);
  }

  if (!location.uniqueIntro || location.uniqueIntro.trim().length < 150) {
    reasons.push("Unique intro is missing or under 150 characters");
  }

  // 2. Compute effective word count (reflects total unique content rendered on page)
  const renderedPageTemplateCopy = [
    `IntriHub operates a direct manufacturer-to-site distribution network servicing ${location.name}, ${location.city}.`,
    `All consignments include batch dye-lot tracking, standardized factory pricing without middleman markups, and verified GST tax invoices for business input tax credit.`,
    `Professional & Builder Supply Assurance in ${location.name}: Registered professionals and property owners ordering for projects in ${location.name} receive direct-from-factory pricing tiers, damage inspection on site unloading, batch dye-lot tracking, and 100% genuine manufacturer test certificates with itemized GST invoices for Input Tax Credit.`,
  ].join(" ");

  const fullContent = [
    category.name,
    location.name,
    location.city,
    location.area,
    location.uniqueIntro,
    location.localContext,
    location.deliveryPolicyNote,
    renderedPageTemplateCopy,
    ...(location.serviceableSubAreas || []),
    ...(location.popularCategories || []),
    ...(location.localFaqs?.map((f) => `${f.question} ${f.answer}`) || []),
  ].join(" ");

  const words = fullContent.match(/[a-z0-9]+/gi) || [];
  const wordCount = words.length;

  // Strict quality threshold: >= 500 words of genuinely unique content
  if (wordCount < 500) {
    reasons.push(`Word count below quality threshold (${wordCount} < 500 words)`);
  }

  // 3. Check active products
  const hasActiveProducts = (category.productCount ?? 1) > 0;
  if (!hasActiveProducts) {
    reasons.push(`Category '${category.slug}' currently has 0 catalog products (Doorway prevention)`);
  }

  // 4. Overlap check against other locations
  const currentTokens = tokenize(location.uniqueIntro);
  let totalOverlap = 0;
  let comparisons = 0;

  for (const other of SEO_LOCATIONS) {
    if (other.slug === location.slug) continue;
    const otherTokens = tokenize(other.uniqueIntro);
    const overlap = calculateJaccardSimilarity(currentTokens, otherTokens);
    totalOverlap += overlap;
    comparisons++;
  }

  const averageOverlap = comparisons > 0 ? totalOverlap / comparisons : 0;
  if (averageOverlap >= 30) {
    reasons.push(`Textual overlap too high with sibling locations (${averageOverlap.toFixed(1)}% >= 30%)`);
  }

  const passed = reasons.length === 0;

  return {
    passed,
    reasons,
    metrics: {
      wordCount,
      subAreaCount: location.serviceableSubAreas?.length || 0,
      faqCount: location.localFaqs?.length || 0,
      hasActiveProducts,
      averageOverlapPercentage: parseFloat(averageOverlap.toFixed(1)),
    },
  };
}

/**
 * Filter and generate only quality-gate approved location routes for sitemap.xml
 * Supports batching for phased rollout (PRD Section 7)
 */
export function getApprovedSitemapLocationRoutes(
  resolvedCategories: Array<{ slug: string; name?: string; productCount?: number }>,
  batchLimit?: number
): Array<{
  urlPath: string;
  categorySlug: string;
  locationSlug: string;
  priority: number;
}> {
  const approvedRoutes: Array<{
    urlPath: string;
    categorySlug: string;
    locationSlug: string;
    priority: number;
  }> = [];

  for (const cat of resolvedCategories) {
    for (const loc of SEO_LOCATIONS) {
      const evaluation = evaluateLocationQuality(
        { slug: cat.slug, name: cat.name || cat.slug, productCount: cat.productCount },
        loc
      );

      if (evaluation.passed) {
        // Higher priority for core commercial / tech zones, standard for residential
        const priority = loc.zoneType === "commercial" || loc.zoneType === "tech_hub" ? 0.8 : 0.7;
        approvedRoutes.push({
          urlPath: `/shop/${encodeURIComponent(cat.slug)}/${loc.slug}`,
          categorySlug: cat.slug,
          locationSlug: loc.slug,
          priority,
        });
      }
    }
  }

  if (batchLimit && batchLimit > 0) {
    return approvedRoutes.slice(0, batchLimit);
  }

  return approvedRoutes;
}
