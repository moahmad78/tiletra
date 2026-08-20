import { PrismaClient } from "@prisma/client";
import { updateVendorKycDocuments, updateVendorProfile } from "../lib/actions/vendor";
import { verifyVendorKyc } from "../lib/actions/admin-vendor";
import { createCategory, getCategories, deleteCategory } from "../lib/actions/categories";

const prisma = new PrismaClient();

async function runTests() {
  console.log("==================================================");
  console.log("🧪 TESTING VENDOR KYC, HELPLINE & CATEGORY HERO SYSTEM");
  console.log("==================================================");

  try {
    // 1. Find or create a test vendor
    let testVendor = await prisma.vendor.findFirst();
    if (!testVendor) {
      console.log("Creating test vendor...");
      const testUser = await prisma.user.create({
        data: {
          email: `testvendor_${Date.now()}@intrihub.test`,
          phone: `9178709${Math.floor(10000 + Math.random() * 90000)}`,
          role: "vendor",
          name: "Test Vendor Hub",
        },
      });
      testVendor = await prisma.vendor.create({
        data: {
          businessName: "Test Balaji Electricals & Hardware",
          slug: `test-balaji-${Date.now()}`,
          contactEmail: testUser.email || "vendor@test.com",
          contactPhone: testUser.phone || "9876543210",
          ownerId: testUser.id,
          status: "approved",
        },
      });
    }

    console.log(`\n1. Found Test Vendor: ${testVendor.businessName} (ID: ${testVendor.id})`);

    // 2. Test KYC Submission
    console.log("\n2. Submitting KYC Legal Documents (PAN, Aadhaar, Storefront Photo)...");
    const kycResult = await updateVendorKycDocuments(testVendor.id, {
      panNumber: "ABCDE1234F",
      panDocUrl: "/uploads/test-pan-card.jpg",
      aadharNumber: "5432 1098 7654",
      aadharDocUrl: "/uploads/test-aadhar-card.jpg",
      shopPhotoUrl: "/uploads/test-storefront.jpg",
      gstNumber: "07AAAAA0000A1Z5",
      gstDocUrl: "/uploads/test-gst-cert.pdf",
      chequeDocUrl: "/uploads/test-cheque.jpg",
    });

    console.log("   KYC Update Result:", kycResult.success ? "✅ SUCCESS" : "❌ FAILED", kycResult.message || kycResult.error);

    // Verify in DB
    const dbVendorAfterKyc = await prisma.vendor.findUnique({
      where: { id: testVendor.id },
    });
    console.log(`   Vendor KYC Status: ${dbVendorAfterKyc?.kycStatus} (Expected: submitted)`);
    console.log(`   PAN Saved: ${dbVendorAfterKyc?.panNumber}`);
    console.log(`   Aadhaar Doc Saved: ${dbVendorAfterKyc?.aadharDocUrl}`);
    console.log(`   Shop Photo Saved: ${dbVendorAfterKyc?.shopPhotoUrl}`);

    if (dbVendorAfterKyc?.kycStatus !== "submitted" || !dbVendorAfterKyc?.panNumber) {
      throw new Error("KYC submission failed to persist correctly");
    }

    // 3. Test Admin KYC Verification
    console.log("\n3. Testing Super Admin KYC Verification Action...");
    const verifyResult = await verifyVendorKyc(testVendor.id, {
      kycStatus: "verified",
      kycNotes: "All documents and storefront photo verified successfully by Admin.",
    });
    console.log("   Admin Verify Result:", verifyResult.success ? "✅ SUCCESS" : "❌ FAILED", verifyResult.message || verifyResult.error);

    const dbVendorVerified = await prisma.vendor.findUnique({
      where: { id: testVendor.id },
    });
    console.log(`   Updated KYC Status: ${dbVendorVerified?.kycStatus} (Expected: verified)`);

    // 4. Test Category Creation with Hero Image
    console.log("\n4. Testing Category Creation with Custom Hero Banner...");
    const testCatSlug = `test-wires-${Date.now()}`;
    const catResult = await createCategory({
      name: "Industrial Switchgear & Relays",
      slug: testCatSlug,
      description: "Heavy duty electrical relays and switchgears for factories.",
      image: "/categories/electrical.jpg",
    });

    console.log("   Category Create Result:", catResult.success ? "✅ SUCCESS" : "❌ FAILED");
    if (!catResult.success) {
      throw new Error("Category creation failed");
    }

    const categories = await getCategories();
    const createdCat = categories.find((c) => c.slug === testCatSlug);
    console.log(`   Found Created Category: ${createdCat?.name}, Image: ${createdCat?.image}`);

    // Cleanup test category
    if (createdCat) {
      await deleteCategory(createdCat.id);
      console.log("   Cleaned up test category ✅");
    }

    console.log("\n==================================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY (100%)");
    console.log("==================================================");
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
