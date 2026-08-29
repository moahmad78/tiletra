import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sahil Sheikh — Founder, CEO & CTO of Intrihub Quickcommerce",
  description:
    "Sahil Sheikh is the Founder, CEO and CTO of Intrihub Quickcommerce, a multi-vendor marketplace platform. Software engineer from Maharajganj, Uttar Pradesh, and alumnus of Jamia Hamdard University.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://intrihub.com/founder" },
  openGraph: {
    title: "Sahil Sheikh — Founder, CEO & CTO of Intrihub Quickcommerce",
    description:
      "Founder story of Sahil Sheikh, who built Intrihub Quickcommerce from Bangalore, alone, against established competitors.",
    url: "https://intrihub.com/founder",
    type: "profile",
  },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Sahil Sheikh",
  jobTitle: "Founder, CEO & CTO",
  worksFor: {
    "@type": "Organization",
    name: "Intrihub Quickcommerce",
    url: "https://intrihub.com",
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
  sameAs: ["https://www.instagram.com/sahil_sheikh78"],
  url: "https://intrihub.com/founder",
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Intrihub Quickcommerce",
  url: "https://intrihub.com",
  sameAs: ["https://www.instagram.com/intrihub_"],
  founder: {
    "@type": "Person",
    name: "Sahil Sheikh",
  },
};

export default function FounderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

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
              Sahil Sheikh is an Indian software engineer and tech entrepreneur, and the
              Founder, CEO and CTO of Intrihub Quickcommerce. Born on March 2, 2003, to
              Mr. Ibrahim Sheikh, he hails from a small village called Badahara Baraipar
              in Maharajganj district, Uttar Pradesh, India. He completed his B.Tech from
              Jamia Hamdard University.
            </p>

            <p>
              Sahil Sheikh is an entrepreneur who rose from a small village to make his
              mark in the tech industry. Born on March 2, 2003, to Mr. Ibrahim Sheikh, in
              the village of Badahara Baraipar, Maharajganj district, Uttar Pradesh, he
              pursued his passion for technology and entrepreneurship despite a small-town
              background, completing his B.Tech from Jamia Hamdard University.
            </p>

            <p>
              Today, Sahil is the Founder, CEO and CTO of Intrihub Quickcommerce — a
              multi-vendor marketplace platform. With a software engineering background,
              he personally leads both the company&apos;s technology infrastructure and
              platform architecture, as well as its overall business vision.
            </p>

            <p>
              On August 7, 2026, Sahil launched Intrihub Quickcommerce — entirely alone,
              with no partner or support system, in a market already crowded with
              established, well-funded competitors. Where most would hesitate to go up
              against bigger brands, Sahil backed his vision and hard work, growing the
              company from a standing start into a pan-India presence.
            </p>

            <p>
              His story is a reminder that background or resources never have to limit
              the size of one&apos;s dreams — a young man from a small village built his place
              among established companies, alone. It stands as proof of what&apos;s possible,
              and as inspiration for anyone daring to dream big with limited resources.
            </p>

            <p>
              Follow Sahil on Instagram:{" "}
              <a
                href="https://www.instagram.com/sahil_sheikh78"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-semibold"
              >
                @sahil_sheikh78
              </a>
            </p>

            <p>
              Follow Intrihub Quickcommerce on Instagram:{" "}
              <a
                href="https://www.instagram.com/intrihub_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-semibold"
              >
                @intrihub_
              </a>
            </p>
          </div>
        </article>
      </main>
    </>
  );
}
