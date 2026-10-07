import { prisma } from '../src/lib/prisma';

async function inspectPlayers() {
  const players = await prisma.player.findMany({
    include: { user: true },
  });

  console.log(`\nFound ${players.length} Total Players in dev.db:`);
  players.forEach((p, idx) => {
    console.log(`${idx + 1}. Code: "${p.playerCode}" | Name: "${p.name}" | Email: "${p.email}" | Phone: "${p.phone}" | UserId: "${p.userId}" | User.Phone: "${p.user?.phone}"`);
  });
}

inspectPlayers().finally(() => prisma.$disconnect());
