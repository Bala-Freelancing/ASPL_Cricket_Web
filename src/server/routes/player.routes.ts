import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { hashPassword, generateToken } from '../../lib/auth';
import { CONFIG } from '../../lib/config';
import { normalizePhoneNumber } from '../../services/whatsapp.service';

const router = Router();

/**
 * POST /api/players/register
 * Public Player Registration Endpoint.
 * Role is strictly enforced as PLAYER by backend.
 */
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      dob,
      aadharNumber,
      aadharPhoto,
      tshirtSize,
      phone,
      whatsappNumber,
      email,
      password,
      category,
      age,
      battingStyle,
      bowlingStyle,
      isWicketkeeper,
      pincode,
      description,
      profilePhoto,
      basePrice,
    } = req.body;

    if (!name || !phone || !category) {
      return res.status(400).json({
        success: false,
        error: 'Name, phone, and category are required fields.',
      });
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    const normalizedWhatsapp = whatsappNumber ? normalizePhoneNumber(whatsappNumber) : normalizedPhone;

    const rawPhoneDigits = phone.replace(/\D/g, '');
    const playerEmail = email || `${rawPhoneDigits || Date.now()}@aspl.com`;
    const playerPassword = password || rawPhoneDigits || phone;

    // Check if phone or email already registered
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: playerEmail }, { phone: normalizedPhone }] },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this phone number or email already exists.',
      });
    }

    const passwordHash = await hashPassword(playerPassword);

    // Atomic User + Player Profile creation
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: playerEmail,
          phone: normalizedPhone,
          passwordHash,
          role: 'PLAYER', // Enforced backend role
          mustChangePassword: true,
        },
      });

      const player = await tx.player.create({
        data: {
          userId: user.id,
          name,
          phone: normalizedPhone,
          whatsappNumber: normalizedWhatsapp,
          email: playerEmail,
          category,
          age: Number(age),
          dob: dob || null,
          aadharNumber: aadharNumber || null,
          aadharPhoto: aadharPhoto || null,
          tshirtSize: tshirtSize || 'L',
          isWicketkeeper: Boolean(isWicketkeeper),
          battingStyle: battingStyle || 'Right-hand',
          bowlingStyle: bowlingStyle || 'None',
          pincode: pincode || null,
          description: description || null,
          profilePhoto: profilePhoto || null,
          basePrice: Number(basePrice) || 5000,
          registrationStatus: 'PENDING',
          paymentStatus: 'PENDING',
          auctionStatus: 'REGISTERED',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'PLAYER_REGISTERED',
          entityType: 'PLAYER',
          entityId: player.id,
        },
      });

      return { user, player };
    });

    const token = generateToken({
      userId: result.user.id,
      role: 'PLAYER',
    });

    return res.json({
      success: true,
      token,
      registrationFee: CONFIG.REGISTRATION_FEE,
      player: result.player,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/players/:id
 * Retrieves player details by ID or Player Code
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const player = await prisma.player.findFirst({
      where: {
        OR: [{ id }, { playerCode: id }],
      },
      include: {
        assignedTeam: { select: { id: true, name: true, shortCode: true, logoUrl: true } },
        payments: { select: { id: true, amount: true, status: true, providerOrderId: true, createdAt: true } },
      },
    });

    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    return res.json({ success: true, player });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/players
 * Lists all players with filtering (status, category, search)
 */
router.get('/', async (req, res) => {
  try {
    const { status, category, search } = req.query;

    const where: any = {};

    if (status) {
      if (String(status) === 'AVAILABLE') {
        where.auctionStatus = { in: ['AVAILABLE', 'ADMIN_VERIFIED'] };
      } else {
        where.auctionStatus = String(status);
      }
    }

    if (category) {
      where.category = String(category);
    }

    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { playerCode: { contains: String(search) } },
        { phone: { contains: String(search) } },
      ];
    }

    const players = await prisma.player.findMany({
      where,
      include: {
        assignedTeam: { select: { id: true, name: true, shortCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, players, count: players.length });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
