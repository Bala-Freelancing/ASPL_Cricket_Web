/**
 * Payment Provider Abstraction Layer for Mini IPL Auction Platform
 * Completely decouples registration & player services from third-party payment gateways.
 */

export interface CreateOrderParams {
  playerId: string;
  amount: number; // Server-authoritative fee (₹108)
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface CreateOrderResult {
  success: boolean;
  provider: string;
  providerOrderId: string;
  paymentSessionId?: string;
  paymentLink?: string;
  amount: number;
  currency: string;
  environment: 'sandbox' | 'production';
  rawResponse?: any;
  isMock?: boolean;
}

export interface VerifyPaymentParams {
  playerId: string;
  providerOrderId: string;
  providerPaymentId?: string;
  signature?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  alreadyProcessed?: boolean;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED' | 'EXPIRED';
  providerOrderId: string;
  providerPaymentId?: string;
  playerCode?: string;
  player?: any;
  error?: string;
}

export interface WebhookPayload {
  rawBody: string | object;
  headers: Record<string, any>;
}

export interface WebhookResult {
  success: boolean;
  alreadyProcessed?: boolean;
  providerOrderId?: string;
  status?: 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED' | 'EXPIRED';
  error?: string;
}

export interface RefundParams {
  providerOrderId: string;
  amount?: number;
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  status?: string;
  error?: string;
}

export interface IPaymentProvider {
  readonly name: string;
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult>;
  handleWebhook(payload: WebhookPayload): Promise<WebhookResult>;
  getPaymentStatus(providerOrderId: string): Promise<{ status: string; rawResponse?: any }>;
  refundPayment(params: RefundParams): Promise<RefundResult>;
}
