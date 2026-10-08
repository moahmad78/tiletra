import { redirect } from "next/navigation";
import { getCpoSession } from "@/lib/cpo/auth";
import CpoSidebar from "@/components/cpo/CpoSidebar";
import CpoHeader from "@/components/cpo/CpoHeader";
import CpoWorkspaceBanner from "@/components/cpo/CpoWorkspaceBanner";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CPO Workspace",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CpoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCpoSession();

  if (!session) {
    redirect("/vendor/login");
  }

  return (
    <div
      className="h-screen h-[100dvh] max-h-screen bg-[#F3F4F5] text-slate-800 flex flex-col font-sans selection:bg-[#F26522] selection:text-white notranslate overflow-hidden"
      translate="no"
    >
      {/* Persistent CPO Workspace Banner when acting on behalf of vendor */}
      <CpoWorkspaceBanner />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* CPO Navigation Sidebar - Fixed in place */}
        <CpoSidebar />

        {/* Main Content Area - Only this scrolls */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto scroll-smooth">
          <CpoHeader userEmail={session.email} />
          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

