"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  Bell,
  LogOut,
  User,
  Plus,
  ShieldCheck,
  Search,
  ExternalLink,
} from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";
import { useState } from "react";

export default function AdminHeader({
  onMobileMenuToggle,
}: {
  onMobileMenuToggle: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAdminAuth();
  const orders = useAdminStore((s) => s.orders);
  const [userDropdown, setUserDropdown] = useState(false);

  const pendingOrders = orders.filter(
    (o) => o.orderStatus === "Processing" || o.orderStatus === "Confirmed"
  ).length;

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  // Compute breadcrumb title
  const getPageTitle = () => {
    if (pathname === "/admin") return "Dashboard Overview";
    if (pathname === "/admin/products") return "Product Catalog";
    if (pathname === "/admin/products/new") return "Add New Tile";
    if (pathname.includes("/admin/products/") && pathname.includes("/edit"))
      return "Edit Product";
    if (pathname === "/admin/products/bulk") return "Bulk CSV Import";
    if (pathname === "/admin/categories") return "Category Management";
    if (pathname === "/admin/orders") return "Order Management";
    if (pathname.startsWith("/admin/orders/")) return "Order Details";
    if (pathname === "/admin/customers") return "Customer Directory";
    if (pathname === "/admin/reviews") return "Review Moderation";
    if (pathname === "/admin/coupons") return "Discount Coupons";
    if (pathname === "/admin/content") return "Homepage CMS";
    if (pathname === "/admin/settings") return "Store Settings";
    return "Admin Portal";
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-base md:text-lg font-black text-[#052a51] leading-tight">
            {getPageTitle()}
          </h1>
          <p className="text-[11px] text-gray-400 hidden sm:block">
            Tiletra Operations & Store Management
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Add Product Shortcut */}
        <Link
          href="/admin/products/new"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F26522] text-white text-xs font-bold rounded-xl hover:bg-[#d95a1e] active:scale-95 transition-all shadow-xs"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>New Tile</span>
        </Link>

        {/* Pending Orders Pill */}
        {pendingOrders > 0 && (
          <Link
            href="/admin/orders"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold hover:bg-amber-100 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>{pendingOrders} Pending Orders</span>
          </Link>
        )}

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setUserDropdown(!userDropdown)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50 active:scale-95 transition-all text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-[#052a51] text-white font-black text-xs flex items-center justify-center">
              {user?.name ? user.name[0] : "A"}
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-bold text-[#052a51] leading-none">
                {user?.name || "Admin"}
              </p>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">
                {user?.role || "Owner"}
              </span>
            </div>
          </button>

          {/* Dropdown Box */}
          {userDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <p className="text-xs font-bold text-[#052a51]">{user?.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                </div>

                <Link
                  href="/admin/settings"
                  onClick={() => setUserDropdown(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#052a51]"
                >
                  <User size={14} />
                  <span>Store Settings</span>
                </Link>

                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#052a51]"
                >
                  <ExternalLink size={14} />
                  <span>View Public Store</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors mt-1 border-t border-gray-100"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
