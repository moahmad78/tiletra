import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NotFoundClient from "@/components/NotFoundClient";

export const metadata: Metadata = {
  title: "404 - Page Not Found | IntriHub",
  description: "The page or resource you were looking for is unavailable or has moved. Search 500+ building materials or contact IntriHub support.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />
      <NotFoundClient />
      <Footer />
    </main>
  );
}
