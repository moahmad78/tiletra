"use client";

import DynamicProductUploadForm from "@/components/admin/DynamicProductUploadForm";
import { useEffectiveVendor } from "@/hooks/useEffectiveVendor";

export default function VendorNewProductPage() {
  const { vendor } = useEffectiveVendor();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <DynamicProductUploadForm
        vendorId={vendor?.id || null}
        onSuccessRedirectUrl="/vendor/products"
      />
    </div>
  );
}
