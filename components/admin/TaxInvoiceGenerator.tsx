"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Printer,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  User,
  ShoppingBag,
  Percent,
  Eye,
  Edit3,
  Columns,
  ArrowLeft,
  Lock,
  Unlock,
  RefreshCw,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  getNextSequentialInvoiceNumber,
  commitInvoiceSerial,
  getRecentOrdersForInvoicing,
  getOrderInvoiceData,
} from "@/lib/actions/invoices";

interface InvoiceItem {
  id: string;
  name: string;
  variant: string;
  hsn: string;
  quantity: number;
  unit: string;
  rate: number;
  taxRate: number; // 18, 28, 12, 5, 0
}

interface InvoiceData {
  invoiceNumber: string;
  isAutoSerial: boolean;
  orderId?: string;
  serialNumber?: number;
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
  taxMode: "exclusive" | "inclusive";
  isInterState: boolean;

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
  {
    name: "Astral CPVC Pro High Pressure Pipe 1 Inch (3m)",
    variant: "SDR 11 Lead Free Class 1 Hot & Cold Water",
    hsn: "3917",
    unit: "Pcs",
    rate: 410,
    taxRate: 18,
  },
  {
    name: "Finolex 2.5 sq mm FR PVC Insulated Copper Wire (90m)",
    variant: "Flame Retardant Red • ISI Certified 1100V",
    hsn: "8544",
    unit: "Rolls",
    rate: 2450,
    taxRate: 18,
  },
];

const INITIAL_INVOICE: InvoiceData = {
  invoiceNumber: "IH-INV-2026-0001",
  isAutoSerial: true,
  invoiceDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
  placeOfSupply: "Karnataka (29)",
  paymentMethod: "Online (UPI / NetBanking)",
  paymentStatus: "Paid",

  sellerName: "IntriHub Quick-Commerce Pvt Ltd",
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

  terms: "1. Computer-generated official tax invoice verified by IntriHub.\n2. Goods once delivered cannot be returned without physical QC verification.\n3. All disputes subject to Bengaluru jurisdiction.\n4. Issued under Rule 46 of the CGST Rules, 2017.",
  notes: "Direct-to-site express delivery completed via IntriHub heavy cargo fleet.",
  showSignature: true,
};

function formatPrice(n: number) {
  return "₹" + (Math.round(n) || 0).toLocaleString("en-IN");
}

function numberToWordsINR(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded <= 0) return "Zero Rupees Only";

  const singleDigits = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertTwoDigits(n: number): string {
    if (n === 0) return "";
    if (n < 20) return singleDigits[n] + " ";
    const t = Math.floor(n / 10);
    const u = n % 10;
    return tens[t] + (u > 0 ? " " + singleDigits[u] : "") + " ";
  }

  function convertThreeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    let res = "";
    if (h > 0) res += singleDigits[h] + " Hundred ";
    if (rest > 0) res += (res ? "and " : "") + convertTwoDigits(rest);
    return res;
  }

  let num = rounded;
  let words = "";

  const crores = Math.floor(num / 10000000);
  num %= 10000000;
  if (crores > 0) {
    words += convertTwoDigits(crores) + "Crore ";
  }

  const lakhs = Math.floor(num / 100000);
  num %= 100000;
  if (lakhs > 0) {
    words += convertTwoDigits(lakhs) + "Lakh ";
  }

  const thousands = Math.floor(num / 1000);
  num %= 1000;
  if (thousands > 0) {
    words += convertTwoDigits(thousands) + "Thousand ";
  }

  if (num > 0) {
    words += convertThreeDigits(num);
  }

  return "Rupees " + words.trim() + " Only";
}

/**
 * Isolated A4 Full-Width Printer:
 * Creates a clean iframe without parent margins, sidebars or grid constraints,
 * so the invoice prints at 100% full-width on A4 paper exactly like a professional corporate bill!
 */
function printInvoiceA4Document(elementId: string, docTitle: string) {
  if (typeof window === "undefined") return;

  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  const oldIframe = document.getElementById("intrihub-a4-print-frame");
  if (oldIframe) {
    oldIframe.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = "intrihub-a4-print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.style.zIndex = "-9999";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const styles = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
    .map((el) => el.outerHTML)
    .join("\n");

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${docTitle}</title>
        ${styles}
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          * {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            font-size: 11px !important;
            line-height: 1.4 !important;
            width: 100% !important;
          }
          .a4-print-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .a4-document-card {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 16px 20px !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 4px !important;
            background: #ffffff !important;
            box-shadow: none !important;
          }
          .invoice-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
        </style>
      </head>
      <body>
        <div class="a4-print-wrapper">
          <div class="a4-document-card">
            ${element.innerHTML}
          </div>
        </div>
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    }
  }, 350);
}

interface TaxInvoiceGeneratorProps {
  backHref?: string;
  backLabel?: string;
}

function InvoiceGeneratorContent({
  backHref = "/admin/orders",
  backLabel = "Orders",
}: TaxInvoiceGeneratorProps) {
  const searchParams = useSearchParams();
  const urlOrderId = searchParams?.get("orderId");

  const [invoice, setInvoice] = useState<InvoiceData>(INITIAL_INVOICE);
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">("split");
  const [copied, setCopied] = useState(false);
  const [isManualNumberUnlocked, setIsManualNumberUnlocked] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [selectedOrderPicker, setSelectedOrderPicker] = useState<string>("");
  const [loadingOrder, setLoadingOrder] = useState<boolean>(false);
  const [refreshingSerial, setRefreshingSerial] = useState<boolean>(false);
  const printRef = useRef<HTMLDivElement>(null);

  // 1. Initial hydration: Load latest sequential bill number and recent online orders
  useEffect(() => {
    let isCancelled = false;

    async function initData() {
      try {
        const [seqRes, orders] = await Promise.all([
          getNextSequentialInvoiceNumber({ increment: false }),
          getRecentOrdersForInvoicing(25),
        ]);

        if (isCancelled) return;

        setRecentOrders(orders);

        if (urlOrderId) {
          setLoadingOrder(true);
          const orderRes = await getOrderInvoiceData(urlOrderId);
          if (orderRes.success && orderRes.invoiceData) {
            setInvoice((prev) => ({
              ...prev,
              ...orderRes.invoiceData,
            }));
            setSelectedOrderPicker(urlOrderId);
            toast.success(`Online Order #${urlOrderId} loaded with sequential serial #!`);
            setMounted(true);
            setLoadingOrder(false);
            return;
          }
          setLoadingOrder(false);
        }

        const saved = localStorage.getItem("intrihub_manual_invoice_draft");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === "object") {
              setInvoice((prev) => ({
                ...prev,
                ...parsed,
                invoiceNumber: parsed.invoiceNumber?.startsWith("IH-INV-")
                  ? parsed.invoiceNumber
                  : seqRes.invoiceNumber,
                items: Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed.items : prev.items,
              }));
              setMounted(true);
              return;
            }
          } catch {}
        }

        setInvoice((prev) => ({
          ...prev,
          invoiceNumber: seqRes.invoiceNumber,
          serialNumber: seqRes.serialNumber,
          isAutoSerial: true,
        }));
      } catch (err) {
        console.error("Error initializing invoice data:", err);
      } finally {
        if (!isCancelled) setMounted(true);
      }
    }

    initData();

    return () => {
      isCancelled = true;
    };
  }, [urlOrderId]);

  // 2. Auto-save draft on changes
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("intrihub_manual_invoice_draft", JSON.stringify(invoice));
    } catch {}
  }, [invoice, mounted]);

  // Refresh sequential bill number from server
  const handleRefreshSerial = async () => {
    setRefreshingSerial(true);
    try {
      const res = await getNextSequentialInvoiceNumber({
        increment: false,
        orderId: invoice.orderId,
      });
      setInvoice((prev) => ({
        ...prev,
        invoiceNumber: res.invoiceNumber,
        serialNumber: res.serialNumber,
        isAutoSerial: true,
      }));
      setIsManualNumberUnlocked(false);
      toast.success(`Sequential Serial updated: ${res.invoiceNumber}`);
    } catch {
      toast.error("Failed to refresh serial number");
    } finally {
      setRefreshingSerial(false);
    }
  };

  // Quick Load Online Order
  const handleLoadOnlineOrder = async (orderId: string) => {
    if (!orderId) return;
    setSelectedOrderPicker(orderId);
    setLoadingOrder(true);
    try {
      const res = await getOrderInvoiceData(orderId);
      if (res.success && res.invoiceData) {
        setInvoice((prev) => ({
          ...prev,
          ...res.invoiceData,
        }));
        setIsManualNumberUnlocked(false);
        toast.success(`Order #${orderId} loaded! Serial Bill #${res.invoiceData.invoiceNumber}`);
      } else {
        toast.error(res.error || "Failed to load order data");
      }
    } catch (e: any) {
      toast.error(e?.message || "Error loading order");
    } finally {
      setLoadingOrder(false);
    }
  };

  // Calculations
  const items = Array.isArray(invoice?.items) ? invoice.items : INITIAL_INVOICE.items;

  const rawSubtotal = items.reduce((acc, item) => {
    return acc + (Number(item?.quantity) || 0) * (Number(item?.rate) || 0);
  }, 0);

  let calculatedTax = 0;
  if (invoice?.taxMode === "exclusive") {
    calculatedTax = items.reduce((acc, item) => {
      const taxable = (Number(item?.quantity) || 0) * (Number(item?.rate) || 0);
      const taxAmount = (taxable * (Number(item?.taxRate) || 0)) / 100;
      return acc + taxAmount;
    }, 0);
  } else {
    calculatedTax = items.reduce((acc, item) => {
      const total = (Number(item?.quantity) || 0) * (Number(item?.rate) || 0);
      const rate = Number(item?.taxRate) || 0;
      const base = total / (1 + rate / 100);
      return acc + (total - base);
    }, 0);
  }

  const taxableAmount = invoice?.taxMode === "exclusive" ? rawSubtotal : rawSubtotal - calculatedTax;
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

  // Reset form to fresh blank manual bill with next sequential serial
  const handleResetToNewManualBill = async () => {
    try {
      const seqRes = await getNextSequentialInvoiceNumber({ increment: false });
      const fresh: InvoiceData = {
        ...INITIAL_INVOICE,
        invoiceNumber: seqRes.invoiceNumber,
        serialNumber: seqRes.serialNumber,
        isAutoSerial: true,
        orderId: undefined,
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
        notes: "IntriHub verified direct delivery",
      };
      setInvoice(fresh);
      setSelectedOrderPicker("");
      setIsManualNumberUnlocked(false);
      localStorage.removeItem("intrihub_manual_invoice_draft");
      toast.info(`Created new manual bill template with Serial #${seqRes.invoiceNumber}`);
    } catch {
      toast.error("Failed to reset invoice");
    }
  };

  // Load sample demo
  const handleLoadSample = async () => {
    const seqRes = await getNextSequentialInvoiceNumber({ increment: false }).catch(() => ({
      invoiceNumber: "IH-INV-2026-0001",
      serialNumber: 1,
    }));
    const sample: InvoiceData = {
      ...INITIAL_INVOICE,
      invoiceNumber: seqRes.invoiceNumber,
      serialNumber: seqRes.serialNumber,
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    };
    setInvoice(sample);
    setSelectedOrderPicker("");
    toast.success("Sample invoice loaded! You can preview or print right away.");
  };

  // Trigger print & commit serial to DB
  const handlePrint = async () => {
    commitInvoiceSerial({
      invoiceNumber: invoice.invoiceNumber,
      orderId: invoice.orderId,
      customerName: invoice.customerName,
      total: grandTotal,
    }).catch(() => {});

    // Use full-bleed isolated A4 printing
    printInvoiceA4Document(
      "official-invoice-print-area",
      `${invoice.invoiceNumber} - ${invoice.customerName || "Customer"} - IntriHub Tax Invoice`
    );
  };

  // Copy plain text summary for WhatsApp / Email
  const handleCopySummary = () => {
    commitInvoiceSerial({
      invoiceNumber: invoice.invoiceNumber,
      orderId: invoice.orderId,
      customerName: invoice.customerName,
      total: grandTotal,
    }).catch(() => {});

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
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <div className="w-10 h-10 border-3 border-[#052a51] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-gray-500">Loading Tax Invoice Generator...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Native Fallback Print Stylesheet: Complete edge-to-edge isolation for Ctrl+P ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }

              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #0f172a !important;
                width: 100% !important;
                min-width: 100% !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              /* Hide the entire web app and navigation shell */
              header, footer, nav, aside, .no-print, [role="navigation"], [role="banner"], [role="complementary"], .editor-panel {
                display: none !important;
              }

              body * {
                visibility: hidden !important;
              }

              #official-invoice-print-area,
              #official-invoice-print-area * {
                visibility: visible !important;
              }

              #official-invoice-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                min-width: 100% !important;
                margin: 0 !important;
                padding: 16px 20px !important;
                box-shadow: none !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 4px !important;
                background: #ffffff !important;
              }

              .invoice-avoid-break {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
            }
          `,
        }}
      />

      {/* ── Top Bar / Header Controls (No-Print) ── */}
      <div className="no-print bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={backHref}
              className="text-xs font-bold text-gray-500 hover:text-[#052a51] flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={13} />
              <span>{backLabel}</span>
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-black text-[#F26522] uppercase tracking-wider">
              GST Tax Invoicing
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 size={11} className="text-emerald-600" />
              <span>Auto Sequential Bill #</span>
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-black text-[#052a51] mt-1.5 flex items-center gap-2.5">
            <FileText className="text-[#F26522]" size={26} />
            <span>Tax Invoice Generator</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Auto-calculates continuous serial bill numbers for both online orders and manual bills. No manual numbering needed.
          </p>
        </div>

        {/* Action Controls */}
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
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
            title="Pre-populate with sample construction materials"
          >
            <Sparkles size={14} className="text-amber-600" />
            <span>Load Sample</span>
          </button>

          {/* Reset To Blank Manual Bill */}
          <button
            type="button"
            onClick={handleResetToNewManualBill}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
            title="Clear and create a fresh manual bill with next serial"
          >
            <RotateCcw size={13} />
            <span>New Manual Bill</span>
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
            className="px-4 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 shadow-md active:scale-95 cursor-pointer"
          >
            <Printer size={15} />
            <span>Print / Save PDF (A4)</span>
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
          <span>Edit Form</span>
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

      {/* ──────────────────────────────────────────────────────────
          ⚡ 1-CLICK EASY LOAD FROM ONLINE ORDERS BAR (NO-PRINT)
         ────────────────────────────────────────────────────────── */}
      <div className="no-print bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-orange-50/60 p-4 md:p-5 rounded-2xl border border-blue-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#052a51] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Zap size={20} className="text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[#052a51]">
                Quick Load from Online Orders
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                1-Click Bill
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              Select any recent customer order to auto-populate items, customer details & assign continuous serial bill #.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <select
              value={selectedOrderPicker}
              onChange={(e) => handleLoadOnlineOrder(e.target.value)}
              disabled={loadingOrder}
              className="w-full h-10 px-3 pr-8 bg-white text-xs font-bold text-[#052a51] rounded-xl border border-blue-300 focus:outline-none focus:ring-2 focus:ring-[#F26522] cursor-pointer shadow-2xs"
            >
              <option value="">⚡ Pick an Online Order to Generate Bill...</option>
              {recentOrders.map((ord) => (
                <option key={ord.id} value={ord.id}>
                  #{ord.id} • {ord.customerName} (₹{ord.total.toLocaleString("en-IN")}) • {ord.orderStatus}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleResetToNewManualBill}
            className="h-10 px-3.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 whitespace-nowrap shadow-2xs active:scale-95 transition-all"
          >
            Clear / New Bill
          </button>
        </div>
      </div>

      {/* ── Main Work Area ── */}
      <div className="manual-invoice-page-container grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ──────────────────────────────────────────────────────────
            LEFT COLUMN: INTERACTIVE FORM (HIDDEN ON PRINT / PREVIEW-ONLY)
           ────────────────────────────────────────────────────────── */}
        {(viewMode === "split" || viewMode === "edit") && (
          <div className="editor-panel no-print xl:col-span-6 space-y-6">
            {/* 1. Invoice & Order Details */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#F26522]">
                    <FileText size={15} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-[#052a51]">1. Invoice & Order Details</h2>
                    <span className="text-[11px] text-gray-400">Official GST invoice metadata</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    <span>Auto-Serial Active</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleRefreshSerial}
                    disabled={refreshingSerial}
                    className="p-1.5 text-gray-500 hover:text-[#052a51] hover:bg-gray-100 rounded-lg transition-colors"
                    title="Refresh to latest DB serial number"
                  >
                    <RefreshCw size={14} className={refreshingSerial ? "animate-spin text-[#F26522]" : ""} />
                  </button>
                </div>
              </div>

              {/* Row 1: Invoice #, Date, Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">
                      Invoice / Bill #
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsManualNumberUnlocked(!isManualNumberUnlocked)}
                      className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                      title="Click to manually edit invoice prefix/number if ever needed"
                    >
                      {isManualNumberUnlocked ? (
                        <>
                          <Lock size={10} />
                          <span>Lock</span>
                        </>
                      ) : (
                        <>
                          <Unlock size={10} />
                          <span>Edit</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={invoice.invoiceNumber}
                      readOnly={!isManualNumberUnlocked}
                      onChange={(e) => updateField("invoiceNumber", e.target.value)}
                      className={`w-full h-10 px-3 text-xs font-mono font-black rounded-xl border focus:outline-none transition-all ${
                        isManualNumberUnlocked
                          ? "bg-white border-[#F26522] text-[#052a51] ring-2 ring-[#F26522]/20"
                          : "bg-slate-100/90 border-slate-200 text-[#052a51] cursor-default"
                      }`}
                    />
                    {!isManualNumberUnlocked && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <Lock size={13} />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {invoice.orderId ? `Linked: Order #${invoice.orderId}` : "Continuous sequential serial"}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={invoice.invoiceDate}
                    onChange={(e) => updateField("invoiceDate", e.target.value)}
                    className="w-full h-10 px-3 text-xs font-semibold text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] focus:outline-none bg-white"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Issue date</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={invoice.dueDate}
                    onChange={(e) => updateField("dueDate", e.target.value)}
                    className="w-full h-10 px-3 text-xs font-semibold text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] focus:outline-none bg-white"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Payment due date</p>
                </div>
              </div>

              {/* Row 2: Payment Method, Payment Status, Place of Supply */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Payment Method
                  </label>
                  <select
                    value={invoice.paymentMethod}
                    onChange={(e) => updateField("paymentMethod", e.target.value)}
                    className="w-full h-10 px-3 text-xs font-semibold text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="Online (UPI / NetBanking)">Online (UPI / NetBanking)</option>
                    <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                    <option value="Razorpay Online Payment">Razorpay Online</option>
                    <option value="NEFT / RTGS Transfer">NEFT / RTGS Transfer</option>
                    <option value="Cheque / Draft">Cheque / Demand Draft</option>
                    <option value="15-Day B2B Credit">15-Day B2B Credit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Payment Status
                  </label>
                  <select
                    value={invoice.paymentStatus}
                    onChange={(e) => updateField("paymentStatus", e.target.value as any)}
                    className="w-full h-10 px-3 text-xs font-bold text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="Paid">Paid (Confirmed)</option>
                    <option value="Pending">Pending</option>
                    <option value="Partially Paid">Partially Paid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Place of Supply
                  </label>
                  <input
                    type="text"
                    value={invoice.placeOfSupply}
                    onChange={(e) => updateField("placeOfSupply", e.target.value)}
                    placeholder="Karnataka (29)"
                    className="w-full h-10 px-3 text-xs font-semibold text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 2. Customer & Delivery Info */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#052a51]">
                  <User size={15} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-[#052a51]">2. Customer & Delivery Details</h2>
                  <span className="text-[11px] text-gray-400">Recipient info for GST tax filing</span>
                </div>
              </div>

              {/* Row 1: Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Customer / Business Name *
                  </label>
                  <input
                    type="text"
                    value={invoice.customerName}
                    onChange={(e) => updateField("customerName", e.target.value)}
                    placeholder="e.g. Karthik Builders / Priya Sharma"
                    className="w-full h-10 px-3 text-xs font-bold text-[#052a51] rounded-xl border border-gray-200 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Customer Phone *
                  </label>
                  <input
                    type="tel"
                    value={invoice.customerPhone}
                    onChange={(e) => updateField("customerPhone", e.target.value)}
                    placeholder="+91 98450 12345"
                    className="w-full h-10 px-3 text-xs font-semibold text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Email & GSTIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Customer Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={invoice.customerEmail}
                    onChange={(e) => updateField("customerEmail", e.target.value)}
                    placeholder="client@company.com"
                    className="w-full h-10 px-3 text-xs font-medium text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Customer GSTIN (B2B Tax Credit)
                  </label>
                  <input
                    type="text"
                    value={invoice.customerGstin}
                    onChange={(e) => updateField("customerGstin", e.target.value.toUpperCase())}
                    placeholder="29AABCK1234F1Z9"
                    className="w-full h-10 px-3 text-xs font-mono font-bold text-[#052a51] rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Site Address */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Site / Delivery Address *
                </label>
                <textarea
                  rows={2}
                  value={invoice.deliveryAddress}
                  onChange={(e) => updateField("deliveryAddress", e.target.value)}
                  placeholder="Plot/Flat number, Building name, Street, Landmark, Bengaluru, Karnataka - 560068"
                  className="w-full min-h-[64px] px-3 py-2 text-xs font-medium text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* 3. Materials & Products Table Editor */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#1E9E6B]">
                    <ShoppingBag size={15} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-black text-[#052a51]">3. Materials & Products</h2>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-black rounded-full border border-emerald-200">
                        {invoice.items.length} {invoice.items.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400">Subtotal: {formatPrice(rawSubtotal)}</span>
                  </div>
                </div>

                {/* Quick Preset Selector & Add Item */}
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
                      className="h-9 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none cursor-pointer"
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
                    className="h-9 px-3 bg-[#052a51] hover:bg-[#041f3d] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 active:scale-95"
                  >
                    <Plus size={13} />
                    <span>Custom Item</span>
                  </button>
                </div>
              </div>

              {/* Items Cards List */}
              <div className="space-y-3.5">
                {invoice.items.map((item, idx) => {
                  const lineTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-gray-50/90 rounded-2xl border border-gray-200/90 space-y-3 transition-all hover:border-gray-300"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#052a51] text-white text-[11px] font-black shrink-0 mt-1">
                          {idx + 1}
                        </span>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                              placeholder="Product / Material Name"
                              className="w-full h-9 px-3 text-xs font-bold text-[#052a51] bg-white rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={item.hsn}
                              onChange={(e) => handleUpdateItem(item.id, "hsn", e.target.value)}
                              placeholder="HSN (6907)"
                              className="w-full h-9 px-3 text-xs font-mono font-bold text-gray-700 bg-white rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none text-center"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                          title="Remove this item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={item.variant}
                          onChange={(e) => handleUpdateItem(item.id, "variant", e.target.value)}
                          placeholder="Variant details / specifications"
                          className="w-full h-8 px-3 text-[11px] text-gray-600 bg-white rounded-lg border border-gray-200 focus:border-[#F26522] focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1 items-end">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(item.id, "quantity", Math.max(1, parseFloat(e.target.value) || 1))
                            }
                            className="w-full h-9 px-2.5 text-xs font-bold text-gray-900 bg-white rounded-lg border border-gray-200 focus:border-[#F26522] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                            Unit
                          </label>
                          <select
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(item.id, "unit", e.target.value)}
                            className="w-full h-9 px-2 text-xs font-semibold text-gray-700 bg-white rounded-lg border border-gray-200 focus:border-[#F26522] focus:outline-none cursor-pointer"
                          >
                            <option value="Box">Box</option>
                            <option value="Pcs">Pcs</option>
                            <option value="Sq.Ft.">Sq.Ft.</option>
                            <option value="Bags">Bags</option>
                            <option value="Meters">Meters</option>
                            <option value="Kg">Kg</option>
                            <option value="Rolls">Rolls</option>
                            <option value="Sets">Sets</option>
                            <option value="Liters">Liters</option>
                            <option value="Tonne">Tonne</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
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
                            className="w-full h-9 px-2.5 text-xs font-bold text-[#052a51] bg-white rounded-lg border border-gray-200 focus:border-[#F26522] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                            GST Rate
                          </label>
                          <select
                            value={item.taxRate}
                            onChange={(e) =>
                              handleUpdateItem(item.id, "taxRate", parseFloat(e.target.value) || 0)
                            }
                            className="w-full h-9 px-2 text-xs font-bold text-gray-700 bg-white rounded-lg border border-gray-200 focus:border-[#F26522] focus:outline-none cursor-pointer"
                          >
                            <option value="18">18% GST</option>
                            <option value="28">28% GST</option>
                            <option value="12">12% GST</option>
                            <option value="5">5% GST</option>
                            <option value="0">0% Exempt</option>
                          </select>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 text-right sm:text-left">
                            Line Total
                          </label>
                          <div className="h-9 px-2.5 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between sm:justify-end text-right">
                            <span className="text-[10px] text-gray-400 sm:hidden">Total:</span>
                            <span className="text-xs font-black text-[#052a51] font-mono">
                              {formatPrice(lineTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => handleAddItem()}
                className="w-full py-2.5 border-2 border-dashed border-gray-200 hover:border-[#052a51] hover:bg-slate-50/50 rounded-xl text-xs font-bold text-gray-600 hover:text-[#052a51] transition-all flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Plus size={14} />
                <span>Add Another Line Item</span>
              </button>
            </div>

            {/* 4. Charges, Taxes & Terms */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <Percent size={15} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-[#052a51]">4. Charges, GST & Signatory</h2>
                  <span className="text-[11px] text-gray-400">Freight, discounts and GST application mode</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Delivery & Freight (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={invoice.deliveryFee}
                    onChange={(e) => updateField("deliveryFee", Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full h-10 px-3 text-xs font-bold text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Enter 0 for FREE delivery</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={invoice.discount}
                    onChange={(e) => updateField("discount", Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full h-10 px-3 text-xs font-bold text-emerald-600 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Project discount in INR</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    GST Calculation Mode
                  </label>
                  <select
                    value={invoice.taxMode}
                    onChange={(e) => updateField("taxMode", e.target.value as any)}
                    className="w-full h-10 px-3 text-xs font-bold text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="exclusive">Exclusive (+GST on subtotal)</option>
                    <option value="inclusive">Inclusive (GST in rates)</option>
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">Tax treatment</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-start gap-3 p-3 bg-gray-50/80 hover:bg-gray-100/80 rounded-xl border border-gray-200 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={invoice.isInterState}
                    onChange={(e) => updateField("isInterState", e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-[#F26522] rounded-sm accent-[#F26522] cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#052a51] block">
                      Inter-State Supply (IGST)
                    </span>
                    <span className="text-[11px] text-gray-500 leading-tight block mt-0.5">
                      Apply single Integrated Tax instead of CGST + SGST (outside Karnataka).
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-gray-50/80 hover:bg-gray-100/80 rounded-xl border border-gray-200 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={invoice.showSignature}
                    onChange={(e) => updateField("showSignature", e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-[#F26522] rounded-sm accent-[#F26522] cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#052a51] block">
                      Digital Signature Stamp
                    </span>
                    <span className="text-[11px] text-gray-500 leading-tight block mt-0.5">
                      Include official verified IntriHub digital seal & authorized signatory.
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Delivery / Dispatch Notes
                </label>
                <input
                  type="text"
                  value={invoice.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="e.g. 60-min Express Bengaluru dispatch via IntriHub heavy cargo fleet"
                  className="w-full h-10 px-3 text-xs text-gray-800 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  rows={3}
                  value={invoice.terms}
                  onChange={(e) => updateField("terms", e.target.value)}
                  className="w-full px-3 py-2 text-xs text-gray-700 rounded-xl border border-gray-200 focus:border-[#F26522] focus:outline-none resize-none font-mono leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────
            RIGHT COLUMN: REAL-TIME INVOICE PREVIEW & OFFICIAL A4 PRINTABLE
           ────────────────────────────────────────────────────────── */}
        {(viewMode === "split" || viewMode === "preview") && (
          <div
            className={`invoice-printable-wrapper ${
              viewMode === "split" ? "xl:col-span-6" : "xl:col-span-12 max-w-4xl mx-auto w-full"
            }`}
          >
            {/* Live Indicator Header (Hidden in Print) */}
            <div className="no-print bg-slate-900 text-white px-5 py-3 rounded-t-3xl flex items-center justify-between text-xs shadow-md">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-bold text-slate-200">Real-Time A4 Tax Invoice Preview</span>
                <span className="text-[10px] text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded-md">
                  Matches Official A4 Print
                </span>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="text-xs font-bold text-[#F26522] hover:text-[#ff7f42] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Printer size={13} />
                <span>Print A4</span>
              </button>
            </div>

            {/* ── Official Document Card (This is what prints and previews) ── */}
            <div
              id="official-invoice-print-area"
              ref={printRef}
              className="invoice-paper-card bg-white p-6 sm:p-8 rounded-b-3xl xl:rounded-3xl shadow-xl border border-gray-200/90 text-[#0f172a] relative overflow-hidden"
            >
              {/* Official Watermark Background */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/intri-web-logo.png"
                alt="Watermark"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.03] pointer-events-none object-contain z-0"
              />

              <div className="relative z-10 space-y-4">
                {/* ── 1. Top Header: Company Identity & Invoice Title ── */}
                <div className="invoice-avoid-break flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b-2 border-[#052a51]">
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/logo/intri-web-logo.png"
                      alt="IntriHub Quick-Commerce"
                      className="h-11 w-auto object-contain mb-1.5"
                    />
                    <div className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                      <p className="font-black text-xs text-[#052a51]">{invoice.sellerName}</p>
                      <div>GSTIN: <b className="font-mono">{invoice.sellerGstin}</b></div>
                      <div>Phone: <b>{invoice.sellerPhone}</b> • Email: <b>{invoice.sellerEmail}</b></div>
                      <div>Central Hub: <span className="text-gray-600">{invoice.sellerAddress}</span></div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="inline-block border-2 border-[#052a51] bg-[#052a51]/5 px-3 py-1 rounded-md">
                      <p className="text-base font-black text-[#052a51] tracking-tight">TAX INVOICE</p>
                      <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Original for Recipient</p>
                    </div>

                    <div className="mt-2 text-xs font-semibold space-y-0.5">
                      <p className="text-gray-900">
                        Invoice #: <span className="font-mono font-black text-[#052a51] text-sm">{invoice.invoiceNumber}</span>
                      </p>
                      <p className="text-gray-600 text-[11px]">
                        Date: <b>{new Date(invoice.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</b>
                      </p>
                      <p className="text-gray-600 text-[11px]">
                        Due Date: <b>{new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</b>
                      </p>
                      <p className="text-gray-600 text-[11px]">
                        Place of Supply: <b>{invoice.placeOfSupply}</b>
                      </p>
                      <div className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                        Payment: {invoice.paymentStatus} ({invoice.paymentMethod})
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── 2. Billed To & Delivered To (Two Equal Structured Boxes) ── */}
                <div className="invoice-avoid-break grid grid-cols-1 sm:grid-cols-2 gap-0 border border-slate-300 rounded-lg overflow-hidden text-xs">
                  {/* Buyer */}
                  <div className="p-3 sm:border-r border-b sm:border-b-0 border-slate-300 bg-slate-50/40">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#052a51] border-b border-slate-200 pb-1 mb-1.5 flex items-center justify-between">
                      <span>Billed To (Buyer):</span>
                      <span className="text-gray-400 font-normal">Customer Details</span>
                    </p>
                    <p className="text-sm font-extrabold text-[#0f172a]">{invoice.customerName || "Valued Customer"}</p>
                    <p className="text-blue-700 font-bold text-[11px] mt-0.5">Phone: {invoice.customerPhone || "Not Provided"}</p>
                    {invoice.customerEmail && (
                      <p className="text-gray-500 text-[11px]">Email: {invoice.customerEmail}</p>
                    )}
                    {invoice.customerGstin ? (
                      <p className="text-gray-800 text-[11px] mt-1 font-mono">
                        GSTIN: <span className="bg-white border border-slate-200 px-1 py-0.5 rounded font-bold">{invoice.customerGstin}</span>
                      </p>
                    ) : (
                      <p className="text-gray-400 text-[10px] mt-1">Unregistered Consumer (B2C)</p>
                    )}
                  </div>

                  {/* Consignee */}
                  <div className="p-3 bg-white">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#052a51] border-b border-slate-200 pb-1 mb-1.5 flex items-center justify-between">
                      <span>Shipped / Delivered To:</span>
                      <span className="text-gray-400 font-normal">Site Destination</span>
                    </p>
                    <p className="text-gray-800 font-medium text-[11px] leading-relaxed">
                      {invoice.deliveryAddress || "Bengaluru Express site delivery address"}
                    </p>
                    {invoice.notes && (
                      <p className="text-[10px] text-blue-900 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 mt-1.5 font-medium">
                        <b>Dispatch Route:</b> {invoice.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── 3. Line Items Table (Full Width, Crisp Accounting Grid) ── */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-[#052a51] font-extrabold uppercase text-[10px] tracking-wider">
                        <th className="py-2 px-2.5 text-center w-8 border-r border-slate-300">#</th>
                        <th className="py-2 px-3 border-r border-slate-300">Description of Goods & Specifications</th>
                        <th className="py-2 px-2 text-center w-16 border-r border-slate-300">HSN</th>
                        <th className="py-2 px-2 text-center w-20 border-r border-slate-300">Qty</th>
                        <th className="py-2 px-2.5 text-right w-24 border-r border-slate-300">Unit Rate</th>
                        <th className="py-2 px-2 text-center w-14 border-r border-slate-300">GST</th>
                        <th className="py-2 px-3 text-right w-28">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {invoice.items.map((item, idx) => {
                        const lineTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-2 text-gray-500 font-bold text-center border-r border-slate-200">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-200">
                              <p className="font-bold text-[#0f172a]">{item.name || "Material Product"}</p>
                              {item.variant && (
                                <p className="text-[10px] text-gray-500 font-normal mt-0.5 leading-tight">
                                  {item.variant}
                                </p>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-[11px] text-gray-700 border-r border-slate-200">
                              {item.hsn || "6907"}
                            </td>
                            <td className="py-2.5 px-2 text-center font-bold text-gray-900 border-r border-slate-200">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-2.5 px-2.5 text-right text-gray-800 border-r border-slate-200 font-mono">
                              {formatPrice(item.rate)}
                            </td>
                            <td className="py-2.5 px-2 text-center text-[11px] font-bold text-gray-700 border-r border-slate-200">
                              {item.taxRate}%
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-[#052a51] font-mono">
                              {formatPrice(lineTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── 4. Summary & Calculations & Bank/Signature ── */}
                <div className="invoice-avoid-break grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1 text-xs">
                  {/* Left Column: Amount in Words, Bank Details, Terms */}
                  <div className="sm:col-span-7 space-y-3">
                    {/* Amount in words */}
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Amount Chargeable (in words):
                      </p>
                      <p className="text-xs font-black text-[#052a51] italic mt-0.5">
                        {numberToWordsINR(grandTotal)}
                      </p>
                    </div>

                    {/* Verified IntriHub Payment / Bank details */}
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-[10px] text-gray-600 leading-relaxed">
                      <p className="font-bold text-[#052a51] uppercase mb-0.5">Bank & Remittance Details:</p>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <div>Bank: <b>HDFC Bank Ltd.</b></div>
                        <div>A/c Name: <b>IntriHub Quick-Commerce Pvt Ltd</b></div>
                        <div>A/c No: <b className="font-mono">50200088921456</b></div>
                        <div>IFSC: <b className="font-mono">HDFC0001234 (Begur Branch)</b></div>
                      </div>
                      <div className="mt-1 text-blue-700 font-bold">UPI ID: intrihub@hdfcbank</div>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="text-[10px] text-gray-500 leading-relaxed">
                      <p className="font-bold text-gray-700 mb-0.5">Terms & Conditions:</p>
                      <div className="whitespace-pre-line text-gray-600">{invoice.terms}</div>
                    </div>
                  </div>

                  {/* Right Column: Tax Breakdown & Signature */}
                  <div className="sm:col-span-5 flex flex-col justify-between items-end space-y-3">
                    <div className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Taxable Value:</span>
                        <span className="font-mono font-semibold">{formatPrice(taxableAmount)}</span>
                      </div>

                      {invoice.taxMode === "exclusive" && (
                        <>
                          {invoice.isInterState ? (
                            <div className="flex justify-between text-gray-600">
                              <span>IGST (Integrated Tax):</span>
                              <span className="font-mono font-semibold">{formatPrice(calculatedTax)}</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between text-gray-600">
                                <span>CGST (Central Tax 9%):</span>
                                <span className="font-mono font-semibold">{formatPrice(calculatedTax / 2)}</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>SGST (State Tax 9%):</span>
                                <span className="font-mono font-semibold">{formatPrice(calculatedTax / 2)}</span>
                              </div>
                            </>
                          )}
                        </>
                      )}

                      <div className="flex justify-between text-gray-600">
                        <span>Delivery & Freight:</span>
                        <span className="font-semibold">{deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}</span>
                      </div>

                      {discount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Discount Applied:</span>
                          <span className="font-mono">-{formatPrice(discount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[#052a51] font-black text-sm pt-2 border-t-2 border-slate-300">
                        <span>Total Invoice Value:</span>
                        <span className="font-mono text-base">{formatPrice(grandTotal)}</span>
                      </div>
                    </div>

                    {/* Authorized Signatory Stamp Box */}
                    {invoice.showSignature && (
                      <div className="p-2.5 border border-dashed border-slate-300 rounded-lg text-center w-full max-w-[200px] bg-slate-50/50">
                        <p className="text-[9px] text-gray-400 uppercase font-semibold">For IntriHub Quick-Commerce</p>
                        <p className="text-xs font-black text-[#052a51] italic mt-0.5 tracking-wider">INTRIHUB</p>
                        <p className="text-[9px] text-emerald-600 font-bold flex items-center justify-center gap-1 mt-0.5">
                          <CheckCircle2 size={10} />
                          <span>DIGITALLY SIGNED</span>
                        </p>
                        <p className="text-[9px] text-gray-400 mt-1 border-t border-slate-200 pt-0.5">
                          Authorized Signatory
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 5. Legal Footer ── */}
                <div className="invoice-avoid-break pt-2 border-t border-slate-200 text-center text-[9px] text-gray-400 space-y-0.5">
                  <p>Tax Invoice issued under Rule 46 of the Central Goods and Services Tax Rules, 2017.</p>
                  <p>
                    IntriHub Quick-Commerce Pvt Ltd • Begur, Bommanahalli, Bengaluru 560068 • CIN: U74999KA2024PTC189211 • www.intrihub.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TaxInvoiceGenerator({
  backHref = "/admin/orders",
  backLabel = "Orders",
}: TaxInvoiceGeneratorProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
          <div className="w-10 h-10 border-3 border-[#052a51] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500">Loading Invoice Generator...</p>
        </div>
      }
    >
      <InvoiceGeneratorContent backHref={backHref} backLabel={backLabel} />
    </Suspense>
  );
}
