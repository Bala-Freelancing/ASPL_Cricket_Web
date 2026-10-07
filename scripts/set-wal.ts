import { prisma } from '../src/lib/prisma';

async function setWalMode() {
  console.log('Configuring SQLite for high-concurrency WAL mode...');
  const mode = await prisma.$queryRawUnsafe(`PRAGMA journal_mode=WAL;`);
  console.log('PRAGMA journal_mode result:', mode);
  const busy = await prisma.$queryRawUnsafe(`PRAGMA busy_timeout=5000;`);
  console.log('PRAGMA busy_timeout result:', busy);
  const sync = await prisma.$queryRawUnsafe(`PRAGMA synchronous=NORMAL;`);
  console.log('PRAGMA synchronous result:', sync);
}

setWalMode()
  .then(() => console.log('Successfully configured SQLite WAL mode!'))
  .catch((err) => console.error('Error configuring WAL mode:', err))
  .finally(() => prisma.$disconnect());
