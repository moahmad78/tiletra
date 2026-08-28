import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "../api/client";

class SocketService {
  private socket: Socket | null = null;

  connect(userId?: string) {
    if (this.socket?.connected) return;

    try {
      this.socket = io(API_BASE_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on("connect", () => {
        if (userId) {
          this.socket?.emit("join", `user:${userId}`);
        }
      });
    } catch (err) {
      console.warn("Socket connection failed:", err);
    }
  }

  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on(event, callback);
    return () => {
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
