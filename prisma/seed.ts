import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Mini IPL Database...');

  // Clean existing seed data
  await prisma.bid.deleteMany();
  await prisma.auctionResult.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.player.deleteMany();
  await prisma.ownerInvitation.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Default Admin User
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Tournament Admin',
      email: 'admin@ipl.com',
      phone: '+919999999999',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin Provisioned: admin@ipl.com (Password: admin123)');

  // 2. Create Default IPL Teams
  const teamsData = [
    { name: 'Chennai Super Kings', shortCode: 'CSK', initialPurse: 1000000, remainingPurse: 1000000 },
    { name: 'Mumbai Indians', shortCode: 'MI', initialPurse: 1000000, remainingPurse: 1000000 },
    { name: 'Royal Challengers Bangalore', shortCode: 'RCB', initialPurse: 1000000, remainingPurse: 1000000 },
    { name: 'Kolkata Knight Riders', shortCode: 'KKR', initialPurse: 1000000, remainingPurse: 1000000 },
  ];

  for (const team of teamsData) {
    await prisma.team.create({
      data: team,
    });
  }

  console.log('✅ Seeded 4 Teams (CSK, MI, RCB, KKR)');

  // 3. Create Sample Players for Testing
  const playerPasswordHash = await bcrypt.hash('player123', 10);

  const samplePlayers = [
    {
      name: 'Virat Sharma',
      email: 'virat@example.com',
      phone: '+919876543210',
      category: 'Batsman',
      age: 26,
      battingStyle: 'Right-hand',
      bowlingStyle: 'None',
      basePrice: 10000,
      playerCode: 'IPL26-P0001',
    },
    {
      name: 'Rohit Verma',
      email: 'rohit@example.com',
      phone: '+919876543211',
      category: 'Batsman',
      age: 28,
      battingStyle: 'Right-hand',
      bowlingStyle: 'None',
      basePrice: 10000,
      playerCode: 'IPL26-P0002',
    },
    {
      name: 'Jasprit Patel',
      email: 'jasprit@example.com',
      phone: '+919876543212',
      category: 'Bowler',
      age: 24,
      battingStyle: 'Right-hand',
      bowlingStyle: 'Fast',
      basePrice: 8000,
      playerCode: 'IPL26-P0003',
    },
    {
      name: 'MS Dhoni (Local)',
      email: 'msd@example.com',
      phone: '+919876543213',
      category: 'Wicketkeeper',
      age: 30,
      battingStyle: 'Right-hand',
      bowlingStyle: 'None',
      basePrice: 15000,
      playerCode: 'IPL26-P0004',
    },
  ];

  for (const p of samplePlayers) {
    const user = await prisma.user.create({
      data: {
        name: p.name,
        email: p.email,
        phone: p.phone,
        passwordHash: playerPasswordHash,
        role: 'PLAYER',
      },
    });

    await prisma.player.create({
      data: {
        userId: user.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        category: p.category,
        age: p.age,
        battingStyle: p.battingStyle,
        bowlingStyle: p.bowlingStyle,
        basePrice: p.basePrice,
        playerCode: p.playerCode,
        registrationStatus: 'ADMIN_VERIFIED',
        paymentStatus: 'SUCCESS',
        auctionStatus: 'AVAILABLE',
      },
    });
  }

  console.log('✅ Seeded 4 Sample Verified Players available for auction');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
