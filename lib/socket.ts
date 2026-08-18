"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    // In same-origin setup (Render & local dev), io() connects directly to the current host
    socketInstance = io({
      path: "/socket.io",
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      transports: ["websocket", "polling"],
      timeout: 10000,
    });

    socketInstance.on("connect", () => {
      console.log("[SOCKET CONNECTED] Connected with ID:", socketInstance?.id);
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("[SOCKET CONNECT ERROR]:", err.message);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("[SOCKET DISCONNECTED]:", reason);
    });
  }

  return socketInstance;
}

/**
 * Custom React Hook for Real-time Socket.IO Subscriptions
 * @param room Optional room to join: "admin" or customer userId
 * @param eventHandlers Map of event name to callback handler
 */
export function useSocket(
  room?: string | null,
  eventHandlers: Record<string, (data: any) => void> = {}
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const socket = getSocket();
    socketRef.current = socket;

    // Join room if specified
    if (room) {
      const join = () => {
        if (room === "admin") {
          socket.emit("join-admin");
        } else {
          socket.emit("join-user", room);
        }
      };

      if (socket.connected) {
        join();
      } else {
        socket.once("connect", join);
      }
    }

    // Attach listeners
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      // Cleanup listeners
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      if (room && room !== "admin") {
        socket.emit("leave-user", room);
      }
    };
  }, [room]);

  return socketRef.current;
}
