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
  Sparkles,
  Info,
} from "lucide-react";
import { createProductsBulk } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import type { Category } from "@/lib/data/categories";
import { toast } from "sonner";
import { broadcastLiveEvent } from "@/lib/live-sync";

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
    filename: "intrihub_all_categories_master_template.csv",
    description: "Universal sheet containing all categories and columns for mixed product batches.",
    csvContent: `Category,Product_Name,Brand_Name,Caption_Tagline,MRP_Price,Selling_Price,Stock_Qty,Unit,Material,Dimensions_H_W_D,Thickness_mm,Volume_Litres,Wire_Gauge_sqmm,Grade,Finish,Specifications,Images,Description
tiles-granite,"Kajaria Statuario Grand Gloss Vitrified Tile",Kajaria,"Italian White Marble Look High-Gloss Tile",3400,2650,200,Box,Vitrified Ceramic,800x800mm,9.5 mm,,,High Gloss,"Anti-Skid: Medium; Water Absorption: <0.05%",https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800,"Premium high-gloss mirror finish vitrified tiles for luxury living rooms and showrooms."
electrical,"Roma Classic 6 Module Modular Plate",Anchor Panasonic,"Sleek Polycarbonate Modular Grid Plate",320,240,150,Piece,Polycarbonate,200x85x15 mm,,,,Gloss,"Type: Modular Switch Plate; Warranty: 5 Years",https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800,"Premium flame retardant polycarbonate modular switch plate with sleek gloss finish."
electrical-wires,"Havells LifeLine Plus 1.5 sq mm Wire",Havells,"100% Electrolytic Copper High Safety House Wire",2850,2250,80,Coil,Pure Copper,90m Coil,,1.5 sq mm,,FR PVC,"Conductor: Pure Copper; Voltage: 1100V",https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=800,"High safety 90-meter house wiring copper cable engineered with oxygen-free copper."
paints,"Asian Paints Royale Luxury Interior Matt",Asian Paints,"Ultra-sheen Teflon Anti-fungal Wall Paint",4800,3950,60,Bucket,Emulsion Paint,4 Litres,,4 Litres,,Matt,"Dry Time: 30 Mins; Coats Required: 2",https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800,"Luxury interior emulsion paint with Teflon surface protector for high washability."
plywood,"CenturyPly Club Prime BWP Marine Plywood",CenturyPly,"Boiling Water Proof Marine Grade Plywood",4200,3450,100,Sheet,Gurjan Hardwood,8x4 ft,19 mm,,BWP Marine Grade (IS 710),Smooth,"Warranty: 25 Years; Termite Proof: Yes",https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800,"Heavy-duty boiling water proof plywood sheet with high density Gurjan hardwood core."`,
  },
  {
    id: "tiles-granite",
    name: "Tiles & Granite",
    icon: Boxes,
    filename: "intrihub_tiles_and_granite_template.csv",
    description: "Tailored for Floor Tiles, Wall Tiles, Bathroom/Kitchen Tiles & Natural Granite slabs.",
    csvContent: `Category,Product_Name,Brand_Name,Caption_Tagline,MRP_Price,Selling_Price,Stock_Qty,Unit,Size,Thickness_mm,Finish,Material,Look,Sqft_Per_Box,Pieces_Per_Box,Specifications,Images,Description
tiles-granite,"Kajaria Statuario Grand Gloss Vitrified Tile",Kajaria,"Italian White Marble Look High-Gloss Vitrified Tile",3400,2650,200,Box,800x800mm,9.5 mm,High Gloss,Vitrified Ceramic,Italian Marble,15.5,3,"Water Absorption: <0.05%; Anti-Skid: Medium",https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800,"Premium high-gloss mirror finish vitrified tiles for luxury living rooms and showrooms."
tiles-granite,"Black Galaxy Premium Polished Granite Slab",South Granites,"Mirror Finish Golden Flakes Natural Granite",180,145,500,Sqft,10x4 ft Slab,18 mm,Polished Mirror,Natural Granite,Granite Galaxy,1,1,"Density: High; Application: Kitchen Countertops",https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800,"Durable mirror polished black granite with sparkling golden mica flakes for countertops."`,
  },
  {
    id: "electrical",
    name: "Electrical (Switchboards & Panels)",
    icon: Zap,
    filename: "intrihub_electrical_switchboards_template.csv",
    description: "Tailored for Modular Plates, Switches, Sockets, Distribution Boards & MCBs.",
    csvContent: `Category,Product_Name,Brand_Name,Caption_Tagline,MRP_Price,Selling_Price,Stock_Qty,Unit,Material,Dimensions_H_W_D,Specifications,Images,Description
electrical,"Roma Classic 6 Module Modular Grid Plate",Anchor Panasonic,"Sleek Polycarbonate Modular Grid Plate",320,240,150,Piece,Polycarbonate,200x85x15 mm,"Type: Modular Switch Plate; Warranty: 5 Years",https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800,"Premium flame retardant polycarbonate modular switch plate with sleek gloss finish."
electrical,"Schneider Electric 16A 1-Way Power Switch",Schneider Electric,"Heavy Duty 16A Modular Power Switch with Indicator",190,145,300,Piece,Polycarbonate & Brass,45x45x40 mm,"Current Rating: 16A; Voltage: 240V; Warranty: 10 Years",https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800,"Heavy load 16A modular switch suitable for ACs, Geysers, and heavy appliances."`,
  },
  {
    id: "electrical-wires",
    name: "Electrical (Wires & Cables)",
    icon: Cable,
    filename: "intrihub_electrical_wires_cables_template.csv",
    description: "Tailored for Single Core FR PVC Wires, Submersible Cables & Armoured Wires.",
    csvContent: `Category,Product_Name,Brand_Name,Caption_Tagline,MRP_Price,Selling_Price,Stock_Qty,Unit,Wire_Gauge_sqmm,Coil_Length_m,Voltage_Rating,Flame_Retardant,Specifications,Images,Description
electrical-wires,"Havells LifeLine Plus 1.5 sq mm House Wire",Havells,"100% Electrolytic Copper High Safety House Wire",2850,2250,80,Coil,1.5 sq mm,90 m,1100V,Yes - Grade FR-LSH,"Conductor: Pure Copper; Insulation: Flame Retardant PVC",https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=800,"High safety 90-meter house wiring copper cable engineered with oxygen-free copper."
electrical-wires,"Polycab Optima Plus 2.5 sq mm FR PVC Cable",Polycab,"High Current Capacity FR PVC Insulated Cable",4200,3390,60,Coil,2.5 sq mm,90 m,1100V,Yes - Grade FR,"Conductor: Annealed Bare Copper; Oxygen Index: >29%",https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=800,"Heavy-duty 2.5 sq mm cable for high amperage power circuits and power plugs."`,
  },
  {
    id: "paints",
    name: "Paints & Emulsions",
    icon: Paintbrush,
    filename: "intrihub_paints_emulsions_template.csv",
    description: "Tailored for Luxury Interior Emulsions, Exterior Weatherproof Paints & Primers.",
    csvContent: `Category,Product_Name,Brand_Name,Caption_Tagline,MRP_Price,Selling_Price,Stock_Qty,Volume_Litres,Sheen_Finish,Usage_Area,Coverage_Sqft,Specifications,Images,Description
paints,"Asian Paints Royale Luxury Interior Matt Emulsion",Asian Paints,"Ultra-sheen Teflon Anti-fungal Washable Wall Paint",4800,3950,60,4 Litres,Soft Sheen Matt,Interior Walls,280 sq.ft,"Dry Time: 30 Mins; Coats Required: 2",https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800,"Luxury interior emulsion paint with Teflon surface protector for high washability."
paints,"Berger WeatherCoat Long Life 10 Exterior Paint",Berger Paints,"Heavy Rain & UV Resistant Exterior Acrylic Emulsion",6200,5150,40,10 Litres,Rich Sheen,Exterior Walls,650 sq.ft,"Warranty: 10 Years; Anti-Algal: Yes",https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800,"All-weather protective exterior acrylic emulsion with silicone additives for anti-fading."`,
  },
  {
    id: "plywood",
    name: "Plywood & Laminates",
    icon: FileSpreadsheet,
    filename: "intrihub_plywood_laminates_template.csv",
    description: "Tailored for BWP Marine Grade, Commercial MR Grade, Blockboards & Flush Doors.",
    csvContent: `Category,Product_Name,Brand_Name,Caption_Tagline,MRP_Price,Selling_Price,Stock_Qty,Dimensions_L_W,Thickness_mm,Grade,Wood_Core,Specifications,Images,Description
plywood,"CenturyPly Club Prime BWP Marine Grade Plywood",CenturyPly,"Boiling Water Proof Marine Grade Plywood Sheet",4200,3450,100,8x4 ft,19 mm,BWP Marine Grade (IS 710),Gurjan Core Hardwood,"Warranty: 25 Years; Borer & Termite Proof: Yes",https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800,"Heavy-duty boiling water proof plywood sheet with high density Gurjan hardwood core."
plywood,"Greenply Commercial Moisture Resistant (MR) Plywood",Greenply,"High Strength Interior MR Grade Plywood",2600,2150,120,8x4 ft,12 mm,MR Grade (IS 303),Hardwood Eucalyptus,"Formaldehyde Emission: E1 Standard; Warranty: 10 Years",https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800,"Precision calibrated interior plywood for wardrobes, cabinets, and modular woodwork."`,
  },
];

function sanitizeImageUrl(url: any): string {
  if (!url || typeof url !== "string") return "/placeholders/product.svg";
  const trimmed = url.trim();
  if (!trimmed) return "/placeholders/product.svg";

  // Data URIs or absolute internal paths
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

// ── RFC-4180 Compliant Robust CSV Parser ──
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

export default function BulkProductImportPage() {
  const router = useRouter();
  const fileInputId = useId();

  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>("all");
  const [csvText, setCsvText] = useState<string>(CATEGORY_TEMPLATES[0].csvContent);
  const [parsedProducts, setParsedProducts] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasValidated, setHasValidated] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [showManualEditor, setShowManualEditor] = useState<boolean>(false);

  // Auto-validate initial template
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
    // Add UTF-8 Byte Order Mark (\uFEFF) so Excel opens Hindi/Special chars cleanly
    const blob = new Blob(["\uFEFF" + tmpl.csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", tmpl.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${tmpl.name} CSV template!`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      validateAndTransformCSV(text);
      toast.success(`Loaded file: ${file.name}`);
    };
    reader.readAsText(file);
  };

  const validateAndTransformCSV = (text: string) => {
    setHasValidated(true);
    const parsed = parseCSVText(text);

    if (parsed.error) {
      setValidationErrors([parsed.error]);
      setParsedProducts([]);
      return;
    }

    const errors: string[] = [];
    const products: any[] = [];

    parsed.rows.forEach((r, idx) => {
      const rowNum = idx + 2;

      // Extract common fields (flexible header matching)
      const name = r.productname || r.name || "";
      const category = (r.category || r.categoryslug || selectedTemplateCategory || "tiles-granite")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "");

      const brand = r.brandname || r.brand || "Intrihub Assured";
      const tagline = r.captiontagline || r.caption || r.tagline || "";
      const sellingPrice = parseFloat(r.sellingprice || r.price || r.priceperbox || "0");
      const mrpPrice = parseFloat(r.mrpprice || r.mrp || (sellingPrice * 1.25).toString());
      const stock = parseInt(r.stockqty || r.stock || r.stockboxes || "50", 10);
      const unit = r.unit || r.unitofsale || "Piece";
      const material = r.material || "Standard";
      const description = r.description || tagline || name;

      // Image URLs parser (splits by semicolon, bar or comma)
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

      // Collect specs / dynamic attributes
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

      // Category-specific mapping
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

      // Parse custom specs string if provided (e.g. "Key: Val; Key2: Val2")
      if (r.specifications) {
        r.specifications.split(";").forEach((pair: string) => {
          const [k, v] = pair.split(":").map((s) => s.trim());
          if (k && v) {
            specsObj[k] = v;
            attributes.push({ key: k, value: v });
          }
        });
      }

      // Validation Rules
      const rowErrors: string[] = [];
      if (!name) rowErrors.push("Product Name is missing");
      if (isNaN(sellingPrice) || sellingPrice <= 0) rowErrors.push("Valid Selling Price is required");
      if (isNaN(stock) || stock < 0) rowErrors.push("Stock must be a non-negative number");

      if (rowErrors.length > 0) {
        errors.push(`Row ${rowNum}: ${rowErrors.join(", ")}`);
      }

      // Build CreateProductInput payload
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
            pricePerSqft: sellingPrice,
            sqftPerBox: specsObj.sqftPerBox || 1,
            stockBoxes: stock,
          },
        ],
        _validationErrors: rowErrors,
        _mrp: mrpPrice,
        _sellingPrice: sellingPrice,
        _stock: stock,
      };

      products.push(productPayload);
    });

    setValidationErrors(errors);
    setParsedProducts(products);
  };

  const handleStartImport = async () => {
    if (parsedProducts.length === 0) {
      toast.error("No valid products to import.");
      return;
    }

    if (validationErrors.length > 0) {
      toast.error(`Please fix the ${validationErrors.length} validation errors before importing.`);
      return;
    }

    setIsImporting(true);
    setImportProgress(10);

    try {
      const res = await createProductsBulk(parsedProducts);
      setImportProgress(100);

      if (res.success) {
        toast.success(`🎉 ${res.message || `Successfully imported ${res.count} products!`}`);
        broadcastLiveEvent("data:refresh");
        setTimeout(() => {
          router.push("/admin/products");
        }, 1200);
      } else {
        toast.error(res.error || "Failed to import products");
      }
    } catch (err: any) {
      toast.error(err?.message || "Import encountered an error");
    } finally {
      setIsImporting(false);
    }
  };

  const currentTemplate =
    CATEGORY_TEMPLATES.find((t) => t.id === selectedTemplateCategory) || CATEGORY_TEMPLATES[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
            title="Back to Product Catalog"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-[#052a51]">
              Bulk Product Excel / CSV Importer
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Download category-tailored Excel sheets, fill in your product catalog, and import everything with images in 1-Click.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleDownloadTemplate(selectedTemplateCategory)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download size={15} />
            <span>Download Selected Template</span>
          </button>
        </div>
      </div>

      {/* ── Step 1: Category Format Selector ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#052a51] text-white text-xs font-black flex items-center justify-center">
              1
            </span>
            <h2 className="text-sm font-black text-[#052a51]">
              Select Category & Download Preset Excel / CSV Template
            </h2>
          </div>
          <span className="text-[11px] font-bold text-gray-400">
            {CATEGORY_TEMPLATES.length} Formats Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CATEGORY_TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            const isSelected = selectedTemplateCategory === tmpl.id;

            return (
              <div
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl.id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? "bg-orange-50/50 border-[#F26522] ring-2 ring-[#F26522]/20 shadow-sm"
                    : "bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? "bg-[#F26522] text-white"
                          : "bg-white border border-gray-200 text-[#052a51]"
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#F26522] text-white">
                        Active Format
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-black text-[#052a51]">{tmpl.name}</h3>
                  <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                    {tmpl.description}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-mono">
                    .csv (Excel Ready)
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadTemplate(tmpl.id);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F26522] hover:underline"
                  >
                    <Download size={12} />
                    <span>Download Sheet</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Step 2: Upload Filled File or Paste CSV ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#052a51] text-white text-xs font-black flex items-center justify-center">
              2
            </span>
            <h2 className="text-sm font-black text-[#052a51]">
              Upload Filled Excel / CSV File
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowManualEditor(!showManualEditor)}
            className="text-xs font-bold text-[#F26522] hover:underline cursor-pointer"
          >
            {showManualEditor ? "Hide Raw Text Editor" : "Paste / Edit Raw CSV Text"}
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <label
          htmlFor={fileInputId}
          className="border-2 border-dashed border-gray-300 hover:border-[#F26522] bg-gray-50/50 hover:bg-orange-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-center text-[#052a51] group-hover:scale-110 transition-transform">
            <Upload size={22} className="text-[#F26522]" />
          </div>
          <div>
            <p className="text-xs font-black text-[#052a51]">
              Click to select or drag & drop your completed sheet (.csv)
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Supports standard CSV generated by Microsoft Excel, Google Sheets, or Apple Numbers
            </p>
          </div>
          <input
            id={fileInputId}
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        {/* Raw Text / Paste Area */}
        {showManualEditor && (
          <div className="space-y-2 pt-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700">
                Raw CSV Data (Editable)
              </label>
              <button
                type="button"
                onClick={() => validateAndTransformCSV(csvText)}
                className="text-xs font-bold text-[#052a51] hover:underline flex items-center gap-1"
              >
                <RefreshCw size={12} />
                <span>Re-parse Text</span>
              </button>
            </div>
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                validateAndTransformCSV(e.target.value);
              }}
              className="w-full p-3 font-mono text-xs bg-gray-900 text-emerald-400 rounded-xl border border-gray-700 focus:outline-none focus:border-[#F26522]"
            />
          </div>
        )}
      </div>

      {/* ── Step 3: Verification & Live Preview Grid ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#052a51] text-white text-xs font-black flex items-center justify-center">
              3
            </span>
            <h2 className="text-sm font-black text-[#052a51]">
              Live Product Preview & Data Validation
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-xl">
              {parsedProducts.length} Total Items
            </span>
            {validationErrors.length === 0 ? (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-1">
                <Check size={12} />
                <span>All Valid & Ready</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-1">
                <AlertCircle size={12} />
                <span>{validationErrors.length} Errors Found</span>
              </span>
            )}
          </div>
        </div>

        {/* Validation Errors Notice */}
        {validationErrors.length > 0 && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs font-bold text-red-800">
              <AlertTriangle size={15} />
              <span>Please resolve the following errors in your sheet:</span>
            </div>
            <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5 pl-2">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Products Preview Table */}
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 w-14">Image</th>
                <th className="py-3 px-4">Product Name & Category</th>
                <th className="py-3 px-4">Key Specifications</th>
                <th className="py-3 px-4">Pricing & MRP</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {parsedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400 text-xs">
                    No products parsed yet. Upload a CSV file or paste data above.
                  </td>
                </tr>
              ) : (
                parsedProducts.map((p, idx) => {
                  const hasError = p._validationErrors && p._validationErrors.length > 0;
                  const firstImg = p.images?.[0] || "/placeholders/product.svg";

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-gray-50/70 transition-colors ${
                        hasError ? "bg-red-50/40" : ""
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-mono text-gray-400 text-[11px]">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sanitizeImageUrl(firstImg)}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholders/product.svg";
                            }}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-[#052a51]">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-[#052a51]/5 text-[#052a51] uppercase">
                            {p.categorySlug}
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold">
                            {p.specs?.brand || "Brand N/A"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {p.attributes?.slice(0, 3).map((attr: any, i: number) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 font-medium"
                            >
                              <strong>{attr.key}:</strong> {attr.value}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-black text-[#052a51] text-xs">
                          {formatPrice(p._sellingPrice)}
                        </p>
                        {p._mrp > p._sellingPrice && (
                          <p className="text-[10px] text-gray-400 line-through">
                            MRP: {formatPrice(p._mrp)}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p._stock} in stock
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {hasError ? (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100/60 px-2 py-0.5 rounded-full"
                            title={p._validationErrors.join(", ")}
                          >
                            <AlertTriangle size={12} />
                            <span>Error</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                            <Check size={12} />
                            <span>Ready</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Step 4: 1-Click Import Action ── */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-500">
            <strong>Ready to import:</strong> {parsedProducts.length} product(s) will be created directly in your Neon Cloud Database.
          </div>

          <button
            type="button"
            onClick={handleStartImport}
            disabled={isImporting || parsedProducts.length === 0 || validationErrors.length > 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Importing Products to Database ({importProgress}%)...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>1-Click Import All ({parsedProducts.length} Products)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
