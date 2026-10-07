import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { verifyToken, checkRole } from '../../lib/auth';

const router = Router();

// Middleware: Enforce PLAYER role & retrieve server-authenticated identity
router.use(async (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized access' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload || !checkRole(payload.role, ['PLAYER', 'ADMIN'])) {
    return res.status(403).json({ success: false, error: 'Access denied: Player portal access required' });
  }

  (req as any).user = payload;
  next();
});

/**
 * GET /api/player/me
 * Server-authenticated Player Profile endpoint
 */
router.get('/me', async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        player: {
          include: {
            assignedTeam: {
              select: {
                id: true,
                name: true,
                shortCode: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.player) {
      return res.status(404).json({ success: false, error: 'Player profile not found' });
    }

    return res.json({
      success: true,
      player: user.player,
      mustChangePassword: user.mustChangePassword,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/player/teams
 * List all participating tournament teams
 */
router.get('/teams', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        shortCode: true,
        logoUrl: true,
      },
      orderBy: { name: 'asc' },
    });

    return res.json({ success: true, teams });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/player/bids
 * List teams that actually placed bids on this player
 */
router.get('/bids', async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const player = await prisma.player.findUnique({ where: { userId } });

    if (!player) {
      return res.status(404).json({ success: false, error: 'Player record not found' });
    }

    const bids = await prisma.bid.findMany({
      where: { playerId: player.id },
      include: {
        team: { select: { id: true, name: true, shortCode: true, logoUrl: true } },
      },
      orderBy: { amount: 'desc' },
    });

    return res.json({ success: true, bids });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/player/matches
 * Returns match schedule for authenticated player's assigned team
 */
router.get('/matches', async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const player = await prisma.player.findUnique({ where: { userId } });

    if (!player || !player.assignedTeamId) {
      return res.json({
        success: true,
        assignedTeamId: null,
        matches: [],
        message: 'Your match schedule will appear here once you are selected for a team and the tournament schedule is published.',
      });
    }

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { teamAId: player.assignedTeamId },
          { teamBId: player.assignedTeamId },
        ],
      },
      include: {
        teamA: { select: { id: true, name: true, shortCode: true, logoUrl: true } },
        teamB: { select: { id: true, name: true, shortCode: true, logoUrl: true } },
      },
      orderBy: { matchDate: 'asc' },
    });

    return res.json({
      success: true,
      assignedTeamId: player.assignedTeamId,
      matches,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
