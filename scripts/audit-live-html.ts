import * as fs from "fs";

async function fetchPageInfo(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
    });
    if (!res.ok) {
      return { url, status: res.status, error: res.statusText };
    }
    const html = await res.text();

    const titleMatches = [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map((m) =>
      m[1].trim()
    );
    const ogTitle =
      html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([\s\S]*?)["']/i)?.[1] ||
      html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*property=["']og:title["']/i)?.[1] ||
      "";
    const twTitle =
      html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([\s\S]*?)["']/i)?.[1] ||
      html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']twitter:title["']/i)?.[1] ||
      "";

    // Also look for any json-ld schema containing name or headline
    const jsonLdMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);

    return {
      url,
      status: res.status,
      titleTagsCount: titleMatches.length,
      renderedTitles: titleMatches,
      ogTitle,
      twTitle,
      htmlSnippet: titleMatches.join(" | "),
      hasWholesaler: /wholesaler/i.test(html),
      jsonLdCount: jsonLdMatches.length,
    };
  } catch (err: any) {
    return { url, error: err.message };
  }
}

async function main() {
  const sampleUrls = [
    "https://www.intrihub.com/",
    "https://www.intrihub.com/about",
    "https://www.intrihub.com/contact",
    "https://www.intrihub.com/areas",
    "https://www.intrihub.com/for-interior-designers",
    "https://www.intrihub.com/product/m-sand-50-kg-bag-1742",
    "https://www.intrihub.com/shop/hardware",
    "https://www.intrihub.com/shop/plumbing-sanitary",
    "https://www.intrihub.com/shop/tiles-stone/sarjapur-road",
    "https://www.intrihub.com/cement-price-in-bangalore",
    "https://www.intrihub.com/plywood-price-per-sheet-bangalore",
    "https://www.intrihub.com/vitrified-tiles-price-in-bangalore",
    "https://www.intrihub.com/interior-material-supplier-bangalore",
    "https://www.intrihub.com/best-interior-material-electronic-city",
    "https://www.intrihub.com/building-materials-online",
    "https://www.intrihub.com/factory-direct-pricing",
  ];

  console.log("Fetching live production pages from https://www.intrihub.com...\n");
  for (const u of sampleUrls) {
    const info = await fetchPageInfo(u);
    console.log(JSON.stringify(info, null, 2));
  }
}

main();
