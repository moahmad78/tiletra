"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Package,
  Layers,
  DollarSign,
  Sparkles,
  CalendarClock,
  Globe2,
  BellRing,
  History,
  Shield,
  ExternalLink,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/cpo", label: "Dashboard", icon: LayoutDashboard, phase: 1 },
  { href: "/cpo/vendors", label: "Vendors", icon: Store, phase: 1 },
  { href: "/cpo/catalog", label: "Catalog", icon: Package, phase: 1 },
  { href: "/cpo/categories", label: "Categories", icon: Layers, phase: 2 },
  { href: "/cpo/pricing", label: "Pricing", icon: DollarSign, phase: 3 },
  { href: "/cpo/merchandising", label: "Merchandising", icon: Sparkles, phase: 3 },
  { href: "/cpo/delivery-slots", label: "Delivery Slots", icon: CalendarClock, phase: 3 },
  { href: "/cpo/seo", label: "SEO Tools", icon: Globe2, phase: 3 },
  { href: "/cpo/announcements", label: "Announcements", icon: BellRing, phase: 2 },
  { href: "/cpo/activity", label: "Activity Log", icon: History, phase: 1 },
];

export default function CpoSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen text-slate-300">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
        <Link href="/cpo" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-purple-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>IntriHub</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase font-mono">
                CPO
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Chief Product Officer</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Management Core
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/cpo" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-purple-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.phase > 1 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                  P{item.phase}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between text-slate-400">
          <span>Platform Version</span>
          <span className="font-mono text-purple-400">v2.4-cpo</span>
        </div>
        <Link
          href="/shop"
          target="_blank"
          className="flex items-center gap-1.5 text-slate-400 hover:text-purple-300 transition-colors pt-1"
        >
          <span>View Customer Store</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </aside>
  );
}
