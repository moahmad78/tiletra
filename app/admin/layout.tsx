"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminInactivityGuard from "@/components/admin/AdminInactivityGuard";
import { useAdminAuth } from "@/lib/admin-auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAdminAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasStoredSession, setHasStoredSession] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (pathname === "/admin/login") return;

    // Check both Zustand state and sessionStorage to prevent premature redirect during initial hydration
    let isStoredAuth = false;
    try {
      const stored = sessionStorage.getItem("intrihub-admin-auth-session");
      if (stored) {
        const parsed = JSON.parse(stored);
        isStoredAuth = Boolean(parsed?.state?.isAuthenticated);
        if (isStoredAuth) {
          setHasStoredSession(true);
        }
      }
    } catch {}

    if (!isAuthenticated && !isStoredAuth) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, pathname, router]);

  if (!mounted) return null;

  // Don't render admin shell on the login page
  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-[#F3F4F5] notranslate" translate="no">{children}</div>;
  }

  // Block dashboard content for unauthenticated users while redirecting (only if neither Zustand nor sessionStorage has auth)
  if (!isAuthenticated && !hasStoredSession) {
    return (
      <div className="min-h-screen bg-[#F3F4F5] flex items-center justify-center notranslate" translate="no">
        <div className="w-8 h-8 border-3 border-[#052a51] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F5] flex notranslate" translate="no">
      {/* 10-Minute Inactivity Auto-Logout Guard */}
      <AdminInactivityGuard />

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex notranslate" translate="no">
          {/* Backdrop: strictly at z-10 so it never covers the drawer */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity z-10"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer content: strictly at z-20 above backdrop */}
          <div className="relative z-20 w-[260px] h-full animate-in slide-in-from-left duration-200">
            <AdminSidebar
              collapsed={false}
              setCollapsed={() => setMobileOpen(false)}
              onItemClick={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 notranslate ${
          collapsed ? "md:ml-[72px]" : "md:ml-[250px]"
        }`}
        translate="no"
      >
        <AdminHeader onMobileMenuToggle={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 md:p-8 max-w-[1600px] w-full mx-auto notranslate" translate="no">
          {children}
        </main>
      </div>
    </div>
  );
}
