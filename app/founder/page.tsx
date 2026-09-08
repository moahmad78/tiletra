import { Metadata } from "next";
import { BASE_SITE_URL, getCanonicalUrl, generateBreadcrumbSchema } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

const canonicalUrl = getCanonicalUrl("/founder");

export const metadata: Metadata = {
  title: "Sahil Sheikh — Founder, CEO & CTO of Intrihub Quickcommerce",
  description:
    "Sahil Sheikh is the Founder, CEO and CTO of Intrihub Quickcommerce, a multi-vendor marketplace platform. Software engineer from Maharajganj, Uttar Pradesh, and alumnus of Jamia Hamdard University.",
  robots: { index: true, follow: true },
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title: "Sahil Sheikh — Founder, CEO & CTO of Intrihub Quickcommerce",
    description:
      "Founder story of Sahil Sheikh, who built Intrihub Quickcommerce from Bangalore, alone, against established competitors.",
    url: canonicalUrl,
    type: "profile",
  },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${canonicalUrl}#person`,
  name: "Sahil Sheikh",
  jobTitle: "Founder, CEO & CTO",
  worksFor: {
    "@type": "Organization",
    "@id": `${BASE_SITE_URL}/#organization`,
    name: "IntriHub",
    url: BASE_SITE_URL,
  },
  birthDate: "2003-03-02",
  birthPlace: "Badahara Baraipar, Maharajganj, Uttar Pradesh, India",
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Jamia Hamdard University",
  },
  parent: {
    "@type": "Person",
    name: "Mr. Ibrahim Sheikh",
  },
  sameAs: [
    "https://www.instagram.com/sahil_sheikh78/",
    "https://www.linkedin.com/company/intrihub",
  ],
  url: canonicalUrl,
};

const breadcrumbsSchema = generateBreadcrumbSchema([
  { name: "Home", url: "/" },
  { name: "Founder", url: "/founder" },
]);

export default function FounderPage() {
  return (
    <>
      <JsonLd data={personSchema} id="founder-person-schema" />
      <JsonLd data={breadcrumbsSchema} id="founder-breadcrumbs-schema" />

      <main className="min-h-screen bg-white text-slate-900 py-16 px-4 sm:px-6 lg:px-8">
        <article className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            Sahil Sheikh
          </h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-700 mt-0 mb-8">
            Founder, CEO & CTO of Intrihub Quickcommerce
          </h2>

          <div className="space-y-6 text-base sm:text-lg leading-relaxed text-slate-800">
            <p>
              Sahil Sheikh is an Indian software engineer and entrepreneur, best known as the Founder,
              CEO and Chief Technology Officer (CTO) of Intrihub Quickcommerce, a multi-vendor quick
              commerce marketplace platform built to deliver building and interior supplies in 60 minutes.
            </p>

            <h3 className="text-xl font-bold text-slate-900 pt-4">Early Life and Education</h3>
            <p>
              Sahil was born on March 2, 2003, in the village of Badahara Baraipar, located in the
              Maharajganj district of Uttar Pradesh, India. He is the son of Mr. Ibrahim Sheikh.
              Growing up in eastern Uttar Pradesh, he showed an early aptitude for computers and software
              development.
            </p>
            <p>
              He pursued higher education at Jamia Hamdard University in New Delhi, where he completed
              his undergraduate studies. During his university years, he developed a deep interest in
              large-scale web architectures, full-stack systems engineering, and low-latency database
              design.
            </p>

            <h3 className="text-xl font-bold text-slate-900 pt-4">Founding Intrihub Quickcommerce</h3>
            <p>
              In 2026, while living in Bangalore, Sahil observed a critical gap in the rapid delivery
              ecosystem: while groceries and food could arrive in under 30 minutes, construction and
              interior hardware supplies still required days or weeks of manual ordering, fragmented vendor
              phone calls, and non-transparent pricing.
            </p>
            <p>
              Working as an independent developer and single engineer, Sahil conceptualized, engineered, and
              launched the entire Intrihub Quickcommerce platform from scratch. Competing against deeply
              funded legacy aggregators, he designed an end-to-end multi-vendor marketplace featuring a
              Next.js frontend, a real-time order routing algorithm with WebSockets, dedicated vendor
              portals, a logistics fleet tracking mechanism, and instant Razorpay payment processing.
            </p>

            <h3 className="text-xl font-bold text-slate-900 pt-4">Technical Leadership and Vision</h3>
            <p>
              As CEO and CTO, Sahil maintains 100% technical control over the platform&apos;s code repository,
              cloud deployments, database partitioning, and infrastructure security. His mission is to make
              Intrihub the primary rapid logistics backbone for building contractors, architects, and
              interior designers across India.
            </p>
          </div>
        </article>
      </main>
    </>
  );
}
