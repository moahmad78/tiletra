"use client";

import DynamicProductUploadForm from "@/components/admin/DynamicProductUploadForm";
import { useVendorAuth } from "@/lib/vendor-auth";

export default function VendorNewProductPage() {
  const { vendor } = useVendorAuth();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <DynamicProductUploadForm
        vendorId={vendor?.id || null}
        onSuccessRedirectUrl="/vendor/products"
      />
    </div>
  );
}
