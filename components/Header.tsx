"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Menu, X, MapPin, Phone, Mail, ShoppingCart, Search, Heart, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useAuthStore } from "@/lib/auth-store";
import SearchModal from "@/components/SearchModal";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import CategoryNavBar from "@/components/CategoryNavBar";
import RotatingHeaderContact from "@/components/RotatingHeaderContact";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { user, isAuthenticated, openLoginModal } = useAuthStore();
  const { toggleCart } = useCartStore();
  const totalBoxes = useCartStore((s) => s.getTotalBoxes());
  const wishlistCount = useWishlistStore((s) => s.items.length);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "Categories", href: "/shop#categories" },
    { name: "About", href: "/about" },
    { name: "FAQ", href: "/faq" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500">
        {/* Top Announcement Bar */}
        <div
          className={cn(
            "bg-[#052a51] text-white py-2 hidden md:block transition-all duration-300 overflow-hidden",
            isScrolled ? "h-0 py-0 opacity-0" : "h-auto opacity-100"
          )}
        >
          <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
            <div className="flex justify-between items-center text-xs font-medium">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#F26522]" /> Bangalore, Karnataka
                </span>
                <a
                  href="mailto:hello@intrihub.com"
                  className="flex items-center gap-1.5 hover:text-[#F26522] transition-colors"
                >
                  <Mail size={13} className="text-[#F26522]" /> hello@intrihub.com
                </a>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[#F26522] font-bold">✨ Everything for Every Space</span>
                <span className="text-white/30">|</span>
                <RotatingHeaderContact />
              </div>
            </div>
          </div>
        </div>

        {/* Main Nav */}
        <div
          className={cn(
            "bg-white shadow-xs transition-all duration-300 border-b border-gray-100",
            "h-[56px] md:h-[76px]"
          )}
        >
          <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 h-full flex items-center justify-between gap-2.5">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo/intri-web-logo.png"
                  alt="Intrihub Logo"
                  className="h-[30px] sm:h-[34px] md:h-[40px] w-auto object-contain transition-all duration-300 group-hover:scale-105"
                />
              </Link>
            </div>

            {/* Mobile Prominent Search Bar (Center) */}
            <div className="flex md:hidden flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search products"
                className="w-full h-9 bg-gray-100/90 hover:bg-gray-100 border border-gray-200/80 rounded-full px-3 flex items-center gap-2 text-left transition-all shadow-2xs group active:scale-[0.99]"
              >
                <Search size={14} className="text-[#F26522] shrink-0" />
                <span className="text-xs text-gray-400 group-hover:text-gray-500 font-medium truncate">
                  Search tiles, wires, pipes, plywood...
                </span>
              </button>
            </div>

            {/* Desktop Large Prominent Search Bar (Flipkart / Amazon Pattern) */}
            <div className="hidden md:flex flex-1 max-w-[520px] xl:max-w-[620px] mx-6">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="w-full h-11 bg-gray-50 hover:bg-gray-100/80 border border-gray-200 hover:border-[#F26522] rounded-2xl px-4 flex items-center justify-between text-left transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-2.5 text-gray-400 group-hover:text-gray-600 text-xs font-semibold">
                  <Search size={16} className="text-gray-400 group-hover:text-[#F26522] transition-colors" />
                  <span>Search tiles, electrical, plumbing, hardware, plywood, granite...</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-md shadow-2xs">
                  ⌘K
                </span>
              </button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3 shrink-0">
              {/* Notification Center (Site-wide on mobile & desktop) */}
              <NotificationCenter />

              {/* Wishlist Button (Desktop only - mobile uses BottomTabBar) */}
              <Link
                href="/wishlist"
                aria-label="View Wishlist"
                className="hidden md:flex relative w-10 h-10 rounded-full items-center justify-center text-[#052a51] hover:bg-gray-100 active:scale-95 transition-all"
              >
                <Heart size={20} />
                {mounted && wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Drawer Trigger (Desktop only - mobile uses BottomTabBar) */}
              <button
                id="cart-button"
                onClick={toggleCart}
                aria-label="Open cart"
                className="hidden md:flex relative w-10 h-10 rounded-full items-center justify-center text-[#052a51] hover:bg-gray-100 active:scale-95 transition-all"
              >
                <ShoppingCart size={20} />
                {mounted && totalBoxes > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#F26522] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {totalBoxes > 9 ? "9+" : totalBoxes}
                  </span>
                )}
              </button>

              {/* Account Link / Sign In (Desktop) */}
              {mounted && isAuthenticated && user ? (
                <Link
                  href="/account"
                  aria-label="Account"
                  className="hidden lg:flex items-center gap-2 px-2.5 h-[40px] rounded-xl text-xs font-bold text-[#052a51] hover:bg-gray-100 transition-colors"
                >
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar}
                      alt={user.name || "User"}
                      className="w-7 h-7 rounded-full object-cover border border-[#052a51]/20 shadow-2xs"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#052a51] text-white flex items-center justify-center text-[11px] font-black">
                      {user.name ? user.name[0].toUpperCase() : "U"}
                    </div>
                  )}
                  <span className="truncate max-w-[100px]">{user.name?.split(" ")[0] || "Account"}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openLoginModal()}
                  aria-label="Sign in"
                  className="hidden lg:flex items-center gap-1.5 px-3.5 h-[40px] rounded-xl text-xs font-bold text-[#052a51] hover:bg-gray-100 transition-colors"
                >
                  <UserIcon size={16} />
                  <span>Login</span>
                </button>
              )}

              <Link href="/shop" className="hidden sm:block">
                <Button className="rounded-xl px-4 lg:px-5 h-[40px] font-bold text-white bg-[#F26522] hover:bg-[#d95a1e] active:scale-95 shadow-xs hover:shadow transition-all whitespace-nowrap text-xs md:text-sm">
                  Shop Now
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop Category Nav Bar (Mega-Menu) */}
        <CategoryNavBar />

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl py-5 px-6 flex flex-col gap-1 border-t border-gray-100 animate-in slide-in-from-top duration-200">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-base font-bold px-3 py-2.5 rounded-xl text-[#052a51] hover:text-[#F26522] hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
              <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 text-[#052a51] font-bold text-sm">
                  <span className="flex items-center gap-2">
                    <Heart size={16} className="text-red-500" /> My Wishlist
                  </span>
                  {mounted && wishlistCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">
                      {wishlistCount}
                    </span>
                  )}
                </div>
              </Link>
              <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full rounded-xl h-11 text-sm font-bold bg-[#F26522] text-white">
                  Explore All Tiles
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
