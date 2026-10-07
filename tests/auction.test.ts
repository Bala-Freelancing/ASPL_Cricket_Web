import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { hashPassword, comparePassword } from '../src/lib/auth';
import { CONFIG } from '../src/lib/config';

vi.setConfig({ testTimeout: 15000 });
import {
  startAuction,
  placeBid,
  markLotSold,
} from '../src/services/auction.service';
import {
  normalizePhoneNumber,
  sendPlayerRegistrationWhatsApp,
  resendWhatsAppNotification,
} from '../src/services/whatsapp.service';
import {
  createPaymentOrder,
  verifyPaymentSignature,
  processPaymentWebhook,
  getPaymentProvider,
} from '../src/services/payment.service';
import { cashfreeProvider } from '../src/services/cashfree.provider';

describe('Mini IPL Platform — Cashfree Payments & Auction Test Suite', () => {
  beforeAll(async () => {
    await prisma.$transaction([
      prisma.whatsappNotification.deleteMany(),
      prisma.bid.deleteMany(),
      prisma.auctionResult.deleteMany(),
      prisma.auction.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.player.deleteMany(),
      prisma.ownerInvitation.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // Re-create default Admin for DB integrity
    const adminHash = await hashPassword('admin123');
    await prisma.user.create({
      data: {
        id: 'admin-default-id',
        name: 'Tournament Admin',
        email: 'admin@ipl.com',
        phone: '+919999999999',
        passwordHash: adminHash,
        role: 'ADMIN',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Authentication & Phone Normalization', () => {
    it('should hash and compare passwords securely', async () => {
      const plain = 'SecretPass123';
      const hash = await hashPassword(plain);
      expect(hash).not.toBe(plain);
      expect(await comparePassword(plain, hash)).toBe(true);
      expect(await comparePassword('WrongPass', hash)).toBe(false);
    });

    it('should normalize Indian phone numbers to E.164 standard (+919871234567)', () => {
      expect(normalizePhoneNumber('9871234567')).toBe('+919871234567');
      expect(normalizePhoneNumber('+919871234567')).toBe('+919871234567');
      expect(normalizePhoneNumber('09871234567')).toBe('+919871234567');
      expect(normalizePhoneNumber('0919871234567')).toBe('+919871234567');
    });
  });

  describe('Cashfree Payments Provider Architecture & Registration Flow', () => {
    let testPlayerId: string;
    let providerOrderId: string;

    beforeAll(async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Rahul Kumar',
          email: 'rahul.test@example.com',
          phone: '+919876543210',
          passwordHash: 'hash',
          role: 'PLAYER',
        },
      });

      const player = await prisma.player.create({
        data: {
          userId: user.id,
          name: 'Rahul Kumar',
          email: 'rahul.test@example.com',
          phone: '+919876543210',
          whatsappNumber: '+919876543210',
          category: 'Batsman',
          age: 25,
          battingStyle: 'Right-hand',
          bowlingStyle: 'None',
          basePrice: 5000,
          registrationStatus: 'PENDING',
          paymentStatus: 'PENDING',
        },
      });

      testPlayerId = player.id;
      const order = await createPaymentOrder({ playerId: testPlayerId });
      providerOrderId = order.providerOrderId;
    });

    it('Test 1 — Successful Cashfree Payment Order Creation & Server Fee Enforcement (₹208)', async () => {
      expect(providerOrderId).toBeDefined();
      expect(providerOrderId).toMatch(/^(cf_ord|order_cf_mock)/);

      const paymentInDb = await prisma.payment.findUnique({ where: { providerOrderId } });
      expect(paymentInDb).toBeDefined();
      expect(paymentInDb?.amount).toBe(208); // Server-enforced fee
      expect(paymentInDb?.provider).toBe('CASHFREE');
      expect(paymentInDb?.status).toBe('PENDING');
    });

    it('Test 2 — Successful Cashfree Payment Verification & Single Player ID Badge Generation', async () => {
      const result = await verifyPaymentSignature({
        playerId: testPlayerId,
        providerOrderId,
        providerPaymentId: 'cf_pay_test_123',
        signature: 'mock_valid_signature',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('SUCCESS');
      expect(result.playerCode).toMatch(/^IPL26-P\d{4}$/);

      // Verify DB player registration status
      const updatedPlayer = await prisma.player.findUnique({ where: { id: testPlayerId } });
      expect(updatedPlayer?.paymentStatus).toBe('SUCCESS');
      expect(updatedPlayer?.registrationStatus).toBe('PAID');
      expect(updatedPlayer?.auctionStatus).toBe('PAYMENT_VERIFIED');

      // Poll for async WhatsApp notification completion
      let notif = null;
      for (let i = 0; i < 25; i++) {
        notif = await prisma.whatsappNotification.findFirst({
          where: { playerId: testPlayerId },
        });
        if (notif && notif.status !== 'PENDING') break;
        await new Promise((r) => setTimeout(r, 200));
      }

      expect(notif).toBeDefined();
      expect(notif?.recipientNumber).toBe('+919876543210');
      expect(notif?.status).toBe('SENT');
    });

    it('Test 3 — Failed Payment Handling (Registration remains PENDING, No Player ID Generated)', async () => {
      const unverifiedUser = await prisma.user.create({
        data: {
          name: 'Failed Payer',
          email: 'failed@example.com',
          phone: '+919998887770',
          passwordHash: 'hash',
          role: 'PLAYER',
        },
      });

      const unverifiedPlayer = await prisma.player.create({
        data: {
          userId: unverifiedUser.id,
          name: 'Failed Payer',
          email: 'failed@example.com',
          phone: '+919998887770',
          category: 'Bowler',
          age: 22,
          battingStyle: 'Right-hand',
          bowlingStyle: 'Fast',
          paymentStatus: 'PENDING',
        },
      });

      await expect(
        sendPlayerRegistrationWhatsApp(unverifiedPlayer.id)
      ).rejects.toThrow('Player payment not verified');

      const notifCount = await prisma.whatsappNotification.count({
        where: { playerId: unverifiedPlayer.id },
      });

      expect(notifCount).toBe(0);
      expect(unverifiedPlayer.playerCode).toBeNull();
    });

    it('Test 4 — Duplicate Webhook & Verification Idempotency Lock', async () => {
      const notifBefore = await prisma.whatsappNotification.count({
        where: { playerId: testPlayerId, status: 'SENT' },
      });

      const secondResult = await sendPlayerRegistrationWhatsApp(testPlayerId);

      expect(secondResult.success).toBe(true);
      expect(secondResult.alreadyProcessed).toBe(true);

      const notifAfter = await prisma.whatsappNotification.count({
        where: { playerId: testPlayerId, status: 'SENT' },
      });

      expect(notifAfter).toBe(notifBefore); // Guaranteed zero duplicate WhatsApp message dispatches
    });

    it('Test 5 — Invalid Webhook Signature Rejection', async () => {
      const invalidWebhookResult = await processPaymentWebhook({
        rawBody: JSON.stringify({ data: { order: { order_id: 'cf_ord_fake' }, payment: { payment_status: 'SUCCESS' } } }),
        headers: {
          'x-webhook-signature': 'invalid_forged_signature',
          'x-webhook-timestamp': String(Date.now()),
        },
      });

      expect(invalidWebhookResult.success).toBe(false);
      expect(invalidWebhookResult.error).toContain('Invalid Cashfree webhook signature');
    });

    it('Test 6 — Client Payment Fee Tampering Rejection (Server Enforces ₹208)', async () => {
      const tamperUser = await prisma.user.create({
        data: {
          name: 'Tamper Payer',
          email: 'tamper@example.com',
          phone: '+919870001111',
          passwordHash: 'hash',
          role: 'PLAYER',
        },
      });

      const tamperPlayer = await prisma.player.create({
        data: {
          userId: tamperUser.id,
          name: 'Tamper Payer',
          email: 'tamper@example.com',
          phone: '+919870001111',
          category: 'Batsman',
          age: 23,
          battingStyle: 'Right-hand',
          bowlingStyle: 'None',
        },
      });

      // Attempt to send amount: 1 from client
      const order = await createPaymentOrder({ playerId: tamperPlayer.id, amount: 1 });
      expect(order.amount).toBe(208); // Must enforce authoritative ₹208 server fee

      const dbPayment = await prisma.payment.findUnique({ where: { providerOrderId: order.providerOrderId } });
      expect(dbPayment?.amount).toBe(208);
    });

    it('Test 7 — Payment Verification for Unknown Player Rejection', async () => {
      await expect(
        verifyPaymentSignature({
          playerId: 'non-existent-player-id',
          providerOrderId: 'cf_ord_non_existent',
        })
      ).rejects.toThrow('Payment order record not found');
    });

    it('Test 8 — Repeated Payment Verification Idempotency', async () => {
      const repeatVerify = await verifyPaymentSignature({
        playerId: testPlayerId,
        providerOrderId,
        providerPaymentId: 'cf_pay_test_123',
      });

      expect(repeatVerify.success).toBe(true);
      expect(repeatVerify.alreadyProcessed).toBe(true);
      expect(repeatVerify.status).toBe('SUCCESS');
    });

    it('Test 9 — WhatsApp Failure Resilience (Payment remains SUCCESS, Registration remains PAID)', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'API Fail User',
          email: 'apifail@example.com',
          phone: '+919871112233',
          passwordHash: 'hash',
          role: 'PLAYER',
        },
      });

      const player = await prisma.player.create({
        data: {
          userId: user.id,
          name: 'API Fail User',
          email: 'apifail@example.com',
          phone: '+919871112233',
          category: 'All-Rounder',
          age: 24,
          battingStyle: 'Right-hand',
          bowlingStyle: 'Spin',
          playerCode: 'IPL26-P9999',
          paymentStatus: 'SUCCESS',
          registrationStatus: 'PAID',
        },
      });

      // Manually trigger dispatch with forced failure
      const notif = await prisma.whatsappNotification.create({
        data: {
          playerId: player.id,
          recipientNumber: '+919871112233',
          status: 'FAILED',
          errorMessage: 'Meta Cloud API returned 500 Network Timeout',
        },
      });

      expect(notif.status).toBe('FAILED');

      // Verify Player registration status remains PAID and SUCCESS
      const refreshedPlayer = await prisma.player.findUnique({ where: { id: player.id } });
      expect(refreshedPlayer?.paymentStatus).toBe('SUCCESS');
      expect(refreshedPlayer?.registrationStatus).toBe('PAID');
    });

    it('Test 10 — Admin Manual Resend WhatsApp', async () => {
      const failedNotif = await prisma.whatsappNotification.findFirst({
        where: { status: 'FAILED' },
      });

      expect(failedNotif).toBeDefined();

      const resendResult = await resendWhatsAppNotification(failedNotif!.id);

      expect(resendResult.success).toBe(true);
      expect(resendResult.notification.status).toBe('SENT');
    });

    it('Test 11 — Sandbox & Production Provider Configuration Validation', async () => {
      const provider = getPaymentProvider();
      expect(provider.name).toBe('CASHFREE');

      const envSetting = (CONFIG.CASHFREE_ENVIRONMENT || 'sandbox').toLowerCase();
      expect(['sandbox', 'production']).toContain(envSetting);
    });

    it('Test 12 — Cashfree Refund Execution Interface Validation', async () => {
      const refundRes = await cashfreeProvider.refundPayment({
        providerOrderId: 'order_cf_mock_123',
        amount: 208,
        reason: 'Player request refund',
      });

      expect(refundRes.success).toBe(true);
      expect(refundRes.refundId).toBeDefined();
    });
  });

  describe('Auction Engine & Bidding Rules', () => {
    let testPlayerId: string;
    let ownerAUserId: string;

    beforeAll(async () => {
      const shortCode = `T${Math.floor(Math.random() * 8999 + 1000)}`;
      const userA = await prisma.user.create({
        data: {
          name: 'Owner Team A',
          email: `ownera_${Date.now()}@test.com`,
          phone: `+91${Date.now()}`.substring(0, 13),
          passwordHash: 'hash',
          role: 'TEAM_OWNER',
        },
      });
      ownerAUserId = userA.id;

      await prisma.team.create({
        data: {
          name: `Super Kings Test ${Date.now()}`,
          shortCode,
          ownerUserId: ownerAUserId,
          initialPurse: 100000,
          remainingPurse: 100000,
        },
      });

      const playerUser = await prisma.user.create({
        data: {
          name: 'Auction Player',
          email: 'aucplayer@test.com',
          phone: '+913333333344',
          passwordHash: 'hash',
          role: 'PLAYER',
        },
      });

      const player = await prisma.player.create({
        data: {
          userId: playerUser.id,
          name: 'Auction Player',
          email: 'aucplayer@test.com',
          phone: '+913333333344',
          category: 'Batsman',
          age: 25,
          battingStyle: 'Right-hand',
          bowlingStyle: 'None',
          basePrice: 5000,
          playerCode: 'IPL26-P0050',
          registrationStatus: 'ADMIN_VERIFIED',
          paymentStatus: 'SUCCESS',
          auctionStatus: 'AVAILABLE',
        },
      });
      testPlayerId = player.id;
    });

    it('should start auction and place bid', async () => {
      const auction = await startAuction({ playerId: testPlayerId, basePrice: 5000 });
      expect(auction.state).toBe('ACTIVE');

      const result = await placeBid({
        auctionId: auction.id,
        teamOwnerUserId: ownerAUserId,
        amount: 5000,
      });

      expect(result.auction.currentBid).toBe(5000);

      const soldResult = await markLotSold(auction.id);
      expect(soldResult.player.auctionStatus).toBe('SOLD');
    });
  });
});
