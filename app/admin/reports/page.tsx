"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  DollarSign,
  Receipt,
  Users,
  Store,
  CheckCircle2,
  Loader2,
  FileText,
  BarChart3,
} from "lucide-react";
import {
  exportSalesReportCsv,
  exportTaxGstReportCsv,
  exportVendorSettlementReportCsv,
  exportCustomerCrmReportCsv,
} from "@/lib/actions/reports";
import { toast } from "sonner";

export default function AdminReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const triggerCsvDownload = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownload = async (type: "sales" | "tax" | "vendor" | "crm") => {
    try {
      setDownloading(type);
      toast.info("Compiling latest ledger data...");

      let res: any;
      if (type === "sales") res = await exportSalesReportCsv();
      else if (type === "tax") res = await exportTaxGstReportCsv();
      else if (type === "vendor") res = await exportVendorSettlementReportCsv();
      else if (type === "crm") res = await exportCustomerCrmReportCsv();

      if (res?.success && res.csv) {
        triggerCsvDownload(res.filename, res.csv);
        toast.success(`Exported ${res.filename} successfully!`);
      } else {
        toast.error(res?.error || "Export generation failed");
      }
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setDownloading(null);
    }
  };

  const reportCards = [
    {
      id: "sales" as const,
      title: "Full Sales & Revenue Ledger",
      desc: "Complete order transactions with subtotal, discounts, delivery fees, customer contact, and payment gateway IDs.",
      icon: DollarSign,
      color: "from-blue-600 to-indigo-700",
      accentBg: "bg-blue-50 text-blue-700 border-blue-200",
      format: "CSV (Excel Compatible)",
      itemsCovered: "Up to 2,000 recent orders",
    },
    {
      id: "tax" as const,
      title: "GST & Tax Compliance Report",
      desc: "Detailed state-wise CGST (9%), SGST (9%), and IGST (18%) tax liabilities for CA reconciliation and quarterly filing.",
      icon: Receipt,
      color: "from-emerald-600 to-teal-700",
      accentBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      format: "CSV (Excel Compatible)",
      itemsCovered: "Paid orders with invoice values",
    },
    {
      id: "vendor" as const,
      title: "Vendor Payouts & Settlement Ledger",
      desc: "Split-level platform commission cuts, net vendor payable amounts, order fulfillment state, and registered bank accounts.",
      icon: Store,
      color: "from-amber-600 to-orange-700",
      accentBg: "bg-amber-50 text-amber-700 border-amber-200",
      format: "CSV (Excel Compatible)",
      itemsCovered: "Active & completed vendor splits",
    },
    {
      id: "crm" as const,
      title: "Customer Directory & Lifetime Value (LTV)",
      desc: "Registered user profiles, verified phone numbers, total orders placed, and lifetime spend per customer account.",
      icon: Users,
      color: "from-purple-600 to-pink-700",
      accentBg: "bg-purple-50 text-purple-700 border-purple-200",
      format: "CSV (Excel Compatible)",
      itemsCovered: "All registered buyers & accounts",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-[#052a51]">Reports & Data Exports</h1>
            <span className="text-[11px] font-bold bg-[#F26522]/10 text-[#F26522] px-2.5 py-0.5 rounded-full">
              Module 5
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Pre-built, 1-click exportable business ledgers for investors, accountants, and growth marketing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl">
            Live Database Feeds
          </span>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reportCards.map((card) => {
          const Icon = card.icon;
          const isBusy = downloading === card.id;

          return (
            <div
              key={card.id}
              className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col justify-between hover:border-[#052a51]/30 transition group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${card.color} text-white shadow-sm`}>
                    <Icon size={22} />
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${card.accentBg}`}>
                    {card.format}
                  </span>
                </div>

                <h3 className="text-base font-black text-[#052a51] group-hover:text-[#F26522] transition">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  {card.desc}
                </p>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-semibold">
                  <span>Coverage:</span>
                  <span className="text-gray-700 font-bold">{card.itemsCovered}</span>
                </div>
              </div>

              <button
                onClick={() => handleDownload(card.id)}
                disabled={Boolean(downloading)}
                className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#052a51] hover:bg-[#07386c] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isBusy ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generating CSV...
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    Download CSV Report
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
