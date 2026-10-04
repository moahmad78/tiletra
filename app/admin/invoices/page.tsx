"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Printer,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Download,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  Building2,
  User,
  ShoppingBag,
  CreditCard,
  Percent,
  Truck,
  Eye,
  Edit3,
  Columns,
  Maximize2,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

interface InvoiceItem {
  id: string;
  name: string;
  variant: string;
  hsn: string;
  quantity: number;
  unit: string;
  rate: number;
  taxRate: number; // e.g., 18, 12, 5, 28, 0
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  placeOfSupply: string;
  paymentMethod: string;
  paymentStatus: "Paid" | "Pending" | "Partially Paid";
  
  // Seller
  sellerName: string;
  sellerGstin: string;
  sellerPhone: string;
  sellerEmail: string;
  sellerAddress: string;

  // Customer
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerGstin: string;
  deliveryAddress: string;

  // Items & Calculations
  items: InvoiceItem[];
  deliveryFee: number;
  discount: number;
  taxMode: "exclusive" | "inclusive"; // GST added on top or included in rate
  isInterState: boolean; // IGST vs CGST+SGST

  // Terms & Meta
  terms: string;
  notes: string;
  showSignature: boolean;
}

const PRESET_MATERIALS = [
  {
    name: "600x1200mm Glazed Vitrified Tiles (Statuario White)",
    variant: "High Gloss • 2 Pcs/Box • 15.5 Sq.Ft Coverage",
    hsn: "6907",
    unit: "Box",
    rate: 850,
    taxRate: 18,
  },
  {
    name: "Wall Mounted Rimless Ceramic Commode (Alpine White)",
    variant: "Soft-Close Seat Cover • Dual Flush Cistern Included",
    hsn: "6910",
    unit: "Pcs",
    rate: 4800,
    taxRate: 18,
  },
  {
    name: "IntriHub Premium Polymer Modified Tile Adhesive (Type 2)",
    variant: "20 Kg Multi-Surface Heavy Duty Bag",
    hsn: "3824",
    unit: "Bags",
    rate: 420,
    taxRate: 18,
  },
  {
    name: "High Precision Brass Basin Mixer Tap (Chrome Finish)",
    variant: "Hot & Cold Single Lever • Ceramic Disc Cartridge",
    hsn: "8481",
    unit: "Pcs",
    rate: 2150,
    taxRate: 18,
  },
  {
    name: "Waterproof Epoxy Tile Grout (2 Part System)",
    variant: "5 Kg Bucket • Stain Resistant • Ivory Beige",
    hsn: "3214",
    unit: "Pcs",
    rate: 650,
    taxRate: 18,
  },
  {
    name: "Natural Polished Granite Countertop Slab (Black Pearl)",
    variant: "18mm Calibrated • Pre-cut 8ft x 2.5ft",
    hsn: "6802",
    unit: "Sq.Ft.",
    rate: 195,
    taxRate: 18,
  },
];

function generateNewInvoiceNumber() {
  const dateStr = new Date().toISOString().slice(2, 7).replace("-", "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `IH-INV-${dateStr}-${randomSuffix}`;
}

const INITIAL_INVOICE: InvoiceData = {
  invoiceNumber: generateNewInvoiceNumber(),
  invoiceDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
  placeOfSupply: "Karnataka (29)",
  paymentMethod: "Online (UPI / Bank Transfer)",
  paymentStatus: "Paid",

  sellerName: "Intrihub - Everything, Every Place",
  sellerGstin: "29AAAAA0000A1Z5",
  sellerPhone: "+91 7090120211",
  sellerEmail: "support@intrihub.com",
  sellerAddress: "Begur, Bommanahalli, Bengaluru, Karnataka - 560068",

  customerName: "Karthik Builders & Developers",
  customerPhone: "+91 9845012345",
  customerEmail: "procurement@karthikbuilders.in",
  customerGstin: "29AABCK1234F1Z9",
  deliveryAddress: "Site #42, Green Glen Layout, Bellandur, Bengaluru, Karnataka - 560103",

  items: [
    {
      id: "item-1",
      name: "600x1200mm Glazed Vitrified Tiles (Statuario White)",
      variant: "High Gloss • 2 Pcs/Box • 15.5 Sq.Ft Coverage",
      hsn: "6907",
      quantity: 45,
      unit: "Box",
      rate: 850,
      taxRate: 18,
    },
    {
      id: "item-2",
      name: "IntriHub Premium Polymer Modified Tile Adhesive (Type 2)",
      variant: "20 Kg Multi-Surface Heavy Duty Bag",
      hsn: "3824",
      quantity: 12,
      unit: "Bags",
      rate: 420,
      taxRate: 18,
    },
  ],
  deliveryFee: 0,
  discount: 1500,
  taxMode: "exclusive",
  isInterState: false,

  terms: "• Computer-generated tax invoice verified by IntriHub.\n• Goods once delivered cannot be returned without physical QC verification.\n• All disputes subject to Bengaluru jurisdiction.\n• Everything, Every Place • www.intrihub.com",
  notes: "Direct-to-site express delivery completed via IntriHub heavy cargo fleet.",
  showSignature: true,
};

function formatPrice(n: number) {
  return "₹" + (Math.round(n) || 0).toLocaleString("en-IN");
}

export default function ManualInvoiceGeneratorPage() {
  const [invoice, setInvoice] = useState<InvoiceData>(INITIAL_INVOICE);
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">("split");
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage draft if present
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("intrihub_manual_invoice_draft");
      if (saved) {
        setInvoice(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Auto-save draft on changes
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("intrihub_manual_invoice_draft", JSON.stringify(invoice));
    } catch {
      // Ignore
    }
  }, [invoice, mounted]);

  // Calculations
  const rawSubtotal = invoice.items.reduce((acc, item) => {
    return acc + (Number(item.quantity) || 0) * (Number(item.rate) || 0);
  }, 0);

  // Calculate tax depending on exclusive vs inclusive
  let calculatedTax = 0;
  if (invoice.taxMode === "exclusive") {
    calculatedTax = invoice.items.reduce((acc, item) => {
      const taxable = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
      const taxAmount = (taxable * (Number(item.taxRate) || 0)) / 100;
      return acc + taxAmount;
    }, 0);
  } else {
    // Inclusive: Tax is already part of the unit rate
    calculatedTax = invoice.items.reduce((acc, item) => {
      const total = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
      const rate = Number(item.taxRate) || 0;
      const base = total / (1 + rate / 100);
      return acc + (total - base);
    }, 0);
  }

  const taxableAmount = invoice.taxMode === "exclusive" ? rawSubtotal : rawSubtotal - calculatedTax;
  const deliveryFee = Number(invoice.deliveryFee) || 0;
  const discount = Number(invoice.discount) || 0;
  const grandTotal = Math.max(0, rawSubtotal + (invoice.taxMode === "exclusive" ? calculatedTax : 0) + deliveryFee - discount);

  // Field update helper
  const updateField = <K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) => {
    setInvoice((prev) => ({ ...prev, [key]: value }));
  };

  // Line item helpers
  const handleAddItem = (preset?: typeof PRESET_MATERIALS[0]) => {
    const newItem: InvoiceItem = preset
      ? {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: preset.name,
          variant: preset.variant,
          hsn: preset.hsn,
          quantity: 1,
          unit: preset.unit,
          rate: preset.rate,
          taxRate: preset.taxRate,
        }
      : {
          id: `item-${Date.now()}`,
          name: "",
          variant: "",
          hsn: "6907",
          quantity: 1,
          unit: "Box",
          rate: 0,
          taxRate: 18,
        };
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    toast.success("Item added to invoice");
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleRemoveItem = (id: string) => {
    if (invoice.items.length <= 1) {
      toast.error("Invoice must have at least one line item");
      return;
    }
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  // Reset form
  const handleReset = () => {
    const fresh: InvoiceData = {
      ...INITIAL_INVOICE,
      invoiceNumber: generateNewInvoiceNumber(),
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      customerGstin: "",
      deliveryAddress: "",
      items: [
        {
          id: `item-${Date.now()}`,
          name: "",
          variant: "",
          hsn: "6907",
          quantity: 1,
          unit: "Box",
          rate: 0,
          taxRate: 18,
        },
      ],
      deliveryFee: 0,
      discount: 0,
      notes: "",
    };
    setInvoice(fresh);
    localStorage.removeItem("intrihub_manual_invoice_draft");
    toast.info("Invoice form reset to blank template");
  };

  // Load sample demo
  const handleLoadSample = () => {
    const sample: InvoiceData = {
      ...INITIAL_INVOICE,
      invoiceNumber: generateNewInvoiceNumber(),
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    };
    setInvoice(sample);
    toast.success("Sample invoice loaded! You can preview or print right away.");
  };

  // Trigger print
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
      window.print();
    }
  };

  // Copy plain text summary for WhatsApp / Email
  const handleCopySummary = () => {
    const summary = `*OFFICIAL TAX INVOICE - INTRIHUB*
Invoice #: ${invoice.invoiceNumber}
Date: ${invoice.invoiceDate}
Billed To: ${invoice.customerName} (${invoice.customerPhone})
Delivery Address: ${invoice.deliveryAddress}

*Items:*
${invoice.items
  .map(
    (item, idx) =>
      `${idx + 1}. ${item.name} (${item.quantity} ${item.unit}) @ ₹${item.rate} = ₹${(
        item.quantity * item.rate
      ).toLocaleString("en-IN")}`
  )
  .join("\n")}

Subtotal: ₹${rawSubtotal.toLocaleString("en-IN")}
Delivery Fee: ${deliveryFee === 0 ? "FREE" : "₹" + deliveryFee.toLocaleString("en-IN")}
Discount: ₹${discount.toLocaleString("en-IN")}
*Grand Total: ₹${grandTotal.toLocaleString("en-IN")}*
Status: ${invoice.paymentStatus} (${invoice.paymentMethod})

Everything, Every Place • www.intrihub.com`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Invoice summary copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-[#052a51] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Print Stylesheet: Ensures ONLY the clean invoice is printed on A4 ── */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 11px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide header, sidebars, controls, editor, breadcrumbs */
          header, footer, nav, aside, .no-print, [role="navigation"], [role="banner"], [role="complementary"], .editor-panel {
            display: none !important;
          }

          .manual-invoice-page-container {
            margin: 0 !important;
            padding: 0 !important;
          }

          .invoice-printable-wrapper {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .invoice-paper-card {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          .invoice-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ── Top Bar / Header Controls (No-Print) ── */}
      <div className="no-print bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-gray-500 hover:text-[#052a51] flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Orders</span>
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-bold text-[#F26522] uppercase tracking-wider">
              Manual Generator
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-[#052a51] mt-1 flex items-center gap-2">
            <FileText className="text-[#F26522]" size={24} />
            <span>Tax Invoice Generator</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Fill in details dynamically to build, preview, and print official IntriHub GST Tax Invoices.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher (Desktop) */}
          <div className="hidden xl:flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200 text-xs font-bold text-gray-600">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === "split" ? "bg-white text-[#052a51] shadow-xs" : "hover:text-[#052a51]"
              }`}
            >
              <Columns size={13} />
              <span>Split View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("edit")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === "edit" ? "bg-white text-[#052a51] shadow-xs" : "hover:text-[#052a51]"
              }`}
            >
              <Edit3 size={13} />
              <span>Editor Only</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === "preview" ? "bg-white text-[#052a51] shadow-xs" : "hover:text-[#052a51]"
              }`}
            >
              <Eye size={13} />
              <span>Preview Only</span>
            </button>
          </div>

          {/* Sample Demo Button */}
          <button
            type="button"
            onClick={handleLoadSample}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
            title="Pre-populate with sample construction materials"
          >
            <Sparkles size={14} className="text-amber-600" />
            <span>Load Sample</span>
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
            title="Clear and generate new blank invoice"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          {/* Copy Summary */}
          <button
            type="button"
            onClick={handleCopySummary}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            <span>{copied ? "Copied!" : "Copy Summary"}</span>
          </button>

          {/* Print / Save PDF Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 shadow-md active:scale-95"
          >
            <Printer size={15} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* ── Mobile/Tablet View Toggle (No-Print) ── */}
      <div className="xl:hidden no-print flex rounded-xl bg-gray-200 p-1 text-xs font-bold text-gray-700">
        <button
          type="button"
          onClick={() => setViewMode("edit")}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            viewMode !== "preview" ? "bg-white text-[#052a51] shadow-xs" : "text-gray-600"
          }`}
        >
          <Edit3 size={14} />
          <span>Edit Details</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode("preview")}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            viewMode === "preview" ? "bg-white text-[#F26522] shadow-xs" : "text-gray-600"
          }`}
        >
          <Eye size={14} />
          <span>Live Invoice Preview</span>
        </button>
      </div>

      {/* ── Main Work Area ── */}
      <div className="manual-invoice-page-container grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ──────────────────────────────────────────────────────────
            LEFT COLUMN: INTERACTIVE FORM (HIDDEN ON PRINT / PREVIEW-ONLY)
           ────────────────────────────────────────────────────────── */}
        {(viewMode === "split" || viewMode === "edit") && (
          <div className="editor-panel no-print xl:col-span-6 space-y-6">
            {/* 1. Invoice Metadata */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[#F26522]" />
                  <h2 className="text-sm font-black text-[#052a51]">1. Invoice & Order Details</h2>
                </div>
                <button
                  type="button"
                  onClick={() => updateField("invoiceNumber", generateNewInvoiceNumber())}
                  className="text-[11px] font-bold text-[#F26522] hover:underline"
                >
                  Generate New #
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Invoice / Order #
                  </label>
                  <input
                    type="text"
                    value={invoice.invoiceNumber}
                    onChange={(e) => updateField("invoiceNumber", e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold text-[#052a51] rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={invoice.invoiceDate}
                    onChange={(e) => updateField("invoiceDate", e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={invoice.dueDate}
                    onChange={(e) => updateField("dueDate", e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Payment Method
                  </label>
                  <select
                    value={invoice.paymentMethod}
                    onChange={(e) => updateField("paymentMethod", e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none bg-white"
                  >
                    <option value="Online (UPI / Bank Transfer)">Online (UPI / NetBanking)</option>
                    <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                    <option value="Razorpay Online Payment">Razorpay Online</option>
                    <option value="NEFT / RTGS Transfer">NEFT / RTGS Transfer</option>
                    <option value="Cheque / Draft">Cheque / Demand Draft</option>
                    <option value="15-Day B2B Credit">15-Day B2B Credit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Payment Status
                  </label>
                  <select
                    value={invoice.paymentStatus}
                    onChange={(e) => updateField("paymentStatus", e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-bold text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none bg-white"
                  >
                    <option value="Paid">Paid (Confirmed)</option>
                    <option value="Pending">Pending</option>
                    <option value="Partially Paid">Partially Paid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Place of Supply
                  </label>
                  <input
                    type="text"
                    value={invoice.placeOfSupply}
                    onChange={(e) => updateField("placeOfSupply", e.target.value)}
                    placeholder="Karnataka (29)"
                    className="w-full px-3 py-2 text-xs font-medium text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Customer & Delivery Info */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <User size={16} className="text-[#052a51]" />
                <h2 className="text-sm font-black text-[#052a51]">2. Customer & Delivery Details</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Customer / Business Name *
                  </label>
                  <input
                    type="text"
                    value={invoice.customerName}
                    onChange={(e) => updateField("customerName", e.target.value)}
                    placeholder="e.g. Karthik Builders / Priya Sharma"
                    className="w-full px-3 py-2 text-xs font-bold text-[#052a51] rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Customer Phone *
                  </label>
                  <input
                    type="tel"
                    value={invoice.customerPhone}
                    onChange={(e) => updateField("customerPhone", e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 text-xs font-medium text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Customer Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={invoice.customerEmail}
                    onChange={(e) => updateField("customerEmail", e.target.value)}
                    placeholder="client@company.com"
                    className="w-full px-3 py-2 text-xs font-medium text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Customer GSTIN (B2B Tax Credit)
                  </label>
                  <input
                    type="text"
                    value={invoice.customerGstin}
                    onChange={(e) => updateField("customerGstin", e.target.value.toUpperCase())}
                    placeholder="29AAAAA0000A1Z5"
                    className="w-full px-3 py-2 text-xs font-mono font-bold text-[#052a51] rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Site / Delivery Address *
                </label>
                <textarea
                  rows={2}
                  value={invoice.deliveryAddress}
                  onChange={(e) => updateField("deliveryAddress", e.target.value)}
                  placeholder="Plot/Flat number, Building, Street, Landmark, Bengaluru - 560068"
                  className="w-full px-3 py-2 text-xs text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* 3. Line Items Table Editor */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={16} className="text-[#1E9E6B]" />
                  <h2 className="text-sm font-black text-[#052a51]">3. Materials & Products</h2>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">
                    {invoice.items.length} {invoice.items.length === 1 ? "item" : "items"}
                  </span>
                </div>

                {/* Quick Preset Selector */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        const idx = Number(e.target.value);
                        if (!isNaN(idx) && PRESET_MATERIALS[idx]) {
                          handleAddItem(PRESET_MATERIALS[idx]);
                          e.target.value = "";
                        }
                      }}
                      defaultValue=""
                      className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none cursor-pointer"
                    >
                      <option value="" disabled>
                        + Add Popular Preset...
                      </option>
                      {PRESET_MATERIALS.map((p, idx) => (
                        <option key={idx} value={idx}>
                          {p.name.slice(0, 36)}... (₹{p.rate})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    className="px-3 py-1.5 bg-[#052a51] hover:bg-[#041f3d] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 active:scale-95"
                  >
                    <Plus size={13} />
                    <span>Custom Item</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {invoice.items.map((item, idx) => {
                  const lineTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/90 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#052a51] text-white text-[10px] font-black shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                              placeholder="Product / Material Name"
                              className="w-full px-2.5 py-1.5 text-xs font-bold text-[#052a51] bg-white rounded-lg border border-gray-200 focus:border-[#F26522] focus:outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={item.hsn}
                              onChange={(e) => handleUpdateItem(item.id, "hsn", e.target.value)}
                              placeholder="HSN Code (e.g. 6907)"
                              className="w-full px-2.5 py-1.5 text-xs font-mono text-gray-700 bg-white rounded-lg border border-gray-200 focus:border-[#F26522] focus:outline-none"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={item.variant}
                          onChange={(e) => handleUpdateItem(item.id, "variant", e.target.value)}
                          placeholder="Variant details / specifications (e.g. High Gloss, 2 Pcs/Box, Size 60x120cm)"
                          className="w-full px-2.5 py-1 text-[11px] text-gray-600 bg-white rounded-lg border border-gray-200 focus:border-[#F26522] focus:outline-none"
                        />
                      </div>

                      {/* Numeric values */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(item.id, "quantity", Math.max(1, parseFloat(e.target.value) || 1))
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-bold text-gray-900 bg-white rounded-lg border border-gray-200 focus:border-[#F26522] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">
                            Unit
                          </label>
                          <select
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(item.id, "unit", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs font-medium text-gray-700 bg-white rounded-lg border border-gray-200 focus:border-[#F26522] focus:outline-none"
                          >
                            <option value="Box">Box</option>
                            <option value="Pcs">Pcs</option>
                            <option value="Sq.Ft.">Sq.Ft.</option>
                            <option value="Bags">Bags</option>
                            <option value="Meters">Meters</option>
                            <option value="Kg">Kg</option>
                            <option value="Rolls">Rolls</option>
                            <option value="Sets">Sets</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">
                            Unit Rate (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.rate}
                            onChange={(e) =>
                              handleUpdateItem(item.id, "rate", Math.max(0, parseFloat(e.target.value) || 0))
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-bold text-[#052a51] bg-white rounded-lg border border-gray-200 focus:border-[#F26522] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">
                            GST %
                          </label>
                          <select
                            value={item.taxRate}
                            onChange={(e) =>
                              handleUpdateItem(item.id, "taxRate", parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1.5 text-xs font-bold text-gray-700 bg-white rounded-lg border border-gray-200 focus:border-[#F26522] focus:outline-none"
                          >
                            <option value="18">18% GST</option>
                            <option value="28">28% GST</option>
                            <option value="12">12% GST</option>
                            <option value="5">5% GST</option>
                            <option value="0">0% (Exempt)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-200 text-gray-500">
                        <span className="text-[11px]">
                          Item Total: <b className="text-gray-800">{formatPrice(lineTotal)}</b>
                        </span>
                        <span className="text-[11px] text-gray-400">
                          HSN: {item.hsn} • {item.taxRate}% GST
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Charges, Taxes & Terms */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Percent size={16} className="text-blue-600" />
                <h2 className="text-sm font-black text-[#052a51]">4. Charges, GST & Signatory</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Delivery & Freight (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={invoice.deliveryFee}
                    onChange={(e) => updateField("deliveryFee", Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-xs font-bold text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Enter 0 for FREE delivery</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={invoice.discount}
                    onChange={(e) => updateField("discount", Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-xs font-bold text-emerald-600 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Direct project discount</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    GST Mode
                  </label>
                  <select
                    value={invoice.taxMode}
                    onChange={(e) => updateField("taxMode", e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-bold text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none bg-white"
                  >
                    <option value="exclusive">Exclusive (Add GST to Subtotal)</option>
                    <option value="inclusive">Inclusive (GST in Unit Rate)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-[#052a51] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoice.isInterState}
                    onChange={(e) => updateField("isInterState", e.target.checked)}
                    className="w-4 h-4 text-[#F26522] rounded-sm accent-[#F26522]"
                  />
                  <span>Inter-state Supply (Apply IGST instead of CGST + SGST)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-[#052a51] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoice.showSignature}
                    onChange={(e) => updateField("showSignature", e.target.checked)}
                    className="w-4 h-4 text-[#F26522] rounded-sm accent-[#F26522]"
                  />
                  <span>Include Digital Signature Stamp</span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Delivery / Dispatch Notes
                </label>
                <input
                  type="text"
                  value={invoice.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="e.g. 60-min Express Bengaluru dispatch via IntriHub heavy fleet"
                  className="w-full px-3 py-2 text-xs text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  rows={3}
                  value={invoice.terms}
                  onChange={(e) => updateField("terms", e.target.value)}
                  className="w-full px-3 py-2 text-xs text-gray-700 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none resize-none font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────
            RIGHT COLUMN: REAL-TIME INVOICE PREVIEW (OFFICIAL FORMAT)
           ────────────────────────────────────────────────────────── */}
        {(viewMode === "split" || viewMode === "preview") && (
          <div
            className={`invoice-printable-wrapper ${
              viewMode === "split" ? "xl:col-span-6" : "xl:col-span-12 max-w-4xl mx-auto w-full"
            }`}
          >
            {/* Live Indicator Header (Hidden in Print) */}
            <div className="no-print bg-slate-900 text-white px-5 py-3 rounded-t-3xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-bold text-slate-200">Real-Time Invoice Preview</span>
                <span className="text-[10px] text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded-md">
                  Matches Official Format
                </span>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="text-xs font-bold text-[#F26522] hover:text-[#ff7f42] flex items-center gap-1 transition-colors"
              >
                <Printer size={13} />
                <span>Print A4</span>
              </button>
            </div>

            {/* ── Official Document Card (This is what prints) ── */}
            <div
              ref={printRef}
              className="invoice-paper-card bg-white p-6 sm:p-10 rounded-b-3xl xl:rounded-3xl shadow-xl border border-gray-200/90 text-[#0f172a] relative overflow-hidden"
            >
              {/* Official Watermark Background */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/intri-web-logo.png"
                alt="Watermark"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.04] pointer-events-none object-contain z-0"
              />

              <div className="relative z-10">
                {/* ── Top Header ── */}
                <div className="invoice-avoid-break flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-[#052a51]">
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/logo/intri-web-logo.png"
                      alt="Intrihub Logo"
                      className="h-12 w-auto object-contain mb-2"
                    />
                    <div className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                      <div>GSTIN: <b>{invoice.sellerGstin}</b></div>
                      <div>Mobile: <b>{invoice.sellerPhone}</b></div>
                      <div>Email: <b>{invoice.sellerEmail}</b></div>
                      <div>Address: <span className="text-gray-600">{invoice.sellerAddress}</span></div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-lg font-black text-[#052a51] tracking-tight">OFFICIAL TAX INVOICE</p>
                    <p className="text-xs font-bold text-gray-800 mt-1">
                      Invoice #: <span className="font-mono">{invoice.invoiceNumber}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Date: <b>{new Date(invoice.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</b>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Place of Supply: <b>{invoice.placeOfSupply}</b>
                    </p>
                    <div className="inline-block mt-2 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Payment: {invoice.paymentStatus} ({invoice.paymentMethod})
                    </div>
                  </div>
                </div>

                {/* ── Billed & Delivered To ── */}
                <div className="invoice-avoid-break py-5 border-b border-gray-100 text-xs">
                  <span className="font-black text-[#052a51] uppercase tracking-wider block mb-1 border-b border-gray-100 pb-1">
                    Billed & Delivered To:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-sm font-extrabold text-[#0f172a]">{invoice.customerName || "Valued Customer"}</p>
                      <p className="text-blue-600 font-bold mt-0.5">Phone: {invoice.customerPhone || "Not Provided"}</p>
                      {invoice.customerEmail && (
                        <p className="text-gray-500 text-[11px]">Email: {invoice.customerEmail}</p>
                      )}
                      {invoice.customerGstin && (
                        <p className="text-gray-800 font-mono font-bold text-[11px] mt-1">
                          GSTIN: <span className="bg-gray-100 px-1 py-0.5 rounded-sm">{invoice.customerGstin}</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-700 leading-relaxed">
                        <b>Delivery Address:</b>
                        <br />
                        {invoice.deliveryAddress || "Site delivery address in Bengaluru"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Line Items Table ── */}
                <div className="py-5">
                  <table className="invoice-table w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-y-2 border-slate-300 text-[#052a51] font-extrabold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-2 text-center w-8">#</th>
                        <th className="py-2.5 px-2">Material / Product Description</th>
                        <th className="py-2.5 px-2 text-center w-16">HSN</th>
                        <th className="py-2.5 px-2 text-center w-20">Quantity</th>
                        <th className="py-2.5 px-2 text-right w-24">Unit Rate</th>
                        <th className="py-2.5 px-2 text-center w-14">GST</th>
                        <th className="py-2.5 px-2 text-right w-28">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {invoice.items.map((item, idx) => {
                        const lineTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-2 text-gray-400 font-bold text-center">{idx + 1}</td>
                            <td className="py-3 px-2">
                              <p className="font-bold text-[#0f172a]">{item.name || "Material Product"}</p>
                              {item.variant && (
                                <p className="text-[11px] text-gray-500 font-normal mt-0.5">{item.variant}</p>
                              )}
                            </td>
                            <td className="py-3 px-2 text-center font-mono text-[11px] text-gray-600">
                              {item.hsn || "—"}
                            </td>
                            <td className="py-3 px-2 text-center font-bold text-gray-800">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-3 px-2 text-right text-gray-700">
                              {formatPrice(item.rate)}
                            </td>
                            <td className="py-3 px-2 text-center text-[11px] font-bold text-gray-600">
                              {item.taxRate}%
                            </td>
                            <td className="py-3 px-2 text-right font-black text-[#052a51]">
                              {formatPrice(lineTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Summary & Signature ── */}
                <div className="invoice-avoid-break border-t-2 border-gray-200 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-xs">
                  {/* Left: Terms and Notes */}
                  <div className="text-[11px] text-gray-500 leading-relaxed max-w-sm space-y-2">
                    {invoice.notes && (
                      <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100 text-blue-950 font-medium text-[11px]">
                        <b>Dispatch Note:</b> {invoice.notes}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-800 mb-0.5">Terms & Conditions:</p>
                      <div className="whitespace-pre-line text-gray-600">{invoice.terms}</div>
                    </div>
                  </div>

                  {/* Right: Calculations & Digital Stamp */}
                  <div className="w-full sm:w-72 flex flex-col items-end space-y-3 shrink-0">
                    <div className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Taxable Subtotal:</span>
                        <span>{formatPrice(taxableAmount)}</span>
                      </div>

                      {/* GST Breakdown */}
                      {invoice.taxMode === "exclusive" && (
                        <>
                          {invoice.isInterState ? (
                            <div className="flex justify-between text-gray-600">
                              <span>IGST (Integrated Tax):</span>
                              <span>{formatPrice(calculatedTax)}</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between text-gray-600">
                                <span>CGST (Central Tax):</span>
                                <span>{formatPrice(calculatedTax / 2)}</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>SGST (State Tax):</span>
                                <span>{formatPrice(calculatedTax / 2)}</span>
                              </div>
                            </>
                          )}
                        </>
                      )}

                      {invoice.taxMode === "inclusive" && (
                        <div className="flex justify-between text-[11px] text-gray-500 italic">
                          <span>Includes GST:</span>
                          <span>{formatPrice(calculatedTax)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-gray-600">
                        <span>Delivery & Freight:</span>
                        <span>{deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}</span>
                      </div>

                      {discount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span>Discount Applied:</span>
                          <span>-{formatPrice(discount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm font-black text-[#052a51] pt-2 border-t-2 border-dashed border-gray-300">
                        <span>Grand Total:</span>
                        <span className="text-[#052a51] text-base">{formatPrice(grandTotal)}</span>
                      </div>
                    </div>

                    {/* Digital Signature */}
                    {invoice.showSignature && (
                      <div className="text-center w-48 self-center sm:self-end">
                        <div className="border border-dashed border-slate-400 rounded-lg p-2.5 bg-slate-50">
                          <p className="font-serif italic font-bold text-base text-[#052a51] tracking-wide">
                            INTRIHUB
                          </p>
                          <p className="text-[9px] font-extrabold text-emerald-600 uppercase mt-0.5">
                            ✔ Digitally Signed
                          </p>
                        </div>
                        <p className="text-[10px] text-gray-600 font-semibold mt-1">Authorized Signatory</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Official Footer ── */}
                <div className="invoice-avoid-break mt-8 pt-4 border-t border-gray-100 text-center text-[10px] text-gray-400 space-y-0.5">
                  <p>This is an official computer-generated tax invoice verified by IntriHub.</p>
                  <p>Everything, Every Place • www.intrihub.com • Support: support@intrihub.com • +91 7090120211</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
