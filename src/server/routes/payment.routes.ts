import { Router } from 'express';
import {
  createPaymentOrder,
  verifyPaymentSignature,
  processPaymentWebhook,
} from '../../services/payment.service';

const router = Router();

/**
 * POST /api/payments/create
 * Creates a Cashfree payment order for ₹108 registration fee.
 * SERVER FEE SECURITY: Authoritative fee (₹108) is enforced server-side.
 */
router.post('/create', async (req, res) => {
  try {
    const { playerId } = req.body;
    if (!playerId) {
      return res.status(400).json({ success: false, error: 'Player ID is required' });
    }

    const orderData = await createPaymentOrder({ playerId });
    return res.json(orderData);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/payments/cashfree/create
 * Alias endpoint for Cashfree payment order creation.
 */
router.post('/cashfree/create', async (req, res) => {
  try {
    const { playerId } = req.body;
    if (!playerId) {
      return res.status(400).json({ success: false, error: 'Player ID is required' });
    }

    const orderData = await createPaymentOrder({ playerId });
    return res.json(orderData);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/payments/verify
 * Server-side payment verification using Cashfree order status / HMAC signature.
 * On success: atomically marks payment SUCCESS, registration PAID, generates Player ID Badge (IPL26-P0001), and dispatches WhatsApp notification.
 */
router.post('/verify', async (req, res) => {
  try {
    const { playerId, providerOrderId, providerPaymentId, signature, gatewayOrderId, gatewayPaymentId, gatewaySignature } = req.body;

    const targetOrderId = providerOrderId || gatewayOrderId;
    const targetPaymentId = providerPaymentId || gatewayPaymentId;
    const targetSignature = signature || gatewaySignature;

    if (!targetOrderId) {
      return res.status(400).json({
        success: false,
        error: 'providerOrderId is required for payment verification',
      });
    }

    const result = await verifyPaymentSignature({
      playerId: playerId || '',
      providerOrderId: targetOrderId,
      providerPaymentId: targetPaymentId,
      signature: targetSignature || 'mock_valid_signature',
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/payments/webhooks/cashfree
 * Authentic Cashfree Payment Gateway Webhook Listener.
 * Validates webhook headers/signature, processes payment state changes idempotently, generates Player ID, and dispatches WhatsApp confirmation.
 */
router.post('/webhooks/cashfree', async (req, res) => {
  try {
    const payload = {
      rawBody: req.body,
      headers: req.headers,
    };

    const webhookResult = await processPaymentWebhook(payload);
    if (!webhookResult.success) {
      return res.status(400).json({ success: false, error: webhookResult.error });
    }

    return res.status(200).json({ acknowledged: true, ...webhookResult });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
