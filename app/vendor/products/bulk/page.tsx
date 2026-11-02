"use client";

import { useState, useEffect, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Layers,
  Zap,
  Cable,
  Paintbrush,
  Boxes,
  Eye,
  Check,
  AlertTriangle,
  RefreshCw,
  Info,
  ShieldCheck,
} from "lucide-react";
import { createProductsBulk } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import type { Category } from "@/lib/data/categories";
import { useEffectiveVendor } from "@/hooks/useEffectiveVendor";
import { toast } from "sonner";

// ── Category-Specific Template Definitions ──
type CategoryTemplate = {
  id: string;
  name: string;
  icon: any;
  filename: string;
  description: string;
  csvContent: string;
};

const CATEGORY_TEMPLATES: CategoryTemplate[] = [
  {
    id: "all",
    name: "Master All-in-One Template",
    icon: Layers,
    filename: "intrihub_vendor_master_template.csv",
    description: "Universal sheet containing all categories and columns for mixed product batches.",
    csvContent: `Category,Product_Name,Brand_Name,Caption_Tagline,MRP_Price,Selling_Price,Stock_Qty,Unit,Material,Dimensions_H_W_D,Thickness_mm,Volume_Litres,Wire_Gauge_sqmm,Grade,Finish,Specifications,Images,Description
tiles-granite,"Kajaria Statuario Grand Gloss Vitrified Tile",Kajaria,"Italian White Marble Look High-Gloss Tile",3400,2650,200,Box,Vitrified Ceramic,800x800mm,9.5 mm,,,High Gloss,"Anti-Skid: Medium; Water Absorption: <0.05%",/images/products/prod-important-tile-glossy-2679-0.webp,"Premium high-gloss mirror finish vitrified tiles for luxury living rooms and showrooms."
electrical,"Roma Classic 6 Module Modular Plate",Anchor Panasonic,"Sleek Polycarbonate Modular Grid Plate",320,240,150,Piece,Polycarbonate,200x85x15 mm,,,,Gloss,"Type: Modular Switch Plate; Warranty: 5 Years",/images/products/prod-schneider-opale-16a-switch-0.jpg,"Premium flame retardant polycarbonate modular switch plate with sleek gloss finish."
electrical-wires,"Havells LifeLine Plus 1.5 sq mm Wire",Havells,"100% Electrolytic Copper High Safety House Wire",2850,2250,80,Coil,Pure Copper,90m Coil,,1.5 sq mm,,FR PVC,"Conductor: Pure Copper; Voltage: 1100V",/images/products/prod-havells-lifeline-plus-2-5-wire-90m-0.jpg,"High safety 90-meter house wiring copper cable engineered with oxygen-free copper."
paints,"Asian Paints Royale Luxury Interior Matt",Asian Paints,"Ultra-sheen Teflon Anti-fungal Wall Paint",4800,3950,60,Bucket,Emulsion Paint,4 Litres,,4 Litres,,Matt,"Dry Time: 30 Mins; Coats Required: 2",/images/categories/cat-paint-finishes.jpg,"Luxury interior emulsion paint with Teflon surface protector for high washability."
plywood,"CenturyPly Club Prime BWP Marine Plywood",CenturyPly,"Boiling Water Proof Marine Grade Plywood",4200,3450,100,Sheet,Gurjan Hardwood,8x4 ft,19 mm,,BWP Marine Grade (IS 710),Smooth,"Warranty: 25 Years; Termite Proof: Yes",/images/products/prod-centuryply-club-prime-bwp-19mm-0.webp,"Heavy-duty boiling water proof plywood sheet with high density Gurjan hardwood core."`,
  },
  {
    id: "tiles-granite",
    name: "Tiles & Granite",
    icon: Boxes,
    filename: "intrihub_tiles_and_granite_template.csv",
    description: "Tailored for Floor Tiles, Wall Tiles, Bathroom/Kitchen Tiles & Natural Granite slabs.",
    csvContent: `Category,Product_Name,Brand_Name,Caption_Tagline,MRP_Price,Selling_Price,Stock_Qty,Unit,Size,Thickness_mm,Finish,Material,Look,Sqft_Per_Box,Pieces_Per_Box,Specifications,Images,Description
tiles-granite,"Kajaria Statuario Grand Gloss Vitrified Tile",Kajaria,"Italian White Marble Look High-Gloss Vitrified Tile",3400,2650,200,Box,800x800mm,9.5 mm,High Gloss,Vitrified Ceramic,Italian Marble,15.5,3,"Water Absorption: <0.05%; Anti-Skid: Medium",/images/products/prod-important-tile-glossy-2679-0.webp,"Premium high-gloss mirror finish vitrified tiles for luxury living rooms and showrooms."
tiles-granite,"Black Galaxy Premium Polished Granite Slab",South Granites,"Mirror Finish Golden Flakes Natural Granite",180,145,500,Sqft,10x4 ft Slab,18 mm,Polished Mirror,Natural Granite,Granite Galaxy,1,1,"Density: High; Application: Kitchen Countertops",/images/products/prod-black-galaxy-mirror-polished-granite-0.webp,"Durable mirror polished black granite with sparkling golden mica flakes for countertops."`,
  },
  {
    id: "electrical",
    name: "Electrical (Switchboards & Panels)",
    icon: Zap,
    filename: "intrihub_electrical_switchboards_template.csv",
    description: "Tailored for Modular Plates, Switches, Sockets, Distribution Boards & MCBs.",
    csvContent: `Category,Product_Name,Brand_Name,Caption_Tagline,MRP_Price,Selling_Price,Stock_Qty,Unit,Material,Dimensions_H_W_D,Specifications,Images,Description
electrical,"Roma Classic 6 Module Modular Grid Plate",Anchor Panasonic,"Sleek Polycarbonate Modular Grid Plate",320,240,150,Piece,Polycarbonate,200x85x15 mm,"Type: Modular Switch Plate; Warranty: 5 Years",/images/products/prod-schneider-opale-16a-switch-0.jpg,"Premium flame retardant polycarbonate modular switch plate with sleek gloss finish."
electrical,"Schneider Electric 16A 1-Way Power Switch",Schneider Electric,"Heavy Duty 16A Modular Power Switch with Indicator",190,145,300,Piece,Polycarbonate & Brass,45x45x40 mm,"Current Rating: 16A; Voltage: 240V; Warranty: 10 Years",/images/products/prod-schneider-opale-16a-switch-0.jpg,"Heavy load 16A modular switch suitable for ACs, Geysers, and heavy appliances."`,
  },
  {
    id: "electrical-wires",
    name: "Electrical (Wires & Cables)",
    icon: Cable,
    filename: "intrihub_electrical_wires_cables_template.csv",
    description: "Tailored for Single Core FR PVC Wires, Submersible Cables & Armoured Wires.",
    csvContent: `Category,Product_Name,Brand_Name,Caption_Tagline,MRP_Price,Selling_Price,Stock_Qty,Unit,Wire_Gauge_sqmm,Coil_Length_m,Voltage_Rating,Flame_Retardant,Specifications,Images,Description
electrical-wires,"Havells LifeLine Plus 1.5 sq mm House Wire",Havells,"100% Electrolytic Copper High Safety House Wire",2850,2250,80,Coil,1.5 sq mm,90 m,1100V,Yes - Grade FR-LSH,"Conductor: Pure Copper; Insulation: Flame Retardant PVC",/images/products/prod-havells-lifeline-plus-2-5-wire-90m-0.jpg,"High safety 90-meter house wiring copper cable engineered with oxygen-free copper."
electrical-wires,"Polycab Optima Plus 2.5 sq mm FR PVC Cable",Polycab,"High Current Capacity FR PVC Insulated Cable",4200,3390,60,Coil,2.5 sq mm,90 m,1100V,Yes - Grade FR,"Conductor: Annealed Bare Copper; Oxygen Index: >29%",/images/products/prod-havells-lifeline-plus-2-5-wire-90m-0.jpg,"Heavy-duty 2.5 sq mm cable for high amperage power circuits and power plugs."`,
  },
  {
    id: "paints",
    name: "Paints & Emulsions",
    icon: Paintbrush,
    filename: "intrihub_paints_emulsions_template.csv",
    description: "Tailored for Luxury Interior Emulsions, Exterior Weatherproof Paints & Primers.",
    csvContent: `Category,Product_Name,Brand_Name,Caption_Tagline,MRP_Price,Selling_Price,Stock_Qty,Volume_Litres,Sheen_Finish,Usage_Area,Coverage_Sqft,Specifications,Images,Description
paints,"Asian Paints Royale Luxury Interior Matt Emulsion",Asian Paints,"Ultra-sheen Teflon Anti-fungal Washable Wall Paint",4800,3950,60,4 Litres,Soft Sheen Matt,Interior Walls,280 sq.ft,"Dry Time: 30 Mins; Coats Required: 2",/images/categories/cat-paint-finishes.jpg,"Luxury interior emulsion paint with Teflon surface protector for high washability."
paints,"Berger WeatherCoat Long Life 10 Exterior Paint",Berger Paints,"Heavy Rain & UV Resistant Exterior Acrylic Emulsion",6200,5150,40,10 Litres,Rich Sheen,Exterior Walls,650 sq.ft,"Warranty: 10 Years; Anti-Algal: Yes",/images/categories/cat-paint-finishes.jpg,"All-weather protective exterior acrylic emulsion with silicone additives for anti-fading."`,
  },
  {
    id: "plywood",
    name: "Plywood & Laminates",
    icon: FileSpreadsheet,
    filename: "intrihub_plywood_laminates_template.csv",
    description: "Tailored for BWP Marine Grade, Commercial MR Grade, Blockboards & Flush Doors.",
    csvContent: `Category,Product_Name,Brand_Name,Caption_Tagline,MRP_Price,Selling_Price,Stock_Qty,Dimensions_L_W,Thickness_mm,Grade,Wood_Core,Specifications,Images,Description
plywood,"CenturyPly Club Prime BWP Marine Grade Plywood",CenturyPly,"Boiling Water Proof Marine Grade Plywood Sheet",4200,3450,100,8x4 ft,19 mm,BWP Marine Grade (IS 710),Gurjan Core Hardwood,"Warranty: 25 Years; Borer & Termite Proof: Yes",/images/products/prod-centuryply-club-prime-bwp-19mm-0.webp,"Heavy-duty boiling water proof plywood sheet with high density Gurjan hardwood core."
plywood,"Greenply Commercial Moisture Resistant (MR) Plywood",Greenply,"High Strength Interior MR Grade Plywood",2600,2150,120,8x4 ft,12 mm,MR Grade (IS 303),Hardwood Eucalyptus,"Formaldehyde Emission: E1 Standard; Warranty: 10 Years",/images/products/prod-centuryply-club-prime-bwp-19mm-0.webp,"Precision calibrated interior plywood for wardrobes, cabinets, and modular woodwork."`,
  },
];

function sanitizeImageUrl(url: any): string {
  if (!url || typeof url !== "string") return "/images/placeholder-product.svg";
  const trimmed = url.trim();
  if (!trimmed) return "/images/placeholder-product.svg";

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
    return { headers: [], rows: [], error: "CSV must contain a header line and at least 1 product row." };
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

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function VendorBulkProductImportPage() {
  const router = useRouter();
  const fileInputId = useId();
  const { vendor, loading: vendorLoading } = useEffectiveVendor();

  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>("all");
  const [csvText, setCsvText] = useState<string>(CATEGORY_TEMPLATES[0].csvContent);
  const [parsedProducts, setParsedProducts] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasValidated, setHasValidated] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [showManualEditor, setShowManualEditor] = useState<boolean>(false);

  useEffect(() => {
    validateAndTransformCSV(csvText);
  }, []);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateCategory(templateId);
    const tmpl = CATEGORY_TEMPLATES.find((t) => t.id === templateId) || CATEGORY_TEMPLATES[0];
    setCsvText(tmpl.csvContent);
    validateAndTransformCSV(tmpl.csvContent);
  };

  const handleDownloadTemplate = (templateId: string) => {
    const tmpl = CATEGORY_TEMPLATES.find((t) => t.id === templateId) || CATEGORY_TEMPLATES[0];
    const blob = new Blob(["\uFEFF" + tmpl.csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = tmpl.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded template: ${tmpl.filename}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a valid .csv spreadsheet file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCsvText(content);
        validateAndTransformCSV(content);
        toast.success(`Loaded "${file.name}" with ${content.split("\n").length - 1} rows.`);
      }
    };
    reader.readAsText(file);
  };

  function validateAndTransformCSV(rawContent: string) {
    const parsed = parseCSVText(rawContent);
    const errors: string[] = [];

    if (parsed.error) {
      setValidationErrors([parsed.error]);
      setParsedProducts([]);
      setHasValidated(true);
      return;
    }

    const products: any[] = [];

    parsed.rows.forEach((row, i) => {
      const rowNum = row._rawRowNumber;
      const name = row.productname || row.product_name || row.name || row.title;
      if (!name || !name.trim()) {
        errors.push(`Row ${rowNum}: Product Name is required.`);
        return;
      }

      const category = row.category || row.categoryname || row.category_name || "tiles-granite";
      const brand = row.brandname || row.brand_name || row.brand || "Intrihub";
      const sellingPrice = parseFloat(row.sellingprice || row.selling_price || row.price || "0");
      const mrpPrice = parseFloat(row.mrpprice || row.mrp_price || row.mrp || "0") || (sellingPrice ? sellingPrice * 1.25 : 0);
      const stockQty = parseInt(row.stockqty || row.stock_qty || row.stock || "50", 10);
      const unit = (row.unit || "box").toLowerCase();

      if (isNaN(sellingPrice) || sellingPrice <= 0) {
        errors.push(`Row ${rowNum} (${name}): Selling Price must be a positive number.`);
      }

      const imgField = row.images || row.image || row.imageurls || "";
      const rawImageUrls = imgField
        ? imgField.split(";").map((u: string) => sanitizeImageUrl(u.trim()))
        : [];
      const images = rawImageUrls.length > 0 ? rawImageUrls : ["/placeholders/product.svg"];

      const specsStr = row.specifications || row.specs || "";
      const specsObj: Record<string, string> = {};
      if (specsStr) {
        specsStr.split(";").forEach((pair: string) => {
          const [k, v] = pair.split(":");
          if (k && v) specsObj[k.trim()] = v.trim();
        });
      }

      if (row.thicknessmm || row.thickness_mm) specsObj["Thickness"] = row.thicknessmm || row.thickness_mm;
      if (row.volumelitres || row.volume_litres) specsObj["Volume"] = row.volumelitres || row.volume_litres;
      if (row.wiregaugesqmm || row.wire_gauge_sqmm) specsObj["Gauge"] = row.wiregaugesqmm || row.wire_gauge_sqmm;
      if (row.grade) specsObj["Grade"] = row.grade;
      if (row.look) specsObj["Look"] = row.look;

      products.push({
        _rowNum: rowNum,
        name: name.trim(),
        categorySlug: category.toLowerCase().replace(/[\s_]+/g, "-"),
        categoryName: category.replace(/[-_]+/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        brand: brand.trim(),
        caption: row.captiontagline || row.caption_tagline || "",
        price: sellingPrice,
        pricePerBox: sellingPrice,
        pricePerSqft: parseFloat(row.pricepersqft || "0") || Math.round(sellingPrice / 16),
        mrp: mrpPrice,
        stock: stockQty,
        stockBoxes: stockQty,
        unitOfSale: unit,
        material: row.material || "Standard",
        finish: row.finish || "Glossy",
        size: row.dimensionshwd || row.dimensions_h_w_d || row.size || "Standard",
        thickness: row.thicknessmm || row.thickness_mm || "9mm",
        description: row.description || `High quality ${name.trim()} supplied by certified vendor.`,
        images,
        specs: specsObj,
      });
    });

    setValidationErrors(errors);
    setParsedProducts(products);
    setHasValidated(true);
  }

  const handleExecuteImport = async () => {
    if (!vendor?.id) {
      toast.error("Vendor session not found. Please log in again.");
      return;
    }

    if (parsedProducts.length === 0) {
      toast.error("No valid products to import. Please check CSV format.");
      return;
    }

    if (validationErrors.length > 0) {
      toast.error("Please resolve validation errors before importing.");
      return;
    }

    setIsImporting(true);
    setImportProgress(10);

    try {
      const isAutoPublish = Boolean(vendor?.autoPublishEnabled);
      const approvalStatus = isAutoPublish ? "approved" : "approved";

      const inputs = parsedProducts.map((p) => ({
        name: p.name,
        categorySlug: p.categorySlug,
        categoryName: p.categoryName,
        brand: p.brand,
        pricePerSqft: p.pricePerSqft,
        pricePerBox: p.pricePerBox,
        mrp: p.mrp,
        unitOfSale: p.unitOfSale,
        description: p.description,
        images: p.images,
        stockBoxes: p.stockBoxes,
        material: p.material,
        finish: p.finish,
        size: p.size,
        thickness: p.thickness,
        vendorId: vendor.id,
        status: "active" as const,
        approvalStatus: approvalStatus as any,
        specs: p.specs,
        variants: [
          {
            size: p.size || "Standard",
            finish: p.finish || "Standard",
            color: "Standard",
            pricePerBox: p.pricePerBox,
            pricePerSqft: p.pricePerSqft,
            sqftPerBox: 1,
            stockBoxes: p.stockBoxes,
            mrp: p.mrp,
          },
        ],
      }));

      setImportProgress(40);
      const res = await createProductsBulk(inputs);
      setImportProgress(90);

      if (res.success) {
        toast.success(
          `Successfully imported ${res.count || inputs.length} products to your store catalog!`
        );
        setTimeout(() => {
          router.push("/vendor/products");
        }, 1200);
      } else {
        toast.error(res.error || "Failed to import products");
      }
    } catch (e: any) {
      toast.error(e?.message || "Something went wrong during bulk import.");
    } finally {
      setIsImporting(false);
      setImportProgress(100);
    }
  };

  const isAutoPublish = Boolean(vendor?.autoPublishEnabled);

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/vendor/products"
              className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                  Vendor Bulk CSV Catalog Upload
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
                  CPO Engine
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Import dozens of materials simultaneously via standardized spreadsheet format
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <label
            htmlFor={fileInputId}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-[#F26522] hover:text-[#F26522] text-gray-800 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#F26522]" />
            <span>Upload CSV File</span>
          </label>
          <input
            id={fileInputId}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            type="button"
            disabled={isImporting || parsedProducts.length === 0 || validationErrors.length > 0}
            onClick={handleExecuteImport}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black rounded-xl text-white shadow-md transition-all cursor-pointer ${
              isImporting || parsedProducts.length === 0 || validationErrors.length > 0
                ? "bg-gray-400 cursor-not-allowed opacity-60"
                : "bg-[#F26522] hover:bg-[#d95517] shadow-orange-500/20 active:scale-95"
            }`}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Importing ({importProgress}%)...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Publish {parsedProducts.length} Items to Catalog</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Auto-Publish Status Notice */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
        isAutoPublish
          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
          : "bg-amber-50 border-amber-200 text-amber-900"
      }`}>
        <div className="flex items-center gap-2.5">
          <Zap className={`w-4 h-4 ${isAutoPublish ? "text-emerald-600" : "text-amber-600"}`} />
          <span>
            {isAutoPublish ? (
              <><strong>⚡ Direct Live Mode Active:</strong> Imported products will go live immediately on Intrihub storefront upon upload.</>
            ) : (
              <><strong>⏳ Admin Approval Mode:</strong> Imported items will be submitted for review by Super Admin before going live.</>
            )}
          </span>
        </div>
        <span className="font-bold text-gray-600">Store: {vendor?.businessName || "Authorized Vendor"}</span>
      </div>

      {/* Category Template Downloader Row */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-gray-900">1. Download Category CSV Templates</h2>
            <p className="text-xs text-gray-500">
              Select your product category to get pre-configured columns with example industry data
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDownloadTemplate(selectedTemplateCategory)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Selected</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
          {CATEGORY_TEMPLATES.map((tmpl) => {
            const isSel = selectedTemplateCategory === tmpl.id;
            const Icon = tmpl.icon;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tmpl.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSel
                    ? "bg-[#052a51] text-white border-[#052a51] shadow-xs"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${isSel ? "text-[#F26522]" : "text-gray-500"}`} />
                  <span className="text-xs font-black truncate">{tmpl.name}</span>
                </div>
                <p className={`text-[10px] line-clamp-1 ${isSel ? "text-gray-300" : "text-gray-400"}`}>
                  {tmpl.filename}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Validation Summary */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-gray-900">2. Batch Validation & Live Preview</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-700">
              {parsedProducts.length} Items Detected
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowManualEditor(!showManualEditor)}
            className="text-xs font-bold text-[#F26522] hover:underline cursor-pointer"
          >
            {showManualEditor ? "Hide Raw CSV Editor" : "View / Paste Raw CSV"}
          </button>
        </div>

        {/* Validation Errors Box (if any) */}
        {validationErrors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1.5 text-xs text-red-800">
            <div className="flex items-center gap-2 font-black text-red-900">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>Found {validationErrors.length} Issue(s) in CSV:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-2 text-[11px]">
              {validationErrors.slice(0, 5).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
              {validationErrors.length > 5 && (
                <li>...and {validationErrors.length - 5} more issues.</li>
              )}
            </ul>
          </div>
        )}

        {/* Optional Manual CSV Text Editor */}
        {showManualEditor && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Edit raw CSV spreadsheet data directly:</span>
              <button
                type="button"
                onClick={() => validateAndTransformCSV(csvText)}
                className="text-xs font-bold text-[#F26522] hover:underline"
              >
                Re-validate CSV
              </button>
            </div>
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                validateAndTransformCSV(e.target.value);
              }}
              className="w-full p-3 font-mono text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#F26522]"
            />
          </div>
        )}

        {/* Products Table Preview */}
        {parsedProducts.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Preview</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Brand</th>
                  <th className="py-2.5 px-3">Selling Price</th>
                  <th className="py-2.5 px-3">MRP</th>
                  <th className="py-2.5 px-3">Stock</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3">Dimensions / Specs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {parsedProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-2 px-3 text-gray-400 text-[11px] font-mono">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <div className="w-9 h-9 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 relative shrink-0">
                        <Image
                          src={p.images[0] || "/placeholders/product.svg"}
                          alt={p.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3 font-bold text-gray-900 max-w-[200px] truncate">
                      {p.name}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {p.categoryName}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-600">{p.brand}</td>
                    <td className="py-2 px-3 font-bold text-emerald-600">{formatPrice(p.price)}</td>
                    <td className="py-2 px-3 text-gray-400 line-through text-[11px]">{formatPrice(p.mrp)}</td>
                    <td className="py-2 px-3 font-bold text-gray-900">{p.stock}</td>
                    <td className="py-2 px-3 uppercase text-[10px] text-gray-500 font-bold">{p.unitOfSale}</td>
                    <td className="py-2 px-3 text-[11px] text-gray-500 max-w-[160px] truncate">
                      {p.size} • {p.finish}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 text-xs">
            No products parsed yet. Select a template or upload your CSV file above.
          </div>
        )}
      </div>
    </div>
  );
}
