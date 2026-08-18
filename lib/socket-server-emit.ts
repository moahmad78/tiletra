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
    // 1. Direct in-memory Socket.IO instance on same Next.js server
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
  } catch (error) {
    console.error("[SOCKET EMIT ERROR]:", error);
  }

  return false;
}
