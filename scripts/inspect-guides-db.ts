import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.guidePost.findMany({
    select: { id: true, slug: true, title: true, featuredImage: true },
  });
  console.log("GuidePost count:", posts.length);
  for (const post of posts) {
    console.log(`- [${post.slug}] "${post.title}" -> ${post.featuredImage}`);
  }
}

main().finally(() => prisma.$disconnect());
