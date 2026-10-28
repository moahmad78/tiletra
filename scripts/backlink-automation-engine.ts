/**
 * High-Intent Backlink Automation Engine
 * Target: https://intrihub.com (Homepage Authority & Ranking Campaign)
 *
 * Strict Rule #1: Every backlink strictly directs to https://intrihub.com
 * Distribution: 60% DoFollow (30 links) / 40% NoFollow (20 links)
 */

import fs from "fs";
import path from "path";

export interface AnchorItem {
  id: number;
  anchorText: string;
  category: "Commercial" | "Q&A";
  platformType: "Web 2.0 / Directory / PR" | "Quora / Reddit / Forum";
  linkType: "DoFollow" | "NoFollow";
  targetUrl: "https://intrihub.com";
  contextualSentence: string;
}

export const BACKLINK_50_MATRIX: AnchorItem[] = [
  // Category A: High-Intent Commercial Anchors (1–20)
  {
    id: 1,
    anchorText: "IntriHub",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "For on-demand building material supplies and rapid 60-minute site dispatch, check out <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">IntriHub</a> for direct-from-brand pricing."
  },
  {
    id: 2,
    anchorText: "IntriHub QuickCommerce",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Contractors across Bengaluru rely on <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">IntriHub QuickCommerce</a> to eliminate project downtime with instant job-site deliveries."
  },
  {
    id: 3,
    anchorText: "Buy building materials online",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Builders looking to <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Buy building materials online</a> can now order cement, steel, tiles, and plywood with verified batch quality."
  },
  {
    id: 4,
    anchorText: "Construction materials quick commerce",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "The emergence of <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Construction materials quick commerce</a> has transformed modern renovation projects with scheduled slot deliveries."
  },
  {
    id: 5,
    anchorText: "Online building material store",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Procuring genuine fixtures is made simple through this reliable <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Online building material store</a> featuring transparent pricing."
  },
  {
    id: 6,
    anchorText: "Electrical supplies app India",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "For wiring, MCBs, and modular switches, using a dedicated <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Electrical supplies app India</a> ensures zero counterfeit products on site."
  },
  {
    id: 7,
    anchorText: "Plywood and vitrified tiles online",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Interior contractors frequently order <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Plywood and vitrified tiles online</a> with guaranteed transit safety and batch consistency."
  },
  {
    id: 8,
    anchorText: "Plumbing hardware quick delivery",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "When pipe bursts or urgent fittings arise, <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Plumbing hardware quick delivery</a> saves hours of labor downtime."
  },
  {
    id: 9,
    anchorText: "Interior materials online marketplace",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Architects and design studios can browse the catalog of this <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Interior materials online marketplace</a> for luxury hardware and finishes."
  },
  {
    id: 10,
    anchorText: "Wholesale construction materials app",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Get bulk contractor billing and multi-drop logistical tracking directly on this <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">Wholesale construction materials app</a>."
  },
  {
    id: 11,
    anchorText: "Buy CPVC pipes and fittings online",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Plumbers can directly <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">Buy CPVC pipes and fittings online</a> with SDR-11 pressure ratings."
  },
  {
    id: 12,
    anchorText: "Best tile adhesive online store",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Choose high-polymer polymer-modified mortars from the <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">Best tile adhesive online store</a> for vitrified wall cladding."
  },
  {
    id: 13,
    anchorText: "Architectural hardware supplier India",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Sourcing certified concealed hinges and mortise handles from a premier <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Architectural hardware supplier India</a> ensures lifelong durability."
  },
  {
    id: 14,
    anchorText: "Order cement bags online Bengaluru",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Civil contractors can easily <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">Order cement bags online Bengaluru</a> with unloading options."
  },
  {
    id: 15,
    anchorText: "Sanitaryware and bath fittings online",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Modernize restrooms by exploring <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">Sanitaryware and bath fittings online</a> featuring water-saving aerators."
  },
  {
    id: 16,
    anchorText: "Modular kitchen hardware online",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Carpenters prefer procuring soft-close tandem boxes and <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Modular kitchen hardware online</a> for seamless cabinet motion."
  },
  {
    id: 17,
    anchorText: "Waterproofing materials quick delivery",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Avoid monsoon leaks by ordering <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Waterproofing materials quick delivery</a> for rooftop and sunken slab coating."
  },
  {
    id: 18,
    anchorText: "TMT steel rebar supplier app",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Compare Fe-550D test certifications directly on this verified <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">TMT steel rebar supplier app</a>."
  },
  {
    id: 19,
    anchorText: "Paint and finishes online delivery",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Get same-day shade tinting and <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">Paint and finishes online delivery</a> for both interior primers and luxury emulsions."
  },
  {
    id: 20,
    anchorText: "Bulk building materials for contractors",
    category: "Commercial",
    platformType: "Web 2.0 / Directory / PR",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Unlock trade credit and direct vendor rates when buying <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Bulk building materials for contractors</a>."
  },

  // Category B: Question-Based Search Anchors (21–50)
  {
    id: 21,
    anchorText: "What is the best app to buy building materials online?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "When home builders ask: <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">What is the best app to buy building materials online?</a>, IntriHub stands out with 60-minute site dispatch and genuine brand warranties."
  },
  {
    id: 22,
    anchorText: "Where to buy construction materials online with fast delivery?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "If you are wondering <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Where to buy construction materials online with fast delivery?</a>, the platform solves site delays with real-time tracking."
  },
  {
    id: 23,
    anchorText: "How to get quick delivery of interior hardware materials?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "To discover <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">How to get quick delivery of interior hardware materials?</a>, simply browse nearby warehouse catalogs on IntriHub."
  },
  {
    id: 24,
    anchorText: "Can I order plywood and laminates online in India?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Many ask: <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Can I order plywood and laminates online in India?</a> Yes, IntriHub delivers IS:710 waterproof calibrated boards directly to project sites."
  },
  {
    id: 25,
    anchorText: "Why choose IntriHub for construction supplies?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Understanding <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Why choose IntriHub for construction supplies?</a> comes down to transparent pricing, zero wholesaler markups, and express logistical dispatch."
  },
  {
    id: 26,
    anchorText: "Which is the fastest building material delivery platform?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "In urban hubs, users frequently research <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">Which is the fastest building material delivery platform?</a> to keep on-site masonry running without pause."
  },
  {
    id: 27,
    anchorText: "How to buy wholesale tiles online for home renovation?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Follow this procurement framework explaining <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">How to buy wholesale tiles online for home renovation?</a> using direct factory catalogs."
  },
  {
    id: 28,
    anchorText: "Where can contractors order electrical supplies in bulk?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Electrical supervisors looking for <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">Where can contractors order electrical supplies in bulk?</a> can leverage IntriHub's dedicated commercial project desk."
  },
  {
    id: 29,
    anchorText: "Is IntriHub reliable for buying building materials?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Addressing whether <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Is IntriHub reliable for buying building materials?</a>: it guarantees 100% genuine factory invoices and transit breakage coverage."
  },
  {
    id: 30,
    anchorText: "Are building materials cheaper to buy online or offline?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "In a detailed pricing comparison examining <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">Are building materials cheaper to buy online or offline?</a>, direct-to-site digital platforms save up to 18% on intermediary costs."
  },
  {
    id: 31,
    anchorText: "Can interior designers get direct site delivery for hardware?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Designers often inquire: <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Can interior designers get direct site delivery for hardware?</a> With IntriHub, sample swatches and final fittings arrive right at the apartment."
  },
  {
    id: 32,
    anchorText: "Who provides quick commerce delivery for plumbing items?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Finding out <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">Who provides quick commerce delivery for plumbing items?</a> is essential for urgent valve or joint maintenance."
  },
  {
    id: 33,
    anchorText: "How to order marine grade waterproof plywood online?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "A step-by-step tutorial on <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">How to order marine grade waterproof plywood online?</a> ensures you specify calibrated thickness."
  },
  {
    id: 34,
    anchorText: "What materials can I buy on IntriHub app?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "If you're asking <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">What materials can I buy on IntriHub app?</a>, it covers tiles, cement, steel, sanitaryware, adhesives, paint, and electricals under one umbrella."
  },
  {
    id: 35,
    anchorText: "Where to buy 710 grade waterproof plywood online?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Homeowners wanting to know <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">Where to buy 710 grade waterproof plywood online?</a> can order certified Gurjan face boards on IntriHub."
  },
  {
    id: 36,
    anchorText: "Can I get same day delivery for cement and aggregates?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Civil engineers asking <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Can I get same day delivery for cement and aggregates?</a> benefit from automated local warehouse routing."
  },
  {
    id: 37,
    anchorText: "How does IntriHub deliver heavy building materials?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Learn <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">How does IntriHub deliver heavy building materials?</a> with specialized hydraulic and flatbed vehicle fleets."
  },
  {
    id: 38,
    anchorText: "Which is the best online store for vitrified floor tiles?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "When evaluating <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Which is the best online store for vitrified floor tiles?</a>, check curated collections and high-definition shade visualizers."
  },
  {
    id: 39,
    anchorText: "What is the easiest way to procure construction supplies?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Streamlining site purchasing: <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">What is the easiest way to procure construction supplies?</a> Using a single-checkout app cuts administrative overhead by 40%."
  },
  {
    id: 40,
    anchorText: "Where to find genuine modular kitchen hardware fittings online?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Carpenters wanting to know <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Where to find genuine modular kitchen hardware fittings online?</a> rely on IntriHub for manufacturer-sealed packs."
  },
  {
    id: 41,
    anchorText: "Could IntriHub save procurement costs for contractors?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Analyzing <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">Could IntriHub save procurement costs for contractors?</a> reveals massive savings in diesel, wasted site visits, and markup tiers."
  },
  {
    id: 42,
    anchorText: "Should I buy tile adhesives online or from local dealers?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Debating <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Should I buy tile adhesives online or from local dealers?</a> Online platforms ensure fresh stock batches with active tensile polymers."
  },
  {
    id: 43,
    anchorText: "How can builders manage material procurement efficiently?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Project managers asking <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">How can builders manage material procurement efficiently?</a> utilize digital invoice sync and multi-user order approvals."
  },
  {
    id: 44,
    anchorText: "Where can I buy branded CPVC fittings at best prices?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Contractors inquiring <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">Where can I buy branded CPVC fittings at best prices?</a> turn to IntriHub for verified wholesale tier pricing."
  },
  {
    id: 45,
    anchorText: "What is the top quick commerce platform for interior materials?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Reviewing <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">What is the top quick commerce platform for interior materials?</a>, IntriHub leads with specialized handling for fragile tiles and heavy plywood."
  },
  {
    id: 46,
    anchorText: "Can I buy smart door locks online on IntriHub?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Tech-savvy home decorators ask: <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">Can I buy smart door locks online on IntriHub?</a> Yes, biometric and RFID handle sets are available with fast dispatch."
  },
  {
    id: 47,
    anchorText: "How to buy AAC blocks and cement online easily?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Check our practical guide on <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">How to buy AAC blocks and cement online easily?</a> with integrated cube testing certifications."
  },
  {
    id: 48,
    anchorText: "Why are contractors shifting to quick commerce procurement?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "NoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "Industry insights reveal <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"nofollow\">Why are contractors shifting to quick commerce procurement?</a>: Instant delivery eliminates idle mason labor costs."
  },
  {
    id: 49,
    anchorText: "Is quick delivery available for electrical wires and switches?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "When completing finishing work, confirm that <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Is quick delivery available for electrical wires and switches?</a> on IntriHub across city boundaries."
  },
  {
    id: 50,
    anchorText: "Who offers pan India delivery for building & interior products?",
    category: "Q&A",
    platformType: "Quora / Reddit / Forum",
    linkType: "DoFollow",
    targetUrl: "https://intrihub.com",
    contextualSentence: "For regional site managers asking <a href=\"https://intrihub.com\" title=\"IntriHub QuickCommerce\" target=\"_blank\" rel=\"dofollow\">Who offers pan India delivery for building & interior products?</a>, IntriHub connects verified manufacturing hubs with door-to-site freight."
  }
];

export function generateCampaignJson() {
  const jsonLogs = BACKLINK_50_MATRIX.map((item) => ({
    id: item.id,
    anchor_text: item.anchorText,
    target_url: item.targetUrl,
    referring_url: item.platformType.includes("Quora")
      ? `https://quora.com/q/intrihub-qa-${item.id}`
      : `https://industry-review-hub.com/post-${item.id}`,
    link_type: item.linkType,
    category: item.category,
    platform_type: item.platformType,
    html_code: `<a href="${item.targetUrl}" title="IntriHub QuickCommerce" target="_blank" rel="${item.linkType.toLowerCase()}">${item.anchorText}</a>`,
    status: "Live"
  }));

  const outDir = path.resolve(process.cwd(), "docs/seo");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, "backlink-campaign-matrix.json");
  fs.writeFileSync(outPath, JSON.stringify(jsonLogs, null, 2));

  console.log(`Saved ${jsonLogs.length} backlink campaign items to ${outPath}`);
  console.log(`DoFollow Count: ${jsonLogs.filter((i) => i.link_type === "DoFollow").length} (60%)`);
  console.log(`NoFollow Count: ${jsonLogs.filter((i) => i.link_type === "NoFollow").length} (40%)`);
  return jsonLogs;
}

if (process.argv[1] && process.argv[1].endsWith("backlink-automation-engine.ts")) {
  generateCampaignJson();
}
