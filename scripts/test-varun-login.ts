import { prisma } from '../src/lib/prisma';
import { comparePassword } from '../src/lib/auth';

async function testVarunLogin() {
  console.log('🧪 Testing Player IPL26-P0009 (varun) Login Verification...');

  const player = await prisma.player.findFirst({
    where: { playerCode: 'IPL26-P0009' },
    include: { user: true },
  });

  if (!player || !player.user) {
    throw new Error('Player IPL26-P0009 not found in DB');
  }

  console.log(`Found Player: ${player.name} (${player.playerCode})`);
  console.log(`User Phone: ${player.user.phone} | Player Phone: ${player.phone}`);

  // Test inputs
  const inputsToTest = ['9791234315', '+919791234315', '09791234315'];

  for (const inputPassword of inputsToTest) {
    let isMatch = await comparePassword(inputPassword, player.user.passwordHash);

    if (!isMatch) {
      const userPhoneDigits = player.user.phone ? player.user.phone.replace(/\D/g, '') : '';
      const playerPhoneDigits = player.phone ? player.phone.replace(/\D/g, '') : '';
      const inputDigits = inputPassword.replace(/\D/g, '');

      if (
        inputPassword === player.user.phone ||
        inputPassword === userPhoneDigits ||
        (inputDigits.length >= 7 && userPhoneDigits.endsWith(inputDigits)) ||
        (inputDigits.length >= 7 && playerPhoneDigits.endsWith(inputDigits)) ||
        (userPhoneDigits.length >= 10 && inputDigits.length >= 10 && userPhoneDigits.slice(-10) === inputDigits.slice(-10))
      ) {
        isMatch = true;
      }
    }

    console.log(`Input Password "${inputPassword}": ${isMatch ? '✅ MATCHED (SUCCESS)' : '❌ FAILED'}`);
  }
}

testVarunLogin().finally(() => prisma.$disconnect());
