// Helper to safely emit Socket.IO events from Next.js Server Actions and API routes

export function getIO() {
  if (typeof globalThis !== "undefined" && (globalThis as any).io) {
    return (globalThis as any).io;
  }
  return null;
}

export function emitToAdmin(event: string, data: any) {
  try {
    const io = getIO();
    if (io) {
      io.to("admin").emit(event, data);
      return true;
    }
  } catch (err) {
    console.error(`Failed to emit ${event} to admin room:`, err);
  }
  return false;
}

export function emitToUser(userId: string, event: string, data: any) {
  try {
    const io = getIO();
    if (io && userId) {
      io.to(`user:${userId}`).emit(event, data);
      return true;
    }
  } catch (err) {
    console.error(`Failed to emit ${event} to user:${userId}:`, err);
  }
  return false;
}

export function emitToAll(event: string, data: any) {
  try {
    const io = getIO();
    if (io) {
      io.emit(event, data);
      return true;
    }
  } catch (err) {
    console.error(`Failed to broadcast ${event}:`, err);
  }
  return false;
}
