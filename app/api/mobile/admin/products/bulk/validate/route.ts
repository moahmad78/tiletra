import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

function sanitizeImageUrl(url: any): string {
  if (!url || typeof url !== "string") return "/placeholders/product.svg";
  const trimmed = url.trim();
  if (!trimmed) return "/placeholders/product.svg";
  if (trimmed.startsWith("data:image/")) return trimmed;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return "/placeholders/product.svg";
    }
  }
  if (trimmed.startsWith("uploads/")) return `/${trimmed}`;
  if (trimmed.startsWith("api/")) return `/${trimmed}`;
  return "/placeholders/product.svg";
}

function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseCSVText(csvString: string) {
  const lines = csvString
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return { headers: [], rawHeaders: [], rows: [], error: "CSV must contain a header line and at least 1 product row." };
  }

  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map((h) => h.toLowerCase().replace(/[\s_-]+/g, ""));

  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const rowObj: any = { _rawRowNumber: i + 1, _rawValues: values };

    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] !== undefined ? values[idx] : "";
    });
    rows.push(rowObj);
  }

  return { headers, rawHeaders, rows, error: null };
}

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    let csvText = "";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData: any = await req.formData();
      const file = formData.get("file");
      if (!file) {
        return mobileApiResponse({ success: false, error: "No CSV file provided in upload" }, 400);
      }
      csvText = typeof file.text === "function" ? await file.text() : String(file);
    } else {
      const body = await req.json().catch(() => ({}));
      csvText = body.csvText || body.content || "";
    }

    if (!csvText || !csvText.trim()) {
      return mobileApiResponse({ success: false, error: "CSV content is empty" }, 400);
    }

    const parsed = parseCSVText(csvText);
    if (parsed.error) {
      return mobileApiResponse({ success: false, error: parsed.error, errors: [parsed.error] }, 400);
    }

    const errors: string[] = [];
    const products: any[] = [];

    parsed.rows.forEach((r, idx) => {
      const rowNum = idx + 2;

      const name = r.productname || r.name || "";
      const category = (r.category || r.categoryslug || "tiles-granite")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "");

      const brand = r.brandname || r.brand || "Intrihub Assured";
      const tagline = r.captiontagline || r.caption || r.tagline || "";
      const sellingPrice = parseFloat(r.sellingprice || r.price || r.priceperbox || "0");
      const mrpPrice = parseFloat(r.mrpprice || r.mrp || (sellingPrice * 1.25).toString());
      const stock = parseInt(r.stockqty || r.stock || r.stockboxes || "50", 10);
      const unit = r.unit || r.unitofsale || "piece";
      const material = r.material || "Standard";
      const description = r.description || tagline || name;

      let images: string[] = [];
      const rawImages = r.images || r.imageurls || r.image || "";
      if (rawImages) {
        images = rawImages
          .split(/[|;]+/)
          .map((u: string) => sanitizeImageUrl(u))
          .filter((u: string) => u.length > 0);
      }
      if (images.length === 0) {
        images = ["/placeholders/product.svg"];
      }

      const attributes: { key: string; value: string }[] = [];
      if (brand) attributes.push({ key: "Brand", value: brand });
      if (tagline) attributes.push({ key: "Tagline", value: tagline });
      if (mrpPrice > sellingPrice) attributes.push({ key: "MRP", value: `₹${mrpPrice}` });

      const specsObj: Record<string, any> = {
        brand,
        caption: tagline,
        mrp: mrpPrice,
        unit,
      };

      if (r.dimensionshwd || r.size || r.dimensionslw) {
        const sizeVal = r.dimensionshwd || r.size || r.dimensionslw;
        specsObj.dimensions = sizeVal;
        attributes.push({ key: "Dimensions", value: sizeVal });
      }
      if (r.thicknessmm || r.thickness) {
        const thickVal = r.thicknessmm || r.thickness;
        specsObj.thickness = thickVal;
        attributes.push({ key: "Thickness", value: thickVal });
      }
      if (r.volumelitres || r.volume) {
        const volVal = r.volumelitres || r.volume;
        specsObj.volume = volVal;
        attributes.push({ key: "Volume", value: volVal });
      }
      if (r.wiregaugesqmm || r.wiregauge) {
        const gaugeVal = r.wiregaugesqmm || r.wiregauge;
        specsObj.wireGauge = gaugeVal;
        attributes.push({ key: "Wire Gauge", value: gaugeVal });
      }
      if (r.coillengthm) {
        specsObj.coilLength = r.coillengthm;
        attributes.push({ key: "Coil Length", value: r.coillengthm });
      }
      if (r.grade) {
        specsObj.grade = r.grade;
        attributes.push({ key: "Grade", value: r.grade });
      }
      if (r.finish || r.sheenfinish) {
        const finishVal = r.finish || r.sheenfinish;
        specsObj.finish = finishVal;
        attributes.push({ key: "Finish", value: finishVal });
      }
      if (r.sqftperbox) {
        specsObj.sqftPerBox = parseFloat(r.sqftperbox);
      }

      if (r.specifications) {
        r.specifications.split(";").forEach((pair: string) => {
          const [k, v] = pair.split(":").map((s) => s.trim());
          if (k && v) {
            specsObj[k] = v;
            attributes.push({ key: k, value: v });
          }
        });
      }

      const rowErrors: string[] = [];
      if (!name) rowErrors.push("Product Name is missing");
      if (isNaN(sellingPrice) || sellingPrice <= 0) rowErrors.push("Valid Selling Price is required");
      if (isNaN(stock) || stock < 0) rowErrors.push("Stock must be a non-negative number");

      if (rowErrors.length > 0) {
        errors.push(`Row ${rowNum}: ${rowErrors.join(", ")}`);
      } else {
        const productPayload = {
          name,
          categorySlug: category === "all" ? "tiles-granite" : category,
          categoryName: category.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
          material,
          unitOfSale: unit.toLowerCase(),
          description,
          images,
          attributes,
          specs: specsObj,
          isBestseller: false,
          isNew: true,
          isTrending: false,
          variants: [
            {
              size: specsObj.dimensions || specsObj.size || "Standard",
              finish: specsObj.finish || "Standard",
              color: "Standard",
              pricePerBox: sellingPrice,
              pricePerSqft: specsObj.sqftPerBox ? +(sellingPrice / specsObj.sqftPerBox).toFixed(2) : sellingPrice,
              sqftPerBox: specsObj.sqftPerBox || 1,
              stockBoxes: stock,
            },
          ],
        };
        products.push(productPayload);
      }
    });

    return mobileApiResponse({
      success: errors.length === 0,
      totalRows: parsed.rows.length,
      validRows: products.length,
      invalidRows: errors.length,
      errors,
      preview: products,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Bulk Validate Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to validate CSV" },
      500
    );
  }
}
