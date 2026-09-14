/**
 * Seed a dedicated Play Store Reviewer Vendor Account for
 * Google Play Console → App Access → Sign-in details.
 *
 * This creates an approved vendor with password-based login
 * so the Google review team can sign in without needing OTP.
 *
 * Usage:  npx tsx scripts/seed-play-reviewer-vendor.ts
 */
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password-security";

async function seedPlayReviewerVendor() {
  const reviewerEmail = "bizreview@intrihub.com";
  const reviewerPassword = "IntriBizReview#2026";
  const reviewerPhone = "email_bizreview_intrihub_com"; // synthetic phone (non-dialable)

  console.log("🔧 Seeding Play Store Reviewer Vendor Account...\n");

  // 1. Hash the password using the same scrypt utility the app uses
  const passwordHash = hashPassword(reviewerPassword);
  console.log("✅ Password hashed with scrypt");

  // 2. Upsert the reviewer User record (role: vendor)
  const user = await prisma.user.upsert({
    where: { phone: reviewerPhone },
    update: {
      name: "Play Reviewer Vendor",
      email: reviewerEmail,
      role: "vendor",
      phoneVerified: true,
      emailVerified: true,
      passwordHash,
    },
    create: {
      name: "Play Reviewer Vendor",
      email: reviewerEmail,
      phone: reviewerPhone,
      role: "vendor",
      phoneVerified: true,
      emailVerified: true,
      passwordHash,
    },
  });
  console.log(`✅ User upserted: ${user.id} (${user.email})`);

  // 3. Upsert the Vendor record (approved, password login)
  const vendor = await prisma.vendor.upsert({
    where: { slug: "play-reviewer-vendor" },
    update: {
      ownerId: user.id,
      contactEmail: reviewerEmail,
      contactPhone: "0000000000",
      status: "approved",
      loginMethod: "password",
      passwordHash,
      commissionRate: 15.0,
      description: "Dedicated test vendor account for Google Play Console app review.",
    },
    create: {
      businessName: "Play Reviewer Test Store",
      slug: "play-reviewer-vendor",
      contactEmail: reviewerEmail,
      contactPhone: "0000000000",
      category: "General",
      businessAddress: "Intrihub HQ, Begur, Bengaluru, Karnataka 560114",
      status: "approved",
      commissionRate: 15.0,
      ownerId: user.id,
      onboardingPath: "admin_created",
      loginMethod: "password",
      passwordHash,
      description: "Dedicated test vendor account for Google Play Console app review.",
    },
  });
  console.log(`✅ Vendor upserted: ${vendor.id} (${vendor.businessName})`);

  // 4. Summary
  console.log("\n" + "═".repeat(60));
  console.log("  PLAY STORE REVIEWER — VENDOR ACCOUNT CREDENTIALS");
  console.log("═".repeat(60));
  console.log(`  Email:     ${reviewerEmail}`);
  console.log(`  Password:  ${reviewerPassword}`);
  console.log(`  Vendor:    ${vendor.businessName}`);
  console.log(`  Status:    ${vendor.status}`);
  console.log(`  Login:     ${vendor.loginMethod}`);
  console.log(`  User ID:   ${user.id}`);
  console.log(`  Vendor ID: ${vendor.id}`);
  console.log("═".repeat(60));
  console.log("\n✅ Done! Use these credentials in Play Console → App Access.\n");
}

seedPlayReviewerVendor()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
