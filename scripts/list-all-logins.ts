import { prisma } from '../src/lib/prisma';

async function listAllLogins() {
  const users = await prisma.user.findMany({
    include: { player: true, ownedTeam: true },
    orderBy: { createdAt: 'desc' },
  });

  console.log('\n================ ALL SYSTEM USERS & LOGINS ================');
  for (const u of users) {
    console.log(`Role: ${u.role} | Name: ${u.name}`);
    console.log(`   Email: ${u.email}`);
    console.log(`   Phone: ${u.phone}`);
    if (u.player) {
      console.log(`   Player ID: ${u.player.playerCode}`);
    }
    if (u.ownedTeam) {
      console.log(`   Team Owned: ${u.ownedTeam.name} (${u.ownedTeam.shortCode})`);
    }
    console.log('-----------------------------------------------------------');
  }
}

listAllLogins().finally(() => prisma.$disconnect());
