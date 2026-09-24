/**
 * Server-side Socket Event Dispatcher
 * Directly broadcasts real-time events to Socket.IO rooms attached to the HTTP server.
 */

interface EmitPayload {
  event: "new-order" | "order-status-updated" | "low-stock" | "new-review-pending" | "return-request-created" | string;
  data: any;
  room?: string;
  rooms?: string[];
}

export async function emitSocketEvent(payload: EmitPayload): Promise<boolean> {
  try {
    // 1. Direct in-memory Socket.IO instance (local dev / standalone node server)
    const io = typeof globalThis !== "undefined" ? (globalThis as any).io : null;
    if (io) {
      const targetRooms = payload.rooms || (payload.room ? [payload.room] : []);
      if (targetRooms.length > 0) {
        targetRooms.forEach((r) => {
          io.to(r).emit(payload.event, payload.data);
        });
      } else {
        io.emit(payload.event, payload.data);
      }
      return true;
    }

    // 2. Serverless / Vercel: Relay to external socket server if configured
    const socketUrl = process.env.SOCKET_SERVER_URL || process.env.NEXT_PUBLIC_SOCKET_URL;
    if (socketUrl && socketUrl.startsWith("http")) {
      const endpoint = socketUrl.replace(/\/$/, "") + "/emit";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        return true;
      }
    }
  } catch (error) {
    // Graceful error handling in serverless environments (do not break transaction)
    console.warn("[SOCKET EMIT NOTICE]: Could not relay socket event:", error instanceof Error ? error.message : error);
  }

  return false;
}
