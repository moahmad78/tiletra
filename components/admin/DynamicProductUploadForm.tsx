"use client";

import SharedProductUploadWizard from "@/components/shared/SharedProductUploadWizard";

export interface DynamicProductUploadFormProps {
  onSuccessRedirectUrl?: string;
  vendorId?: string | null;
  initialCategory?: string;
  isAdminOrCpo?: boolean;
}

export default function DynamicProductUploadForm({
  onSuccessRedirectUrl = "/admin/products",
  vendorId = null,
  isAdminOrCpo = false,
}: DynamicProductUploadFormProps) {
  return (
    <SharedProductUploadWizard
      onSuccessRedirectUrl={onSuccessRedirectUrl}
      vendorId={vendorId}
      isAdminOrCpo={isAdminOrCpo}
    />
  );
}
