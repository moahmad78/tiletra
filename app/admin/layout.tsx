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

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [isAuthenticated, pathname, router]);

  if (!mounted) return null;

  // Don't render admin shell on the login page
  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-[#F3F4F5]">{children}</div>;
  }

  // Block dashboard content for unauthenticated users while redirecting
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F3F4F5] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#052a51] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F5] flex">
      {/* 10-Minute Inactivity Auto-Logout Guard */}
      <AdminInactivityGuard />

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 w-[260px] h-full animate-in slide-in-from-left duration-200">
            <AdminSidebar collapsed={false} setCollapsed={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? "md:ml-[72px]" : "md:ml-[250px]"
        }`}
      >
        <AdminHeader onMobileMenuToggle={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 md:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
