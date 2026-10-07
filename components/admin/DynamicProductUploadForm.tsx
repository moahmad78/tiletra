"use client";

import SharedProductUploadWizard from "@/components/shared/SharedProductUploadWizard";

export interface DynamicProductUploadFormProps {
  onSuccessRedirectUrl?: string;
  vendorId?: string | null;
  initialCategory?: string;
  isAdminOrCpo?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
  headerBadge?: string;
  headerVendorSlot?: React.ReactNode;
}

export default function DynamicProductUploadForm({
  onSuccessRedirectUrl = "/admin/products",
  vendorId = null,
  isAdminOrCpo = false,
  headerTitle,
  headerSubtitle,
  headerBadge,
  headerVendorSlot,
}: DynamicProductUploadFormProps) {
  return (
    <SharedProductUploadWizard
      onSuccessRedirectUrl={onSuccessRedirectUrl}
      vendorId={vendorId}
      isAdminOrCpo={isAdminOrCpo}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
      headerBadge={headerBadge}
      headerVendorSlot={headerVendorSlot}
    />
  );
}
