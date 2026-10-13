"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Store,
  Package,
  PlusCircle,
  FileText,
  ExternalLink,
  Shield,
  LayoutDashboard,
  Layers,
  Trash2,
  LogOut,
  Loader2,
} from "lucide-react";
import { logoutCpo } from "@/lib/cpo/auth";
import { toast } from "sonner";

const NAV_ITEMS = [
  { href: "/cpo", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/cpo/vendors", label: "Vendors & Stores", icon: Store },
  { href: "/cpo/categories", label: "Categories & Taxonomy", icon: Layers },
  { href: "/cpo/catalog", label: "Catalog & Items", icon: Package },
  { href: "/cpo/catalog/new", label: "Add Item (All Options)", icon: PlusCircle },
  { href: "/cpo/recycle-bin", label: "Recycle Bin", icon: Trash2 },
  { href: "/cpo/invoices", label: "Tax Invoice Generator", icon: FileText },
];

export default function CpoSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutCpo();
      toast.success("CPO logged out successfully");
      router.push("/vendor/login");
    } catch {
      toast.error("Logout failed. Please try again.");
      setLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 bg-[#052a51] text-white flex flex-col shrink-0 h-full border-r border-white/10 select-none notranslate" translate="no">
      {/* Brand Header with IntriHub Web Logo */}
      <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between shrink-0">
        <Link href="/cpo" className="flex items-center gap-2">
          <div className="bg-white px-2.5 py-1 rounded-xl shadow-xs flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/intri-web-logo.png"
              alt="IntriHub"
              className="h-6 w-auto object-contain"
            />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-[#F26522] rounded-md text-white shadow-2xs">
            CPO
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
          Management
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || (item.href !== "/cpo" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-[#F26522] text-white shadow-md shadow-[#F26522]/20"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-white/70"}`} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info & Logout */}
      <div className="p-3 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] text-white/60">Platform</span>
          <span className="font-mono text-[#F26522] text-[11px] font-bold">CPO Hub</span>
        </div>

        <Link
          href="/shop"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white/80 bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#F26522]" />
          <span>View Customer Store</span>
        </Link>

        {/* 🚪 CPO Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors cursor-pointer text-left disabled:opacity-50 active:scale-98"
          title="Logout from CPO Portal"
        >
          {loggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin text-red-400 shrink-0" />
          ) : (
            <LogOut className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{loggingOut ? "Signing Out..." : "Sign Out / Logout"}</span>
        </button>
      </div>
    </aside>
  );
}
