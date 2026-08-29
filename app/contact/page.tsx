import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";
import GoogleMap from "@/components/GoogleMap";
import { QuoteModalProvider } from "@/components/QuoteModalProvider";
import { BASE_SITE_URL, getCanonicalUrl, generateBreadcrumbSchema, safeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contact IntriHub | Building & Interior Materials Marketplace Bengaluru",
  description:
    "Contact IntriHub for direct-from-factory building supplies, contractor bulk trade pricing, and 60-minute site delivery in Bengaluru. Registered Office: Begur, Bengaluru.",
  alternates: {
    canonical: getCanonicalUrl("/contact"),
  },
  openGraph: {
    title: "Contact IntriHub | Building & Interior Materials Marketplace",
    description:
      "Get in touch with IntriHub for building materials, wholesale quotations, and 60-minute site delivery in Bengaluru.",
    url: getCanonicalUrl("/contact"),
    type: "website",
    siteName: "IntriHub",
  },
};

export default function ContactPage() {
  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${BASE_SITE_URL}/contact#webpage`,
    name: "Contact IntriHub",
    url: `${BASE_SITE_URL}/contact`,
    description: "Official contact directory and customer support for IntriHub quick-commerce building materials platform.",
    mainEntity: {
      "@type": "LocalBusiness",
      "@id": `${BASE_SITE_URL}/#organization`,
      name: "IntriHub",
      alternateName: "IntriHub QuickCommerce",
      url: BASE_SITE_URL,
      telephone: "+91-92649-20211",
      email: "support@intrihub.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "41, 10th A Cross Rd, Janapriya Layout, Begur",
        addressLocality: "Begur, Bengaluru",
        addressRegion: "Karnataka",
        postalCode: "560114",
        addressCountry: "IN",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: "12.8797",
        longitude: "77.6256",
      },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "08:00",
        closes: "21:00",
      },
    },
  };

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Contact Us", url: "/contact" },
  ]);

  return (
    <QuoteModalProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(contactPageSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(breadcrumbsSchema),
        }}
      />
      <main className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Header />

        {/* Page Hero */}
        <div className="pt-36 sm:pt-44 md:pt-48 pb-10 bg-[#052a51] relative overflow-hidden shrink-0">
          <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] relative z-10 text-center">
            <span className="px-3.5 py-1.5 bg-[#F26522]/20 border border-[#F26522]/40 rounded-full text-[#F26522] text-xs font-bold uppercase tracking-wider inline-block mb-3">
              Direct Support & Dispatch Helpline
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Get in <span className="text-[#F26522]">Touch with IntriHub</span>
            </h1>
            <p className="text-white/80 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              We&apos;re here to power your construction and interior projects. Reach out for 60-minute site dispatch, wholesale trade queries, or custom material quotes.
            </p>
          </div>
        </div>

        {/* Contact Section Component */}
        <div className="bg-[#02152b] pb-10">
          <Contact />
        </div>

        {/* Full width Map */}
        <div className="w-full shrink-0">
          <GoogleMap />
        </div>

        <Footer />
      </main>
    </QuoteModalProvider>
  );
}

