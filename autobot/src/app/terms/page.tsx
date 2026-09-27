import Link from "next/link";
import { FileText, ArrowLeft, CheckCircle2, Shield, Mail } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Intrihub Customer Desk",
  description: "Terms of Service for Intrihub WhatsApp Customer Support Desk.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 py-12 px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#F26522] hover:text-[#d95a1e] transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#F26522]" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#052A51]">Terms of Service</h1>
          </div>
          <p className="text-sm text-slate-500">
            Last Updated: September 27, 2026 • Governing Terms for Intrihub Customer Desk
          </p>
        </div>

        {/* 1. Acceptance */}
        <section className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
          <h2 className="text-base font-bold text-[#052A51] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#1E9E6B]" />
            1. Acceptance of Terms
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            By communicating through Intrihub&apos;s WhatsApp Customer Desk or placing building material inquiries, you agree to these Terms of Service and Intrihub&apos;s standard order fulfillment and return policies.
          </p>
        </section>

        {/* 2. Permitted Use */}
        <section className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
          <h2 className="text-base font-bold text-[#052A51] flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#052A51]" />
            2. WhatsApp Communications & Fair Use
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Our WhatsApp channel is designed for genuine inquiries related to tiles, sanitaryware, quotations, deliveries, and vendor onboardings. Users agree not to send spam or inappropriate communications.
          </p>
        </section>

        {/* 3. Product Estimates & Pricing */}
        <section className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
          <h2 className="text-base font-bold text-[#052A51] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#F26522]" />
            3. Quotations & Order Commitments
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Estimates and tile calculations provided through the desk are based on standard measurements and standard 10% cutting margins. Final invoices are generated with full GST compliance upon dispatch confirmation.
          </p>
        </section>

        {/* 4. Contact */}
        <section className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
          <h2 className="text-base font-bold text-[#052A51] flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#F26522]" />
            4. Support Desk Contact
          </h2>
          <p className="text-sm text-slate-600">
            Questions regarding our terms or services can be directed to: <a href="mailto:support@intrihub.com" className="text-[#F26522] font-bold hover:underline">support@intrihub.com</a> or WhatsApp <span className="font-bold text-[#052A51]">+91 70901 20211</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
