export interface PaymentRecord {
  id: string;
  user_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  type: 'membership' | 'donation';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentFormData {
  amount: number;
  paymentType: 'membership' | 'donation';
  customAmount?: number;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}