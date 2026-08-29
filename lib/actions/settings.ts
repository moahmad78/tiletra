"use server";

import { prisma } from "@/lib/prisma";
import { safeRevalidate } from "@/lib/formatters";

export async function getStoreSettings() {
  try {
    let settings = await prisma.storeSettings.findFirst();
    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          storeName: "Intrihub",
          contactPhone: "+91 92649 20211",
          whatsappNumber: "+91 92649 20211",
          email: "support@intrihub.com",
          address: "Intrihub Central Supply Hub, Begur, Bangalore, Karnataka - 560114",
          gstNumber: "29AABCT1234F1Z8",
          freeDeliveryThreshold: 15000,
          standardDeliveryFee: 999,
          deliveryFeeEnabled: true,
          bikeDeliveryRate: 99,
          fourWheelerDeliveryRate: 349,
          weightThresholdKg: 20,
          lowStockThreshold: 25,
          codEnabled: true,
          codMaxLimit: 25000,
          codBlockedPincodes: ["560099", "560088"],
          estimatedDelivery: "Within 60 Minutes",
        } as any,
      });
    }
    return settings;
  } catch (error) {
    console.error("Error fetching store settings:", error);
    return null;
  }
}

export async function updateStoreSettings(data: {
  storeName?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  freeDeliveryThreshold?: number;
  standardDeliveryFee?: number;
  deliveryFeeEnabled?: boolean;
  bikeDeliveryRate?: number;
  fourWheelerDeliveryRate?: number;
  weightThresholdKg?: number;
  lowStockThreshold?: number;
  codEnabled?: boolean;
  codMaxLimit?: number;
  codBlockedPincodes?: string[];
  estimatedDelivery?: string;
}) {
  try {
    let settings = await prisma.storeSettings.findFirst();
    if (settings) {
      settings = await prisma.storeSettings.update({
        where: { id: settings.id },
        data: data as any,
      });
    } else {
      settings = await prisma.storeSettings.create({
        data: data as any,
      });
    }

    // Comprehensive revalidation across storefront and admin
    safeRevalidate("/admin/settings");
    safeRevalidate("/admin");
    safeRevalidate("/");
    safeRevalidate("/cart");
    safeRevalidate("/checkout");
    safeRevalidate("/shop");
    safeRevalidate("/contact");
    safeRevalidate("/shipping-policy");
    safeRevalidate("/returns-policy");
    safeRevalidate("/about");
    safeRevalidate("/faq");

    return { success: true, settings };
  } catch (error: any) {
    console.error("Error updating store settings:", error);
    return { success: false, error: error?.message || "Failed to update settings" };
  }
}

export async function getOfferBanners() {
  try {
    const banners = await prisma.offerBanner.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    return banners;
  } catch (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
}

export async function getAllOfferBanners() {
  try {
    const banners = await prisma.offerBanner.findMany({
      orderBy: { order: "asc" },
    });
    return banners;
  } catch (error) {
    console.error("Error fetching all banners:", error);
    return [];
  }
}

export async function createOfferBanner(data: {
  title: string;
  subtitle?: string;
  badge?: string;
  cta?: string;
  href?: string;
  image: string;
  bgGradient?: string;
}) {
  try {
    const count = await prisma.offerBanner.count();
    const banner = await prisma.offerBanner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle || "",
        badge: data.badge || "Special Offer",
        cta: data.cta || "Shop Now",
        href: data.href || "/shop",
        image: data.image,
        bgGradient: data.bgGradient || "from-[#052a51]/95 via-[#052a51]/80 to-transparent",
        order: count,
        isActive: true,
      },
    });

    safeRevalidate("/admin/content");
    safeRevalidate("/");
    safeRevalidate("/shop");
    return { success: true, banner };
  } catch (error: any) {
    console.error("Error creating banner:", error);
    return { success: false, error: error?.message || "Failed to create banner" };
  }
}

export async function updateOfferBanner(id: string, data: any) {
  try {
    const banner = await prisma.offerBanner.update({
      where: { id },
      data,
    });

    safeRevalidate("/admin/content");
    safeRevalidate("/");
    safeRevalidate("/shop");
    return { success: true, banner };
  } catch (error: any) {
    console.error("Error updating banner:", error);
    return { success: false, error: error?.message || "Failed to update banner" };
  }
}

export async function deleteOfferBanner(id: string) {
  try {
    await prisma.offerBanner.delete({ where: { id } });

    safeRevalidate("/admin/content");
    safeRevalidate("/");
    safeRevalidate("/shop");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting banner:", error);
    return { success: false, error: error?.message || "Failed to delete banner" };
  }
}

// Homepage Hero Settings
export async function getHomepageHeroSettings() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "homepage_hero" },
    });
    if (setting && setting.value) {
      return JSON.parse(setting.value);
    }
  } catch (e) {
    console.error("Error fetching homepage hero:", e);
  }

  return {
    headline: "India's Most Trusted Architectural Tile Store",
    subheadline: "Direct factory prices on Vitrified, Ceramic & Natural Stones. Accurate square foot calculators and doorstep pallet freight delivery.",
    badge: "Direct Factory Pricing",
    ctaText: "Explore Tile Catalog",
    ctaHref: "/shop",
    bgImage: "/placeholders/product.svg",
  };
}

export async function updateHomepageHeroSettings(data: {
  headline?: string;
  subheadline?: string;
  badge?: string;
  ctaText?: string;
  ctaHref?: string;
  bgImage?: string;
}) {
  try {
    const existing = await getHomepageHeroSettings();
    const merged = { ...existing, ...data };

    await prisma.setting.upsert({
      where: { key: "homepage_hero" },
      update: { value: JSON.stringify(merged) },
      create: { key: "homepage_hero", value: JSON.stringify(merged) },
    });

    safeRevalidate("/admin/content");
    safeRevalidate("/");
    safeRevalidate("/shop");

    return { success: true, hero: merged };
  } catch (error: any) {
    console.error("Error updating homepage hero:", error);
    return { success: false, error: error?.message || "Failed to update hero settings" };
  }
}

// Announcements & Ticker
export async function getHomepageAnnouncements() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "homepage_announcements" },
    });
    if (setting && setting.value) {
      return JSON.parse(setting.value);
    }
  } catch (e) {
    console.error("Error fetching announcements:", e);
  }

  return {
    enabled: true,
    text: "🚚 Free Doorstep Pallet Freight on Orders Above ₹15,000 across Bangalore | Factory Direct Wholesale Rates",
    linkText: "Shop Deals",
    linkHref: "/shop",
  };
}

export async function updateHomepageAnnouncements(data: {
  enabled?: boolean;
  text?: string;
  linkText?: string;
  linkHref?: string;
}) {
  try {
    const existing = await getHomepageAnnouncements();
    const merged = { ...existing, ...data };

    await prisma.setting.upsert({
      where: { key: "homepage_announcements" },
      update: { value: JSON.stringify(merged) },
      create: { key: "homepage_announcements", value: JSON.stringify(merged) },
    });

    safeRevalidate("/admin/content");
    safeRevalidate("/");
    safeRevalidate("/shop");

    return { success: true, announcements: merged };
  } catch (error: any) {
    console.error("Error updating announcements:", error);
    return { success: false, error: error?.message || "Failed to update announcements" };
  }
}
