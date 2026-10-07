import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/auth';

async function seedOwners() {
  console.log('🔑 Creating Team Owner logins for 5 IPL Teams (CSK, MI, RCB, KKR, DC)...');

  const passwordHash = await hashPassword('password123');

  const owners = [
    { name: 'CSK Owner', email: 'csk@aspl.com', phone: '+919800000001', teamCode: 'CSK' },
    { name: 'MI Owner', email: 'mi@aspl.com', phone: '+919800000002', teamCode: 'MI' },
    { name: 'RCB Owner', email: 'rcb@aspl.com', phone: '+919800000003', teamCode: 'RCB' },
    { name: 'KKR Owner', email: 'kkr@aspl.com', phone: '+919800000004', teamCode: 'KKR' },
    { name: 'DC Owner', email: 'dc@aspl.com', phone: '+919800000005', teamCode: 'DC' },
  ];

  for (const o of owners) {
    const user = await prisma.user.upsert({
      where: { email: o.email },
      update: { name: o.name, role: 'TEAM_OWNER' },
      create: {
        name: o.name,
        email: o.email,
        phone: o.phone,
        passwordHash,
        role: 'TEAM_OWNER',
      },
    });

    const team = await prisma.team.findUnique({ where: { shortCode: o.teamCode } });
    if (team) {
      await prisma.team.update({
        where: { id: team.id },
        data: { ownerUserId: user.id },
      });
      console.log(`✅ Assigned ${o.name} (${o.email}) to Team ${team.name} (${team.shortCode})`);
    }
  }

  console.log('\n🎉 ALL 5 TEAM OWNER ACCOUNTS CREATED SUCCESSFULLY!');
  console.log('   Password for all owner accounts: password123');
}

seedOwners()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error('Error seeding owners:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
