"use client";

import DynamicProductUploadForm from "@/components/admin/DynamicProductUploadForm";

export default function AddProductPage() {
  return <DynamicProductUploadForm onSuccessRedirectUrl="/admin/products" />;
}
