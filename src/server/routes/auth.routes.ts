import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { comparePassword, generateToken, hashPassword, verifyToken } from '../../lib/auth';

const router = Router();

/**
 * POST /api/auth/login
 * Unified authentication endpoint for Admin and Team Owners.
 * Players use public registration and player dashboard token.
 */
/**
 * POST /api/auth/login
 * Multi-role authentication endpoint supporting Player ID, Email, or Phone.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, username, password, role } = req.body;
    const identifier = username || email;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Invalid credentials.' });
    }

    const trimmed = String(identifier).trim();
    let user: any = null;

    // Check if identifier looks like Player ID (e.g. IPL26-P0001) or role is PLAYER
    if (trimmed.toUpperCase().startsWith('IPL26-') || role === 'PLAYER') {
      const player = await prisma.player.findFirst({
        where: {
          OR: [
            { playerCode: trimmed.toUpperCase() },
            { phone: trimmed },
            { email: trimmed.toLowerCase() },
          ],
        },
        include: { user: { include: { ownedTeam: true, player: { include: { assignedTeam: true } } } }, assignedTeam: true },
      });

      if (player && player.user) {
        user = player.user;
      }
    }

    // Fallback: search User model by email or phone
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: trimmed.toLowerCase() },
            { phone: trimmed },
          ],
        },
        include: { ownedTeam: true, player: { include: { assignedTeam: true } } },
      });
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    // Compare password with hashed password
    let isMatch = await comparePassword(password, user.passwordHash);

    // Initial password fallback check (e.g., registered phone number like 9791234315 or +919791234315)
    if (!isMatch) {
      const userPhoneDigits = user.phone ? user.phone.replace(/\D/g, '') : '';
      const playerPhoneDigits = (user.player && user.player.phone) ? user.player.phone.replace(/\D/g, '') : '';
      const inputDigits = password.replace(/\D/g, '');

      if (
        password === user.phone ||
        password === userPhoneDigits ||
        (inputDigits.length >= 7 && userPhoneDigits.endsWith(inputDigits)) ||
        (inputDigits.length >= 7 && playerPhoneDigits.endsWith(inputDigits)) ||
        (userPhoneDigits.length >= 10 && inputDigits.length >= 10 && userPhoneDigits.slice(-10) === inputDigits.slice(-10)) ||
        (playerPhoneDigits.length >= 10 && inputDigits.length >= 10 && playerPhoneDigits.slice(-10) === inputDigits.slice(-10))
      ) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const token = generateToken({
      userId: user.id,
      role: user.role as any,
      teamId: user.ownedTeam?.id || user.player?.assignedTeamId || null,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword || false,
        team: user.ownedTeam || null,
        player: user.player || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Invalid credentials.' });
  }
});

/**
 * POST /api/auth/change-password
 * Allows authenticated user to update their password.
 */
router.post('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    const { newPassword, confirmPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match' });
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: payload.userId },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    return res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/owner-activate
 * Activates Team Owner account using token from Admin invitation link.
 */
router.post('/owner-activate', async (req, res) => {
  try {
    const { token, name, password } = req.body;

    if (!token || !password || !name) {
      return res.status(400).json({ success: false, error: 'Token, name, and password are required' });
    }

    const invitation = await prisma.ownerInvitation.findUnique({
      where: { tokenHash: token },
      include: { team: true },
    });

    if (!invitation || invitation.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Invalid, used, or expired invitation token' });
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.ownerInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ success: false, error: 'Invitation link has expired' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Atomic user creation and team owner assignment
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or update user with TEAM_OWNER role
      const user = await tx.user.create({
        data: {
          name,
          email: invitation.email,
          phone: invitation.phone,
          passwordHash,
          role: 'TEAM_OWNER',
        },
      });

      // 2. Link team to owner
      await tx.team.update({
        where: { id: invitation.teamId },
        data: { ownerUserId: user.id },
      });

      // 3. Update invitation status to ACCEPTED
      await tx.ownerInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          usedAt: new Date(),
        },
      });

      return user;
    });

    const authToken = generateToken({
      userId: result.id,
      role: 'TEAM_OWNER',
      teamId: invitation.teamId,
    });

    return res.json({
      success: true,
      token: authToken,
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        role: 'TEAM_OWNER',
        teamId: invitation.teamId,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/auth/me
 * Retrieves active authenticated user session.
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        ownedTeam: {
          include: {
            players: {
              select: {
                id: true,
                playerCode: true,
                name: true,
                category: true,
                winningBid: true,
                profilePhoto: true,
                battingStyle: true,
                bowlingStyle: true,
              },
            },
          },
        },
        player: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: user.ownedTeam,
        player: user.player,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
