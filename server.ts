import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store io on globalThis so Next.js Server Actions can access it
declare global {
  // eslint-disable-next-line no-var
  var io: SocketIOServer | undefined;
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      res.removeHeader("X-Powered-By");
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  const ALLOWED_CORS_ORIGINS = [
    "https://intrihub.com",
    "https://www.intrihub.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4001",
  ];

  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (ALLOWED_CORS_ORIGINS.includes(origin) || origin.endsWith(".intrihub.com")) {
          return callback(null, true);
        }
        return callback(new Error("CORS policy violation: Unauthorized origin"), false);
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Attach to globalThis for Server Actions
  globalThis.io = io;

  io.on("connection", (socket) => {
    // Universal Room Normalizer
    const getNormalizedRooms = (rawRoom: string) => {
      if (!rawRoom || typeof rawRoom !== "string") return [];
      const r = rawRoom.trim();
      const set = new Set<string>([r]);

      if (r === "admin" || r === "admin-room") {
        set.add("admin");
        set.add("admin-room");
      }
      if (r.startsWith("user:")) {
        set.add(r.slice(5));
      } else if (r.startsWith("vendor:")) {
        set.add(r.slice(7));
      } else {
        set.add(`user:${r}`);
        set.add(`vendor:${r}`);
      }
      return Array.from(set);
    };

    const handleJoin = (rawRoom: string) => {
      if (typeof rawRoom === "string" && rawRoom.trim()) {
        const rooms = getNormalizedRooms(rawRoom);
        rooms.forEach((r) => socket.join(r));
        socket.emit("joined-room", { room: rawRoom.trim(), success: true });
      }
    };

    const handleLeave = (rawRoom: string) => {
      if (typeof rawRoom === "string" && rawRoom.trim()) {
        const rooms = getNormalizedRooms(rawRoom);
        rooms.forEach((r) => socket.leave(r));
      }
    };

    // Join Event Handlers
    socket.on("join-room", handleJoin);
    socket.on("join", handleJoin);
    socket.on("join-admin", () => handleJoin("admin"));
    socket.on("join-vendor", (vendorId: string) => handleJoin(`vendor:${vendorId}`));
    socket.on("join-user", (userId: string) => handleJoin(`user:${userId}`));

    // Leave Event Handlers
    socket.on("leave-room", handleLeave);
    socket.on("leave", handleLeave);
    socket.on("leave-user", (userId: string) => handleLeave(`user:${userId}`));

    // Client-to-client relay & broadcast
    socket.on("client-action", (data: any) => {
      io.emit("update-stats", {
        message: "Data updated at " + new Date().toLocaleTimeString(),
        data,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Intrihub ready on http://${hostname}:${port} (Socket.IO attached)`);
  });

  // Global Process Error Resilience
  process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
    console.error("[Process Guard] Unhandled Rejection at:", promise, "reason:", reason);
  });

  process.on("uncaughtException", (error: Error) => {
    console.error("[Process Guard] Uncaught Exception:", error);
  });

  const gracefulShutdown = (signal: string) => {
    console.log(`[Process Guard] ${signal} received. Closing server gracefully...`);
    if (globalThis.io) {
      globalThis.io.close();
    }
    const forceTimer = setTimeout(() => {
      console.error("[Process Guard] Forced shutdown due to timeout.");
      process.exit(1);
    }, 5000);
    forceTimer.unref();

    httpServer.close(() => {
      console.log("[Process Guard] HTTP server closed cleanly.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
});
