import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Enable SQLite WAL mode and 5s busy timeout automatically for zero database lock errors
if (!globalForPrisma.prisma) {
  prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL;').catch(() => {});
  prisma.$queryRawUnsafe('PRAGMA busy_timeout=5000;').catch(() => {});
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

