import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { verifyToken, checkRole } from '../../lib/auth';
import { CONFIG } from '../../lib/config';
import { resendWhatsAppNotification, getBaileysStatus, initBaileysWhatsApp, sendOwnerInviteWhatsApp } from '../../services/whatsapp.service';

const router = Router();

// Middleware: Enforce Admin Role & Verify DB User Existence
router.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload || !checkRole(payload.role, ['ADMIN'])) {
    return res.status(403).json({ success: false, error: 'Access denied: Admin role required' });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!dbUser || dbUser.role !== 'ADMIN') {
    return res.status(401).json({ success: false, error: 'Invalid or expired admin session. Please login again.' });
  }

  (req as any).user = payload;
  next();
});

/**
 * GET /api/admin/dashboard
 * Summary statistics for tournament administration
 */
router.get('/dashboard', async (req, res) => {
  try {
    const totalPlayers = await prisma.player.count();
    const paidPlayers = await prisma.player.count({ where: { paymentStatus: 'SUCCESS' } });
    const verifiedPlayers = await prisma.player.count({ where: { auctionStatus: 'ADMIN_VERIFIED' } });
    const soldPlayers = await prisma.player.count({ where: { auctionStatus: 'SOLD' } });
    const totalTeams = await prisma.team.count();

    return res.json({
      success: true,
      stats: {
        totalPlayers,
        paidPlayers,
        verifiedPlayers,
        soldPlayers,
        totalTeams,
        totalRevenue: paidPlayers * CONFIG.REGISTRATION_FEE,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/teams
 * Admin creates a new team
 */
router.post('/teams', async (req, res) => {
  try {
    const { name, shortCode, logoUrl, initialPurse, maxSquadSize } = req.body;

    if (!name || !shortCode) {
      return res.status(400).json({ success: false, error: 'Team name and short code are required' });
    }

    const purse = Number(initialPurse) || CONFIG.INITIAL_TEAM_PURSE;
    const squadLimit = Number(maxSquadSize) || CONFIG.MAX_SQUAD_SIZE;

    const team = await prisma.team.create({
      data: {
        name,
        shortCode: shortCode.toUpperCase(),
        logoUrl: logoUrl || null,
        initialPurse: purse,
        remainingPurse: purse,
        maxSquadSize: squadLimit,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.userId,
        action: 'CREATE_TEAM',
        entityType: 'TEAM',
        entityId: team.id,
        metadata: JSON.stringify({ name, shortCode }),
      },
    });

    return res.json({ success: true, team });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/teams
 * List all teams with squad details and owner info
 */
router.get('/teams', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        players: { select: { id: true, playerCode: true, name: true, category: true, winningBid: true } },
        invitations: { where: { status: 'PENDING' } },
      },
      orderBy: { name: 'asc' },
    });

    return res.json({ success: true, teams });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/owners/invite
 * Generates secure single-use invitation token for Team Owner onboarding
 */
router.post('/owners/invite', async (req, res) => {
  try {
    const { teamId, email, phone } = req.body;

    if (!teamId || !email || !phone) {
      return res.status(400).json({ success: false, error: 'teamId, email, and phone are required' });
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    // Generate crypto random token (raw to return, hash saved in DB)
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Revoke any previous pending invitation for this team
    await prisma.ownerInvitation.updateMany({
      where: { teamId, status: 'PENDING' },
      data: { status: 'REVOKED' },
    });

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 Hours validity

    const invitation = await prisma.ownerInvitation.create({
      data: {
        teamId,
        email,
        phone,
        tokenHash: rawToken,
        status: 'PENDING',
        expiresAt,
        createdBy: (req as any).user.userId,
      },
    });

    const frontendUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invitationUrl = `${frontendUrl}/activate-owner?token=${rawToken}`;

    // Attempt automatic direct WhatsApp message dispatch
    const waResult = await sendOwnerInviteWhatsApp(phone, team.name, invitationUrl);

    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.userId,
        action: 'INVITE_OWNER',
        entityType: 'OWNER_INVITATION',
        entityId: invitation.id,
        metadata: JSON.stringify({ teamId, email, phone, whatsappSent: waResult.success }),
      },
    });

    return res.json({
      success: true,
      invitationId: invitation.id,
      teamName: team.name,
      email,
      phone,
      invitationToken: rawToken,
      invitationUrl,
      whatsappSent: waResult.success,
      whatsappError: waResult.error || null,
      expiresAt,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/admin/players/:id/verify
 * Approves a player for live auction pool
 */
router.patch('/players/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, basePrice } = req.body;

    const player = await prisma.player.findUnique({ where: { id } });
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    const updated = await prisma.player.update({
      where: { id },
      data: {
        registrationStatus: 'ADMIN_VERIFIED',
        auctionStatus: 'AVAILABLE',
        category: category || player.category,
        basePrice: basePrice ? Number(basePrice) : player.basePrice,
      },
    });

    return res.json({ success: true, player: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});



/**
 * POST /api/admin/notifications/:id/resend
 * Resends a failed WhatsApp registration confirmation
 */
router.post('/notifications/:id/resend', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await resendWhatsAppNotification(id);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/whatsapp/status
 * Retrieves current WhatsApp Baileys connection status and QR code data
 */
router.get('/whatsapp/status', (req, res) => {
  return res.json({ success: true, ...getBaileysStatus() });
});

/**
 * POST /api/admin/whatsapp/connect
 * Forces initialization of Baileys WhatsApp connection socket
 */
router.post('/whatsapp/connect', async (req, res) => {
  try {
    await initBaileysWhatsApp(true);

    // Poll up to 3 seconds for Baileys socket to emit QR code
    for (let i = 0; i < 15; i++) {
      const statusObj = getBaileysStatus();
      if (statusObj.qrCode || statusObj.status === 'CONNECTED' || statusObj.status === 'QR_READY') {
        return res.json({ success: true, ...statusObj });
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return res.json({ success: true, ...getBaileysStatus() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/audit-logs
 * Retrieves audit trial logs
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.json({ success: true, logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
