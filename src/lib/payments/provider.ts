/**
 * Payment Provider Interface
 *
 * Defines the contract for payment providers (Mock, Razorpay, etc).
 * Allows swapping providers without changing application logic.
 */

export interface Quote {
  id: string;
  total: number;
  currency: string;
  job_id?: string;
}

export interface Customer {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
}

export interface WebhookEvent {
  event: string;
  payload: Record<string, any>;
}

export interface OrderResponse {
  orderId: string;
  paymentUrl?: string;
  metadata: Record<string, any>;
}

export interface VerificationResult {
  verified: boolean;
  paymentId: string;
  amount: number;
  metadata: Record<string, any>;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  metadata: Record<string, any>;
}

export interface PaymentProvider {
  /**
   * getType
   * Returns the provider type identifier for database auditing and debugging.
   */
  getType(): 'mock' | 'razorpay';

  /**
   * createOrder
   * Creates an order/payment intent with the provider.
   * Returns order details needed by frontend to initiate payment.
   */
  createOrder(quote: Quote, customer: Customer): Promise<OrderResponse>;

  /**
   * verifyPayment
   * Verifies that a payment was successfully processed.
   * Used for confirmation after payment gateway redirect.
   */
  verifyPayment(orderId: string, paymentId: string): Promise<VerificationResult>;

  /**
   * handleWebhook
   * Processes webhook events from payment provider.
   * Updates payment records in database.
   */
  handleWebhook(event: WebhookEvent): Promise<void>;

  /**
   * refundPayment
   * Initiates a refund for a paid payment.
   * Returns refund confirmation.
   */
  refundPayment(paymentId: string, amount: number): Promise<RefundResult>;
}
