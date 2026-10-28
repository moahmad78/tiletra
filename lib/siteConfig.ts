// Single source of truth for IntriHub branding, contact info, canonical URL and social profiles.

export const SITE_URL = "https://www.intrihub.com";

export const COMPANY_NAME = "IntriHub Private Limited";
export const CIN = "U43299KA2026PTC230136";

export const PHONE_DISPLAY = "+91 70901 20211";
export const PHONE_TEL = "tel:+917090120211";
export const PHONE_WA = "https://wa.me/917090120211";
export const PHONE_SCHEMA = "+91-70901-20211";

export const EMAIL = "support@intrihub.com";
export const SUPPORT_EMAIL = "support@intrihub.com";

export const ADDRESS = {
  streetAddress: "2858/4, Near Government High School, Begur Hobli, Mico Layout, Bangalore South",
  addressLocality: "Bangalore",
  addressRegion: "Karnataka",
  postalCode: "560076",
  addressCountry: "IN",
};

export const REGISTERED_OFFICE_STRING =
  "2858/4, Near Government High School, Begur Hobli, Mico Layout, Bangalore South, Bangalore, Karnataka - 560076";

// Official social links (Facebook, Instagram, LinkedIn, YouTube, X).
// Kept empty until official profiles are confirmed. Root JSON-LD & Footer will conditionally render.
export const SOCIAL_LINKS: string[] = [];

export const SITE_CONFIG = {
  name: "IntriHub",
  legalName: COMPANY_NAME,
  cin: CIN,
  alternateName: ["IntriHub", "Intrihub.com", "IntriHub Quickcommerce", "IntriHub Private Limited"],
  url: SITE_URL,
  logo: `${SITE_URL}/logo/intri-web-logo.png`,
  telephone: PHONE_SCHEMA,
  phoneDisplay: PHONE_DISPLAY,
  phoneTel: PHONE_TEL,
  phoneWa: PHONE_WA,
  email: EMAIL,
  address: ADDRESS,
  registeredOffice: REGISTERED_OFFICE_STRING,
  areaServed: ["Bengaluru", "India"],
  description:
    "Marketplace for building and interior materials (tiles, electrical, plumbing, plywood, hardware, furniture) with 60-minute delivery in Bengaluru and 3 to 7 day delivery across India.",
  socialLinks: SOCIAL_LINKS,
};
