import Link from "next/link";
import { Search, Home, ShoppingBag, BookOpen, ArrowRight, HelpCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />

      <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 pt-[84px] md:pt-[175px] lg:pt-[180px] pb-16 flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-blue-50 text-[#052A51] flex items-center justify-center mb-6">
          <HelpCircle size={40} />
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">404 — Page Not Found</h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-md mt-3 leading-relaxed">
          The page or product you are looking for might have been relocated, renamed, or is temporarily unavailable.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <Link
            href="/"
            className="px-6 py-3 bg-[#052A51] hover:bg-[#093A6D] text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            <Home size={16} />
            Back to Homepage
          </Link>
          <Link
            href="/shop"
            className="px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            <ShoppingBag size={16} />
            Explore All Materials
          </Link>
        </div>

        {/* Popular Categories Shortcut */}
        <div className="w-full mt-12 pt-10 border-t border-slate-200">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4">
            Popular Categories
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: "Floor Tiles", href: "/shop/floor-tiles" },
              { name: "Wall Tiles", href: "/shop/wall-tiles" },
              { name: "Sanitaryware", href: "/shop/sanitaryware" },
              { name: "Granite & Marble", href: "/shop/granite-marble" },
              { name: "Tile Adhesives", href: "/shop/tile-adhesives" },
              { name: "Buying Guides", href: "/guides" },
            ].map((cat, i) => (
              <Link
                key={i}
                href={cat.href}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-700 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
