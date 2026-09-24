"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-guard";
import { BUYING_GUIDES } from "@/lib/guides-data";

export interface GuidePostFilter {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export type GuidePostItem = {
  id: string;
  title: string;
  slug: string;
  featuredImage: string;
  featuredImageAlt?: string | null;
  excerpt: string | null;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  category: string;
  tags: string[];
  keywords?: string[];
  status: string;
  publishedAt: Date;
  authorName: string;
  authorRole?: string | null;
  readTimeMinutes: number;
  readTime?: string;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export interface GuidePostInput {
  title: string;
  slug?: string;
  featuredImage: string;
  featuredImageAlt?: string;
  excerpt?: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  category?: string;
  tags?: string[];
  keywords?: string[] | string;
  status?: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  publishedAt?: string | Date;
  authorName?: string;
  authorRole?: string;
  readTime?: string;
  readTimeMinutes?: number;
}

function calculateReadTime(text: string): number {
  if (!text) return 3;
  // Strip HTML tags
  const plainText = text.replace(/<[^>]*>/g, " ");
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(wordCount / 200); // 200 words per minute average reading speed
  return Math.max(1, minutes);
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Seed initial buying guides from guides-data.ts and PRD into database if empty
 */
export async function seedInitialGuidesIfEmpty(): Promise<void> {
  try {
    // 1. Check if PRD seed post exists
    const seedSlug = "eco-friendly-building-materials-india-2026";
    const existingSeed = await prisma.guidePost.findUnique({ where: { slug: seedSlug } });

    if (!existingSeed) {
      const seedBody = `<p>As Indian homeowners and builders become more conscious of their environmental footprint, 2026 is shaping up to be the year sustainable construction materials move from niche to mainstream. Whether you're renovating an apartment in Bengaluru or building a new home across Karnataka, here's what's actually trending — and why it matters for your next project.</p>

<h2>Recycled Stone & Engineered Surfaces</h2>
<p>Recycled stone composites are gaining serious traction this year. They deliver the same premium look as natural stone — think countertops, flooring, and accent walls — while using significantly less virgin material.</p>

<h2>Reclaimed & FSC-Certified Wood</h2>
<p>Certified sustainable wood sourcing is becoming a standard ask from architects and interior designers. Reclaimed wood is finding its way into feature walls, ceiling panels, and furniture.</p>

<h2>Low-VOC & Clay-Based Paints</h2>
<p>Low-VOC paints and clay-based finishes release far fewer harmful chemicals into your home, making them a smart choice for bedrooms, nurseries, and any space where you spend extended time.</p>

<h2>Bamboo Ply & Natural Fiber Boards</h2>
<p>Bamboo plywood is a genuinely renewable alternative to traditional hardwood ply — ideal for cabinetry, wall panels, and modular furniture.</p>

<h2>Eco Boards for Modular Kitchens & Wardrobes</h2>
<p>Eco boards, made from agricultural waste and recycled wood fiber, are increasingly replacing conventional particleboard in kitchen and wardrobe manufacturing.</p>

<h2>Why This Matters for Your Project</h2>
<p>Beyond the environmental benefits, many of these materials also improve long-term durability and indoor comfort.</p>

<p>At IntriHub, we're expanding our catalog to include more sustainable options across our <a href="/shop/tiles-stone">tiles & stone</a>, <a href="/shop/furniture">plywood</a>, and <a href="/shop/paint-finishes">paint & finishes</a> categories — with factory-direct pricing and fast delivery across Bengaluru and Karnataka.</p>

<p><em>Looking to source eco-friendly materials for your next project? <a href="/shop">Browse our catalog</a> or reach out to our material specialists on WhatsApp.</em></p>`;

      await prisma.guidePost.create({
        data: {
          title: "Eco-Friendly Building Materials Trending in India: A 2026 Guide for Homeowners & Builders",
          slug: seedSlug,
          featuredImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200",
          featuredImageAlt: "Eco-Friendly Building Materials Trending in India 2026 - Natural stone, timber, and sustainable finishes",
          excerpt: "Discover the top eco-friendly building materials trending in India for 2026 — from recycled stone to low-VOC paints. Shop sustainably with IntriHub.",
          content: seedBody,
          metaTitle: "Eco-Friendly Building Materials 2026 | IntriHub Guide",
          metaDescription: "Discover the top eco-friendly building materials trending in India for 2026 — from recycled stone to low-VOC paints. Shop sustainably with IntriHub.",
          category: "Trends",
          tags: ["Trends", "Eco-Friendly", "Sustainability", "Materials 2026"],
          keywords: [
            "eco-friendly building materials India",
            "sustainable construction materials",
            "green building materials Bengaluru",
            "low VOC paints India",
            "eco-friendly interior materials 2026",
          ],
          status: "PUBLISHED",
          publishedAt: new Date(),
          authorName: "IntriHub Team",
          readTimeMinutes: 5,
        },
      });
    }

    const count = await prisma.guidePost.count();
    if (count > 1) return;

    for (const guide of BUYING_GUIDES) {
      if (guide.slug === seedSlug) continue;

      let htmlContent = `<div class="guide-summary-box mb-8 p-6 rounded-2xl bg-amber-50/80 border border-amber-200"><h3 class="text-sm font-extrabold uppercase tracking-wider text-amber-900 mb-2">Key Takeaways</h3><p class="text-slate-800 text-sm leading-relaxed">${guide.summary}</p></div>`;

      for (const section of guide.sections) {
        htmlContent += `<h2>${section.heading}</h2>`;
        for (const p of section.content) {
          htmlContent += `<p>${p}</p>`;
        }
        if (section.bulletPoints && section.bulletPoints.length > 0) {
          htmlContent += `<ul>`;
          for (const bp of section.bulletPoints) {
            htmlContent += `<li>${bp}</li>`;
          }
          htmlContent += `</ul>`;
        }
      }

      if (guide.faqs && guide.faqs.length > 0) {
        htmlContent += `<h2>Frequently Asked Questions</h2>`;
        for (const faq of guide.faqs) {
          htmlContent += `<h3>${faq.question}</h3><p>${faq.answer}</p>`;
        }
      }

      const readTimeNum = parseInt(guide.readTime.replace(/\D/g, ""), 10) || 5;

      await prisma.guidePost.create({
        data: {
          title: guide.title,
          slug: guide.slug,
          featuredImage: guide.image,
          featuredImageAlt: `${guide.title} - IntriHub Guide`,
          excerpt: guide.shortDescription,
          content: htmlContent,
          metaTitle: `${guide.title} | IntriHub Guide`,
          metaDescription: guide.shortDescription,
          category: guide.category,
          tags: [guide.category, "Buying Guide"],
          keywords: [guide.category, "buying guide", "intrihub", "materials"],
          status: "PUBLISHED",
          publishedAt: new Date(guide.publishedAt),
          authorName: guide.author,
          readTimeMinutes: readTimeNum,
        },
      });
    }
  } catch (error) {
    console.error("Error seeding initial guides:", error);
  }
}

/**
 * Get paginated & filtered guide posts
 */
export async function getGuidePosts(filter: GuidePostFilter = {}) {
  try {
    await seedInitialGuidesIfEmpty();

    const {
      status,
      category,
      search,
      page = 1,
      limit = 20,
    } = filter;

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status.toUpperCase();
    }

    if (category && category !== "ALL") {
      where.category = {
        equals: category,
        mode: "insensitive",
      };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { excerpt: { contains: q, mode: "insensitive" } },
        { authorName: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, posts] = await Promise.all([
      prisma.guidePost.count({ where }),
      prisma.guidePost.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  } catch (error) {
    console.error("Error in getGuidePosts:", error);
    return { posts: [], total: 0, page: 1, totalPages: 1, hasMore: false };
  }
}

/**
 * Get published post by slug (public storefront)
 */
export async function getGuidePostBySlug(slug: string) {
  try {
    await seedInitialGuidesIfEmpty();

    const post = await prisma.guidePost.findUnique({
      where: { slug },
    });

    if (!post) return null;

    // Increment views asynchronously without blocking
    prisma.guidePost
      .update({
        where: { id: post.id },
        data: { viewsCount: { increment: 1 } },
      })
      .catch(() => {});

    return post;
  } catch (error) {
    console.error(`Error in getGuidePostBySlug (${slug}):`, error);
    return null;
  }
}

/**
 * Get post by ID (admin editing)
 */
export async function getGuidePostById(id: string) {
  try {
    const post = await prisma.guidePost.findUnique({
      where: { id },
    });
    return post;
  } catch (error) {
    console.error(`Error in getGuidePostById (${id}):`, error);
    return null;
  }
}

/**
 * Create a new Guide Post (Admin Only)
 */
export async function createGuidePost(input: GuidePostInput) {
  try {
    const auth = await requireAdminAction();
    if (!auth.authorized) {
      return { success: false, error: auth.error || "Unauthorized" };
    }

    if (!input.title || !input.title.trim()) {
      return { success: false, error: "Post title is required." };
    }

    if (!input.content || !input.content.trim()) {
      return { success: false, error: "Content body is required." };
    }

    if (!input.featuredImage || !input.featuredImage.trim()) {
      return { success: false, error: "Featured image is required." };
    }

    // Generate and ensure unique slug
    let baseSlug = input.slug && input.slug.trim() ? generateSlug(input.slug) : generateSlug(input.title);
    if (!baseSlug) baseSlug = `guide-${Date.now()}`;

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.guidePost.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const readTimeMinutes = input.readTimeMinutes || calculateReadTime(input.content);

    const keywordsArray = Array.isArray(input.keywords)
      ? input.keywords
      : typeof input.keywords === "string"
      ? input.keywords.split(",").map((k) => k.trim()).filter(Boolean)
      : [];

    const post = await prisma.guidePost.create({
      data: {
        title: input.title.trim(),
        slug,
        featuredImage: input.featuredImage.trim(),
        featuredImageAlt: input.featuredImageAlt?.trim() || input.title.trim(),
        excerpt: input.excerpt?.trim() || "",
        content: input.content,
        metaTitle: input.metaTitle?.trim() || `${input.title.trim()} | IntriHub Guide`,
        metaDescription: input.metaDescription?.trim() || input.excerpt?.trim() || input.title.trim(),
        category: input.category || "Trends",
        tags: input.tags || [input.category || "Trends"],
        keywords: keywordsArray,
        status: input.status || "PUBLISHED",
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : new Date(),
        authorName: input.authorName?.trim() || "IntriHub Team",
        readTimeMinutes,
      },
    });

    revalidatePath("/guides");
    revalidatePath(`/guides/${post.slug}`);
    revalidatePath("/admin/guides");
    revalidatePath("/sitemap.xml");

    return { success: true, post };
  } catch (error: any) {
    console.error("Error creating guide post:", error);
    return { success: false, error: error?.message || "Failed to create guide post" };
  }
}

/**
 * Update an existing Guide Post (Admin Only)
 */
export async function updateGuidePost(id: string, input: Partial<GuidePostInput>) {
  try {
    const auth = await requireAdminAction();
    if (!auth.authorized) {
      return { success: false, error: auth.error || "Unauthorized" };
    }

    const existing = await prisma.guidePost.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Guide post not found." };
    }

    let slug = existing.slug;
    if (input.slug && input.slug.trim() && input.slug !== existing.slug) {
      const candidateSlug = generateSlug(input.slug);
      const conflict = await prisma.guidePost.findFirst({
        where: { slug: candidateSlug, id: { not: id } },
      });
      if (conflict) {
        return { success: false, error: `Slug "${candidateSlug}" is already taken by another post.` };
      }
      slug = candidateSlug;
    }

    const dataToUpdate: any = {};
    if (input.title !== undefined) dataToUpdate.title = input.title.trim();
    if (slug !== existing.slug) dataToUpdate.slug = slug;
    if (input.featuredImage !== undefined) dataToUpdate.featuredImage = input.featuredImage.trim();
    if (input.featuredImageAlt !== undefined) dataToUpdate.featuredImageAlt = input.featuredImageAlt.trim();
    if (input.excerpt !== undefined) dataToUpdate.excerpt = input.excerpt.trim();
    if (input.content !== undefined) {
      dataToUpdate.content = input.content;
      dataToUpdate.readTimeMinutes = input.readTimeMinutes || calculateReadTime(input.content);
    }
    if (input.metaTitle !== undefined) dataToUpdate.metaTitle = input.metaTitle.trim();
    if (input.metaDescription !== undefined) dataToUpdate.metaDescription = input.metaDescription.trim();
    if (input.category !== undefined) dataToUpdate.category = input.category;
    if (input.tags !== undefined) dataToUpdate.tags = input.tags;
    if (input.keywords !== undefined) {
      dataToUpdate.keywords = Array.isArray(input.keywords)
        ? input.keywords
        : typeof input.keywords === "string"
        ? input.keywords.split(",").map((k) => k.trim()).filter(Boolean)
        : [];
    }
    if (input.status !== undefined) dataToUpdate.status = input.status;
    if (input.publishedAt !== undefined) dataToUpdate.publishedAt = new Date(input.publishedAt);
    if (input.authorName !== undefined) dataToUpdate.authorName = input.authorName.trim();
    if (input.readTimeMinutes !== undefined) dataToUpdate.readTimeMinutes = input.readTimeMinutes;

    const post = await prisma.guidePost.update({
      where: { id },
      data: dataToUpdate,
    });

    revalidatePath("/guides");
    revalidatePath(`/guides/${existing.slug}`);
    if (post.slug !== existing.slug) {
      revalidatePath(`/guides/${post.slug}`);
    }
    revalidatePath("/admin/guides");
    revalidatePath("/sitemap.xml");

    return { success: true, post };
  } catch (error: any) {
    console.error("Error updating guide post:", error);
    return { success: false, error: error?.message || "Failed to update guide post" };
  }
}

/**
 * Delete a Guide Post (Admin Only)
 */
export async function deleteGuidePost(id: string) {
  try {
    const auth = await requireAdminAction();
    if (!auth.authorized) {
      return { success: false, error: auth.error || "Unauthorized" };
    }

    const existing = await prisma.guidePost.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Guide post not found." };
    }

    await prisma.guidePost.delete({ where: { id } });

    revalidatePath("/guides");
    revalidatePath(`/guides/${existing.slug}`);
    revalidatePath("/admin/guides");
    revalidatePath("/sitemap.xml");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting guide post:", error);
    return { success: false, error: error?.message || "Failed to delete guide post" };
  }
}
