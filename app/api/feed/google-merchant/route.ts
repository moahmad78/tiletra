import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BASE_SITE_URL, getCanonicalUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        approvalStatus: "approved",
        status: "active",
      },
      include: {
        category: {
          select: { name: true, slug: true },
        },
        variants: {
          select: { pricePerBox: true, pricePerSqft: true, stockBoxes: true, inStock: true },
        },
      },
      take: 5000,
    });

    const escapeXml = (unsafe: string) =>
      unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const itemsXml = products
      .map((p) => {
        const productUrl = getCanonicalUrl(`/product/${p.slug}`);
        const minPrice = p.variants?.length
          ? Math.min(...p.variants.map((v) => v.pricePerBox || v.pricePerSqft || 0))
          : (p.pricePerSqft || 0);

        let primaryImage = `${BASE_SITE_URL}/placeholders/product.svg`;
        if (p.images && p.images.length > 0) {
          primaryImage = p.images[0].startsWith("http")
            ? p.images[0]
            : `${BASE_SITE_URL}${p.images[0].startsWith("/") ? p.images[0] : `/${p.images[0]}`}`;
        }

        const isAvailable = p.inStock && (p.variants?.some((v) => v.stockBoxes > 0) ?? true);
        const availability = isAvailable ? "in stock" : "out of stock";
        const brand = "Intrihub";
        const categoryName = p.category?.name || "Interior & Construction";
        const cleanDescription = (p.description || `${p.name} on Intrihub marketplace. High quality interior & construction materials.`)
          .slice(0, 5000)
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

        return `
    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${cleanDescription}]]></g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(primaryImage)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${minPrice.toFixed(2)} INR</g:price>
      <g:condition>new</g:condition>
      <g:brand><![CDATA[${brand}]]></g:brand>
      <g:product_type><![CDATA[${categoryName}]]></g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`;
      })
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Intrihub Product Feed</title>
    <link>${BASE_SITE_URL}</link>
    <description>Intrihub - Everything for Every Space. Interior and Construction Supplies Marketplace</description>
    ${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Error generating Google Merchant XML feed:", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>Intrihub</title></channel></rss>`,
      {
        headers: { "Content-Type": "application/xml" },
        status: 500,
      }
    );
  }
}
