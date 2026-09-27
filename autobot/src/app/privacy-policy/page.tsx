import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, Eye, Server, RefreshCw, Mail } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Intrihub Customer Desk",
  description: "Official Privacy Policy for Intrihub WhatsApp Customer Support Desk.",
};

export default function PrivacyPolicyPage() {
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
              <ShieldCheck className="h-5 w-5 text-[#F26522]" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#052A51]">Privacy Policy</h1>
          </div>
          <p className="text-sm text-slate-500">
            Last Updated: September 27, 2026 • Official Privacy Policy for Intrihub Customer Desk
          </p>
        </div>

        {/* Introduction */}
        <section className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
          <h2 className="text-base font-bold text-[#052A51] flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#F26522]" />
            1. Introduction
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Welcome to <strong>Intrihub (Tiletra)</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how our WhatsApp Customer Support Desk collects, uses, and safeguards your information when you interact with our services, catalog, or WhatsApp communications.
          </p>
        </section>

        {/* Information We Collect */}
        <section className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
          <h2 className="text-base font-bold text-[#052A51] flex items-center gap-2">
            <Server className="h-4 w-4 text-[#052A51]" />
            2. Information We Collect
          </h2>
          <div className="space-y-3 text-sm text-slate-600">
            <p>We collect information in the following ways to serve your construction and materials requirements:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong>WhatsApp Inquiries & Orders:</strong> Phone numbers, customer names, delivery site locations, and messages regarding tile calculations, quotation requests, and order tracking.
              </li>
              <li>
                <strong>Customer Support Desk Records:</strong> Inquiries submitted for site deliveries, damage replacement guarantees (photos/videos), and invoice details.
              </li>
              <li>
                <strong>Verified Catalog & Pricing Data:</strong> Product specs and inventory information used to provide accurate pricing and availability.
              </li>
            </ul>
          </div>
        </section>

        {/* How We Use Your Information */}
        <section className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
          <h2 className="text-base font-bold text-[#052A51] flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#1E9E6B]" />
            3. How We Use Your Information
          </h2>
          <div className="space-y-2 text-sm text-slate-600">
            <p>We process your data for legitimate customer service and order fulfillment purposes:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>Delivering instant and accurate answers to customer questions regarding tile quantities, catalog specifications, and pricing.</li>
              <li>Dispatching 60-minute site deliveries in Bengaluru and scheduling pan-India shipments.</li>
              <li>Enabling direct senior executive support when requested by customers.</li>
              <li>Processing 100% free damage replacements and handling return requests seamlessly.</li>
            </ul>
          </div>
        </section>

        {/* Third-Party Service Providers */}
        <section className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
          <h2 className="text-base font-bold text-[#052A51] flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-[#F26522]" />
            4. Secure Infrastructure Partners
          </h2>
          <div className="space-y-3 text-sm text-slate-600">
            <p>To provide reliable, high-speed communication, we partner with secure infrastructure providers:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li><strong>Meta Platforms (WhatsApp Cloud API):</strong> Used to send and receive verified WhatsApp customer messages.</li>
              <li><strong>Supabase (PostgreSQL Enterprise Storage):</strong> Securely stores encrypted message logs and customer inquiry history.</li>
            </ul>
            <p className="text-xs text-slate-400">We never sell, rent, or trade your personal information to third parties.</p>
          </div>
        </section>

        {/* Contact Us */}
        <section className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
          <h2 className="text-base font-bold text-[#052A51] flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#F26522]" />
            5. Contact Us
          </h2>
          <p className="text-sm text-slate-600">
            If you have questions regarding this policy or wish to request data updates, please contact:
          </p>
          <div className="text-sm font-bold text-[#052A51]">
            Email: <a href="mailto:support@intrihub.com" className="text-[#F26522] hover:underline">support@intrihub.com</a> • WhatsApp Helpline: +91 70901 20211
          </div>
        </section>
      </div>
    </div>
  );
}
