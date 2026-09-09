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
    // Join Admin Room (for store notifications, live orders)
    socket.on("join-admin", () => {
      socket.join("admin");
      socket.emit("joined-room", { room: "admin" });
    });

    // Join Customer User Room (for user-specific order updates)
    socket.on("join-user", (userId: string) => {
      if (userId && typeof userId === "string") {
        const rawId = userId.replace(/^user:/, "");
        const roomName = `user:${rawId}`;
        socket.join(roomName);
        socket.emit("joined-room", { room: roomName });
      }
    });

    // Leave Customer User Room
    socket.on("leave-user", (userId: string) => {
      if (userId && typeof userId === "string") {
        const rawId = userId.replace(/^user:/, "");
        socket.leave(`user:${rawId}`);
      }
    });

    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  httpServer.listen(port, () => {
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
