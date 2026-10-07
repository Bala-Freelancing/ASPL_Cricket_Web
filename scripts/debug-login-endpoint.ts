import { prisma } from '../src/lib/prisma';
import { comparePassword } from '../src/lib/auth';

async function debugLogin() {
  const identifier = 'IPL26-P0009';
  const password = '9791234315';

  console.log(`\n🔍 DEBUGGING LOGIN FOR IDENTIFIER: "${identifier}" AND PASSWORD: "${password}"`);

  // 1. Search player
  const player = await prisma.player.findFirst({
    where: {
      OR: [
        { playerCode: identifier.trim().toUpperCase() },
        { phone: identifier.trim() },
        { email: identifier.trim().toLowerCase() },
      ],
    },
    include: { user: true, assignedTeam: true },
  });

  console.log('Player lookup result:', player ? `Found: ${player.name} (${player.playerCode})` : 'NULL');

  let user: any = player?.user || null;

  if (!user) {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.trim().toLowerCase() },
          { phone: identifier.trim() },
        ],
      },
      include: { ownedTeam: true, player: { include: { assignedTeam: true } } },
    });
    console.log('Fallback user lookup result:', user ? `Found: ${user.name} (${user.email})` : 'NULL');
  }

  if (!user) {
    console.log('❌ USER IS NULL!');
    return;
  }

  console.log(`User found: ID=${user.id} Email=${user.email} Phone=${user.phone} Role=${user.role} IsActive=${user.isActive}`);
  console.log(`Password Hash in DB: "${user.passwordHash}"`);

  let isMatch = await comparePassword(password, user.passwordHash);
  console.log(`Bcrypt compare match: ${isMatch}`);

  if (!isMatch) {
    const userPhoneDigits = user.phone ? user.phone.replace(/\D/g, '') : '';
    const playerPhoneDigits = (user.player && user.player.phone) ? user.player.phone.replace(/\D/g, '') : '';
    const inputDigits = password.replace(/\D/g, '');

    console.log(`Phone Digits Debug: userPhoneDigits="${userPhoneDigits}", playerPhoneDigits="${playerPhoneDigits}", inputDigits="${inputDigits}"`);

    if (
      password === user.phone ||
      password === userPhoneDigits ||
      (inputDigits.length >= 7 && userPhoneDigits.endsWith(inputDigits)) ||
      (inputDigits.length >= 7 && playerPhoneDigits.endsWith(inputDigits)) ||
      (userPhoneDigits.length >= 10 && inputDigits.length >= 10 && userPhoneDigits.slice(-10) === inputDigits.slice(-10)) ||
      (playerPhoneDigits.length >= 10 && inputDigits.length >= 10 && playerPhoneDigits.slice(-10) === inputDigits.slice(-10))
    ) {
      isMatch = true;
      console.log('✅ Phone fallback matched!');
    }
  }

  console.log(`Final isMatch: ${isMatch}`);

  // Test HTTP request to running server on localhost:4000
  try {
    const res = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: identifier,
        password,
        role: 'PLAYER',
      }),
    });
    const data = await res.json();
    console.log('\n🌐 SERVER HTTP RESPONSE FROM http://localhost:4000/api/auth/login:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error('HTTP fetch error:', err.message);
  }
}

debugLogin().finally(() => prisma.$disconnect());
