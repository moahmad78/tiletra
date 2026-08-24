"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  MessageSquare,
  Tag,
  Palette,
  Settings,
  Store,
  CheckSquare,
  ShieldCheck,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  LogOut,
  Truck,
} from "lucide-react";
import { useAdminStore } from "@/lib/admin-store";
import { useState, useCallback } from "react";
import { getAdminMarketplaceStats } from "@/lib/actions/admin-vendor";
import { useLiveSync } from "@/lib/live-sync";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Vendor Inquiries", href: "/admin/vendor-applications", icon: Clock, badgeKey: "inquiriesCount" },
  { name: "Vendors & Shops", href: "/admin/vendors", icon: Store, badgeKey: "pendingVendors" },
  { name: "Product Approvals", href: "/admin/product-approvals", icon: CheckSquare, badgeKey: "pendingProducts" },
  { name: "Products", href: "/admin/products", icon: Package, badgeKey: "lowStock" },
  { name: "Categories", href: "/admin/categories", icon: Layers },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag, badgeKey: "pendingOrders" },
  { name: "Logistics & Deliveries", href: "/admin/deliveries", icon: Truck },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Reviews", href: "/admin/reviews", icon: MessageSquare, badgeKey: "pendingReviews" },
  { name: "Coupons", href: "/admin/coupons", icon: Tag },
  { name: "Homepage CMS", href: "/admin/content", icon: Palette },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const pathname = usePathname();
  const orders = useAdminStore((s) => s.orders);
  const products = useAdminStore((s) => s.products);
  const reviews = useAdminStore((s) => s.reviews);

  const [marketplaceStats, setMarketplaceStats] = useState({
    pendingVendors: 0,
    pendingProducts: 0,
    inquiriesCount: 0,
    pendingOrders: 0,
    pendingReviews: 0,
    lowStock: 0,
  });

  const fetchStats = useCallback(async () => {
    try {
      const res = await getAdminMarketplaceStats();
      setMarketplaceStats({
        pendingVendors: res.pendingVendors,
        pendingProducts: res.pendingProducts,
        inquiriesCount: res.inquiriesCount,
        pendingOrders: res.pendingOrders,
        pendingReviews: res.pendingReviews,
        lowStock: res.lowStock,
      });
    } catch {
      // Ignore
    }
  }, []);

  useLiveSync({
    onSync: fetchStats,
    pollIntervalMs: 5000,
    enableFocusRefresh: true,
  });

  const badges: Record<string, number> = {
    pendingOrders: marketplaceStats.pendingOrders,
    lowStock: marketplaceStats.lowStock,
    pendingReviews: marketplaceStats.pendingReviews,
    pendingVendors: marketplaceStats.pendingVendors,
    pendingProducts: marketplaceStats.pendingProducts,
    inquiriesCount: marketplaceStats.inquiriesCount,
  };

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#052a51] text-white flex flex-col transition-all duration-300 border-r border-white/10 ${
        collapsed ? "w-[72px]" : "w-[250px]"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <div className="bg-white px-2.5 py-1 rounded-xl shadow-2xs flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/intri-web-logo.png"
                alt="Intrihub Admin"
                className="h-6 w-auto object-contain"
              />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-[#F26522] rounded text-white shadow-2xs">
              Admin
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/admin" className="mx-auto">
            <span className="w-8 h-8 rounded-xl bg-[#F26522] text-white font-black flex items-center justify-center text-sm shadow-sm">
              I
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

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-none">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          const badgeValue = item.badgeKey ? badges[item.badgeKey] : 0;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group relative ${
                isActive
                  ? "bg-[#F26522] text-white shadow-sm"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon size={18} className="shrink-0" />

              {!collapsed && <span className="truncate flex-1">{item.name}</span>}

              {!collapsed && badgeValue > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? "bg-white text-[#F26522]" : "bg-[#F26522] text-white"
                  }`}
                >
                  {badgeValue}
                </span>
              )}

              {collapsed && badgeValue > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F26522] ring-2 ring-[#052a51]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Live Storefront Link & Logout */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-white/80 bg-white/5 hover:bg-white/15 hover:text-white transition-colors"
          title="Open customer storefront in new tab"
        >
          <ExternalLink size={16} className="shrink-0 text-[#F26522]" />
          {!collapsed && <span className="truncate">View Public Store</span>}
        </Link>

        <button
          type="button"
          onClick={() => {
            const { useAdminAuth } = require("@/lib/admin-auth");
            useAdminAuth.getState().logout();
            window.location.href = "/admin/login";
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors cursor-pointer text-left"
          title="Logout from Admin Panel"
        >
          <LogOut size={16} className="shrink-0 text-red-400" />
          {!collapsed && <span className="truncate">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
