import { prisma } from "../lib/prisma";
import { createVendorManually, deleteVendor, getAdminVendors } from "../lib/actions/admin-vendor";
import { loginVendor } from "../lib/actions/vendor";

async function verifyVendorCrud() {
  console.log("==========================================================================");
  console.log("TEST SUITE: VENDOR MANAGEMENT END-TO-END (ADD, AUTH LOGIN, DELETE)");
  console.log("==========================================================================");

  const timestamp = Date.now();
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000).toString().slice(0, 8)}`;
  const testEmail = `test.partner.${timestamp}@intrihub.com`;
  const testBusiness = `Test Apex Hardware & Electricals ${timestamp}`;
  const testPassword = `Vendor#Pass${timestamp.toString().slice(-4)}`;

  // Clean up any test records
  const oldTestVendors = await prisma.vendor.findMany({
    where: { OR: [{ businessName: { startsWith: "Test Apex" } }, { contactPhone: "9888776655" }] },
  });
  for (const v of oldTestVendors) {
    await deleteVendor(v.id).catch(() => {});
  }

  // ── 1. Test "Add Vendor" (Path B: Admin manual creation) ──────────────────
  console.log(`\n[STEP 1] Creating new vendor via Admin Path B ("${testBusiness}")...`);
  const createRes = await createVendorManually({
    businessName: testBusiness,
    ownerName: "Rakesh Verma",
    contactPhone: testPhone,
    contactEmail: testEmail,
    category: "Hardware & Fasteners",
    businessAddress: "Plot 42, Peenya Industrial Area, Phase 2, Bangalore",
    commissionRate: 12.5,
    customPassword: testPassword,
  });

  if (!createRes.success || !createRes.vendor) {
    throw new Error(`Failed to create vendor: ${createRes.error}`);
  }

  const createdVendor = createRes.vendor;
  console.log(`✓ Vendor created successfully! (ID: ${createdVendor.id})`);
  console.log(`  - Business Name: ${createdVendor.businessName}`);
  console.log(`  - Login Phone: +91 ${createdVendor.contactPhone}`);
  console.log(`  - Generated Password: ${createRes.credentials?.password}`);
  console.log(`  - Commission Rate: ${createdVendor.commissionRate}%`);

  // Verify Vendor and User in DB
  const dbVendor = await prisma.vendor.findUnique({
    where: { id: createdVendor.id },
    include: { owner: true, products: true },
  });
  if (!dbVendor || !dbVendor.owner) {
    throw new Error("Vendor or Owner user not found in database!");
  }
  console.log(`✓ DB User Account linked: User ID ${dbVendor.owner.id}, Phone: ${dbVendor.owner.phone}`);

  // ── 2. Test Vendor Login with Generated Credentials ──────────────────────
  console.log(`\n[STEP 2] Testing Vendor Login with Phone (+91 ${testPhone}) & Password...`);
  const loginRes = await loginVendor(testPhone, testPassword);
  if (!loginRes.success || !loginRes.vendor) {
    throw new Error(`Vendor login failed with generated credentials: ${loginRes.error}`);
  }
  console.log(`✓ Vendor successfully authenticated!`);
  console.log(`  - Logged in as: ${loginRes.vendor.businessName} (Status: ${loginRes.vendor.status})`);

  // Add a sample test product for this vendor to verify cascade deletion
  console.log(`\n[STEP 2.1] Adding a sample test product linked to vendor...`);
  const testProduct = await prisma.product.create({
    data: {
      name: `Test Heavy Duty Fastener ${timestamp}`,
      slug: `test-fastener-${timestamp}`,
      categorySlug: "hardware-fasteners",
      categoryName: "Hardware & Fasteners",
      vendorId: createdVendor.id,
      pricePerSqft: 450,
      description: "Test vendor product for cascade deletion verification",
      approvalStatus: "approved",
      status: "active",
      variants: {
        create: [
          {
            size: "Standard",
            finish: "Zinc",
            color: "Silver",
            pricePerSqft: 450,
            pricePerBox: 450,
            sqftPerBox: 1,
            piecesPerBox: 10,
            stockBoxes: 50,
          },
        ],
      },
    },
  });
  console.log(`✓ Test product created: "${testProduct.name}" (ID: ${testProduct.id})`);

  // ── 3. Test "Delete Vendor" Action (Full Cascade) ────────────────────────
  console.log(`\n[STEP 3] Executing "Delete Vendor" for ID ${createdVendor.id}...`);
  const deleteRes = await deleteVendor(createdVendor.id);
  if (!deleteRes.success) {
    throw new Error(`Delete vendor action failed: ${deleteRes.error}`);
  }
  console.log(`✓ deleteVendor returned success: "${deleteRes.message}"`);

  // ── 4. Verify Complete Cascade Deletion in DB ────────────────────────────
  console.log(`\n[STEP 4] Verifying 100% cascade removal in PostgreSQL...`);
  const checkVendor = await prisma.vendor.findUnique({ where: { id: createdVendor.id } });
  const checkUser = await prisma.user.findUnique({ where: { id: dbVendor.owner.id } });
  const checkProduct = await prisma.product.findUnique({ where: { id: testProduct.id } });

  console.log(`- Vendor Record in DB: ${checkVendor ? "EXISTS (FAIL)" : "NULL (CLEARED ✓)"}`);
  console.log(`- User Login in DB: ${checkUser ? "EXISTS (FAIL)" : "NULL (CLEARED ✓)"}`);
  console.log(`- Vendor Product in DB: ${checkProduct ? "EXISTS (FAIL)" : "NULL (CLEARED ✓)"}`);

  if (checkVendor) throw new Error("Vendor was not deleted from DB!");
  if (checkUser) throw new Error("Vendor User account was not deleted from DB!");
  if (checkProduct) throw new Error("Vendor Product was not cascade deleted from DB!");

  // Verify remaining vendors
  const allVendors = await getAdminVendors();
  console.log(`- Remaining Vendors in Admin list: ${allVendors.length}`);

  console.log("\n==========================================================================");
  console.log("✓ VENDOR ADD, CREDENTIALS LOGIN, AND CASCADE DELETE ALL TESTED 100%!");
  console.log("==========================================================================");
}

verifyVendorCrud()
  .catch((e) => {
    console.error("VENDOR CRUD TEST FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
