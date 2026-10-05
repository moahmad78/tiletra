"use client";

import CategoryManagementComponent from "@/components/admin/CategoryManagementComponent";

export default function CpoCategoriesPage() {
  return (
    <div className="space-y-6">
      <CategoryManagementComponent
        portalLabel="Category & Department Taxonomy (CPO Panel)"
        badgeLabel="CPO Governance"
      />
    </div>
  );
}
