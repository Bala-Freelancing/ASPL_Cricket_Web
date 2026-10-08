import { prisma } from '../lib/prisma';
import { CONFIG } from '../lib/config';
import { generatePlayerCode } from '../lib/player-id';
import { sendPlayerRegistrationWhatsApp } from './whatsapp.service';
import { cashfreeProvider } from './cashfree.provider';
import { phonepeProvider } from './phonepe.provider';
import {
  IPaymentProvider,
  CreateOrderResult,
  VerifyPaymentResult,
  WebhookPayload,
  WebhookResult,
} from './payment-provider.interface';

/**
 * Returns active payment provider instance (Cashfree or PhonePe).
 * Architecture allows seamless registration of alternative payment providers.
 */
export function getPaymentProvider(): IPaymentProvider {
  const provider = (CONFIG.PAYMENT_PROVIDER || 'CASHFREE').toUpperCase();
  if (provider === 'PHONEPE') {
    return phonepeProvider;
  }
  return cashfreeProvider;
}

export interface CreatePaymentOrderInput {
  playerId: string;
  amount?: number; // Ignored for client fee security, server fee enforced
}

export interface VerifyPaymentInput {
  playerId: string;
  providerOrderId: string;
  providerPaymentId?: string;
  signature?: string;
}

/**
 * Creates a payment order for player registration.
 * SERVER FEE SECURITY: Always retrieves CONFIG.REGISTRATION_FEE (₹108) from server config.
 */
export async function createPaymentOrder({ playerId }: CreatePaymentOrderInput): Promise<CreateOrderResult> {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { user: true },
  });

  if (!player) {
    throw new Error('Player not found');
  }

  if (player.paymentStatus === 'SUCCESS') {
    throw new Error('Payment already completed for this player');
  }

  // Authoritative server-configured fee (₹108)
  const orderAmount = CONFIG.REGISTRATION_FEE;
  const provider = getPaymentProvider();

  // Check if player has an existing pending order created within last 30 minutes
  const existingPayment = await prisma.payment.findFirst({
    where: {
      playerId,
      provider: provider.name,
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existingPayment) {
    const ageMinutes = (Date.now() - existingPayment.createdAt.getTime()) / (1000 * 60);
    if (ageMinutes < 30) {
      return {
        success: true,
        provider: provider.name,
        providerOrderId: existingPayment.providerOrderId,
        amount: existingPayment.amount,
        currency: existingPayment.currency,
        environment: (CONFIG.CASHFREE_ENVIRONMENT || 'sandbox').toLowerCase() === 'production' ? 'production' : 'sandbox',
      };
    }
  }

  // Create order via Provider interface
  const orderResult = await provider.createOrder({
    playerId,
    amount: orderAmount,
    currency: 'INR',
    customerName: player.name,
    customerEmail: player.email,
    customerPhone: player.phone,
  });

  // Save payment intent record in DB
  await prisma.payment.create({
    data: {
      playerId,
      provider: provider.name,
      providerOrderId: orderResult.providerOrderId,
      amount: orderAmount,
      currency: 'INR',
      status: 'PENDING',
      providerResponse: orderResult.rawResponse ? JSON.stringify(orderResult.rawResponse) : null,
    },
  });

  return orderResult;
}

/**
 * Verifies payment signature/status server-side and atomically updates player registration.
 * IDEMPOTENCY: Safely skips duplicate calls if payment is already processed.
 */
export async function verifyPaymentSignature({
  playerId,
  providerOrderId,
  providerPaymentId,
  signature,
}: VerifyPaymentInput): Promise<VerifyPaymentResult> {
  const payment = await prisma.payment.findUnique({
    where: { providerOrderId },
    include: { player: true },
  });

  if (!payment) {
    throw new Error('Payment order record not found');
  }

  // IDEMPOTENCY GUARD: If payment is already marked SUCCESS, return existing result without re-generating Player ID
  if (payment.status === 'SUCCESS') {
    return {
      success: true,
      alreadyProcessed: true,
      status: 'SUCCESS',
      providerOrderId: payment.providerOrderId,
      providerPaymentId: payment.providerPaymentId || undefined,
      playerCode: payment.player.playerCode || undefined,
      player: payment.player,
    };
  }

  const targetPlayerId = playerId || payment.playerId;
  const provider = getPaymentProvider();
  const verifyResult = await provider.verifyPayment({
    playerId: targetPlayerId,
    providerOrderId,
    providerPaymentId,
    signature,
  });

  if (!verifyResult.success || verifyResult.status !== 'SUCCESS') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });
    throw new Error(verifyResult.error || 'Payment verification failed.');
  }

  // Atomic database update: mark payment SUCCESS, generate Player ID Badge, mark player PAID
  const playerCode = await generatePlayerCode();

  const updatedPlayer = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: verifyResult.providerPaymentId || providerPaymentId || `cf_pay_${Date.now()}`,
        status: 'SUCCESS',
      },
    });

    const updated = await tx.player.update({
      where: { id: targetPlayerId },
      data: {
        paymentStatus: 'SUCCESS',
        registrationStatus: 'PAID',
        auctionStatus: 'PAYMENT_VERIFIED',
        playerCode,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: updated.userId,
        action: 'PAYMENT_VERIFIED',
        entityType: 'PLAYER',
        entityId: updated.id,
        metadata: JSON.stringify({
          playerCode,
          amount: payment.amount,
          provider: provider.name,
          providerOrderId,
        }),
      },
    });

    return updated;
  });

  // Trigger WhatsApp notification (ISOLATED: Failure does NOT roll back successful payment)
  sendPlayerRegistrationWhatsApp(updatedPlayer.id).catch((err) => {
    console.error('[WHATSAPP NOTIFICATION DISPATCH ERROR]', err.message);
  });

  return {
    success: true,
    status: 'SUCCESS',
    providerOrderId: payment.providerOrderId,
    providerPaymentId: verifyResult.providerPaymentId,
    playerCode: updatedPlayer.playerCode || undefined,
    player: updatedPlayer,
  };
}

/**
 * Handles incoming Cashfree payment webhooks idempotently.
 */
export async function processPaymentWebhook(payload: WebhookPayload): Promise<WebhookResult> {
  const provider = getPaymentProvider();
  const webhookResult = await provider.handleWebhook(payload);

  if (!webhookResult.success || !webhookResult.providerOrderId) {
    return webhookResult;
  }

  const payment = await prisma.payment.findUnique({
    where: { providerOrderId: webhookResult.providerOrderId },
    include: { player: true },
  });

  if (!payment) {
    return { success: false, error: 'Payment record not found for webhook order ID' };
  }

  // IDEMPOTENCY CHECK
  if (payment.status === 'SUCCESS') {
    return {
      success: true,
      alreadyProcessed: true,
      providerOrderId: payment.providerOrderId,
      status: 'SUCCESS',
    };
  }

  if (webhookResult.status === 'SUCCESS') {
    await verifyPaymentSignature({
      playerId: payment.playerId,
      providerOrderId: payment.providerOrderId,
    });

    return {
      success: true,
      providerOrderId: payment.providerOrderId,
      status: 'SUCCESS',
    };
  } else if (webhookResult.status === 'FAILED' || webhookResult.status === 'CANCELLED') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: webhookResult.status },
    });

    return {
      success: true,
      providerOrderId: payment.providerOrderId,
      status: webhookResult.status,
    };
  }

  return webhookResult;
}
