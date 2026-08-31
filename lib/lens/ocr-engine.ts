import sharp from "sharp";
import { createWorker } from "tesseract.js";

export interface ExtractedProductInfo {
  rawText: string;
  detectedBrand: string | null;
  detectedSeries: string | null;
  detectedGrade: string | null;
  detectedPackaging: string | null;
  categoryGuess: string;
  keywords: string[];
  cleanQuery: string;
}

// Canonical Brands Knowledge Base
const KNOWN_BRANDS: Array<{ brand: string; category: string; aliases: string[] }> = [
  // Cement & Adhesives (Pilot Category)
  { brand: "Roff", category: "tiles-stone", aliases: ["roff", "pidilite roff", "roff t0", "roff t1", "roff t2", "roff t3"] },
  { brand: "Ultratech", category: "tiles-stone", aliases: ["ultratech", "ultra tech", "birla ultratech", "aditya birla ultratech"] },
  { brand: "ACC", category: "tiles-stone", aliases: ["acc", "acc cement", "adani acc", "acc suraksha", "suraksha power"] },
  { brand: "Ambuja", category: "tiles-stone", aliases: ["ambuja", "ambuja cement", "adani ambuja"] },
  { brand: "Dalmia", category: "tiles-stone", aliases: ["dalmia", "dalmia cement", "dalmia dsp"] },
  { brand: "Birla", category: "tiles-stone", aliases: ["birla", "birla a1", "mp birla", "birla samrat"] },
  { brand: "Araldite", category: "tiles-stone", aliases: ["araldite", "huntsman araldite", "araldite standard", "araldite klear"] },
  { brand: "Dr. Fixit", category: "paint-finishes", aliases: ["dr fixit", "dr. fixit", "doctor fixit", "lw+", "pidilite dr fixit"] },
  { brand: "Fevicol", category: "furniture", aliases: ["fevicol", "sh fevicol", "fevicol marine", "fevicol heatx"] },
  { brand: "MYK Laticrete", category: "tiles-stone", aliases: ["myk", "laticrete", "myk laticrete"] },
  { brand: "Sika", category: "paint-finishes", aliases: ["sika", "sikagrout", "sikadur"] },
  { brand: "Weber", category: "tiles-stone", aliases: ["weber", "saint gobain weber", "saint-gobain weber"] },

  // Paint & Finishes (Pilot Category)
  { brand: "Asian Paints", category: "paint-finishes", aliases: ["asian paints", "asianpaints", "royale", "apex", "tractor emulsion", "apcolite"] },
  { brand: "Berger", category: "paint-finishes", aliases: ["berger", "berger paints", "weathercoat", "bison", "walmasta"] },
  { brand: "Nerolac", category: "paint-finishes", aliases: ["nerolac", "kansai nerolac", "beauty smooth", "suraksha plus"] },
  { brand: "Dulux", category: "paint-finishes", aliases: ["dulux", "akzonobel dulux", "velvet touch", "weathershield"] },
  { brand: "Birla Opus", category: "paint-finishes", aliases: ["birla opus", "opus paints", "opus"] },

  // Electrical
  { brand: "Polycab", category: "electrical", aliases: ["polycab", "polycab wires", "polycab maximo"] },
  { brand: "Havells", category: "electrical", aliases: ["havells", "crabtree", "reo", "havells life line"] },
  { brand: "Anchor", category: "electrical", aliases: ["anchor", "panasonic anchor", "roma", "rider"] },
  { brand: "Schneider", category: "electrical", aliases: ["schneider", "schneider electric", "livia", "avatar on"] },
  { brand: "Legrand", category: "electrical", aliases: ["legrand", "mylinc", "arteor", "britzy"] },
  { brand: "Finolex", category: "electrical", aliases: ["finolex", "finolex cables"] },
  { brand: "V-Guard", category: "electrical", aliases: ["v-guard", "vguard"] },
  { brand: "RR Kabel", category: "electrical", aliases: ["rr kabel", "rrkabel", "ratnashri"] },

  // Plumbing & Sanitary
  { brand: "Astral", category: "plumbing-sanitary", aliases: ["astral", "astral pipes", "astral cpvc", "aquasafe"] },
  { brand: "Ashirvad", category: "plumbing-sanitary", aliases: ["ashirvad", "ashirvad pipes", "ashirvad flowguard"] },
  { brand: "Supreme", category: "plumbing-sanitary", aliases: ["supreme", "supreme pipes", "lifeline"] },
  { brand: "Jaquar", category: "plumbing-sanitary", aliases: ["jaquar", "essco by jaquar", "artize"] },
  { brand: "Cera", category: "plumbing-sanitary", aliases: ["cera", "cera sanitaryware", "cera faucets"] },
  { brand: "Hindware", category: "plumbing-sanitary", aliases: ["hindware", "hindware italian"] },
  { brand: "Kohler", category: "plumbing-sanitary", aliases: ["kohler"] },

  // Tiles & Stone
  { brand: "Kajaria", category: "tiles-stone", aliases: ["kajaria", "kajaria eternity", "kerovit"] },
  { brand: "Somany", category: "tiles-stone", aliases: ["somany", "somany ceramics", "duragres"] },
  { brand: "Orientbell", category: "tiles-stone", aliases: ["orientbell", "orient bell"] },
  { brand: "Nitco", category: "tiles-stone", aliases: ["nitco", "nitco tiles"] },
  { brand: "Simpolo", category: "tiles-stone", aliases: ["simpolo", "simpolo ceramics"] },
];

// Product Series & Grades Knowledge Base
const KNOWN_SERIES_GRADES = [
  // Roff series
  { pattern: /\bT-?01\b/i, name: "T01 NCA", brand: "Roff" },
  { pattern: /\bT-?02\b/i, name: "T02 NSA", brand: "Roff" },
  { pattern: /\bT-?03\b/i, name: "T03 VFA", brand: "Roff" },
  { pattern: /\bT-?04\b/i, name: "T04 VFA", brand: "Roff" },
  { pattern: /\bT-?06\b/i, name: "T06 VFA", brand: "Roff" },
  { pattern: /\bT-?07\b/i, name: "T07 Extrofix", brand: "Roff" },
  { pattern: /\bT-?09\b/i, name: "T09 NSA", brand: "Roff" },
  { pattern: /\bT-?16\b/i, name: "T16 Cera", brand: "Roff" },
  { pattern: /\bT-?20\b/i, name: "T20 Extrofix Ultra", brand: "Roff" },
  { pattern: /\bT-?29\b/i, name: "T29 Master Fixed", brand: "Roff" },
  { pattern: /\bT-?34\b/i, name: "T34 Starlike Epoxy", brand: "Roff" },

  // Cement types
  { pattern: /\bPPC\b/i, name: "PPC", brand: null },
  { pattern: /\bOPC\s*(?:43|53)?\b/i, name: "OPC 53", brand: null },
  { pattern: /\bSuraksha(?:\s*Power)?\b/i, name: "Suraksha Power", brand: "ACC" },
  { pattern: /\bSuper\s*Cement\b/i, name: "Super", brand: null },

  // Araldite
  { pattern: /\bKlear\s*5?\b/i, name: "Klear5 Epoxy", brand: "Araldite" },
  { pattern: /\bStandard\s*Epoxy\b/i, name: "Standard Epoxy", brand: "Araldite" },

  // Paint series
  { pattern: /\bRoyale(?:\s*(?:Luxury|Matt|Shyne|Glitz))?\b/i, name: "Royale", brand: "Asian Paints" },
  { pattern: /\bApex(?:\s*(?:Ultima|Shyne))?\b/i, name: "Apex", brand: "Asian Paints" },
  { pattern: /\bTractor\s*Emulsion\b/i, name: "Tractor Emulsion", brand: "Asian Paints" },
  { pattern: /\bWeathercoat(?:\s*(?:Glow|All\s*Guard))?\b/i, name: "Weathercoat", brand: "Berger" },
];

// Packaging / Weight / Volume patterns
const PACKAGING_PATTERNS = [
  /\b(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilo|kilogram)\b/i,
  /\b(\d+(?:\.\d+)?)\s*(?:g|gm|gms|gram|grams)\b/i,
  /\b(\d+(?:\.\d+)?)\s*(?:l|ltr|litre|litres|liter|liters)\b/i,
  /\b(\d+(?:\.\d+)?)\s*(?:ml)\b/i,
  /\b(\d+)\s*(?:sqft|sq\.ft|sq_ft|m|mtr|meter|meters)\b/i,
];

export interface ExtractedProductInfo {
  rawText: string;
  detectedBrand: string | null;
  detectedSeries: string | null;
  detectedGrade: string | null;
  detectedPackaging: string | null;
  detectedLabels?: string[];
  categoryGuess: string;
  keywords: string[];
  cleanQuery: string;
}

/**
 * Pre-processes an image buffer with sharp for optimal OCR text recognition
 */
export async function preprocessImageForOcr(imageBuffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(imageBuffer)
      .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: false })
      .grayscale()
      .normalize()
      .sharpen()
      .png()
      .toBuffer();
  } catch (err) {
    console.error("Error preprocessing image for OCR:", err);
    return imageBuffer;
  }
}

/**
 * Calls Google Cloud Vision API for TEXT_DETECTION and LABEL_DETECTION if API key is configured
 */
async function callGoogleVisionApi(imageBuffer: Buffer): Promise<{ text: string; labels: string[] } | null> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) return null;

  try {
    const base64Image = imageBuffer.toString("base64");
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [
              { type: "TEXT_DETECTION", maxResults: 1 },
              { type: "LABEL_DETECTION", maxResults: 10 },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn("Google Vision API returned non-OK status:", response.status);
      return null;
    }

    const data = await response.json();
    const result = data.responses?.[0];
    if (!result) return null;

    const text = result.fullTextAnnotation?.text || result.textAnnotations?.[0]?.description || "";
    const labels = (result.labelAnnotations || []).map((l: any) => (l.description || "").toLowerCase());

    return { text, labels };
  } catch (err) {
    console.error("Google Vision API error:", err);
    return null;
  }
}

/**
 * Analyzes image buffer using Google Cloud Vision (if configured) or local Tesseract OCR
 */
export async function extractProductVisualData(
  imageBuffer: Buffer
): Promise<{ rawText: string; labels: string[] }> {
  // 1. Attempt Google Cloud Vision API (Combined OCR + Label Detection)
  const gVisionResult = await callGoogleVisionApi(imageBuffer);
  if (gVisionResult && gVisionResult.text.trim().length > 0) {
    return {
      rawText: gVisionResult.text,
      labels: gVisionResult.labels,
    };
  }

  // 2. Fallback to local Sharp + Tesseract OCR
  let worker: any = null;
  try {
    const preprocessed = await preprocessImageForOcr(imageBuffer);
    worker = await createWorker("eng");
    const ret = await worker.recognize(preprocessed);
    await worker.terminate();
    return {
      rawText: ret.data.text || "",
      labels: [],
    };
  } catch (err) {
    if (worker) {
      try {
        await worker.terminate();
      } catch {}
    }
    console.error("Local OCR recognition error:", err);
    return { rawText: "", labels: [] };
  }
}

/**
 * Runs Tesseract or Google Vision OCR on an image buffer (backwards compatible)
 */
export async function extractRawTextFromBuffer(imageBuffer: Buffer): Promise<string> {
  const result = await extractProductVisualData(imageBuffer);
  return result.rawText;
}

/**
 * Parses and normalizes extracted text & labels into canonical brand, grade, and keywords
 */
export function normalizeExtractedText(rawText: string, detectedLabels: string[] = []): ExtractedProductInfo {
  const text = (rawText || "").replace(/\r?\n+/g, " ").trim();
  const lowerText = text.toLowerCase();

  let detectedBrand: string | null = null;
  let categoryGuess = "tiles-stone"; // Default pilot category

  // 1. Detect Brand from Text
  for (const item of KNOWN_BRANDS) {
    for (const alias of item.aliases) {
      const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (regex.test(lowerText) || lowerText.includes(alias)) {
        detectedBrand = item.brand;
        categoryGuess = item.category;
        break;
      }
    }
    if (detectedBrand) break;
  }

  // 2. Infer Category from Label Detection if not determined by brand
  if (!detectedBrand && detectedLabels && detectedLabels.length > 0) {
    const labelsStr = detectedLabels.join(" ");
    if (/cement|concrete|mortar|plaster|grout/i.test(labelsStr)) {
      categoryGuess = "tiles-stone";
    } else if (/paint|coating|varnish|wall/i.test(labelsStr)) {
      categoryGuess = "paint-finishes";
    } else if (/wire|cable|electric|plug|switch/i.test(labelsStr)) {
      categoryGuess = "electrical";
    } else if (/pipe|faucet|plumb|sanitary|drain/i.test(labelsStr)) {
      categoryGuess = "plumbing-sanitary";
    } else if (/tile|flooring|marble|granite|ceramic/i.test(labelsStr)) {
      categoryGuess = "tiles-stone";
    }
  }

  // 2. Detect Series / Grade
  let detectedSeries: string | null = null;
  let detectedGrade: string | null = null;

  for (const gradeItem of KNOWN_SERIES_GRADES) {
    if (gradeItem.pattern.test(text)) {
      detectedSeries = gradeItem.name;
      if (!detectedBrand && gradeItem.brand) {
        detectedBrand = gradeItem.brand;
      }
      break;
    }
  }

  // 3. Detect Packaging / Weight / Volume
  let detectedPackaging: string | null = null;
  for (const pattern of PACKAGING_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const num = match[1];
      const rawUnit = match[0].replace(num, "").trim().toLowerCase();
      detectedPackaging = `${num} ${rawUnit}`;
      break;
    }
  }

  // 4. Build Clean Keywords Array
  const cleanTokens: string[] = [];
  if (detectedBrand) cleanTokens.push(detectedBrand);
  if (detectedSeries) cleanTokens.push(detectedSeries);
  if (detectedPackaging) cleanTokens.push(detectedPackaging);

  // Extract other salient product tokens from raw text (excluding common filler words)
  const stopWords = new Set(["the", "and", "for", "with", "mrp", "net", "qty", "bag", "box", "batch", "pkd", "exp", "mfg", "best", "use", "date", "price", "inclusive", "all", "taxes", "ltd", "pvt", "limited", "india", "regd", "contact", "support"]);
  const rawWords = lowerText.replace(/[^a-z0-9\s]/gi, " ").split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  
  for (const w of rawWords.slice(0, 8)) {
    if (!cleanTokens.some(t => t.toLowerCase().includes(w))) {
      cleanTokens.push(w);
    }
  }

  const cleanQuery = cleanTokens.join(" ");

  return {
    rawText: text,
    detectedBrand,
    detectedSeries,
    detectedGrade,
    detectedPackaging,
    categoryGuess,
    keywords: cleanTokens,
    cleanQuery,
  };
}
