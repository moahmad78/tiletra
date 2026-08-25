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
          email: "info@intrihub.com",
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
