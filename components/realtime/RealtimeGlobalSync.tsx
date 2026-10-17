"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

/**
 * Global Real-Time Synchronization Listener
 * Connects the web customer storefront and admin panel to live WebSocket updates.
 * Handles instant order notifications, status updates, and live data broadcasts.
 */
export default function RealtimeGlobalSync() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const socket = getSocket();
    if (!socket) return;

    const handleConnect = () => {
      console.log("⚡ [REALTIME SYNC] Connected to socket gateway:", socket.id);
      
      // Auto-join user personal notification room if authenticated
      if (user?.id) {
        const userRoom = `user:${user.id}`;
        socket.emit("join-room", userRoom);
        joinedRoomsRef.current.add(userRoom);
      }
    };

    // If socket is already connected
    if (socket.connected && user?.id) {
      const userRoom = `user:${user.id}`;
      socket.emit("join-room", userRoom);
      joinedRoomsRef.current.add(userRoom);
    }

    // 1. Live Order Status Updates (Customer Facing)
    const handleOrderStatusUpdated = (data: any) => {
      console.log("⚡ [REALTIME] order-status-updated:", data);
      const orderId = data.orderId || data.id || "Order";
      const status = data.status || data.newStatus || "Updated";
      const readableStatus = status.replace(/_/g, " ").toUpperCase();

      toast.info(`📦 Order #${orderId} Update`, {
        description: `Your order is now: ${readableStatus}`,
        duration: 8000,
        action: {
          label: "View Status",
          onClick: () => router.push(`/account/orders`),
        },
      });
    };

    // 2. Generic System Notifications
    const handleNotification = (data: any) => {
      console.log("⚡ [REALTIME] notification:", data);
      toast(data.title || "New Notification", {
        description: data.message || data.body || "",
        duration: 6000,
      });
    };

    // 3. Live Broadcast Stats / Trigger
    const handleUpdateStats = (data: any) => {
      console.log("⚡ [REALTIME] update-stats:", data);
    };

    socket.on("connect", handleConnect);
    socket.on("order-status-updated", handleOrderStatusUpdated);
    socket.on("notification", handleNotification);
    socket.on("update-stats", handleUpdateStats);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("order-status-updated", handleOrderStatusUpdated);
      socket.off("notification", handleNotification);
      socket.off("update-stats", handleUpdateStats);

      // Clean up joined rooms on unmount
      if (socket.connected) {
        joinedRoomsRef.current.forEach((room) => {
          socket.emit("leave-room", room);
        });
        joinedRoomsRef.current.clear();
      }
    };
  }, [user?.id, router]);

  return null;
}
