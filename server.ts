import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// CORS configuration for REST and WebSockets
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Initialize Socket.io with persistent WebSockets and auto-reconnection capabilities
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  transports: ['websocket', 'polling'],
});

// Set global socketio instance accessible in Express route controllers
app.set('socketio', io);

import { DEFAULT_TABLES } from './src/data/defaultTables';
import { getInitialSeedData } from './src/data/seedReservations';

const initialSeed = getInitialSeedData();

// Server-Authoritative State Store (Thread-safe memory store with transaction simulation)
interface ServerState {
  reservations: any[];
  tables: any[];
  tableGroups: any[];
  waitlist: any[];
  connectedClients: number;
}

const state: ServerState = {
  reservations: [...initialSeed.reservations],
  tables: [...DEFAULT_TABLES],
  tableGroups: [...initialSeed.tableGroups],
  waitlist: [...initialSeed.waitlist],
  connectedClients: 0,
};

// ==========================================
// SOCKET.IO REAL-TIME EVENT ENGINE
// ==========================================

io.on('connection', (socket) => {
  state.connectedClients = io.engine.clientsCount;
  console.log(`[Socket.io] Client connected: ${socket.id} (Total peers: ${state.connectedClients})`);

  // Broadcast presence update to all connected screens (Host stand, Floor iPad, Bar Terminal)
  io.emit('presenceUpdate', {
    connectedCount: state.connectedClients,
    timestamp: new Date().toISOString(),
  });

  // Client requests initial full state synchronization
  socket.on('client:requestState', () => {
    socket.emit('server:initialState', {
      reservations: state.reservations,
      tables: state.tables,
      tableGroups: state.tableGroups,
      waitlist: state.waitlist,
    });
  });

  // Client broadcasts live table coordinate drag-and-drop
  socket.on('client:tableCoordinateUpdate', (payload) => {
    // Update server state
    if (payload && payload.tableId) {
      const target = state.tables.find((t) => t.id === payload.tableId);
      if (target) {
        target.x = payload.x;
        target.y = payload.y;
      }
    }
    // Zero-latency broadcast to all other screens
    socket.broadcast.emit('tableCoordinateUpdate', payload);
  });

  // Client broadcasts reservation mutations
  socket.on('client:reservationUpdate', (payload) => {
    socket.broadcast.emit('reservationUpdate', payload);
  });

  // Client broadcasts instant reservation reschedule from Timeline
  socket.on('client:reservationRescheduled', (payload) => {
    if (payload && payload.reservation) {
      const idx = state.reservations.findIndex(
        (r) => r.id === payload.reservation.id || r.bookingCode === payload.reservation.bookingCode
      );
      if (idx !== -1) {
        state.reservations[idx] = { ...state.reservations[idx], ...payload.reservation };
      }
    }
    socket.broadcast.emit('reservationRescheduled', payload);
    socket.broadcast.emit('reservationUpdate', {
      action: 'reschedule',
      reservation: payload.reservation,
      targetDate: payload.reservation?.reservationDate,
      timestamp: new Date().toISOString(),
    });
  });

  // Client broadcasts room layout / group merges
  socket.on('client:roomLayoutUpdate', (payload) => {
    socket.broadcast.emit('roomLayoutUpdate', payload);
  });

  // Sync state mutations from client
  socket.on('client:syncState', (incomingState) => {
    if (incomingState.reservations) state.reservations = incomingState.reservations;
    if (incomingState.tables) state.tables = incomingState.tables;
    if (incomingState.tableGroups) state.tableGroups = incomingState.tableGroups;
    if (incomingState.waitlist) state.waitlist = incomingState.waitlist;

    socket.broadcast.emit('server:stateSynced', {
      timestamp: new Date().toISOString(),
      sourceSocketId: socket.id,
    });
  });

  socket.on('disconnect', () => {
    state.connectedClients = io.engine.clientsCount;
    console.log(`[Socket.io] Client disconnected: ${socket.id} (Remaining peers: ${state.connectedClients})`);
    io.emit('presenceUpdate', {
      connectedCount: state.connectedClients,
      timestamp: new Date().toISOString(),
    });
  });
});

// ==========================================
// REST API TRANSACTION CONTROLLERS
// ==========================================

// 1. Server Health Check & Diagnostic Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'Sotto Sotto Real-Time Express & Socket.io Engine',
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
    connectedSockets: io.engine.clientsCount,
    environment: process.env.NODE_ENV || 'development',
    port: 3000,
    timestamp: new Date().toISOString(),
    channels: [
      'reservationUpdate',
      'roomLayoutUpdate',
      'tableCoordinateUpdate',
      'presenceUpdate',
      'server:stateSynced'
    ],
  });
});

// 2. Get Initial / Reconnected State
app.get('/api/state', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: state,
    connectedClients: state.connectedClients,
  });
});

// Helper: time string to minutes
function timeToMins(t: string): number {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minsToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function isTimeOverlap(sA: string, eA: string, sB: string, eB: string): boolean {
  return Math.max(timeToMins(sA), timeToMins(sB)) < Math.min(timeToMins(eA), timeToMins(eB));
}

// Concurrency validator: Option A (<=2 4-seaters, 0 2-seaters) OR Option B (<=2 2-seaters AND <=1 4-seater)
function validateSlotCapacity(
  date: string,
  startTime: string,
  endTime: string,
  partySize: number,
  reservations: any[],
  excludeId?: string
) {
  const startM = timeToMins(startTime);
  const endM = timeToMins(endTime);
  const is4Seater = partySize >= 3;

  const activeAdvance = reservations.filter(
    (r) =>
      r.reservationDate === date &&
      !r.isWalkIn &&
      r.status !== 'cancelled' &&
      r.status !== 'completed' &&
      r.id !== excludeId &&
      r.bookingCode !== excludeId
  );

  for (let slice = startM; slice < endM; slice += 15) {
    const sStart = minsToTime(slice);
    const sEnd = minsToTime(slice + 15);

    let count2 = 0;
    let count4 = 0;

    for (const res of activeAdvance) {
      if (isTimeOverlap(sStart, sEnd, res.startTime, res.endTime)) {
        if (Number(res.partySize) <= 2) count2++;
        else count4++;
      }
    }

    const projected2 = count2 + (is4Seater ? 0 : 1);
    const projected4 = count4 + (is4Seater ? 1 : 0);

    const optionA = projected4 <= 2 && projected2 === 0;
    const optionB = projected2 <= 2 && projected4 <= 1;

    if (!optionA && !optionB) {
      return {
        isValid: false,
        reason: `Spiacenti, la fascia oraria ${sStart} ha raggiunto il limite massimo di capienza per questo turno. (${projected2} tavoli da 2 posti e ${projected4} tavoli da 4 posti contemporanei).`,
        violatingSlot: sStart,
        active2Seaters: count2,
        active4Seaters: count4,
      };
    }
  }

  return { isValid: true };
}

// 2. Validate Slot Availability Endpoint (Pre-flight check)
app.post('/api/reservations/validate-slot', (req: Request, res: Response) => {
  const { reservationDate, startTime, endTime, partySize } = req.body;
  const result = validateSlotCapacity(
    reservationDate,
    startTime,
    endTime || minsToTime(timeToMins(startTime) + (partySize <= 2 ? 120 : 165)),
    partySize,
    state.reservations
  );
  return res.json(result);
});

// 3. Reservation Mutation (Create / Update / Status / PartySize)
app.post('/api/reservations', (req: Request, res: Response) => {
  try {
    const reservation = req.body;
    if (!reservation.guestName || !reservation.reservationDate || !reservation.startTime) {
      return res.status(400).json({ error: 'Missing required reservation fields' });
    }

    // Advance Booking Capacity Check (Excludes Walk-ins)
    if (!reservation.isWalkIn) {
      const calcDuration = reservation.durationMins || (reservation.partySize <= 2 ? 120 : 165);
      const computedEndTime = reservation.endTime || minsToTime(timeToMins(reservation.startTime) + calcDuration);
      
      const validation = validateSlotCapacity(
        reservation.reservationDate,
        reservation.startTime,
        computedEndTime,
        reservation.partySize,
        state.reservations
      );

      if (!validation.isValid) {
        return res.status(409).json({
          error: validation.reason,
          violatingSlot: validation.violatingSlot,
        });
      }
    }

    // Insert into state
    state.reservations.push(reservation);
    // Transaction: COMMIT

    // Real-Time Broadcast to all other devices
    io.emit('reservationUpdate', {
      action: 'create',
      reservation,
      targetDate: reservation.reservationDate,
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({ success: true, reservation });
  } catch (err: any) {
    // Transaction: ROLLBACK
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/reservations/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const index = state.reservations.findIndex((r) => r.id === id || r.bookingCode === id);
    if (index !== -1) {
      state.reservations[index] = { ...state.reservations[index], ...updates };
    }

    io.emit('reservationUpdate', {
      action: 'update',
      id,
      updates,
      targetDate: updates.reservationDate || (index !== -1 ? state.reservations[index].reservationDate : null),
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true, reservation: state.reservations[index] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Interactive Timeline Rescheduling & Time-Shift Engine Endpoint
app.patch('/api/reservations/:id/reschedule', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newStartTime, newDate, newTableId } = req.body;

    if (!newStartTime) {
      return res.status(400).json({ error: 'newStartTime is required for rescheduling' });
    }

    const index = state.reservations.findIndex((r) => r.id === id || r.bookingCode === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const currentRes = state.reservations[index];
    const targetDate = newDate || currentRes.reservationDate;
    const partySize = Number(currentRes.partySize) || 2;
    
    // Duration rules: 120 mins for 1-2 guests, 165 mins for 4+ guests
    const durationMins = currentRes.durationMins || (partySize <= 2 ? 120 : 165);
    const newStartM = timeToMins(newStartTime);
    const newEndM = newStartM + durationMins;
    const newEndTime = minsToTime(newEndM);

    // Validate 15-minute slot capacity limits (excluding this reservation being moved)
    if (!currentRes.isWalkIn) {
      const validation = validateSlotCapacity(
        targetDate,
        newStartTime,
        newEndTime,
        partySize,
        state.reservations,
        id
      );

      if (!validation.isValid) {
        return res.status(409).json({
          error: validation.reason,
          violatingSlot: validation.violatingSlot,
        });
      }
    }

    // Apply updates
    currentRes.startTime = newStartTime;
    currentRes.endTime = newEndTime;
    currentRes.durationMins = durationMins;
    if (newDate) currentRes.reservationDate = newDate;
    if (newTableId) {
      currentRes.tableId = newTableId;
      currentRes.assignedTableIds = [newTableId];
    }

    state.reservations[index] = { ...currentRes };

    // Real-Time Socket.io Broadcast to All Devices
    io.emit('reservationRescheduled', {
      action: 'reschedule',
      reservation: currentRes,
      previousStartTime: currentRes.startTime,
      newStartTime,
      targetDate,
      timestamp: new Date().toISOString(),
    });

    io.emit('reservationUpdate', {
      action: 'update',
      id,
      updates: currentRes,
      targetDate,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      reservation: currentRes,
      message: `Prenotazione riprogrammata con successo alle ${newStartTime} - ${newEndTime}`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/reservations/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = state.reservations.find((r) => r.id === id || r.bookingCode === id);
    state.reservations = state.reservations.filter((r) => r.id !== id && r.bookingCode !== id);

    io.emit('reservationUpdate', {
      action: 'delete',
      id,
      bookingCode: id,
      targetDate: deleted?.reservationDate || null,
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true, deletedId: id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Table Layout & Merges Controller
app.post('/api/tables/merge', (req: Request, res: Response) => {
  try {
    const group = req.body;
    state.tableGroups.push(group);

    io.emit('roomLayoutUpdate', {
      action: 'merge',
      group,
      targetDate: group.groupDate,
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true, group });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/tables/unmerge', (req: Request, res: Response) => {
  try {
    const { groupId } = req.body;
    state.tableGroups = state.tableGroups.filter((g) => g.id !== groupId);

    io.emit('roomLayoutUpdate', {
      action: 'unmerge',
      groupId,
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true, unmergedId: groupId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/tables/:id/position', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { x, y } = req.body;

    const table = state.tables.find((t) => t.id === id);
    if (table) {
      table.x = x;
      table.y = y;
    }

    io.emit('tableCoordinateUpdate', {
      tableId: id,
      x,
      y,
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true, tableId: id, x, y });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// VITE INTEGRATION & PRODUCTION SERVING
// ==========================================

const PORT = 3000;
const isDev = process.env.NODE_ENV !== 'production';

async function startServer() {
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Explicit SPA HTML fallback for direct routes (like /reset-password, /login)
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api/') || url.startsWith('/socket.io/')) {
        return next();
      }
      try {
        const fs = await import('fs');
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        if (vite) vite.ssrFixStacktrace(e);
        next(e);
      }
    });

    console.log('[Dev] Mounted Vite middlewares & SPA HTML fallback on Express server');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[Prod] Serving static build from dist');
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sotto Sotto Real-Time Server running on http://0.0.0.0:${PORT}`);
    console.log(`⚡ WebSocket Bi-directional Engine Ready (Socket.io v4)`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
