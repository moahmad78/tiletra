"use client";

import DynamicProductUploadForm from "@/components/admin/DynamicProductUploadForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function DirectProductUploadPage() {
  return (
    <main className="min-h-screen bg-[#F3F4F5] flex flex-col pt-[56px] md:pt-[124px]">
      <Header />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <DynamicProductUploadForm onSuccessRedirectUrl="/admin/products" />
      </div>
      <Footer />
    </main>
  );
}
