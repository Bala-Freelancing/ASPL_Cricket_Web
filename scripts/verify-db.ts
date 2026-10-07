import { prisma } from '../src/lib/prisma';

async function verify() {
  const teams = await prisma.team.findMany({
    select: { name: true, shortCode: true, owner: { select: { email: true } } },
  });
  const players = await prisma.player.findMany({
    select: { name: true, playerCode: true, profilePhoto: true, auctionStatus: true },
  });

  console.log('\n--- REGISTERED TEAMS ---');
  console.table(teams.map(t => ({ Name: t.name, Code: t.shortCode, OwnerEmail: t.owner?.email })));

  console.log('\n--- REGISTERED PLAYERS ---');
  console.table(players.map(p => ({ Name: p.name, Code: p.playerCode, Photo: p.profilePhoto, Status: p.auctionStatus })));
}

verify().finally(() => prisma.$disconnect());
