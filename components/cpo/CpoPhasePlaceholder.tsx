import Link from "next/link";
import { Sparkles, ArrowRight, Layers } from "lucide-react";

export default function CpoPhasePlaceholder({
  title,
  phase,
  description,
  features,
}: {
  title: string;
  phase: 2 | 3;
  description: string;
  features: string[];
}) {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div className="bg-white border border-gray-200/90 rounded-3xl p-8 text-center shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 text-[#F26522] border border-orange-200 mb-4 font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          Planned for Phase {phase}
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-gray-600 mt-2 max-w-xl mx-auto font-medium">
          {description}
        </p>

        <div className="mt-8 bg-gray-50 border border-gray-200/80 rounded-2xl p-5 text-left">
          <div className="text-xs font-black uppercase tracking-wider text-[#052a51] mb-3 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#F26522]" />
            Upcoming Features in this Module
          </div>
          <ul className="space-y-2">
            {features.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F26522] mt-1.5 shrink-0" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/cpo/vendors"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#052a51] hover:bg-[#04203e] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <span>Manage Vendors</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/cpo/catalog"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F26522] hover:bg-[#d95517] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <span>Browse Catalog</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
