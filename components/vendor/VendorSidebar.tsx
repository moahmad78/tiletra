"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  CreditCard,
  MessageSquare,
  Store,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useVendorAuth, DEMO_VENDORS } from "@/lib/vendor-auth";

const navItems = [
  { name: "Dashboard", href: "/vendor", icon: LayoutDashboard, exact: true },
  { name: "My Products", href: "/vendor/products", icon: Package },
  { name: "Orders & Fulfillment", href: "/vendor/orders", icon: ShoppingBag, badge: "8b" },
  { name: "Inventory Stock", href: "/vendor/inventory", icon: Boxes },
  { name: "Payouts & Earnings", href: "/vendor/payouts", icon: CreditCard, badge: "8c" },
  { name: "Customer Reviews", href: "/vendor/reviews", icon: MessageSquare },
  { name: "Shop Profile", href: "/vendor/settings", icon: Store },
];

export default function VendorSidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const pathname = usePathname();
  const { vendor, quickSwitchVendor } = useVendorAuth();

  const getStatusBadge = () => {
    if (!vendor) return null;
    switch (vendor.status) {
      case "approved":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <ShieldCheck size={12} /> Approved
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/20">
            <Clock size={12} /> Pending Review
          </span>
        );
      case "suspended":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-500/20">
            <AlertTriangle size={12} /> Suspended
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#052a51] text-white flex flex-col transition-all duration-300 border-r border-white/10 ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {!collapsed && (
          <Link href="/vendor" className="flex items-center gap-2">
            <div className="bg-white px-2 py-1 rounded-xl shadow-2xs flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/intri-web-logo.png"
                alt="Intrihub Vendor"
                className="h-5 w-auto object-contain"
              />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-emerald-600 rounded text-white shadow-2xs">
              Vendor
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/vendor" className="mx-auto">
            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
              V
            </span>
          </Link>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors hidden md:block"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Active Shop Card */}
      {!collapsed && vendor && (
        <div className="p-3 mx-3 my-2 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider truncate">
                Shop Account
              </p>
              <p className="text-xs font-bold text-white truncate mt-0.5">
                {vendor.businessName}
              </p>
              <p className="text-[10px] text-white/60 truncate">{vendor.contactEmail}</p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            {getStatusBadge()}
            <span className="text-[10px] font-medium text-white/60">
              Fee: {vendor.commissionRate}%
            </span>
          </div>

          {/* Quick Demo Switcher */}
          <div className="mt-2.5 pt-2 border-t border-white/10">
            <label className="text-[9px] text-white/40 uppercase tracking-wider font-semibold block mb-1">
              Switch Test Shop:
            </label>
            <select
              value={vendor.id}
              onChange={(e) => quickSwitchVendor(e.target.value)}
              className="w-full bg-[#031d38] text-white text-[11px] font-medium rounded-lg px-2 py-1 border border-white/10 focus:outline-hidden focus:border-emerald-500"
            >
              {DEMO_VENDORS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.businessName} ({v.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1 scrollbar-none">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group relative ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon size={18} className="shrink-0" />

              {!collapsed && <span className="truncate flex-1">{item.name}</span>}

              {!collapsed && item.badge && (
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Public Storefront Link */}
      <div className="p-3 border-t border-white/10">
        <Link
          href="/shop"
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-white/80 bg-white/5 hover:bg-white/15 hover:text-white transition-colors"
          title="Open storefront"
        >
          <ExternalLink size={15} className="shrink-0 text-emerald-400" />
          {!collapsed && <span className="truncate">View Public Store</span>}
        </Link>
      </div>
    </aside>
  );
}
