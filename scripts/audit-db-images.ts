import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface FieldAudit {
  model: string;
  field: string;
  totalRecords: number;
  nullOrEmptyCount: number;
  localOkCount: number;
  uploadRouteCount: number;
  externalHosts: Record<string, number>;
  cloudinaryCount: number;
  unsplashCount: number;
  otherCount: number;
  samples: Array<{ id: string; value: string }>;
}

function analyzeValue(val: string | null | undefined): {
  category: "null_empty" | "local_images" | "upload_route" | "external" | "other";
  host?: string;
  isCloudinary: boolean;
  isUnsplash: boolean;
} {
  if (!val || typeof val !== "string" || val.trim() === "") {
    return { category: "null_empty", isCloudinary: false, isUnsplash: false };
  }
  const trimmed = val.trim();
  const isCloudinary = trimmed.includes("res.cloudinary.com") || trimmed.includes("cloudinary.com");
  const isUnsplash = trimmed.includes("images.unsplash.com") || trimmed.includes("unsplash.com");

  if (trimmed.startsWith("/images/")) {
    return { category: "local_images", isCloudinary, isUnsplash };
  }
  if (trimmed.startsWith("/api/uploads/") || trimmed.startsWith("/uploads/")) {
    return { category: "upload_route", isCloudinary, isUnsplash };
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      return { category: "external", host: url.hostname, isCloudinary, isUnsplash };
    } catch {
      return { category: "other", isCloudinary, isUnsplash };
    }
  }
  return { category: "other", isCloudinary, isUnsplash };
}

async function auditField(
  modelName: string,
  fieldName: string,
  records: Array<{ id: string; [key: string]: any }>,
  isArray: boolean = false
): Promise<FieldAudit> {
  const audit: FieldAudit = {
    model: modelName,
    field: fieldName,
    totalRecords: records.length,
    nullOrEmptyCount: 0,
    localOkCount: 0,
    uploadRouteCount: 0,
    externalHosts: {},
    cloudinaryCount: 0,
    unsplashCount: 0,
    otherCount: 0,
    samples: [],
  };

  for (const record of records) {
    const rawVal = record[fieldName];
    if (isArray && Array.isArray(rawVal)) {
      if (rawVal.length === 0) {
        audit.nullOrEmptyCount++;
      } else {
        for (const item of rawVal) {
          const res = analyzeValue(item);
          if (res.category === "null_empty") audit.nullOrEmptyCount++;
          else if (res.category === "local_images") audit.localOkCount++;
          else if (res.category === "upload_route") audit.uploadRouteCount++;
          else if (res.category === "external") {
            const h = res.host || "unknown";
            audit.externalHosts[h] = (audit.externalHosts[h] || 0) + 1;
            if (res.isCloudinary) audit.cloudinaryCount++;
            if (res.isUnsplash) audit.unsplashCount++;
            if (audit.samples.length < 5) audit.samples.push({ id: record.id, value: item });
          } else {
            audit.otherCount++;
            if (audit.samples.length < 5) audit.samples.push({ id: record.id, value: item });
          }
        }
      }
    } else {
      const res = analyzeValue(rawVal);
      if (res.category === "null_empty") audit.nullOrEmptyCount++;
      else if (res.category === "local_images") audit.localOkCount++;
      else if (res.category === "upload_route") audit.uploadRouteCount++;
      else if (res.category === "external") {
        const h = res.host || "unknown";
        audit.externalHosts[h] = (audit.externalHosts[h] || 0) + 1;
        if (res.isCloudinary) audit.cloudinaryCount++;
        if (res.isUnsplash) audit.unsplashCount++;
        if (audit.samples.length < 5) audit.samples.push({ id: record.id, value: rawVal });
      } else {
        audit.otherCount++;
        if (audit.samples.length < 5) audit.samples.push({ id: record.id, value: rawVal });
      }
    }
  }

  return audit;
}

async function runAudit() {
  console.log("=================================================");
  console.log("DATABASE IMAGES AUDIT (READ-ONLY)");
  console.log("=================================================");

  const results: FieldAudit[] = [];

  // 1. User
  const users = await prisma.user.findMany({ select: { id: true, avatar: true } });
  results.push(await auditField("User", "avatar", users));

  // 2. Category
  const categories = await prisma.category.findMany({ select: { id: true, image: true, icon: true } });
  results.push(await auditField("Category", "image", categories));
  results.push(await auditField("Category", "icon", categories));

  // 3. Product
  const products = await prisma.product.findMany({
    select: { id: true, images: true, videos: true, description: true, shortDescription: true },
  });
  results.push(await auditField("Product", "images", products, true));
  results.push(await auditField("Product", "videos", products, true));

  // 4. ProductVariant
  const variants = await prisma.productVariant.findMany({
    select: { id: true, swatchImage: true, image: true },
  });
  results.push(await auditField("ProductVariant", "image", variants));
  results.push(await auditField("ProductVariant", "swatchImage", variants));

  // 5. Colour
  const colours = await prisma.colour.findMany({
    select: { id: true, swatchImage: true },
  });
  results.push(await auditField("Colour", "swatchImage", colours));

  // 6. OrderItem
  const orderItems = await prisma.orderItem.findMany({
    select: { id: true, image: true },
  });
  results.push(await auditField("OrderItem", "image", orderItems));

  // 7. ReturnRequest
  const returnRequests = await prisma.returnRequest.findMany({
    select: { id: true, photos: true },
  });
  results.push(await auditField("ReturnRequest", "photos", returnRequests, true));

  // 8. ReviewMedia
  const reviewMedia = await prisma.reviewMedia.findMany({
    select: { id: true, url: true, thumbnailUrl: true },
  });
  results.push(await auditField("ReviewMedia", "url", reviewMedia));
  results.push(await auditField("ReviewMedia", "thumbnailUrl", reviewMedia));

  // 9. OfferBanner
  const offerBanners = await prisma.offerBanner.findMany({
    select: { id: true, image: true },
  });
  results.push(await auditField("OfferBanner", "image", offerBanners));

  // 10. Banner
  const banners = await prisma.banner.findMany({
    select: { id: true, image: true },
  });
  results.push(await auditField("Banner", "image", banners));

  // 11. Vendor
  const vendors = await prisma.vendor.findMany({
    select: {
      id: true,
      logo: true,
      shopPhotoUrl: true,
      panDocUrl: true,
      aadharDocUrl: true,
      gstDocUrl: true,
      chequeDocUrl: true,
      tradeLicenseDocUrl: true,
    },
  });
  results.push(await auditField("Vendor", "logo", vendors));
  results.push(await auditField("Vendor", "shopPhotoUrl", vendors));
  results.push(await auditField("Vendor", "panDocUrl", vendors));
  results.push(await auditField("Vendor", "aadharDocUrl", vendors));
  results.push(await auditField("Vendor", "gstDocUrl", vendors));
  results.push(await auditField("Vendor", "chequeDocUrl", vendors));
  results.push(await auditField("Vendor", "tradeLicenseDocUrl", vendors));

  // 12. VendorApplication
  const vendorApps = await prisma.vendorApplication.findMany({
    select: { id: true, shopPhotoUrl: true, panDocUrl: true, aadharDocUrl: true },
  });
  results.push(await auditField("VendorApplication", "shopPhotoUrl", vendorApps));
  results.push(await auditField("VendorApplication", "panDocUrl", vendorApps));
  results.push(await auditField("VendorApplication", "aadharDocUrl", vendorApps));

  // 13. GuidePost
  const guidePosts = await prisma.guidePost.findMany({
    select: { id: true, featuredImage: true },
  });
  results.push(await auditField("GuidePost", "featuredImage", guidePosts));

  // Print Table
  console.log("\n%-20s %-18s %-7s %-11s %-10s %-10s %-11s %-10s %-7s",
    "Model", "Field", "Total", "Null/Empty", "Local OK", "Upload API", "Cloudinary", "Unsplash", "Other Ext"
  );
  console.log("-".repeat(110));

  let totalCloudinary = 0;
  let totalUnsplash = 0;
  let totalExternal = 0;

  for (const r of results) {
    const extHostCount = Object.keys(r.externalHosts).length;
    console.log(
      `${r.model.padEnd(20)} ${r.field.padEnd(18)} ${String(r.totalRecords).padStart(7)} ` +
      `${String(r.nullOrEmptyCount).padStart(11)} ${String(r.localOkCount).padStart(10)} ` +
      `${String(r.uploadRouteCount).padStart(10)} ${String(r.cloudinaryCount).padStart(11)} ` +
      `${String(r.unsplashCount).padStart(10)} ${String(extHostCount).padStart(9)}`
    );
    totalCloudinary += r.cloudinaryCount;
    totalUnsplash += r.unsplashCount;
    totalExternal += Object.values(r.externalHosts).reduce((a, b) => a + b, 0);

    if (r.samples.length > 0) {
      for (const s of r.samples) {
        console.log(`   [SAMPLE ${r.model}.${r.field} id=${s.id}]: ${s.value}`);
      }
    }
  }

  console.log("=".repeat(110));
  console.log(`TOTAL AUDIT SUMMARY:`);
  console.log(`- Total Cloudinary URLs in DB: ${totalCloudinary}`);
  console.log(`- Total Unsplash URLs in DB:   ${totalUnsplash}`);
  console.log(`- Total External URLs in DB:   ${totalExternal}`);
  console.log("=================================================\n");

  await prisma.$disconnect();
}

runAudit().catch(async (e) => {
  console.error("Audit error:", e);
  await prisma.$disconnect();
  process.exit(1);
});
