import { redirect } from "next/navigation";
import { getCpoSession } from "@/lib/cpo/auth";
import CpoSidebar from "@/components/cpo/CpoSidebar";
import CpoHeader from "@/components/cpo/CpoHeader";
import CpoWorkspaceBanner from "@/components/cpo/CpoWorkspaceBanner";

export const dynamic = "force-dynamic";

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
    <div className="min-h-screen bg-[#F3F4F5] text-slate-800 flex flex-col font-sans selection:bg-[#F26522] selection:text-white notranslate" translate="no">
      {/* Persistent CPO Workspace Banner when acting on behalf of vendor */}
      <CpoWorkspaceBanner />

      <div className="flex flex-1 overflow-hidden">
        {/* CPO Navigation Sidebar */}
        <CpoSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <CpoHeader userEmail={session.email} />
          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

