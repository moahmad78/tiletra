"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3x3, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

export default function BottomTabBar() {
  const pathname = usePathname();
  const cartCount = useCartStore((state) => state.getTotalItems());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide completely on all admin and vendor routes
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/vendor")) {
    return null;
  }

  const isHomeActive = pathname === "/";
  const isCategoriesActive = pathname.startsWith("/categories") || pathname.startsWith("/shop");
  const isCartActive = pathname.startsWith("/cart");
  const isAccountActive = pathname.startsWith("/account");

  const displayCartCount = mounted ? cartCount : 0;

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-50",
        "bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]",
        "pb-safe"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-[60px] relative px-2">
        {/* 1. Home Tab */}
        <Link
          href="/"
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative active:scale-90 transition-transform duration-150"
        >
          <Home
            size={21}
            strokeWidth={isHomeActive ? 2.5 : 1.8}
            className={cn("transition-colors duration-200", isHomeActive ? "text-[#052a51]" : "text-gray-400")}
            fill={isHomeActive ? "currentColor" : "none"}
          />
          <span className={cn("text-[10px] font-semibold transition-colors", isHomeActive ? "text-[#052a51] font-bold" : "text-gray-400")}>
            Home
          </span>
          {isHomeActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#F26522]" />}
        </Link>

        {/* 2. Categories Tab */}
        <Link
          href="/categories"
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative active:scale-90 transition-transform duration-150"
        >
          <Grid3x3
            size={21}
            strokeWidth={isCategoriesActive ? 2.5 : 1.8}
            className={cn("transition-colors duration-200", isCategoriesActive ? "text-[#052a51]" : "text-gray-400")}
          />
          <span className={cn("text-[10px] font-semibold transition-colors", isCategoriesActive ? "text-[#052a51] font-bold" : "text-gray-400")}>
            Shop
          </span>
          {isCategoriesActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#F26522]" />}
        </Link>

        {/* 3. Cart Tab */}
        <Link
          href="/cart"
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative active:scale-90 transition-transform duration-150"
        >
          <div className="relative">
            <ShoppingBag
              size={21}
              strokeWidth={isCartActive ? 2.5 : 1.8}
              className={cn("transition-colors duration-200", isCartActive ? "text-[#052a51]" : "text-gray-400")}
              fill={isCartActive ? "currentColor" : "none"}
            />
            {displayCartCount > 0 && (
              <span className="absolute -top-2 -right-2.5 w-4 h-4 rounded-full bg-[#F26522] text-white text-[9px] font-black flex items-center justify-center leading-none shadow-xs">
                {displayCartCount > 9 ? "9+" : displayCartCount}
              </span>
            )}
          </div>
          <span className={cn("text-[10px] font-semibold transition-colors", isCartActive ? "text-[#052a51] font-bold" : "text-gray-400")}>
            Cart
          </span>
          {isCartActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#F26522]" />}
        </Link>

        {/* 4. Account Tab */}
        <Link
          href="/account"
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative active:scale-90 transition-transform duration-150"
        >
          <User
            size={21}
            strokeWidth={isAccountActive ? 2.5 : 1.8}
            className={cn("transition-colors duration-200", isAccountActive ? "text-[#052a51]" : "text-gray-400")}
          />
          <span className={cn("text-[10px] font-semibold transition-colors", isAccountActive ? "text-[#052a51] font-bold" : "text-gray-400")}>
            Account
          </span>
          {isAccountActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#F26522]" />}
        </Link>
      </div>
    </nav>
  );
}
