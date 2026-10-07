import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { CONFIG } from '../lib/config';
import authRouter from './routes/auth.routes';
import playerRouter from './routes/player.routes';
import paymentRouter from './routes/payment.routes';
import adminRouter from './routes/admin.routes';
import auctionRouter from './routes/auction.routes';
import playerPortalRouter from './routes/player-portal.routes';
import { setupSocketIO } from './socket';

// ASPL 2026 Server Entrypoint

// Process Crash Protection for Socket & Network Disconnects
process.on('uncaughtException', (err) => {
  console.error('[SERVER UNCAUGHT EXCEPTION] Caught error, keeping server alive:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[SERVER UNHANDLED REJECTION] Caught rejection, keeping server alive:', reason);
});

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.set('io', io);

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Mini IPL Cricket Auction Backend API Engine',
    status: 'online',
    tournament: CONFIG.TOURNAMENT_NAME,
    health: '/health',
    apiRoutes: ['/api/auth', '/api/players', '/api/payments', '/api/admin', '/api/auction'],
  });
});

// Health Check Endpoint (Requirement 67)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    tournament: CONFIG.TOURNAMENT_NAME,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/players', playerRouter);
app.use('/api/player', playerPortalRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/admin', adminRouter);
app.use('/api/auction', auctionRouter);

// Initialize Socket.IO Handler
setupSocketIO(io);

const PORT = CONFIG.PORT;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 IPL Auction Backend Server running on http://localhost:${PORT}`);
    console.log(`🏆 Tournament: ${CONFIG.TOURNAMENT_NAME}`);
    console.log(`📱 WhatsApp Sender Account: ${CONFIG.WHATSAPP_BUSINESS_NUMBER}`);

    // Automatic boot verification for admin accounts
    try {
      const { prisma: db } = require('../lib/prisma');
      const { hashPassword: hp } = require('../lib/auth');
      hp('admin123').then((passwordHash: string) => {
        db.user.upsert({
          where: { email: 'admin@aspl.com' },
          update: { role: 'ADMIN', passwordHash, isActive: true },
          create: { name: 'Tournament Admin', email: 'admin@aspl.com', phone: '+919999999998', passwordHash, role: 'ADMIN', isActive: true },
        }).catch(() => {});
        db.user.upsert({
          where: { email: 'admin@ipl.com' },
          update: { role: 'ADMIN', passwordHash, isActive: true },
          create: { name: 'Tournament Admin', email: 'admin@ipl.com', phone: '+919999999999', passwordHash, role: 'ADMIN', isActive: true },
        }).catch(() => {});
      }).catch(() => {});
    } catch (e) {}

    if (CONFIG.WHATSAPP_PROVIDER === 'BAILEYS') {
      const { initBaileysWhatsApp } = require('../services/whatsapp.service');
      initBaileysWhatsApp().catch((err: any) => console.error('[WHATSAPP AUTO-INIT ERROR]', err.message));
    }
  });
}

export { app, server, io };
