"use client";

import { useState, useEffect } from "react";
import { useVendorAuth, VendorSession } from "@/lib/vendor-auth";
import { getActiveWorkspaceStatus } from "@/lib/vendor-workspace-auth";

export interface EffectiveVendorResult {
  vendor: Partial<VendorSession> | null;
  isAuthenticated: boolean;
  isWorkspace: boolean;
  loading: boolean;
  timeRemaining?: number;
}

/**
 * Returns the active vendor context for client-side pages and components:
 * 1. If real vendor is logged in via OTP/password -> returns real vendor session.
 * 2. If admin is currently inside an active DB workspace session -> returns the workspace vendor.
 * 3. Otherwise -> unauthenticated.
 */
export function useEffectiveVendor(): EffectiveVendorResult {
  const { vendor, isAuthenticated } = useVendorAuth();
  const [workspaceVendor, setWorkspaceVendor] = useState<Partial<VendorSession> | null>(null);
  const [isWorkspace, setIsWorkspace] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If standard vendor session exists, use it
    if (vendor && isAuthenticated) {
      setIsWorkspace(false);
      setLoading(false);
      return;
    }

    // Otherwise check if admin workspace session is active
    let mounted = true;
    getActiveWorkspaceStatus()
      .then((status) => {
        if (!mounted) return;
        if (status.active && status.vendorId) {
          setWorkspaceVendor({
            id: status.vendorId,
            businessName: status.vendorName || "Vendor Store",
            slug: status.vendorSlug || status.vendorId,
            status: "approved",
            commissionRate: 15.0,
            contactEmail: status.adminEmail || "",
            contactPhone: "",
            ownerName: status.vendorName || "Vendor",
            ownerId: status.vendorId,
          });
          setIsWorkspace(true);
          setTimeRemaining(status.secondsRemaining);
        }
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [vendor, isAuthenticated]);

  if (vendor && isAuthenticated) {
    return {
      vendor,
      isAuthenticated: true,
      isWorkspace: false,
      loading: false,
    };
  }

  if (isWorkspace && workspaceVendor) {
    return {
      vendor: workspaceVendor,
      isAuthenticated: true,
      isWorkspace: true,
      loading: false,
      timeRemaining,
    };
  }

  return {
    vendor: null,
    isAuthenticated: false,
    isWorkspace: false,
    loading,
  };
}
