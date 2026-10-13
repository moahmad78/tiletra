"use client";

import DynamicProductUploadForm from "@/components/admin/DynamicProductUploadForm";
import { useEffectiveVendor } from "@/hooks/useEffectiveVendor";

export default function VendorNewProductPage() {
  const { vendor } = useEffectiveVendor();

  return (
    <div className="w-full space-y-6">
      <DynamicProductUploadForm
        vendorId={vendor?.id || null}
        onSuccessRedirectUrl="/vendor/products"
      />
    </div>
  );
}
