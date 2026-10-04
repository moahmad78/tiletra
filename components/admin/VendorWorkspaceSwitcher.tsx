"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getActiveWorkspaceStatus, endWorkspaceSession } from "@/lib/vendor-workspace-auth";
import { Store, ShieldAlert, LogOut, ChevronDown, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function VendorWorkspaceSwitcher({
  onOpenNewWorkspace,
}: {
  onOpenNewWorkspace?: () => void;
}) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<{
    active: boolean;
    vendorId?: string;
    vendorName?: string;
    vendorSlug?: string;
    secondsRemaining?: number;
    sessionId?: string;
  } | null>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    getActiveWorkspaceStatus()
      .then((status) => {
        if (mounted) setWorkspace(status);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const handleExit = async () => {
    try {
      await endWorkspaceSession({ sessionId: workspace?.sessionId });
      toast.success("Exited vendor workspace.");
      setWorkspace(null);
      setDropdownOpen(false);
      router.push("/admin/vendors");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to exit workspace");
    }
  };

  return (
    <div className="relative">
      {workspace?.active ? (
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-xs shadow-xs hover:brightness-105 transition-all cursor-pointer"
        >
          <ShieldAlert size={14} className="text-amber-200 animate-pulse" />
          <span className="truncate max-w-[130px]">{workspace.vendorName}</span>
          <ChevronDown size={14} className="text-amber-200" />
        </button>
      ) : (
        <button
          onClick={onOpenNewWorkspace}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
          title="Open a vendor workspace to act on their behalf"
        >
          <Store size={14} className="text-gray-500" />
          <span>Vendor Workspace</span>
        </button>
      )}

      {/* Dropdown Menu when active */}
      {dropdownOpen && workspace?.active && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-gray-100 py-2 z-50 text-xs">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">
              Active Workspace
            </p>
            <p className="font-bold text-gray-900 truncate mt-0.5">{workspace.vendorName}</p>
            <p className="text-[10px] text-gray-400 font-mono">ID: {workspace.vendorId}</p>
          </div>

          <div className="py-1">
            <Link
              href="/vendor"
              onClick={() => setDropdownOpen(false)}
              className="w-full px-3 py-2 text-left hover:bg-amber-50 text-gray-700 flex items-center gap-2 transition-colors font-medium block"
            >
              <Store size={14} className="text-amber-600" />
              Go to Vendor Panel
            </Link>

            <Link
              href="/vendor/products/new"
              onClick={() => setDropdownOpen(false)}
              className="w-full px-3 py-2 text-left hover:bg-amber-50 text-gray-700 flex items-center gap-2 transition-colors font-medium block"
            >
              <PlusCircle size={14} className="text-emerald-600" />
              Add Product as Vendor
            </Link>

            <Link
              href="/admin/workspace-activity"
              onClick={() => setDropdownOpen(false)}
              className="w-full px-3 py-2 text-left hover:bg-amber-50 text-gray-700 flex items-center gap-2 transition-colors font-medium block"
            >
              <ShieldAlert size={14} className="text-orange-600" />
              View Workspace Activity
            </Link>
          </div>

          <div className="pt-1 border-t border-gray-100 px-2">
            <button
              onClick={handleExit}
              className="w-full py-1.5 px-2 rounded-lg text-rose-600 hover:bg-rose-50 text-left font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut size={13} />
              Exit Workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
