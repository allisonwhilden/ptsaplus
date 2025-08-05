export class PaymentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentValidationError';
  }
}

export function validatePaymentAmount(amount: number, paymentType: 'membership' | 'donation'): void {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentValidationError('Invalid payment amount');
  }
  
  // Set reasonable limits for PTSA payments
  const MIN_AMOUNT = 100; // $1.00
  const MAX_AMOUNT = paymentType === 'donation' ? 100000 : 10000; // $1000 donation, $100 membership
  
  if (amount < MIN_AMOUNT) {
    throw new PaymentValidationError(`Payment amount must be at least $${MIN_AMOUNT / 100}`);
  }
  
  if (amount > MAX_AMOUNT) {
    throw new PaymentValidationError(`Payment amount cannot exceed $${MAX_AMOUNT / 100}`);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new PaymentValidationError('Invalid email address');
  }
}

export function validateUserId(userId: string): void {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new PaymentValidationError('Invalid user ID');
  }
}

export function validatePaymentType(paymentType: string): paymentType is 'membership' | 'donation' {
  if (paymentType !== 'membership' && paymentType !== 'donation') {
    throw new PaymentValidationError('Invalid payment type');
  }
  return true;
}

export interface ValidatedPaymentParams {
  amount: number;
  userId: string;
  userEmail: string;
  paymentType: 'membership' | 'donation';
  metadata?: Record<string, string>;
}

export function validatePaymentParams(params: unknown): ValidatedPaymentParams {
  // Validate all required fields
  if (!params || typeof params !== 'object') {
    throw new PaymentValidationError('Invalid payment parameters');
  }

  const { amount, userId, userEmail, paymentType, metadata = {} } = params;

  // Validate each field
  validateUserId(userId);
  validateEmail(userEmail);
  validatePaymentType(paymentType);
  validatePaymentAmount(amount, paymentType);

  // Validate metadata if provided
  if (metadata && typeof metadata !== 'object') {
    throw new PaymentValidationError('Invalid metadata format');
  }

  return {
    amount,
    userId,
    userEmail,
    paymentType,
    metadata,
  };
}