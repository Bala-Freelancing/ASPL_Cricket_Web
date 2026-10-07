import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { verifyToken, checkRole } from '../../lib/auth';
import {
  startAuction,
  placeBid,
  markLotSold,
  markLotUnsold,
} from '../../services/auction.service';

const router = Router();

/**
 * GET /api/auction/current
 * Public / Authenticated snapshot of current active auction lot
 */
router.get('/current', async (req, res) => {
  try {
    const auction = await prisma.auction.findFirst({
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

    return res.json({ success: true, auction: auction || null });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/auction/public-summary
 * Public stats & teams info for landing page
 */
router.get('/public-summary', async (req, res) => {
  try {
    const totalPlayers = await prisma.player.count();
    const teams = await prisma.team.findMany({
      select: { id: true, name: true, shortCode: true, logoUrl: true },
      orderBy: { name: 'asc' },
    });

    return res.json({
      success: true,
      stats: {
        totalPlayers: totalPlayers > 0 ? totalPlayers : 100,
        totalTeams: teams.length > 0 ? teams.length : 8,
        maxSquadSize: 15,
        fee: 208,
      },
      teams: teams.length > 0 ? teams : [
        { id: '1', name: 'Chennai Strikers', shortCode: 'CS', logoUrl: null },
        { id: '2', name: 'Mumbai Titans', shortCode: 'MT', logoUrl: null },
        { id: '3', name: 'Bangalore Royals', shortCode: 'BR', logoUrl: null },
        { id: '4', name: 'Delhi Superkings', shortCode: 'DSK', logoUrl: null },
        { id: '5', name: 'Kolkata Warriors', shortCode: 'KW', logoUrl: null },
        { id: '6', name: 'Hyderabad Falcons', shortCode: 'HF', logoUrl: null },
        { id: '7', name: 'Punjab Lions', shortCode: 'PL', logoUrl: null },
        { id: '8', name: 'Rajasthan Champions', shortCode: 'RC', logoUrl: null },
      ],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auction/start
 * Admin starts bidding for selected player
 */
router.post('/start', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload || !checkRole(payload.role, ['ADMIN'])) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { playerId, basePrice, minIncrement } = req.body;
    if (!playerId) {
      return res.status(400).json({ success: false, error: 'Player ID required' });
    }

    const auction = await startAuction({ playerId, basePrice, minIncrement });

    // Emit socket broadcast if socket service attached
    const io = (req.app as any).get('io');
    if (io) {
      io.emit('auction:started', auction);
    }

    return res.json({ success: true, auction });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auction/bid
 * Team Owner submits bid via HTTP endpoint
 */
router.post('/bid', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload || !checkRole(payload.role, ['TEAM_OWNER'])) {
      return res.status(403).json({ success: false, error: 'Team Owner access required to place bids' });
    }

    const { auctionId, amount } = req.body;
    if (!auctionId || !amount) {
      return res.status(400).json({ success: false, error: 'auctionId and amount are required' });
    }

    const result = await placeBid({
      auctionId,
      teamOwnerUserId: payload.userId,
      amount: Number(amount),
    });

    const io = (req.app as any).get('io');
    if (io) {
      io.emit('auction:bid_placed', {
        auction: result.auction,
        bid: result.bid,
        winningTeam: result.team,
      });
    }

    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auction/sold
 * Admin completes auction lot as SOLD
 */
router.post('/sold', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload || !checkRole(payload.role, ['ADMIN'])) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { auctionId } = req.body;
    if (!auctionId) {
      return res.status(400).json({ success: false, error: 'auctionId is required' });
    }

    const result = await markLotSold(auctionId);

    const io = (req.app as any).get('io');
    if (io) {
      io.emit('auction:sold', result);
    }

    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auction/unsold
 * Admin completes auction lot as UNSOLD
 */
router.post('/unsold', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload || !checkRole(payload.role, ['ADMIN'])) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { auctionId } = req.body;
    if (!auctionId) {
      return res.status(400).json({ success: false, error: 'auctionId is required' });
    }

    const result = await markLotUnsold(auctionId);

    const io = (req.app as any).get('io');
    if (io) {
      io.emit('auction:unsold', result);
    }

    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/auction/:id/bids
 * Permanently stored audit bid log for specific auction
 */
router.get('/:id/bids', async (req, res) => {
  try {
    const { id } = req.params;
    const bids = await prisma.bid.findMany({
      where: { auctionId: id },
      include: {
        team: { select: { id: true, name: true, shortCode: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { sequenceNumber: 'asc' },
    });

    return res.json({ success: true, bids });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
