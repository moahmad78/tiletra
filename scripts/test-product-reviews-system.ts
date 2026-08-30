import { prisma } from "../lib/prisma";
import { syncProductRatingAggregate, getEligibleOrdersForReview } from "../lib/reviews-server";
import { generateProductSchema } from "../lib/seo";

async function runReviewSystemTests() {
  console.log("\n========================================================");
  console.log("🧪 STARTING PRODUCT REVIEW SYSTEM COMPREHENSIVE TESTS");
  console.log("========================================================\n");

  const timestamp = Date.now();
  const testPhone = `9999${timestamp.toString().slice(-6)}`;
  const testEmail = `reviewer_${timestamp}@example.com`;

  try {
    // 1. Create or fetch test product
    console.log("1️⃣ Setting up test product and user...");
    const product = await prisma.product.create({
      data: {
        name: `Test Review Tile ${timestamp}`,
        slug: `test-review-tile-${timestamp}`,
        categorySlug: "floor-tiles",
        categoryName: "Floor Tiles",
        pricePerSqft: 65,
        avgRating: 0,
        reviewCount: 0,
      },
    });

    const user = await prisma.user.create({
      data: {
        name: "Test Reviewer",
        phone: testPhone,
        email: testEmail,
        phoneVerified: true,
      },
    });

    console.log(`   ✅ Product created: ${product.id} (${product.slug})`);
    console.log(`   ✅ User created: ${user.id} (${user.phone})`);

    // 2. Create Order in "Processing" state (undelivered)
    console.log("\n2️⃣ Testing purchase eligibility on UNDELIVERED order...");
    const order = await prisma.order.create({
      data: {
        id: `ord-test-${timestamp}`,
        userId: user.id,
        customerName: user.name || "Test Reviewer",
        customerPhone: user.phone,
        customerEmail: user.email || testEmail,
        shippingAddress: { city: "Bangalore", street: "MG Road", pincode: "560001" },
        subtotal: 5000,
        total: 5000,
        orderStatus: "Processing",
        items: {
          create: [
            {
              productId: product.id,
              productName: product.name,
              variantId: "var-001",
              variantDetails: "600x600mm Glossy",
              boxQuantity: 5,
              pricePerBox: 1000,
              totalPrice: 5000,
            },
          ],
        },
      },
    });

    const eligibilityUndelivered = await getEligibleOrdersForReview(user.id, product.id, user.phone, user.email);
    console.log(`   Eligibility check for undelivered order: eligible=${eligibilityUndelivered.eligible}`);
    if (eligibilityUndelivered.eligible) {
      throw new Error("FAILED: User should NOT be eligible to review an undelivered order!");
    }
    console.log("   ✅ PASSED: Undelivered order correctly rejected from review eligibility.");

    // 3. Update Order to "DELIVERED"
    console.log("\n3️⃣ Testing purchase eligibility on DELIVERED order...");
    await prisma.order.update({
      where: { id: order.id },
      data: {
        orderStatus: "Delivered",
        deliveredAt: new Date(),
      },
    });

    const eligibilityDelivered = await getEligibleOrdersForReview(user.id, product.id, user.phone, user.email);
    console.log(`   Eligibility check for delivered order: eligible=${eligibilityDelivered.eligible}`);
    if (!eligibilityDelivered.eligible || eligibilityDelivered.eligibleOrders.length === 0) {
      throw new Error("FAILED: User should be eligible to review a delivered order!");
    }
    console.log("   ✅ PASSED: Delivered order correctly identified as eligible.");

    // 4. Create Review (Auto-published)
    console.log("\n4️⃣ Creating verified customer review (Auto-published)...");
    const review = await prisma.review.create({
      data: {
        productId: product.id,
        userId: user.id,
        orderId: order.id,
        rating: 5,
        title: "Outstanding tile quality & finish!",
        body: "The vitrified tiles look gorgeous in our living room with mirror finish shine.",
        status: "PUBLISHED",
      },
    });
    console.log(`   ✅ Review created: ${review.id} with status: ${review.status}`);

    // 5. Test Duplicate Review Prevention
    console.log("\n5️⃣ Testing duplicate review prevention on same order...");
    let duplicateBlocked = false;
    try {
      await prisma.review.create({
        data: {
          productId: product.id,
          userId: user.id,
          orderId: order.id,
          rating: 4,
          title: "Second review",
          body: "Trying to submit duplicate review",
          status: "PUBLISHED",
        },
      });
    } catch (dupErr: any) {
      duplicateBlocked = true;
      console.log(`   ✅ PASSED: Duplicate review blocked by DB unique constraint.`);
    }

    if (!duplicateBlocked) {
      throw new Error("FAILED: Duplicate review was allowed on the same order!");
    }

    // 6. Test Media Upload Row Creation
    console.log("\n6️⃣ Attaching ReviewMedia records (Photo & Video)...");
    const mediaImage = await prisma.reviewMedia.create({
      data: {
        reviewId: review.id,
        type: "IMAGE",
        url: "https://blob.vercel-storage.com/reviews/sample-tile.webp",
      },
    });

    const mediaVideo = await prisma.reviewMedia.create({
      data: {
        reviewId: review.id,
        type: "VIDEO",
        url: "https://blob.vercel-storage.com/reviews/sample-video.mp4",
      },
    });

    const reviewWithMedia = await prisma.review.findUnique({
      where: { id: review.id },
      include: { media: true },
    });

    console.log(`   ✅ Attached media count: ${reviewWithMedia?.media.length}`);
    if (reviewWithMedia?.media.length !== 2) {
      throw new Error("FAILED: Media items not correctly linked to review.");
    }

    // 7. Verify Aggregate Rating Sync
    console.log("\n7️⃣ Testing Product aggregate rating recalculation...");
    const stats1 = await syncProductRatingAggregate(product.id);
    const updatedProd1 = await prisma.product.findUnique({ where: { id: product.id } });

    console.log(`   Product avgRating: ${updatedProd1?.avgRating}, reviewCount: ${updatedProd1?.reviewCount}`);
    if (updatedProd1?.avgRating !== 5 || updatedProd1?.reviewCount !== 1) {
      throw new Error(`FAILED: Expected avgRating 5.0 and reviewCount 1, got ${updatedProd1?.avgRating}, ${updatedProd1?.reviewCount}`);
    }
    console.log("   ✅ PASSED: Aggregate rating accurately computed and cached on Product.");

    // 8. Test Admin Moderation: Hide Review
    console.log("\n8️⃣ Testing Admin moderation: Hide Review with reason...");
    const hiddenReview = await prisma.review.update({
      where: { id: review.id },
      data: {
        status: "HIDDEN",
        hiddenReason: "Flagged by admin for internal audit",
      },
    });

    const stats2 = await syncProductRatingAggregate(product.id);
    const updatedProd2 = await prisma.product.findUnique({ where: { id: product.id } });

    console.log(`   Product avgRating after hide: ${updatedProd2?.avgRating}, reviewCount: ${updatedProd2?.reviewCount}`);
    if (updatedProd2?.avgRating !== 0 || updatedProd2?.reviewCount !== 0) {
      throw new Error("FAILED: Hidden review should not be counted in active product ratings!");
    }
    console.log("   ✅ PASSED: Hidden review excluded from aggregate calculation.");

    // 9. Test Admin Moderation: Restore Review
    console.log("\n9️⃣ Testing Admin moderation: Restore Review...");
    await prisma.review.update({
      where: { id: review.id },
      data: {
        status: "PUBLISHED",
        hiddenReason: null,
      },
    });

    const stats3 = await syncProductRatingAggregate(product.id);
    const updatedProd3 = await prisma.product.findUnique({ where: { id: product.id } });

    console.log(`   Product avgRating after restore: ${updatedProd3?.avgRating}, reviewCount: ${updatedProd3?.reviewCount}`);
    if (updatedProd3?.avgRating !== 5 || updatedProd3?.reviewCount !== 1) {
      throw new Error("FAILED: Restored review should be included in active product ratings!");
    }
    console.log("   ✅ PASSED: Restored review correctly republished and recalculated.");

    // 10. Test JSON-LD Product Schema
    console.log("\n🔟 Testing Google Search Console JSON-LD Product Schema...");
    const schemaWithReview = generateProductSchema({
      id: updatedProd3!.id,
      name: updatedProd3!.name,
      slug: updatedProd3!.slug,
      avgRating: updatedProd3!.avgRating,
      reviewCount: updatedProd3!.reviewCount,
      reviews: [
        {
          id: review.id,
          rating: review.rating,
          title: review.title,
          body: review.body,
          createdAt: review.createdAt,
          author: user.name || "Test User",
        },
      ],
    });

    console.log("   Generated schema aggregateRating:", JSON.stringify(schemaWithReview.aggregateRating, null, 2));
    if (!schemaWithReview.aggregateRating || schemaWithReview.aggregateRating.ratingValue !== "5.0" || schemaWithReview.aggregateRating.reviewCount !== "1") {
      throw new Error("FAILED: aggregateRating missing or invalid in Product JSON-LD schema!");
    }
    console.log("   ✅ PASSED: aggregateRating generated compliant with Google Search Console Rich Snippets.");

    const schemaNoReviews = generateProductSchema({
      id: "prod-empty",
      name: "Empty Product",
      slug: "empty-prod",
      avgRating: 0,
      reviewCount: 0,
      reviews: [],
    });

    if (schemaNoReviews.aggregateRating) {
      throw new Error("FAILED: aggregateRating should be omitted when 0 reviews exist!");
    }
    console.log("   ✅ PASSED: aggregateRating safely omitted when reviewCount is 0.");

    // Clean up
    console.log("\n🧹 Cleaning up test records...");
    await prisma.reviewMedia.deleteMany({ where: { reviewId: review.id } });
    await prisma.review.deleteMany({ where: { productId: product.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.deleteMany({ where: { id: order.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.product.deleteMany({ where: { id: product.id } });

    console.log("   ✅ Cleanup completed.");
    console.log("\n========================================================");
    console.log("🎉 ALL PRODUCT REVIEW SYSTEM TESTS PASSED SUCCESSFULLY!");
    console.log("========================================================\n");
  } catch (err: any) {
    console.error("\n❌ TEST FAILURE:", err);
    process.exit(1);
  }
}

runReviewSystemTests();
