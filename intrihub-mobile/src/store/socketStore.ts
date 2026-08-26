import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../constants/config";

class SocketService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(userId?: string) {
    if (this.socket?.connected) {
      if (userId && userId !== this.currentUserId) {
        this.joinUserRoom(userId);
      }
      return;
    }

    this.socket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    this.socket.on("connect", () => {
      if (userId) {
        this.joinUserRoom(userId);
      }
    });

    this.socket.on("order-status-updated", (data: any) => {
      this.triggerEvent("order-status-updated", data);
    });

    this.socket.on("notification", (data: any) => {
      this.triggerEvent("notification", data);
    });
  }

  joinUserRoom(userId: string) {
    if (!this.socket || !userId) return;
    this.currentUserId = userId;
    this.socket.emit("join-user", userId);
  }

  leaveUserRoom() {
    if (!this.socket || !this.currentUserId) return;
    this.socket.emit("leave-user", this.currentUserId);
    this.currentUserId = null;
  }

  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private triggerEvent(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.warn("Socket event listener error:", err);
        }
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
