// Single source of truth for IntriHub branding, contact info, canonical URL and social profiles.

export const SITE_URL = "https://www.intrihub.com";

export const PHONE_DISPLAY = "+91 70901 20211";
export const PHONE_TEL = "tel:+917090120211";
export const PHONE_WA = "https://wa.me/917090120211";
export const PHONE_SCHEMA = "+91-70901-20211";

export const EMAIL = "support@intrihub.com";

export const ADDRESS = {
  streetAddress: "41, 10th A Cross Rd, Janapriya Layout, Begur",
  addressLocality: "Bengaluru",
  addressRegion: "Karnataka",
  postalCode: "560068", // Found in lib/seo.ts (Begur, Bengaluru)
  addressCountry: "IN",
};

// TODO: Sahil to provide official social links (Facebook, Instagram, LinkedIn, YouTube, X).
// Kept empty until official profiles are confirmed. Root JSON-LD & Footer will conditionally render.
export const SOCIAL_LINKS: string[] = [];

export const SITE_CONFIG = {
  name: "IntriHub",
  alternateName: ["IntriHub", "Intrihub.com", "IntriHub Quickcommerce"],
  url: SITE_URL,
  logo: `${SITE_URL}/images/branding/intrihub-logo.png`,
  telephone: PHONE_SCHEMA,
  phoneDisplay: PHONE_DISPLAY,
  phoneTel: PHONE_TEL,
  phoneWa: PHONE_WA,
  email: EMAIL,
  address: ADDRESS,
  areaServed: ["Bengaluru", "India"],
  description:
    "Marketplace for building and interior materials (tiles, electrical, plumbing, plywood, hardware, furniture) with 60-minute delivery in Bengaluru and 3 to 7 day delivery across India.",
  socialLinks: SOCIAL_LINKS,
};
