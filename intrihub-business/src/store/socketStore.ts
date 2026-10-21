import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "../api/client";

class SocketService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(userId?: string) {
    this.currentUserId = userId || null;

    if (this.socket?.connected) {
      if (userId) {
        this.joinRooms(userId);
      }
      return;
    }

    try {
      this.socket = io(API_BASE_URL, {
        path: "/socket.io",
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1500,
        timeout: 10000,
      });

      this.socket.on("connect", () => {
        console.log("⚡ [BIZ SOCKET CONNECTED] ID:", this.socket?.id);
        if (this.currentUserId) {
          this.joinRooms(this.currentUserId);
        }
      });

      // Forward known events to registered listeners
      const knownEvents = [
        "new-order",
        "order-alert",
        "order-status-updated",
        "notification",
        "update-stats",
        "low-stock",
      ];

      knownEvents.forEach((evt) => {
        this.socket?.on(evt, (data: any) => {
          this.listeners.get(evt)?.forEach((cb) => {
            try {
              cb(data);
            } catch (err) {
              console.warn(`[SOCKET] Error in listener for ${evt}:`, err);
            }
          });

          // If new notification, order, or alert arrives, push to notification store to update unread badge and shake bell
          if (evt === "new-order" || evt === "order-alert" || evt === "notification") {
            try {
              const { addNotification } = require("./notificationStore").useNotificationStore.getState();
              addNotification({
                title: data?.title || (evt === "new-order" ? "New Order Received! 🛍️" : "Store Notification"),
                body: data?.body || data?.message || (data?.orderId ? `Order #${data.orderId} received` : "You have a new update in your store."),
                orderId: data?.orderId || data?.id,
                amount: data?.amount || data?.totalAmount ? `₹${data.amount || data.totalAmount}` : undefined,
                type: data?.requiresManualApproval ? "approval_required" : "auto_accepted",
                accentColor: data?.requiresManualApproval ? "#EF4444" : "#3B82F6",
              });
            } catch (e) {
              console.warn("[SOCKET] Notice adding notification:", e);
            }
          }
        });
      });
    } catch (err) {
      console.warn("[BIZ SOCKET] Connection notice:", err);
    }
  }

  joinRooms(userId: string) {
    if (!this.socket || !userId) return;
    this.socket.emit("join-room", `user:${userId}`);
    this.socket.emit("join-room", `vendor:${userId}`);
    this.socket.emit("join", `user:${userId}`);
    this.socket.emit("join", `vendor:${userId}`);
  }

  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Also attach directly to socket if already initialized
    if (this.socket) {
      this.socket.on(event, callback);
    }

    return () => {
      this.listeners.get(event)?.delete(callback);
      this.socket?.off(event, callback);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
