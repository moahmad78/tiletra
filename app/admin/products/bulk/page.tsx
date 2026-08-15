"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useAdminStore } from "@/lib/admin-store";
import type { Product, Material, Finish } from "@/lib/data/products";
import { toast } from "sonner";

const SAMPLE_CSV = `Name,CategorySlug,Material,Size,Finish,Color,PricePerBox,SqftPerBox,Stock,Images,Description
Royal Statuario White,floor-tiles,Vitrified,800x800mm,Polished,White,3400,44,150,https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80,Luxurious Italian-look vitrified floor tiles.
Matte Charcoal Hex,bathroom-tiles,Porcelain,200x200mm,Matte,Charcoal,2100,32,80,https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80,Modern geometric dark tiles for bathroom showers.
Glossy Mint Metro,kitchen-tiles,Ceramic,300x100mm,Glossy,Mint,920,31,200,https://images.unsplash.com/photo-1556909172-b6b6f3f0ecf6?w=800&q=80,Fresh pastel metro splashback tiles for modern kitchens.`;

export default function BulkProductImportPage() {
  const router = useRouter();
  const importProducts = useAdminStore((s) => s.importProducts);
  const categories = useAdminStore((s) => s.categories);

  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [hasValidated, setHasValidated] = useState(false);

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "tiletra_product_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV template downloaded!");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      validateCSV(text);
    };
    reader.readAsText(file);
  };

  const validateCSV = (text: string) => {
    const lines = text
      .trim()
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length <= 1) {
      setErrors(["CSV must have at least one header row and one product row."]);
      setParsedRows([]);
      setHasValidated(true);
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const requiredHeaders = ["name", "categoryslug", "priceperbox"];
    const missing = requiredHeaders.filter((h) => !headers.includes(h));

    if (missing.length > 0) {
      setErrors([`Missing required column headers: ${missing.join(", ")}`]);
      setParsedRows([]);
      setHasValidated(true);
      return;
    }

    const rows: any[] = [];
    const errs: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const rowObj: any = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || "";
      });

      if (!rowObj.name) {
        errs.push(`Row ${i + 1}: Name is empty`);
      } else {
        rows.push(rowObj);
      }
    }

    setParsedRows(rows);
    setErrors(errs);
    setHasValidated(true);
  };

  const handleImport = () => {
    if (parsedRows.length === 0) return;

    const newProducts: Product[] = parsedRows.map((row, idx) => {
      const cat = categories.find((c) => c.slug === row.categoryslug) || categories[0];
      const boxPrice = Number(row.priceperbox) || 2000;
      const sqft = Number(row.sqftperbox) || 40;
      const rateSqft = Math.round(boxPrice / sqft);
      const newId = `prod-imp-${Date.now().toString().slice(-4)}-${idx}`;

      return {
        id: newId,
        name: row.name,
        slug: `${row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${newId}`,
        categorySlug: cat.slug,
        categoryName: cat.name,
        description: row.description || "Premium high-grade architectural tile design.",
        material: (row.material as Material) || "Vitrified",
        images: row.images ? [row.images] : ["https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80"],
        variants: [
          {
            id: `v-${newId}-0`,
            size: row.size || "600x600mm",
            finish: (row.finish as Finish) || "Matte",
            color: row.color || "Standard",
            pricePerBox: boxPrice,
            pricePerSqft: rateSqft,
            sqftPerBox: sqft,
            stockBoxes: Number(row.stock) || 100,
          },
        ],
        rating: 4.8,
        reviewCount: 1,
        isBestseller: false,
        isNew: true,
        tags: ["imported", cat.slug],
        specs: {
          waterAbsorption: "< 0.5%",
          slipResistance: "R9",
          thickness: "9mm",
          surfaceFinish: row.finish || "Matte",
          breakingStrength: "> 1200N",
          frostResistance: "Yes",
        },
      };
    });

    importProducts(newProducts);
    toast.success(`Successfully imported ${newProducts.length} new tile designs!`);
    router.push("/admin/products");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-black text-[#052a51]">Bulk CSV Product Import</h2>
            <p className="text-xs text-gray-400">
              Upload multiple tile catalog items at once using CSV or Excel
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-[#052a51] text-xs font-bold rounded-xl transition-colors shadow-2xs"
        >
          <Download size={14} />
          <span>Download Template</span>
        </button>
      </div>

      {/* Upload & CSV Editor */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#052a51]">CSV Data Input</h3>

          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#052a51] text-white text-xs font-bold rounded-xl hover:bg-[#041f3d] transition-colors shadow-xs">
            <Upload size={13} />
            <span>Choose CSV File</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <textarea
          rows={9}
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value);
            setHasValidated(false);
          }}
          className="w-full p-4 font-mono text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#F26522] leading-relaxed text-[#052a51]"
          placeholder="Paste CSV rows here..."
        />

        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={() => validateCSV(csvText)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#052a51] text-xs font-bold rounded-xl transition-colors"
          >
            Validate Data
          </button>

          {hasValidated && errors.length === 0 && parsedRows.length > 0 && (
            <button
              type="button"
              onClick={handleImport}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all"
            >
              <CheckCircle size={15} />
              <span>Import {parsedRows.length} Valid Products</span>
            </button>
          )}
        </div>
      </div>

      {/* Validation Results */}
      {hasValidated && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-[#052a51]">Validation Report</h3>

          {errors.length > 0 ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-red-700 font-bold text-xs">
                <AlertCircle size={15} />
                <span>Found {errors.length} error(s):</span>
              </div>
              <ul className="text-xs text-red-600 list-disc list-inside space-y-0.5 mt-2">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                <CheckCircle size={16} />
                <span>All {parsedRows.length} rows parsed and validated successfully!</span>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Material</th>
                    <th className="p-2.5">Size</th>
                    <th className="p-2.5">Box Price</th>
                    <th className="p-2.5">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {parsedRows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="p-2.5 font-bold text-[#052a51]">{r.name}</td>
                      <td className="p-2.5 text-gray-600">{r.categoryslug}</td>
                      <td className="p-2.5 text-gray-600">{r.material || "Vitrified"}</td>
                      <td className="p-2.5 text-gray-600">{r.size || "600x600mm"}</td>
                      <td className="p-2.5 font-black text-[#052a51]">₹{r.priceperbox}</td>
                      <td className="p-2.5 text-emerald-700 font-bold">{r.stock || 100}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
