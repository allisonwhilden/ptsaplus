export interface PaymentAuditLog {
  event: string;
  userId: string;
  amount: number;
  paymentIntentId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export enum PaymentAuditEvent {
  PAYMENT_INTENT_CREATED = 'payment.intent.created',
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_CANCELED = 'payment.canceled',
  WEBHOOK_RECEIVED = 'webhook.received',
  WEBHOOK_FAILED = 'webhook.failed',
  REFUND_INITIATED = 'refund.initiated',
  REFUND_COMPLETED = 'refund.completed',
}

export function logPaymentEvent(log: PaymentAuditLog): void {
  // Use structured logging for security monitoring
  // NEVER LOG: card numbers, CVV, full payment intent objects, or other sensitive data
  console.log(JSON.stringify({
    ...log,
    level: 'audit',
    service: 'payment',
    environment: process.env.NODE_ENV,
  }));
}

export function createAuditLog(
  event: PaymentAuditEvent,
  userId: string,
  amount: number,
  paymentIntentId?: string,
  metadata?: Record<string, any>
): PaymentAuditLog {
  return {
    event,
    userId,
    amount,
    paymentIntentId,
    timestamp: new Date().toISOString(),
    metadata,
  };
}

export function logPaymentIntentCreated(
  userId: string,
  amount: number,
  paymentIntentId: string,
  paymentType: 'membership' | 'donation'
): void {
  const log = createAuditLog(
    PaymentAuditEvent.PAYMENT_INTENT_CREATED,
    userId,
    amount,
    paymentIntentId,
    { paymentType }
  );
  logPaymentEvent(log);
}

export function logPaymentSucceeded(
  userId: string,
  amount: number,
  paymentIntentId: string
): void {
  const log = createAuditLog(
    PaymentAuditEvent.PAYMENT_SUCCEEDED,
    userId,
    amount,
    paymentIntentId
  );
  logPaymentEvent(log);
}

export function logPaymentFailed(
  userId: string,
  amount: number,
  paymentIntentId: string,
  error?: string
): void {
  const log = createAuditLog(
    PaymentAuditEvent.PAYMENT_FAILED,
    userId,
    amount,
    paymentIntentId,
    { error }
  );
  logPaymentEvent(log);
}

export function logWebhookReceived(
  eventType: string,
  eventId: string
): void {
  console.log(JSON.stringify({
    event: PaymentAuditEvent.WEBHOOK_RECEIVED,
    eventType,
    eventId,
    timestamp: new Date().toISOString(),
    level: 'audit',
    service: 'payment',
  }));
}

export function logWebhookFailed(
  error: string,
  signature?: string
): void {
  console.log(JSON.stringify({
    event: PaymentAuditEvent.WEBHOOK_FAILED,
    error,
    hasSignature: !!signature,
    timestamp: new Date().toISOString(),
    level: 'error',
    service: 'payment',
  }));
}