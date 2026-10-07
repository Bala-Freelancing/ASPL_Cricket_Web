import { Server, Socket } from 'socket.io';
import { verifyToken } from '../lib/auth';
import { prisma } from '../lib/prisma';
import { placeBid } from '../services/auction.service';

export function setupSocketIO(io: Server) {
  // Active Auction Server Timer Loop (Heartbeat every 1000ms)
  setInterval(async () => {
    try {
      const activeAuction = await prisma.auction.findFirst({
        where: { state: 'ACTIVE' },
        include: {
          player: true,
          currentWinningTeam: { select: { id: true, name: true, shortCode: true } },
        },
      });

      if (activeAuction && activeAuction.timerExpiresAt) {
        const remainingMs = activeAuction.timerExpiresAt.getTime() - Date.now();
        const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

        io.to('auction_room').emit('auction:timer_tick', {
          auctionId: activeAuction.id,
          remainingSeconds,
          timerExpiresAt: activeAuction.timerExpiresAt,
        });
      }
    } catch (err) {
      // Ignore background timer fetch errors
    }
  }, 1000);

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token && typeof token === 'string') {
      const payload = verifyToken(token);
      if (payload) {
        (socket as any).user = payload;
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;

    // Join default room for live auction updates
    socket.join('auction_room');

    if (user) {
      if (user.role === 'ADMIN') {
        socket.join('admin_room');
      }
      if (user.teamId) {
        socket.join(`team_${user.teamId}`);
      }
    }

    // State Synchronization on Join
    socket.on('auction:join', async () => {
      try {
        const currentAuction = await prisma.auction.findFirst({
          where: { state: { in: ['ACTIVE', 'PAUSED'] } },
          include: {
            player: true,
            currentWinningTeam: { select: { id: true, name: true, shortCode: true, logoUrl: true } },
            bids: {
              include: { team: { select: { name: true, shortCode: true } } },
              orderBy: { sequenceNumber: 'desc' },
              take: 20,
            },
          },
        });

        socket.emit('auction:state_sync', { auction: currentAuction || null });
      } catch (err: any) {
        socket.emit('notification:error', { message: err.message });
      }
    });

    // Realtime Bidding Event
    socket.on('auction:bid', async (data: { auctionId: string; amount: number }) => {
      try {
        if (!user || user.role !== 'TEAM_OWNER') {
          return socket.emit('auction:bid_rejected', {
            code: 'UNAUTHORIZED',
            message: 'Only authenticated Team Owners can submit bids.',
          });
        }

        const { auctionId, amount } = data;
        const result = await placeBid({
          auctionId,
          teamOwnerUserId: user.userId,
          amount: Number(amount),
        });

        // Broadcast valid bid to all clients in room
        io.to('auction_room').emit('auction:bid_placed', {
          auction: result.auction,
          bid: result.bid,
          winningTeam: result.team,
        });

        // Private success confirmation to bidder
        socket.emit('auction:bid_accepted', {
          auctionId,
          amount: result.bid.amount,
        });
      } catch (err: any) {
        socket.emit('auction:bid_rejected', {
          code: 'INVALID_BID',
          message: err.message,
        });
      }
    });

    socket.on('disconnect', () => {
      // Clean socket disconnect
    });
  });
}
