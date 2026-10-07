import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/auth';
import { normalizePhoneNumber, sendPlayerRegistrationWhatsApp } from '../src/services/whatsapp.service';
import { createPaymentOrder, verifyPaymentSignature } from '../src/services/payment.service';

async function registerVarun() {
  console.log('🏏 Registering Player: Varun...');

  const phone = '9392672873';
  const normalizedPhone = normalizePhoneNumber(phone);
  const email = 'varun@example.com';
  const passwordHash = await hashPassword('password123');

  // 1. Create User & Player
  const user = await prisma.user.upsert({
    where: { email },
    update: { phone: normalizedPhone },
    create: {
      name: 'Varun',
      email,
      phone: normalizedPhone,
      passwordHash,
      role: 'PLAYER',
    },
  });

  const player = await prisma.player.upsert({
    where: { userId: user.id },
    update: {
      phone: normalizedPhone,
      whatsappNumber: normalizedPhone,
    },
    create: {
      userId: user.id,
      name: 'Varun',
      email,
      phone: normalizedPhone,
      whatsappNumber: normalizedPhone,
      category: 'All-Rounder',
      age: 24,
      battingStyle: 'Right-hand',
      bowlingStyle: 'Medium Pace',
      basePrice: 10000,
      registrationStatus: 'PENDING',
      paymentStatus: 'PENDING',
      auctionStatus: 'REGISTERED',
    },
  });

  console.log('✅ Player Record Created:', player.id);

  // 2. Create Payment Order
  const order = await createPaymentOrder({ playerId: player.id, amount: 208 });
  console.log('✅ Payment Order Created:', order.providerOrderId);

  // 3. Server-side Payment Verification
  const verifyResult = await verifyPaymentSignature({
    playerId: player.id,
    providerOrderId: order.providerOrderId,
    providerPaymentId: `pay_varun_${Date.now()}`,
    signature: 'mock_valid_signature',
  });

  console.log('🎉 Payment Verified Successfully!');
  console.log('🆔 Generated Player ID:', verifyResult.playerCode);

  // 4. Check Notification Log
  const notif = await prisma.whatsappNotification.findFirst({
    where: { playerId: player.id },
  });

  console.log('📱 WhatsApp Notification Status:');
  console.log('   Recipient:', notif?.recipientNumber);
  console.log('   Status:', notif?.status);
  console.log('   Message ID:', notif?.providerMessageId);
}

registerVarun()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error('Error registering Varun:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
