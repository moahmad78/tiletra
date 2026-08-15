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
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAdminStore } from "@/lib/admin-store";
import { useState } from "react";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Products", href: "/admin/products", icon: Package, badgeKey: "lowStock" },
  { name: "Categories", href: "/admin/categories", icon: Layers },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag, badgeKey: "pendingOrders" },
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

  const pendingOrdersCount = orders.filter(
    (o) => o.orderStatus === "Processing" || o.orderStatus === "Confirmed"
  ).length;

  const lowStockCount = products.filter((p) =>
    p.variants.some((v) => v.stockBoxes < 15)
  ).length;

  const pendingReviewsCount = reviews.filter((r) => r.status === "pending").length;

  const badges: Record<string, number> = {
    pendingOrders: pendingOrdersCount,
    lowStock: lowStockCount,
    pendingReviews: pendingReviewsCount,
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
          <Link href="/admin" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Tiletra/logo/web-logo.png"
              alt="Tiletra Admin"
              className="h-7 w-auto object-contain brightness-0 invert"
            />
            <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-[#F26522] rounded text-white">
              Admin
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/admin" className="mx-auto">
            <span className="w-8 h-8 rounded-xl bg-[#F26522] text-white font-black flex items-center justify-center text-sm shadow-sm">
              T
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

      {/* Live Storefront Link */}
      <div className="p-3 border-t border-white/10">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white/80 bg-white/5 hover:bg-white/15 hover:text-white transition-colors"
          title="Open customer storefront in new tab"
        >
          <ExternalLink size={16} className="shrink-0 text-[#F26522]" />
          {!collapsed && <span className="truncate">View Public Store</span>}
        </Link>
      </div>
    </aside>
  );
}
