"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3x3, ShoppingBag, Heart, User } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { cn } from "@/lib/utils";

type TabItem = {
  label: string;
  icon: typeof Home;
  href: string;
  badge?: boolean;
  wishlistBadge?: boolean;
};

const tabs: TabItem[] = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Categories", icon: Grid3x3, href: "/shop" },
  { label: "Cart", icon: ShoppingBag, href: "/cart", badge: true },
  { label: "Wishlist", icon: Heart, href: "/wishlist", wishlistBadge: true },
  { label: "Account", icon: User, href: "/account" },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const cartCount = useCartStore((s) => s.getTotalBoxes());
  const wishlistCount = useWishlistStore((s) => s.items.length);

  // Hide on scroll down, show on scroll up
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 60) {
        setVisible(true);
        setLastY(currentY);
        return;
      }
      setVisible(currentY < lastY);
      setLastY(currentY);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastY]);

  // Hide completely on all admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-50",
        "bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]",
        // Safe area for iPhone notch
        "pb-safe",
        // Slide hide/show
        "transition-transform duration-300",
        visible ? "translate-y-0" : "translate-y-full"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-[60px]">
        {tabs.map(({ label, icon: Icon, href, badge, wishlistBadge }) => {
          // Active: exact match for home, startsWith for others
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const count = mounted ? (badge ? cartCount : wishlistBadge ? wishlistCount : 0) : 0;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative",
                "active:scale-90 transition-transform duration-150"
              )}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-[#052a51]" : "text-gray-400"
                  )}
                  fill={isActive ? "currentColor" : "none"}
                />
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[#F26522] text-white text-[9px] font-black flex items-center justify-center leading-none shadow-xs">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold transition-colors",
                  isActive ? "text-[#052a51]" : "text-gray-400"
                )}
              >
                {label}
              </span>
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#F26522]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
