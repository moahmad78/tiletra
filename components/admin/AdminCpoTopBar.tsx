"use client";

import { ShieldCheck } from "lucide-react";
import AdminPortalSwitchTabs from "@/components/admin/AdminPortalSwitchTabs";

/**
 * Executive top switch bar shown inside `/cpo/*` ONLY when the viewer
 * is an authenticated Super Admin switching from the Admin Panel.
 * Regular CPO accounts never render this component.
 */
export default function AdminCpoTopBar({ adminEmail }: { adminEmail: string }) {
  return (
    <div
      className="shrink-0 z-50 bg-gradient-to-r from-[#052a51] via-[#073466] to-[#052a51] text-white px-3 md:px-5 py-1.5 border-b border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs notranslate"
      translate="no"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] font-black uppercase tracking-wider text-amber-300">
          <ShieldCheck size={12} />
          Admin Panel Access
        </span>
        <span className="hidden sm:inline text-white/75 text-[11px] font-medium truncate">
          Signed in as <strong className="text-white">{adminEmail}</strong> • Quick Portal Switch
        </span>
      </div>

      <AdminPortalSwitchTabs activePortal="cpo" variant="banner" />
    </div>
  );
}
