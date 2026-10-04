"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Menu, X, MapPin, Phone, Mail, ShoppingCart, Search, Heart, User as UserIcon, Store, Truck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useAuthStore, useAuthStatus } from "@/lib/auth-store";
import SearchModal from "@/components/SearchModal";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import CategoryNavBar from "@/components/CategoryNavBar";
import RotatingHeaderContact from "@/components/RotatingHeaderContact";
import UserAvatar from "@/components/ui/UserAvatar";
import LanguageSelector from "@/components/i18n/LanguageSelector";
import { useTranslation } from "@/lib/i18n/client";

export default function Header() {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const authStatus = useAuthStatus();
  const { user, openLoginModal } = useAuthStore();
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
    { name: t("nav.home"), href: "/" },
    { name: t("nav.shop"), href: "/shop" },
    { name: t("nav.categories"), href: "/categories" },
    { name: t("nav.whyIntriHub"), href: "/why-intrihub" },
    { name: t("nav.about"), href: "/about" },
    { name: t("nav.faq"), href: "/faq" },
    { name: t("nav.contact"), href: "/contact" },
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
          <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex justify-between items-center text-xs font-medium">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#F26522]" /> {t("common.bangaloreKarnataka")}
                </span>
                <a
                  href="mailto:support@intrihub.com"
                  className="flex items-center gap-1.5 hover:text-[#F26522] transition-colors"
                >
                  <Mail size={13} className="text-[#F26522]" /> support@intrihub.com
                </a>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[#F26522] font-bold inline-flex items-center gap-1.5">
                  <Truck size={13} className="text-[#F26522]" />
                  <span>{t("common.buildBetterTagline")}</span>
                </span>
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
            <div className="flex-shrink-0 notranslate" translate="no">
              <Link href="/" className="flex items-center group notranslate" translate="no">
                <Image
                  src="/logo/intri-web-logo.png"
                  alt="IntriHub"
                  width={150}
                  height={40}
                  priority
                  className="h-[30px] sm:h-[34px] md:h-[40px] w-auto object-contain transition-all duration-300 group-hover:scale-105"
                />
              </Link>
            </div>

            {/* Mobile Prominent Search Bar (Center) */}
            <div className="flex md:hidden flex-1 min-w-0">
              <div className="w-full h-9 bg-gray-100/90 hover:bg-gray-100 border border-gray-200/80 rounded-full px-3 flex items-center gap-2 text-left transition-all shadow-2xs group">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label={t("nav.searchProducts")}
                  className="flex-1 flex items-center gap-2 min-w-0 text-left"
                >
                  <Search size={14} className="text-[#F26522] shrink-0" />
                  <span className="text-xs text-gray-600 group-hover:text-gray-800 font-medium truncate">
                    {t("nav.searchPlaceholderMobile")}
                  </span>
                </button>
              </div>
            </div>

            {/* Desktop Large Prominent Search Bar (Flipkart / Amazon Pattern) */}
            <div className="hidden md:flex flex-1 max-w-[520px] xl:max-w-[620px] mx-6">
              <div className="w-full h-11 bg-gray-50 hover:bg-gray-100/80 border border-gray-200 hover:border-[#F26522] rounded-2xl px-4 flex items-center justify-between text-left transition-all shadow-2xs group">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label={t("nav.searchCatalog")}
                  className="flex-1 flex items-center gap-2.5 text-gray-600 group-hover:text-gray-800 text-xs font-semibold mr-2 overflow-hidden"
                >
                  <Search size={16} className="text-gray-500 group-hover:text-[#F26522] transition-colors shrink-0" />
                  <span className="truncate">{t("nav.searchPlaceholderDesktop")}</span>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-gray-600 bg-white border border-gray-300 px-2 py-0.5 rounded-md shadow-2xs">
                    ⌘K
                  </span>
                </div>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3 shrink-0">
              {/* Notification Center (Site-wide on mobile & desktop) */}
              <NotificationCenter />

              {/* Mobile Hamburger Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label={t("nav.toggleMenu")}
                className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[#052a51] hover:bg-gray-100 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              {/* Wishlist Button (Desktop only - mobile uses BottomTabBar) */}
              <Link
                href="/wishlist"
                aria-label={t("common.viewWishlist")}
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
                aria-label={t("common.openCart")}
                className="hidden md:flex relative w-10 h-10 rounded-full items-center justify-center text-[#052a51] hover:bg-gray-100 active:scale-95 transition-all"
              >
                <ShoppingCart size={20} />
                {mounted && totalBoxes > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#F26522] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {totalBoxes > 9 ? "9+" : totalBoxes}
                  </span>
                )}
              </button>

              {/* Account Link / Sign In (Desktop & Tablet) */}
              {!mounted || authStatus === "loading" ? (
                <div className="hidden md:block w-[76px] h-[40px] rounded-xl bg-gray-100/60 animate-pulse" />
              ) : authStatus === "authenticated" && user ? (
                <Link
                  href="/account"
                  aria-label={t("nav.account")}
                  className="hidden md:flex items-center gap-2 px-2.5 h-[40px] rounded-xl text-xs font-bold text-[#052a51] hover:bg-gray-100 transition-colors"
                >
                  <UserAvatar
                    src={user.avatar}
                    name={user.name}
                    email={user.email}
                    size={28}
                    priority
                    className="border border-[#052a51]/20 shadow-2xs"
                  />
                  <span className="truncate max-w-[100px] notranslate" translate="no">{user.name?.split(" ")[0] || t("nav.account")}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openLoginModal()}
                  aria-label={t("common.signIn")}
                  className="hidden md:flex items-center gap-1.5 px-3.5 h-[40px] rounded-xl text-xs font-bold text-[#052a51] hover:bg-gray-100 transition-colors"
                >
                  <UserIcon size={16} />
                  <span>{t("auth.login")}</span>
                </button>
              )}

              {/* Mobile Header Account Avatar Button (Visible on mobile header when logged in) */}
              {mounted && authStatus === "authenticated" && user && (
                <Link
                  href="/account"
                  aria-label={t("nav.account")}
                  className="md:hidden flex items-center justify-center w-8 h-8 rounded-full shrink-0 active:scale-95 transition-transform"
                >
                  <UserAvatar
                    src={user.avatar}
                    name={user.name}
                    email={user.email}
                    size={28}
                    priority
                    className="border border-[#052a51]/20 shadow-xs"
                  />
                </Link>
              )}

              {/* Language Selector — globe only on md, full on lg+ */}
              <div className="hidden md:flex lg:hidden items-center">
                <LanguageSelector variant="minimal" />
              </div>
              <div className="hidden lg:flex items-center">
                <LanguageSelector variant="header" />
              </div>

              <Link href="/vendor/apply" className="hidden sm:block">
                <Button className="rounded-xl px-3.5 lg:px-4 h-[40px] font-bold text-white bg-[#F26522] hover:bg-[#d95a1e] active:scale-95 shadow-xs hover:shadow transition-all whitespace-nowrap text-xs md:text-sm flex items-center gap-1.5">
                  <Store size={15} />
                  <span>{t("nav.becomeVendor")}</span>
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
            {mounted && authStatus === "authenticated" && user ? (
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="mb-2 p-3 bg-blue-50/80 rounded-2xl flex items-center gap-3 border border-blue-100 active:scale-[0.98] transition-transform"
              >
                <UserAvatar
                  src={user.avatar}
                  name={user.name}
                  email={user.email}
                  size={42}
                  priority
                  className="border border-white shadow-xs shrink-0"
                />
                <div className="min-w-0 flex-1 notranslate" translate="no">
                  <p className="text-sm font-black text-[#052a51] truncate">{user.name || "Customer"}</p>
                  <p className="text-[11px] text-gray-500 truncate">{user.email || user.phone || ""}</p>
                </div>
              </Link>
            ) : mounted && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openLoginModal();
                }}
                className="mb-2 p-3 bg-[#052a51] text-white rounded-2xl flex items-center justify-center gap-2 font-bold text-sm shadow-xs active:scale-[0.98] transition-transform cursor-pointer"
              >
                <UserIcon size={16} />
                <span>{t("auth.login")} / {t("auth.register")}</span>
              </button>
            )}

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
                    <Heart size={16} className="text-red-500" /> {t("nav.myWishlist")}
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
                  {t("nav.exploreSupplies")}
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
