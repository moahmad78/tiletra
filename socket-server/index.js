const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Global Anti-Crash Protectors (Prevent Unhandled Exceptions from killing the server)
process.on('uncaughtException', (err) => {
  console.error('[FATAL UNCAUGHT EXCEPTION]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]:', reason);
});

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4001;
const CORS_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['https://intrihub.com', 'https://www.intrihub.com', 'http://localhost:3000', 'http://127.0.0.1:3000'];

// Setup Express Security & Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Let Next.js and Cloudflare manage full CSP
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
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
    service: 'Intrihub Socket.IO Relay Server',
    connectedClients: io.engine.clientsCount,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', clients: io.engine.clientsCount });
});

// Helper to normalize room names across Web, Customer Mobile App, and Business App
function getEquivalentRooms(rawRoom) {
  if (!rawRoom || typeof rawRoom !== 'string') return [];
  const r = rawRoom.trim();
  const set = new Set([r]);

  if (r === 'admin' || r === 'admin-room') {
    set.add('admin');
    set.add('admin-room');
  }

  // user:123 <-> user_123 <-> 123
  if (r.startsWith('user:')) {
    const id = r.slice(5);
    set.add(`user_${id}`);
    set.add(id);
  } else if (r.startsWith('user_')) {
    const id = r.slice(5);
    set.add(`user:${id}`);
    set.add(id);
  }

  // vendor:123 <-> vendor_123 <-> 123
  if (r.startsWith('vendor:')) {
    const id = r.slice(7);
    set.add(`vendor_${id}`);
    set.add(id);
  } else if (r.startsWith('vendor_')) {
    const id = r.slice(7);
    set.add(`vendor:${id}`);
    set.add(id);
  }

  // order:123 <-> order_123 <-> 123
  if (r.startsWith('order:')) {
    const id = r.slice(6);
    set.add(`order_${id}`);
    set.add(id);
  } else if (r.startsWith('order_')) {
    const id = r.slice(6);
    set.add(`order:${id}`);
    set.add(id);
  }

  return Array.from(set);
}

// HTTP /emit Endpoint for Server Actions (Web, Mobile APIs, Webhooks)
app.post('/emit', (req, res) => {
  try {
    const { event, data, room, rooms } = req.body;

    if (!event) {
      return res.status(400).json({ success: false, error: 'Event name is required' });
    }

    const rawList = rooms && Array.isArray(rooms) ? rooms : room ? [room] : [];
    const targetRooms = new Set();
    rawList.forEach((r) => {
      getEquivalentRooms(r).forEach((eq) => targetRooms.add(eq));
    });

    console.log(`[EMIT TRIGGER] Event: "${event}"`, targetRooms.size > 0 ? `Target Rooms: [${Array.from(targetRooms).join(', ')}]` : 'Broadcast to all');

    if (targetRooms.size > 0) {
      targetRooms.forEach((r) => {
        io.to(r).emit(event, data);
      });
    } else {
      io.emit(event, data);
    }

    return res.json({ success: true, delivered: true, event, targetRooms: Array.from(targetRooms) });
  } catch (error) {
    console.error('[EMIT ERROR]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// WebSocket Connection Lifecycle
io.on('connection', (socket) => {
  console.log(`[CLIENT CONNECTED] ID: ${socket.id} (Total: ${io.engine.clientsCount})`);

  // Universal Join Handler (Supports Web 'join-room', Business 'join', and Mobile 'join-user')
  const handleJoin = (rawRoom) => {
    if (typeof rawRoom === 'string' && rawRoom.trim()) {
      const normalizedRooms = getEquivalentRooms(rawRoom);
      normalizedRooms.forEach((r) => socket.join(r));
      console.log(`[ROOM JOIN] Socket ${socket.id} joined rooms: [${normalizedRooms.join(', ')}]`);
      socket.emit('joined-room', { room: rawRoom.trim(), success: true });
    }
  };

  const handleLeave = (rawRoom) => {
    if (typeof rawRoom === 'string' && rawRoom.trim()) {
      const normalizedRooms = getEquivalentRooms(rawRoom);
      normalizedRooms.forEach((r) => socket.leave(r));
      console.log(`[ROOM LEAVE] Socket ${socket.id} left rooms: [${normalizedRooms.join(', ')}]`);
    }
  };

  socket.on('join-room', handleJoin);
  socket.on('join', handleJoin);
  socket.on('join-user', (userId) => handleJoin(`user:${userId}`));

  socket.on('leave-room', handleLeave);
  socket.on('leave', handleLeave);
  socket.on('leave-user', (userId) => handleLeave(`user:${userId}`));

  // Client-to-client event relay
  socket.on('client-emit', ({ event, data, room }) => {
    if (room) {
      const targetRooms = getEquivalentRooms(room);
      targetRooms.forEach((r) => io.to(r).emit(event, data));
    } else {
      socket.broadcast.emit(event, data);
    }
  });

  // Client action trigger & live broadcast
  socket.on('client-action', (data) => {
    console.log('[CLIENT ACTION RECEIVED]:', data);
    io.emit('update-stats', {
      message: 'Data updated at ' + new Date().toLocaleTimeString(),
      data,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`[CLIENT DISCONNECTED] ID: ${socket.id} (Reason: ${reason})`);
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Intrihub Socket.IO Relay Server running on port ${PORT}`);
  console.log(`📡 CORS allowed origins:`, CORS_ORIGINS);
});
