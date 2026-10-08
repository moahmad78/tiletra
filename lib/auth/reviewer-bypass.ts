import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password-security";

/**
 * Dedicated Google Play Console App Review Credentials & Self-Contained Test Bypass
 *
 * Meets Play Console Requirements:
 * - Multi-factor authentication blocks access resolution:
 *   Provides dedicated testing bypass for both password and static OTP (123456).
 * - Zero dependency on real-time external SMS, emails, or second devices.
 * - Self-healing: if records are missing in DB, automatically provisions them.
 */
export const PLAY_REVIEW_ACCOUNTS = {
  vendor: {
    email: "bizreview@intrihub.com",
    password: "IntriBizReview#2026",
    staticOtps: ["123456", "000000", "999999"],
    phone: "email_bizreview_intrihub_com",
    vendorSlug: "play-reviewer-vendor",
    businessName: "Play Reviewer Test Store",
  },
  customer: {
    email: "playreview@intrihub.com",
    password: "IntriReview#2026",
    staticOtps: ["123456", "000000", "999999"],
    phone: "email_playreview_intrihub_com",
  },
} as const;

export function isPlayReviewerEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    clean === PLAY_REVIEW_ACCOUNTS.vendor.email ||
    clean === PLAY_REVIEW_ACCOUNTS.customer.email
  );
}

export function isPlayReviewerOtp(email: string, otp: string): boolean {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanOtp = (otp || "").trim();

  if (cleanEmail === PLAY_REVIEW_ACCOUNTS.vendor.email) {
    return (PLAY_REVIEW_ACCOUNTS.vendor.staticOtps as readonly string[]).includes(cleanOtp);
  }
  if (cleanEmail === PLAY_REVIEW_ACCOUNTS.customer.email) {
    return (PLAY_REVIEW_ACCOUNTS.customer.staticOtps as readonly string[]).includes(cleanOtp);
  }
  return false;
}

/**
 * Self-healing provisioning of Google Play Reviewer accounts in the database.
 * Ensures the reviewer records ALWAYS exist and have approved status and password authentication.
 */
export async function ensurePlayReviewerAccounts() {
  try {
    // 1. Ensure Vendor Reviewer
    const vendorHash = hashPassword(PLAY_REVIEW_ACCOUNTS.vendor.password);

    const vendorUser = await prisma.user.upsert({
      where: { phone: PLAY_REVIEW_ACCOUNTS.vendor.phone },
      update: {
        name: "Play Reviewer Vendor",
        email: PLAY_REVIEW_ACCOUNTS.vendor.email,
        role: "vendor",
        phoneVerified: true,
        emailVerified: true,
        passwordHash: vendorHash,
      },
      create: {
        name: "Play Reviewer Vendor",
        email: PLAY_REVIEW_ACCOUNTS.vendor.email,
        phone: PLAY_REVIEW_ACCOUNTS.vendor.phone,
        role: "vendor",
        phoneVerified: true,
        emailVerified: true,
        passwordHash: vendorHash,
      },
    });

    await prisma.vendor.upsert({
      where: { slug: PLAY_REVIEW_ACCOUNTS.vendor.vendorSlug },
      update: {
        ownerId: vendorUser.id,
        contactEmail: PLAY_REVIEW_ACCOUNTS.vendor.email,
        contactPhone: "0000000000",
        status: "approved",
        loginMethod: "password",
        passwordHash: vendorHash,
        commissionRate: 15.0,
      },
      create: {
        businessName: PLAY_REVIEW_ACCOUNTS.vendor.businessName,
        slug: PLAY_REVIEW_ACCOUNTS.vendor.vendorSlug,
        contactEmail: PLAY_REVIEW_ACCOUNTS.vendor.email,
        contactPhone: "0000000000",
        category: "General",
        businessAddress: "Intrihub HQ, Begur, Bengaluru, Karnataka 560114",
        status: "approved",
        commissionRate: 15.0,
        ownerId: vendorUser.id,
        onboardingPath: "admin_created",
        loginMethod: "password",
        passwordHash: vendorHash,
      },
    });

    // 2. Ensure Customer Reviewer
    const customerHash = hashPassword(PLAY_REVIEW_ACCOUNTS.customer.password);

    await prisma.user.upsert({
      where: { phone: PLAY_REVIEW_ACCOUNTS.customer.phone },
      update: {
        name: "Play Reviewer Customer",
        email: PLAY_REVIEW_ACCOUNTS.customer.email,
        role: "customer",
        phoneVerified: true,
        emailVerified: true,
        passwordHash: customerHash,
      },
      create: {
        name: "Play Reviewer Customer",
        email: PLAY_REVIEW_ACCOUNTS.customer.email,
        phone: PLAY_REVIEW_ACCOUNTS.customer.phone,
        role: "customer",
        phoneVerified: true,
        emailVerified: true,
        passwordHash: customerHash,
      },
    });
  } catch (err) {
    console.warn("[ensurePlayReviewerAccounts] Error during self-healing seed:", err);
  }
}
