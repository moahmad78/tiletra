"use client";

import { useVendorAuth } from "@/lib/vendor-auth";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Store, Bell, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function VendorHeader({
  onMobileMenuToggle,
}: {
  onMobileMenuToggle: () => void;
}) {
  const { vendor, logout } = useVendorAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/vendor/login");
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200/80 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-sm md:text-base font-extrabold text-[#052a51] flex items-center gap-2">
            <Store size={18} className="text-emerald-600" />
            {vendor?.businessName || "Vendor Portal"}
          </h1>
          <p className="text-[11px] text-gray-500 hidden md:block">
            Multi-Vendor Seller Panel • {vendor?.category || "Building Materials"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Add Product Button */}
        <Link
          href="/vendor/products/new"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          + Add Product
        </Link>

        {/* User Account / Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
            {vendor?.businessName ? vendor.businessName.charAt(0).toUpperCase() : "V"}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-gray-800 truncate max-w-[120px]">
              {vendor?.ownerName || "Seller"}
            </p>
            <p className="text-[10px] text-gray-400 capitalize">{vendor?.status}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Log out from Vendor Panel"
            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
