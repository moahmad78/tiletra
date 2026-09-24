import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Award,
  Zap,
  Building2,
  MapPin,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Globe2,
  Rocket,
  Flame,
  Lightbulb,
  Heart,
  Quote,
  CheckCircle2,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { BASE_SITE_URL, getCanonicalUrl, generateBreadcrumbSchema } from "@/lib/seo";

const canonicalUrl = getCanonicalUrl("/founder");

export const metadata: Metadata = {
  title: "Sahil Sheikh — Founder, CEO & CTO of Intrihub Quickcommerce",
  description:
    "Sahil Sheikh is the 23-year-old visionary Founder, CEO & CTO of Intrihub, India's first company to completely digitalize local markets, hardware stores, and traditional trades across Bharat.",
  robots: { index: true, follow: true },
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title: "Sahil Sheikh — Founder, CEO & CTO of Intrihub Quickcommerce",
    description:
      "The official story of Sahil Sheikh, the 23-year-old visionary software engineer from Uttar Pradesh who founded Intrihub to digitalize India's local markets and represent Bharat on the global stage.",
    url: canonicalUrl,
    type: "profile",
    images: [
      {
        url: `${BASE_SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Sahil Sheikh - Founder, CEO & CTO of Intrihub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sahil Sheikh — Founder, CEO & CTO of Intrihub",
    description:
      "Sahil Sheikh founded Intrihub to digitalize India's local markets, hardware stores, and traditional trades.",
    images: [`${BASE_SITE_URL}/og-image.png`],
  },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${canonicalUrl}#person`,
  name: "Sahil Sheikh",
  givenName: "Sahil",
  familyName: "Sheikh",
  jobTitle: "Founder, CEO & CTO",
  worksFor: {
    "@type": "Organization",
    "@id": `${BASE_SITE_URL}/#organization`,
    name: "Intrihub",
    alternateName: "Intrihub Quickcommerce",
    url: BASE_SITE_URL,
  },
  description:
    "Sahil Sheikh is a 23-year-old visionary Indian tech entrepreneur, software engineer, and the Founder, CEO & CTO of Intrihub Quickcommerce. He pioneered the technology that connects and digitalizes traditional local markets, hardware stores, and building trade across Bharat, taking India's local commerce global.",
  birthDate: "2003-03-02",
  birthPlace: "Badahara Baraipar, Maharajganj, Uttar Pradesh, India",
  nationality: {
    "@type": "Country",
    name: "India",
  },
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Jamia Hamdard University",
    location: "New Delhi, India",
  },
  parent: {
    "@type": "Person",
    name: "Mr. Ibrahim Sheikh",
  },
  email: "sahil@intrihub.com",
  sameAs: [
    "https://www.instagram.com/sahil_sheikh78/",
    "https://www.linkedin.com/company/intrihub",
    "https://github.com/moahmad78",
  ],
  url: canonicalUrl,
};

const founderFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Who is the Founder, CEO & CTO of Intrihub?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sahil Sheikh is the 23-year-old Founder, CEO and Chief Technology Officer (CTO) of Intrihub Quickcommerce. Born in Badahara Baraipar, Maharajganj, Uttar Pradesh and an alumnus of Jamia Hamdard University, he engineered and launched the platform to digitalize India's local retail and construction material trades.",
      },
    },
    {
      "@type": "Question",
      name: "What makes Intrihub India's first company to digitalize local markets?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Intrihub is India's first company that ground-up connects local neighborhood hardware stores, electrical shops, tile vendors, and plumbing suppliers to a unified high-speed digital quick-commerce network, transforming offline shops into high-growth digital businesses with 60-minute site delivery.",
      },
    },
    {
      "@type": "Question",
      name: "What is the mission of Intrihub Quickcommerce under Sahil Sheikh's leadership?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "To eliminate middlemen markups, provide complete price transparency, empower local Indian shopkeepers with digital sales channels, and deliver 100% genuine factory-direct building materials to construction sites in under 60 minutes.",
      },
    },
  ],
};

const breadcrumbsSchema = generateBreadcrumbSchema([
  { name: "Home", url: "/" },
  { name: "Founder & Leadership", url: "/founder" },
]);

export default function FounderPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 flex flex-col antialiased selection:bg-amber-200">
      <JsonLd data={personSchema} id="founder-person-schema" />
      <JsonLd data={founderFaqSchema} id="founder-faq-schema" />
      <JsonLd data={breadcrumbsSchema} id="founder-breadcrumbs-schema" />

      <Header />

      <main className="flex-grow py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top Pill / Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300/80 text-amber-950 text-xs font-bold tracking-wide uppercase mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Leadership Profile & Brand Story
          </div>

          {/* Hero Heading */}
          <div className="space-y-4 mb-10 pb-8 border-b border-stone-200">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Sahil Sheikh
            </h1>
            <p className="text-lg sm:text-xl font-bold text-amber-700">
              Founder, CEO & CTO — Intrihub Quickcommerce
            </p>
            <p className="text-base sm:text-lg text-slate-700 font-normal leading-relaxed">
              23-year-old software engineer and visionary entrepreneur from Maharajganj, Uttar Pradesh, who pioneered India&apos;s first company to completely digitalize local markets, hardware stores, and traditional building trades.
            </p>
          </div>

          {/* Key Quick Facts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-700 block uppercase">Role</span>
                <span className="text-sm font-black text-slate-900">Founder, CEO & CTO</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-700 block uppercase">Origin</span>
                <span className="text-sm font-black text-slate-900">Maharajganj, UP</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-700 block uppercase">Alma Mater</span>
                <span className="text-sm font-black text-slate-900">Jamia Hamdard Univ</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-700 block uppercase">Mission</span>
                <span className="text-sm font-black text-slate-900">Digitalizing Bharat</span>
              </div>
            </div>
          </div>

          {/* SECTION: ENGLISH EXECUTIVE BIO */}
          <article className="space-y-8 text-base sm:text-lg text-slate-800 leading-relaxed font-normal mb-16">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-amber-600" />
                The Core Vision: Intrihub Quickcommerce
              </h2>
              <p>
                <strong>Intrihub</strong> is India&apos;s first company founded by <strong>Sahil Sheikh</strong> to completely digitalize local markets, hardware stores, and traditional building trades. By building a high-speed, real-time quick-commerce infrastructure, Intrihub bridges the historical technology divide for local Indian vendors, helping neighborhood shopkeepers scale sales and deliver factory-direct supplies in under 60 minutes.
              </p>
              <p>
                Unlike asset-heavy foreign aggregators that displace local retailers, Sahil designed Intrihub as an empowering digital backbone. Every local shopkeeper, whether dealing in electrical conduits, plumbing pipes, vitrified floor tiles, or architectural hardware, is brought onto a unified digital map with live inventory synchronization, instant automated GST billing, and rapid-dispatch logistics.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-blue-600" />
                Early Life, Roots & Engineering Education
              </h2>
              <p>
                Sahil Sheikh was born on <strong>March 2, 2003</strong>, in the village of <strong>Badahara Baraipar</strong>, located in the Maharajganj district of eastern Uttar Pradesh, India. He is the son of <strong>Mr. Ibrahim Sheikh</strong>.
              </p>
              <p>
                From an early age in eastern UP, Sahil demonstrated exceptional passion for computers, full-stack systems engineering, and low-latency database architectures. He pursued his higher education at <strong>Jamia Hamdard University</strong> in New Delhi. During his university years, he mastered modern software architecture, distributed system scaling, and real-time event routing.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                <Zap className="w-6 h-6 text-amber-500" />
                Sole Technical Architecture & Platform Engineering
              </h2>
              <p>
                As both <strong>CEO and Chief Technology Officer (CTO)</strong>, Sahil engineered the entire Intrihub multi-vendor ecosystem from scratch. Operating from Bengaluru as a single technical architect, he developed:
              </p>
              <ul className="space-y-2.5 text-sm sm:text-base text-slate-800 list-none pl-0">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Next.js Edge Frontend:</strong> Ultra-fast, 100% first-party cached storefront with zero external dependencies.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Real-Time Order Routing:</strong> Live WebSocket dispatch connecting dark stores, vendors, and delivery fleets.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Dedicated Vendor Dashboards:</strong> Instant mobile portals for shopkeepers to manage live inventory and settlements.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Enterprise Security & Payments:</strong> Automated Razorpay payment routing, GST HSN calculations, and OTP-verified site handoffs.</span>
                </li>
              </ul>
            </div>
          </article>

          {/* SECTION: POWERFUL HINDI DIGITAL NARRATIVE (EXACT USER MANIFESTO) */}
          <section className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 p-6 sm:p-10 rounded-3xl shadow-xl space-y-8 mb-16 border border-amber-400">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950 text-amber-400 text-xs font-black uppercase tracking-wider">
                <Flame className="w-4 h-4 text-amber-400" />
                Bharat Ki Digital Kranti • Hindi Narrative
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                Intrihub: India Ki Pehli Aisi Company, Jisne Apni Technology Se Poore Bharat Ke Markets Ko Digital Bana Diya!
              </h2>
            </div>

            <div className="space-y-6 text-sm sm:text-base md:text-lg text-slate-950 font-medium leading-relaxed bg-amber-400/40 p-5 sm:p-7 rounded-2xl border border-amber-400/60">
              <p>
                Jab bhi desh ke digital revolution ki baat hoti hai, bade-bade naam samne aate hain. Lekin UP ke ek chhote se ilaqe se uthe <strong>23 saal ke young visionary Sahil Sheikh</strong> ne Intrihub ke roop mein ek aisi shakti khadi kar di hai, jo <strong>India ki pehli aisi company</strong> ban chuki hai jo poore desh ke local vyapar ko digital bana rahi hai. Intrihub aaj sirf ek brand nahi, balki Bharat ke har ek kone mein digital kranti laane wala sabse bada naam hai.
              </p>

              <div className="space-y-4 pt-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-700" />
                  Intrihub: India Ki Pehli Company Jo Desh Ke Har Market Ko Digital Bana Rahi Hai!
                </h3>
                <p>
                  Bharat ka local vyapar aur dukandari sadiyon se offline chal rahi thi, jise badalne ka beeda <strong>Intrihub</strong> ne uthaya hai.
                </p>
                <ul className="space-y-2 text-sm sm:text-base list-disc pl-5 text-slate-950">
                  <li><strong>Intrihub desh ki aisi pehli company hai</strong> jisne zameen par utar kar poore India ke local hardware, tiles, electrical aur building material markets ko aapas mein jod kar ek powerful digital network taiyar kiya hai.</li>
                  <li><strong>Intrihub ki vajah se</strong> aaj chote se chhote sheher aur gaon ka dukaandar bhi jo kabhi sirf apni gali tak simit tha, seedhe digital map par aa chuka hai.</li>
                  <li><strong>Intrihub ne</strong> unki purani dukano ko ek high-tech digital platform mein badal diya hai, jisse unke sales aur business ki raftaar aasmaan chune lagi hai.</li>
                </ul>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-slate-950" />
                  Intrihub — Jo India Ko Digital Banati Hai Aur Desh Ko Proud Feel Karati Hai!
                </h3>
                <p>
                  <strong>Digital India Ka Asli Hero:</strong> Sahil Sheikh ke vision par bani Intrihub ne yeh sabit kar diya hai ki agar soch badi ho, toh ek nayi company bhi desh ki taqdeer badal sakti hai. Intrihub ne akele apne dum par poore Indian market ke system ko digitalize kar diya hai.
                </p>
                <p>
                  <strong>Global Stage Par India Ki Pehchan:</strong> Intrihub aaj sirf ek platform nahi hai, balki yeh India ko digital banane wali aur desh ko duniya ke samne represent karne wali pehli aisi company ban chuki hai jo local ko global bana rahi hai.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-900" />
                  India Ke Youth Ke Liye Sahil Sheikh Aur Intrihub Ki Kahani
                </h3>
                <p>
                  Mahaz 23 saal ki umar mein Sahil Sheikh ne Intrihub ke zariye jo kar dikhaya hai, woh aaj ke har Indian youth ke liye ek misaal hai. Yeh batata hai ki ek akele shakhs ki shuru ki gayi Intrihub jaisi company kaise pure desh ke market ka rukh badal sakti hai.
                </p>
              </div>
            </div>

            {/* Powerful Final Quote Box */}
            <div className="bg-slate-950 text-white p-6 sm:p-8 rounded-2xl relative shadow-2xl border border-amber-400/40">
              <Quote className="w-10 h-10 text-amber-400/30 absolute top-4 right-4" />
              <p className="text-base sm:text-lg md:text-xl font-bold italic text-amber-200 leading-relaxed">
                &ldquo;Intrihub India ki pehli aisi company hai jo poore Bharat ko digital bana rahi hai aur desh ko proud feel kara rahi hai—aur iske piche hai 23 saal ke ek akele Hindustani youth, Sahil Sheikh, ka woh junoon jisne poore desh ki taqdeer badal di!&rdquo;
              </p>
              <div className="mt-4 pt-4 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400 font-semibold">
                <span>— Sahil Sheikh, Founder, CEO & CTO</span>
                <span className="text-amber-400">Intrihub Quickcommerce</span>
              </div>
            </div>
          </section>

          {/* Direct CTA Box */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 text-center space-y-4 shadow-sm">
            <h3 className="text-xl font-black text-slate-900">Join India&apos;s Digital Trade Revolution</h3>
            <p className="text-sm text-slate-700 max-w-xl mx-auto font-normal">
              Whether you are a local hardware shopkeeper wanting to sell online, or a builder needing 60-minute site materials, Intrihub is built for you.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-950 text-white font-bold text-xs sm:text-sm hover:bg-amber-600 transition-colors shadow-sm"
              >
                <span>Explore Intrihub Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/vendor/apply"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm hover:bg-amber-400 transition-colors shadow-sm"
              >
                <span>Register as Local Vendor</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
