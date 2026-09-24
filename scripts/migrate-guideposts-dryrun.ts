import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SLUG_TO_IMAGE_MAP: Record<string, string> = {
  "how-intrihub-delivers-materials-in-60-minutes": "/images/banners/banner-slide-1.jpg",
  "interior-material-checklist-contractors": "/images/categories/cat-hardware-fittings.jpg",
  "tile-quantity-calculation-guide": "/images/categories/cat-floor-tiles.jpg",
  "founders-note-why-we-started-intrihub": "/images/banners/banner-slide-2.jpg",
  "how-to-choose-tiles-for-home": "/images/categories/cat-tiles-stone.jpg",
  "granite-vs-tiles-comparison": "/images/categories/cat-granite.jpg",
  "eco-friendly-building-materials-india-2026": "/images/categories/cat-tiles-stone.jpg",
};

async function main() {
  const isApply = process.argv.includes("--apply");
  console.log(`=================================================`);
  console.log(`GUIDEPOST IMAGE MIGRATION (${isApply ? "APPLY MODE" : "DRY-RUN MODE"})`);
  console.log(`=================================================\n`);

  const posts = await prisma.guidePost.findMany();
  let changeCount = 0;

  for (const post of posts) {
    const targetImage = SLUG_TO_IMAGE_MAP[post.slug] || "/images/placeholder-product.svg";
    if (post.featuredImage !== targetImage) {
      changeCount++;
      console.log(`Post ID:   ${post.id}`);
      console.log(`Slug:      ${post.slug}`);
      console.log(`Title:     ${post.title}`);
      console.log(`  BEFORE:  ${post.featuredImage}`);
      console.log(`  AFTER:   ${targetImage}`);
      console.log(`-------------------------------------------------`);

      if (isApply) {
        await prisma.guidePost.update({
          where: { id: post.id },
          data: { featuredImage: targetImage },
        });
      }
    } else {
      console.log(`[ALREADY MIGRATED] ${post.slug} -> ${post.featuredImage}`);
    }
  }

  console.log(`\nTotal posts evaluated: ${posts.length}`);
  console.log(`Total changes ${isApply ? "applied" : "to apply"}: ${changeCount}`);
  if (!isApply && changeCount > 0) {
    console.log(`\nTo apply changes, run with --apply after confirmation.`);
  }
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
