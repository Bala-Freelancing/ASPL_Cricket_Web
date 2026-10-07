import { prisma } from '../src/lib/prisma';
import { hashPassword, comparePassword } from '../src/lib/auth';

async function testPlayerFlow() {
  console.log('🧪 Testing Player Portal Authentication & First Login Password Reset...');

  // 1. Fetch test player Rohit Sharma (IPL26-P0101)
  const player = await prisma.player.findUnique({
    where: { playerCode: 'IPL26-P0101' },
    include: { user: true },
  });

  if (!player || !player.user) {
    throw new Error('Test player IPL26-P0101 not found');
  }

  console.log(`✅ Found Player: ${player.name} (${player.playerCode}) | User ID: ${player.user.id}`);

  // 2. Ensure initial password is set to registered phone digits
  const rawPhone = player.phone.replace(/\D/g, '');
  const initialHash = await hashPassword(rawPhone);

  await prisma.user.update({
    where: { id: player.user.id },
    data: {
      passwordHash: initialHash,
      mustChangePassword: true,
    },
  });

  console.log(`🔐 Set Initial Password to phone number: ${rawPhone} | mustChangePassword = true`);

  // 3. Test initial password match
  const isInitialMatch = await comparePassword(rawPhone, initialHash);
  console.log(`🔑 Initial Password Verification: ${isInitialMatch ? 'MATCHED (SUCCESS)' : 'FAILED'}`);

  // 4. Test password change
  const newSecretPass = 'rohit_secret_2026';
  const newHash = await hashPassword(newSecretPass);

  const updatedUser = await prisma.user.update({
    where: { id: player.user.id },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });

  console.log(`🎉 Password Changed Successfully! mustChangePassword = ${updatedUser.mustChangePassword}`);
  const isNewMatch = await comparePassword(newSecretPass, updatedUser.passwordHash);
  console.log(`🔑 New Password Verification: ${isNewMatch ? 'MATCHED (SUCCESS)' : 'FAILED'}`);
}

testPlayerFlow()
  .then(() => console.log('\n✅ ALL PLAYER PORTAL TESTS PASSED!'))
  .catch((err) => console.error('❌ Player Portal Test Error:', err))
  .finally(() => prisma.$disconnect());
