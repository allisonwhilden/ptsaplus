-- Create payments table for tracking Stripe payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Clerk user ID, NOT NULL per security audit
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0), -- Amount in cents
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
  type TEXT NOT NULL CHECK (type IN ('membership', 'donation')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_type ON payments(type);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only view their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Only system can insert/update payments (via service role)
CREATE POLICY "Service role can manage payments" ON payments
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit log table for payment events
CREATE TABLE IF NOT EXISTS payment_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for audit log queries
CREATE INDEX idx_payment_audit_logs_payment_id ON payment_audit_logs(payment_id);
CREATE INDEX idx_payment_audit_logs_created_at ON payment_audit_logs(created_at DESC);

-- Enable RLS on audit logs
ALTER TABLE payment_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access audit logs
CREATE POLICY "Service role can manage audit logs" ON payment_audit_logs
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE payments IS 'Stores all payment transactions processed through Stripe';
COMMENT ON COLUMN payments.user_id IS 'Clerk user ID of the person making the payment';
COMMENT ON COLUMN payments.stripe_payment_intent_id IS 'Unique Stripe PaymentIntent ID';
COMMENT ON COLUMN payments.amount IS 'Payment amount in cents (e.g., 1500 = $15.00)';
COMMENT ON COLUMN payments.status IS 'Current status of the payment in Stripe';
COMMENT ON COLUMN payments.type IS 'Type of payment: membership dues or donation';
COMMENT ON COLUMN payments.metadata IS 'Additional data from Stripe or our application';