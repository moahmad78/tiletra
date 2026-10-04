import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Layers } from "lucide-react";

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
    <div className="max-w-3xl mx-auto py-12 space-y-6">
      <div className="bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-4 font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          Scheduled for Phase {phase}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
          {description}
        </p>

        <div className="mt-8 bg-slate-950/60 border border-slate-800 rounded-xl p-5 text-left">
          <div className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-3 flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            Planned Capabilities for this Module
          </div>
          <ul className="space-y-2">
            {features.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/cpo/vendors"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
          >
            <span>Manage Vendors</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/cpo/catalog"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <span>Browse Catalog</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
