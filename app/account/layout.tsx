import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AccountSidebar from "@/components/account/AccountSidebar";
import { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col bg-[#F1F3F6]">
      <Header />

      <div className="w-full max-w-[1340px] mx-auto px-3 sm:px-6 lg:px-8 pt-[76px] sm:pt-[84px] md:pt-[175px] lg:pt-[180px] pb-14 flex-1">
        {/* ── DESKTOP VIEW (2-column with persistent sidebar on all /account/* routes) ── */}
        <div className="hidden md:grid grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr] gap-6 items-start">
          <Suspense fallback={<div className="w-full h-96 bg-white rounded-2xl animate-pulse" />}>
            <AccountSidebar />
          </Suspense>

          <div className="min-w-0 flex-1">{children}</div>
        </div>

        {/* ── MOBILE VIEW (Single column) ── */}
        <div className="block md:hidden">{children}</div>
      </div>

      <Footer />
    </main>
  );
}
