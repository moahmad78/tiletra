"use client";

import { useState, useEffect } from "react";
import { useVendorAuth } from "@/lib/vendor-auth";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Store, Bell, CheckCircle2, AlertCircle, Power } from "lucide-react";
import Link from "next/link";
import LanguageSelector from "@/components/translate/LanguageSelector";
import { useSocket } from "@/lib/socket";
import { toast } from "sonner";
import { broadcastLiveEvent } from "@/lib/live-sync";
import { getVendorOnlineStatus, toggleVendorOnlineStatus } from "@/lib/actions/vendor";

export default function VendorHeader({
  onMobileMenuToggle,
}: {
  onMobileMenuToggle: () => void;
}) {
  const { vendor, logout, setVendor } = useVendorAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOnline, setIsOnline] = useState<boolean>(vendor?.isOnline ?? true);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  // Sync initial online status directly from database
  useEffect(() => {
    if (!vendor?.id) return;
    getVendorOnlineStatus(vendor.id).then((res) => {
      if (res.success && typeof res.isOnline === "boolean") {
        setIsOnline(res.isOnline);
      }
    });
  }, [vendor?.id]);

  const handleToggleOnline = async () => {
    if (!vendor?.id || updatingStatus) return;
    const targetStatus = !isOnline;
    setUpdatingStatus(true);
    // Optimistic UI update
    setIsOnline(targetStatus);

    try {
      const res = await toggleVendorOnlineStatus(vendor.id, targetStatus);
      if (res.success) {
        const finalStatus = Boolean(res.isOnline);
        setIsOnline(finalStatus);
        if (vendor && setVendor) {
          setVendor({ ...vendor, isOnline: finalStatus });
        }
        broadcastLiveEvent("vendor:status-changed", { vendorId: vendor.id, isOnline: finalStatus });
        if (finalStatus) {
          toast.success("🟢 Store is now ONLINE!", {
            description: "Your catalog is live and visible to customers on website and app.",
          });
        } else {
          toast.warning("🔴 Store is now OFFLINE", {
            description: "Your products are hidden from the storefront. Turn back online to receive new orders.",
          });
        }
      } else {
        setIsOnline(!targetStatus);
        toast.error("Failed to update status", { description: res.error });
      }
    } catch (e: any) {
      setIsOnline(!targetStatus);
      toast.error("Network error while updating store status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Play a soft notification chime on new order
  const playChime = () => {
    try {
      if (typeof window !== "undefined" && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch {}
  };

  // ── Real-Time Socket.IO Listener for Vendor Room ──
  const vendorRoom = vendor?.id ? `vendor:${vendor.id}` : null;
  useSocket(vendorRoom, {
    "new-order": (data: any) => {
      console.log("⚡ [VENDOR SOCKET] new-order received:", data);
      playChime();
      setUnreadCount((c) => c + 1);
      broadcastLiveEvent("order:new", data);

      toast.success(`🎉 New Order #${data.orderId || data.id || "Received"}!`, {
        description: `${data.customerName || "Customer"} placed an order for ₹${(data.total || 0).toLocaleString("en-IN")}`,
        duration: 9000,
        action: {
          label: "View & Pack",
          onClick: () => router.push(`/vendor/orders`),
        },
      });
    },
    "order-status-updated": (data: any) => {
      console.log("⚡ [VENDOR SOCKET] order-status-updated:", data);
      broadcastLiveEvent("order:status-updated", data);
      toast.info(`📦 Order Status Updated`, {
        description: `Order #${data.orderId || data.id} status changed to ${data.status || data.newStatus}`,
      });
    },
    "low-stock": (data: any) => {
      toast.warning(`⚠️ Low Stock Alert: ${data.productName}`, {
        description: `Only ${data.quantity} units left in your inventory.`,
      });
    },
  });

  const handleLogout = () => {
    logout();
    router.push("/vendor/login");
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200/80 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-sm md:text-base font-extrabold text-[#052a51] flex items-center gap-2">
            <Store size={18} className="text-emerald-600" />
            {vendor?.businessName || "Vendor Portal"}
          </h1>
          <p className="text-[11px] text-gray-500 hidden md:block">
            Multi-Vendor Seller Panel • {vendor?.category || "Building Materials"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Store Online / Offline Toggle */}
        <button
          type="button"
          onClick={handleToggleOnline}
          disabled={updatingStatus}
          title={isOnline ? "Store is ONLINE (Click to go offline)" : "Store is OFFLINE (Click to go online)"}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-xs border cursor-pointer ${
            isOnline
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400"
              : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 hover:border-rose-400"
          } ${updatingStatus ? "opacity-60 cursor-wait" : ""}`}
        >
          <span className="relative flex h-2.5 w-2.5">
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isOnline ? "bg-emerald-500" : "bg-rose-500"
              }`}
            ></span>
          </span>
          <span className="font-extrabold tracking-tight">
            {updatingStatus ? "Saving..." : isOnline ? "Online" : "Offline"}
          </span>
          <span className="hidden xl:inline text-[10px] font-semibold text-gray-500 border-l border-gray-300 pl-1.5">
            {isOnline ? "Store Open" : "Closed"}
          </span>
        </button>

        {/* Language Selector */}
        <LanguageSelector variant="navbar" />

        {/* Real-time Notification Bell */}
        <button
          onClick={() => {
            setUnreadCount(0);
            router.push("/vendor/orders");
          }}
          className="relative p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          title="Live Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Quick Add Product Button */}
        <Link
          href="/vendor/products/new"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          + Add Product
        </Link>

        {/* User Account / Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
            {vendor?.businessName ? vendor.businessName.charAt(0).toUpperCase() : "V"}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-gray-800 truncate max-w-[120px]">
              {vendor?.ownerName || "Seller"}
            </p>
            <p className="text-[10px] text-gray-400 capitalize">{vendor?.status}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Log out from Vendor Panel"
            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
