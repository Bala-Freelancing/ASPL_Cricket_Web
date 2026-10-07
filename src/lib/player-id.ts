import { prisma } from './prisma';

/**
 * Generates a unique human-readable Player ID upon verified payment.
 * Format: IPL26-P0001, IPL26-P0002...
 */
export async function generatePlayerCode(): Promise<string> {
  // Count total players with paid / verified status to get sequential index
  const paidCount = await prisma.player.count({
    where: {
      paymentStatus: 'SUCCESS',
      playerCode: { not: null },
    },
  });

  const nextNumber = paidCount + 1;
  const paddedNumber = String(nextNumber).padStart(4, '0');
  const code = `IPL26-P${paddedNumber}`;

  // Ensure uniqueness in case of concurrent generations
  const existing = await prisma.player.findUnique({
    where: { playerCode: code },
  });

  if (existing) {
    const fallbackNumber = paidCount + Math.floor(Math.random() * 100) + 2;
    return `IPL26-P${String(fallbackNumber).padStart(4, '0')}`;
  }

  return code;
}
