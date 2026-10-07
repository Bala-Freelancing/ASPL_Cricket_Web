import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/auth';
import fs from 'fs';
import path from 'path';
import https from 'https';

function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location!, filepath).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function seedTestData() {
  console.log('🚀 Seeding 3 IPL Teams & 5 Test Players with Photos...');

  const playersDir = path.join(process.cwd(), 'public', 'players');
  if (!fs.existsSync(playersDir)) {
    fs.mkdirSync(playersDir, { recursive: true });
  }

  // 1. Seed 5 IPL Teams with Franchise Owners
  const teamsData = [
    { name: 'Chennai Super Kings', shortCode: 'CSK', email: 'csk@aspl.com', phone: '+919800000001', initialPurse: 10000000, remainingPurse: 10000000, maxSquadSize: 15 },
    { name: 'Mumbai Indians', shortCode: 'MI', email: 'mi@aspl.com', phone: '+919800000002', initialPurse: 10000000, remainingPurse: 10000000, maxSquadSize: 15 },
    { name: 'Royal Challengers Bengaluru', shortCode: 'RCB', email: 'rcb@aspl.com', phone: '+919800000003', initialPurse: 10000000, remainingPurse: 10000000, maxSquadSize: 15 },
    { name: 'Kolkata Knight Riders', shortCode: 'KKR', email: 'kkr@aspl.com', phone: '+919800000004', initialPurse: 10000000, remainingPurse: 10000000, maxSquadSize: 15 },
    { name: 'Delhi Capitals', shortCode: 'DC', email: 'dc@aspl.com', phone: '+919800000005', initialPurse: 10000000, remainingPurse: 10000000, maxSquadSize: 15 },
  ];

  const defaultOwnerPasswordHash = await hashPassword('password123');

  for (const t of teamsData) {
    const ownerUser = await prisma.user.upsert({
      where: { email: t.email },
      update: { name: `${t.name} Owner`, passwordHash: defaultOwnerPasswordHash, role: 'TEAM_OWNER' },
      create: {
        name: `${t.name} Owner`,
        email: t.email,
        phone: t.phone,
        passwordHash: defaultOwnerPasswordHash,
        role: 'TEAM_OWNER',
        mustChangePassword: false,
      },
    });

    await prisma.team.upsert({
      where: { shortCode: t.shortCode },
      update: { name: t.name, initialPurse: t.initialPurse, maxSquadSize: t.maxSquadSize, ownerUserId: ownerUser.id },
      create: {
        name: t.name,
        shortCode: t.shortCode,
        initialPurse: t.initialPurse,
        remainingPurse: t.remainingPurse,
        maxSquadSize: t.maxSquadSize,
        ownerUserId: ownerUser.id,
      },
    });
    console.log(`✅ Team Created/Updated with Owner (${t.email}): ${t.name} (${t.shortCode})`);
  }

  // 2. Download 5 High Quality Player Photos to public/players/
  const samplePhotos = [
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
  ];

  for (let i = 0; i < samplePhotos.length; i++) {
    const localPath = path.join(playersDir, `player${i + 1}.jpg`);
    try {
      await downloadImage(samplePhotos[i], localPath);
      console.log(`📸 Downloaded photo: /players/player${i + 1}.jpg`);
    } catch (err) {
      console.warn(`⚠️ Download fallback for player ${i + 1}`);
    }
  }

  // 3. Register 5 Test Players
  const playersToCreate = [
    {
      name: 'Rohit Sharma',
      email: 'rohit@aspl.com',
      phone: '9876543201',
      category: 'Batsman',
      age: 36,
      battingStyle: 'Right-hand',
      bowlingStyle: 'Right-arm Off Spin',
      basePrice: 5000,
      photoUrl: '/players/player1.jpg',
      playerCode: 'IPL26-P0101',
    },
    {
      name: 'Jasprit Bumrah',
      email: 'bumrah@aspl.com',
      phone: '9876543202',
      category: 'Bowler',
      age: 30,
      battingStyle: 'Right-hand',
      bowlingStyle: 'Right-arm Fast',
      basePrice: 5000,
      photoUrl: '/players/player2.jpg',
      playerCode: 'IPL26-P0102',
    },
    {
      name: 'Virat Kohli',
      email: 'virat@aspl.com',
      phone: '9876543203',
      category: 'Batsman',
      age: 35,
      battingStyle: 'Right-hand',
      bowlingStyle: 'Right-arm Medium',
      basePrice: 5000,
      photoUrl: '/players/player3.jpg',
      playerCode: 'IPL26-P0103',
    },
    {
      name: 'Hardik Pandya',
      email: 'hardik@aspl.com',
      phone: '9876543204',
      category: 'All-Rounder',
      age: 30,
      battingStyle: 'Right-hand',
      bowlingStyle: 'Right-arm Fast Medium',
      basePrice: 5000,
      photoUrl: '/players/player4.jpg',
      playerCode: 'IPL26-P0104',
    },
    {
      name: 'KL Rahul',
      email: 'klrahul@aspl.com',
      phone: '9876543205',
      category: 'Wicketkeeper',
      age: 31,
      battingStyle: 'Right-hand',
      bowlingStyle: 'None',
      basePrice: 5000,
      photoUrl: '/players/player5.jpg',
      playerCode: 'IPL26-P0105',
    },
    {
      name: 'varun',
      email: 'balakumarkk5@gmail.com',
      phone: '9791234315',
      category: 'All-Rounder',
      age: 25,
      battingStyle: 'Right-hand',
      bowlingStyle: 'Right-arm Fast',
      basePrice: 5000,
      photoUrl: '/players/player1.jpg',
      playerCode: 'IPL26-P0009',
    },
  ];

  const defaultPasswordHash = await hashPassword('password123');

  for (const p of playersToCreate) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: { name: p.name, phone: `+91${p.phone}` },
      create: {
        name: p.name,
        email: p.email,
        phone: `+91${p.phone}`,
        passwordHash: defaultPasswordHash,
        role: 'PLAYER',
      },
    });

    const existingPlayer = await prisma.player.findUnique({ where: { userId: user.id } });

    let player;
    if (existingPlayer) {
      player = await prisma.player.update({
        where: { id: existingPlayer.id },
        data: {
          name: p.name,
          category: p.category,
          age: p.age,
          battingStyle: p.battingStyle,
          bowlingStyle: p.bowlingStyle,
          basePrice: p.basePrice,
          profilePhoto: p.photoUrl,
          registrationStatus: 'APPROVED',
          paymentStatus: 'SUCCESS',
          auctionStatus: 'ADMIN_VERIFIED',
        },
      });
    } else {
      player = await prisma.player.create({
        data: {
          userId: user.id,
          playerCode: p.playerCode,
          name: p.name,
          email: p.email,
          phone: `+91${p.phone}`,
          whatsappNumber: `+91${p.phone}`,
          category: p.category,
          age: p.age,
          dob: '1992-05-15',
          tshirtSize: 'L',
          isWicketkeeper: p.category === 'Wicketkeeper',
          battingStyle: p.battingStyle,
          bowlingStyle: p.bowlingStyle,
          pincode: '600001',
          description: `Official ASPL 2026 player profile for ${p.name}.`,
          profilePhoto: p.photoUrl,
          basePrice: p.basePrice,
          registrationStatus: 'APPROVED',
          paymentStatus: 'SUCCESS',
          auctionStatus: 'ADMIN_VERIFIED',
        },
      });
    }

    console.log(`🎉 Registered Player: ${player.name} (${player.playerCode}) — Photo: ${player.profilePhoto}`);
  }

  console.log('\n✅ ALL TEST TEAMS AND PLAYERS SUCCESSFULLY SEEDED!');
}

seedTestData()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error('Error seeding test data:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
