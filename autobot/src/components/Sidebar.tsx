"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, Settings, ExternalLink, Headphones } from "lucide-react";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "WhatsApp Live Inbox", href: "/chat", icon: MessageSquare },
  { name: "Support Desk & Catalog", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200 text-slate-900 transition-all duration-300 select-none shadow-xs">
      {/* Brand Header */}
      <div className="flex h-20 items-center justify-between px-6 border-b border-slate-100 bg-white">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo/intri-web-logo.png"
            alt="Intrihub"
            className="h-8 w-auto object-contain"
          />
        </Link>
        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-orange-50 text-[#F26522] border border-orange-200 px-2 py-0.5 rounded-full">
          DESK
        </span>
      </div>

      {/* Navigation links */}
      <div className="flex flex-1 flex-col overflow-y-auto py-6 px-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2.5">
          IntriHub Customer Hub
        </div>
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-[#F26522] text-white shadow-md shadow-[#F26522]/20"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#052A51]"
                }`}
              >
                <item.icon
                  className={`h-4 w-4 flex-shrink-0 transition-colors ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-[#F26522]"
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Quick link to main Intrihub storefront */}
        <div className="mt-8 pt-4 border-t border-slate-100 px-2">
          <a
            href="https://www.intrihub.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-[#F26522] hover:bg-orange-50/50 transition-colors border border-transparent hover:border-orange-200"
          >
            <span>Visit Intrihub.com</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="border-t border-slate-100 p-3.5 bg-slate-50/80">
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#25D366]"></span>
          </div>
          <div className="text-xs">
            <p className="font-bold text-[#052A51]">WhatsApp Live Desk</p>
            <p className="text-[11px] text-[#1E9E6B] font-bold">Instant Support Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
