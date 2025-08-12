-- Audit logs table for tracking sensitive operations
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  user_id VARCHAR(255) NOT NULL, -- Can be 'system' for system events
  target_id VARCHAR(255), -- ID of the resource being acted upon
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Indexes for common queries
  INDEX idx_audit_logs_user_id (user_id),
  INDEX idx_audit_logs_event_type (event_type),
  INDEX idx_audit_logs_created_at (created_at),
  INDEX idx_audit_logs_target_id (target_id)
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- System can insert audit logs (using service key)
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Function to automatically clean old audit logs (keep 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs 
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (would need pg_cron extension or external scheduler)
-- This is just documentation of the cleanup policy
COMMENT ON FUNCTION cleanup_old_audit_logs() IS 
  'Removes audit logs older than 1 year. Should be scheduled to run monthly.';