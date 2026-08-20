"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import VendorSidebar from "@/components/vendor/VendorSidebar";
import VendorHeader from "@/components/vendor/VendorHeader";
import { useVendorAuth } from "@/lib/vendor-auth";
import { AlertCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, vendor } = useVendorAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isAuthPage = pathname === "/vendor/login" || pathname === "/vendor/signup" || pathname === "/vendor/apply";

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated && !isAuthPage) {
      router.push("/vendor/login");
    }
  }, [isAuthenticated, isAuthPage, router]);

  if (!mounted) return null;

  if (isAuthPage) {
    return <div className="min-h-screen bg-[#F3F4F5]">{children}</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#052a51] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="animate-spin text-[#F26522]" size={32} />
          <p className="text-sm font-bold">Redirecting to Vendor Login...</p>
        </div>
      </div>
    );
  }

  // If vendor account is in pending or rejected state, block access to panel routes and display Under Review screen
  if (vendor && vendor.status !== "approved") {
    return (
      <div className="min-h-screen bg-[#F3F4F5] flex flex-col">
        <VendorHeader onMobileMenuToggle={() => {}} />

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 shadow-xl text-center space-y-5">
            {vendor.status === "pending" && (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <Clock size={36} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    Application Under Review
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Your seller account for <strong>{vendor.businessName}</strong> has been submitted and is currently awaiting Super Admin approval.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-1">
                  <p className="font-bold text-amber-800">⏳ Status: Pending Approval</p>
                  <p>• Registered email: <strong>{vendor.contactEmail}</strong></p>
                  <p>• Category: <strong>{vendor.category || "General"}</strong></p>
                  <p className="pt-1 text-amber-800/80">
                    Once our platform team approves your shop, you will receive full access to manage your products and fulfill customer orders.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Check Approval Status (Refresh)
                  </button>
                  <button
                    onClick={() => {
                      router.push("/vendor/login");
                    }}
                    className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
                  >
                    Switch Account / Logout
                  </button>
                </div>
              </>
            )}

            {vendor.status === "rejected" && (
              <>
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertTriangle size={36} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    Application Not Approved
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Your seller application could not be approved at this time.
                  </p>
                </div>

                {vendor.rejectionReason && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-left text-xs text-rose-900">
                    <p className="font-bold text-rose-800">Feedback from Admin:</p>
                    <p className="mt-1">{vendor.rejectionReason}</p>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => router.push("/vendor/apply")}
                    className="w-full py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Re-apply with Updated Information
                  </button>
                </div>
              </>
            )}

            {vendor.status === "suspended" && (
              <>
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertTriangle size={36} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    Account Suspended
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Your shop privileges have been temporarily suspended by the platform administrator. All product listings are hidden.
                  </p>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F5] flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <VendorSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 w-[260px] h-full animate-in slide-in-from-left duration-200">
            <VendorSidebar collapsed={false} setCollapsed={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? "md:ml-[72px]" : "md:ml-[260px]"
        }`}
      >
        <VendorHeader onMobileMenuToggle={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 md:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
