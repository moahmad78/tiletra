const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4001;
const CORS_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : '*';

// Setup Express Middleware
app.use(cors({ origin: CORS_ORIGINS }));
app.use(express.json());

// Setup Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Tiletra Socket.IO Relay Server',
    connectedClients: io.engine.clientsCount,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', clients: io.engine.clientsCount });
});

// HTTP /emit Endpoint for Server Actions
app.post('/emit', (req, res) => {
  try {
    const { event, data, room, rooms } = req.body;

    if (!event) {
      return res.status(400).json({ success: false, error: 'Event name is required' });
    }

    console.log(`[EMIT TRIGGER] Event: "${event}"`, room ? `Room: "${room}"` : 'Broadcast to all');

    if (rooms && Array.isArray(rooms) && rooms.length > 0) {
      rooms.forEach((r) => {
        io.to(r).emit(event, data);
      });
    } else if (room) {
      io.to(room).emit(event, data);
    } else {
      io.emit(event, data);
    }

    return res.json({ success: true, delivered: true, event, room });
  } catch (error) {
    console.error('[EMIT ERROR]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// WebSocket Connection Lifecycle
io.on('connection', (socket) => {
  console.log(`[CLIENT CONNECTED] ID: ${socket.id} (Total: ${io.engine.clientsCount})`);

  // Join designated room (e.g. "admin", "user:cuid123", "phone:9876543210")
  socket.on('join-room', (room) => {
    if (typeof room === 'string' && room.trim()) {
      socket.join(room.trim());
      console.log(`[ROOM JOIN] Socket ${socket.id} joined "${room.trim()}"`);
      socket.emit('joined-room', { room: room.trim(), success: true });
    }
  });

  socket.on('leave-room', (room) => {
    if (typeof room === 'string' && room.trim()) {
      socket.leave(room.trim());
      console.log(`[ROOM LEAVE] Socket ${socket.id} left "${room.trim()}"`);
    }
  });

  // Client-to-client event relay
  socket.on('client-emit', ({ event, data, room }) => {
    if (room) {
      io.to(room).emit(event, data);
    } else {
      socket.broadcast.emit(event, data);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[CLIENT DISCONNECTED] ID: ${socket.id} (Reason: ${reason})`);
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Tiletra Socket.IO Relay Server running on port ${PORT}`);
  console.log(`📡 CORS allowed origins:`, CORS_ORIGINS);
});
