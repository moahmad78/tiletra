/**
 * Intrihub SEO Location Data
 * 12 curated Bangalore delivery zones for /shop/[category]/[location] pages.
 * Each entry has SEO context metadata to generate non-identical intro copy per location.
 */

export type SeoLocation = {
  /** URL slug used as the route segment */
  slug: string;
  /** Display name for headings and content */
  name: string;
  /** Neighbourhood descriptor (used in prose variation) */
  area: string;
  /** Zone type — drives sentence template selection */
  zoneType: "residential" | "commercial" | "tech_hub" | "industrial";
  /** One-sentence Google-friendly neighbourhood context */
  context: string;
  /** Representative pincodes for LocalBusiness schema */
  pincodes: string[];
};

export const SEO_LOCATIONS: SeoLocation[] = [
  {
    slug: "begur",
    name: "Begur",
    area: "South Bangalore",
    zoneType: "residential",
    context:
      "Begur is a rapidly developing residential hub in South Bangalore with a high density of villa projects and apartment complexes under construction.",
    pincodes: ["560114", "560068"],
  },
  {
    slug: "koramangala",
    name: "Koramangala",
    area: "Central South Bangalore",
    zoneType: "commercial",
    context:
      "Koramangala is one of Bangalore's most sought-after addresses, blending upscale residential towers with a thriving commercial corridor.",
    pincodes: ["560034", "560095"],
  },
  {
    slug: "whitefield",
    name: "Whitefield",
    area: "East Bangalore",
    zoneType: "tech_hub",
    context:
      "Whitefield is Bangalore's premier IT and tech park corridor, surrounded by thousands of premium residential apartments and villa communities.",
    pincodes: ["560066", "560067"],
  },
  {
    slug: "hsr-layout",
    name: "HSR Layout",
    area: "South Bangalore",
    zoneType: "residential",
    context:
      "HSR Layout is a planned residential sector with wide roads, high-rise gated societies, and strong demand for quality interior finishing materials.",
    pincodes: ["560102"],
  },
  {
    slug: "indiranagar",
    name: "Indiranagar",
    area: "East Bangalore",
    zoneType: "commercial",
    context:
      "Indiranagar is a premier mixed-use locality blending luxury residential properties with boutique commercial spaces, driving consistent demand for premium interior materials.",
    pincodes: ["560038", "560008"],
  },
  {
    slug: "jp-nagar",
    name: "JP Nagar",
    area: "South Bangalore",
    zoneType: "residential",
    context:
      "JP Nagar is a large, well-established residential locality across 9 phases in South Bangalore, with continuous renovation and new construction activity.",
    pincodes: ["560078", "560062"],
  },
  {
    slug: "jayanagar",
    name: "Jayanagar",
    area: "South Bangalore",
    zoneType: "residential",
    context:
      "Jayanagar is one of Bangalore's oldest planned residential areas, known for large independent houses and ongoing interior renovation projects.",
    pincodes: ["560041", "560011"],
  },
  {
    slug: "electronic-city",
    name: "Electronic City",
    area: "South Bangalore",
    zoneType: "tech_hub",
    context:
      "Electronic City is South Bangalore's major IT campus zone surrounded by thousands of apartments housing tech professionals undertaking regular home renovations.",
    pincodes: ["560100"],
  },
  {
    slug: "sarjapur-road",
    name: "Sarjapur Road",
    area: "Southeast Bangalore",
    zoneType: "tech_hub",
    context:
      "Sarjapur Road is one of Bangalore's fastest-growing corridors with hundreds of under-construction villa and apartment projects along its 20km stretch.",
    pincodes: ["560035"],
  },
  {
    slug: "marathahalli",
    name: "Marathahalli",
    area: "East Bangalore",
    zoneType: "commercial",
    context:
      "Marathahalli is a high-density mixed zone in East Bangalore, home to IT offices and a large residential catchment with strong demand for construction materials.",
    pincodes: ["560037"],
  },
  {
    slug: "btm-layout",
    name: "BTM Layout",
    area: "South Bangalore",
    zoneType: "residential",
    context:
      "BTM Layout is a densely populated residential area in South Bangalore adjacent to Koramangala, with ongoing apartment and independent house constructions.",
    pincodes: ["560076"],
  },
  {
    slug: "hebbal",
    name: "Hebbal",
    area: "North Bangalore",
    zoneType: "commercial",
    context:
      "Hebbal is a prominent North Bangalore node near the airport corridor with luxury residential developments and significant commercial construction activity.",
    pincodes: ["560024"],
  },
];

/** Lookup a location by slug. Returns undefined if not found. */
export function getLocationBySlug(slug: string): SeoLocation | undefined {
  return SEO_LOCATIONS.find((l) => l.slug === slug);
}
