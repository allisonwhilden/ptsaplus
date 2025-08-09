-- Privacy & Compliance Schema for PTSA+ Platform
-- Implements FERPA/COPPA compliance requirements

-- Privacy Settings Table
-- Stores user privacy preferences for field-level visibility
CREATE TABLE IF NOT EXISTS privacy_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE, -- Clerk user ID
  show_email BOOLEAN DEFAULT false,
  show_phone BOOLEAN DEFAULT false,
  show_address BOOLEAN DEFAULT false,
  show_children BOOLEAN DEFAULT false,
  directory_visible BOOLEAN DEFAULT true,
  allow_photo_sharing BOOLEAN DEFAULT false,
  allow_data_sharing BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES members(clerk_id) ON DELETE CASCADE
);

-- Consent Records Table
-- Tracks all consent actions for audit trail
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  consent_type VARCHAR(100) NOT NULL CHECK (consent_type IN (
    'terms_of_service',
    'privacy_policy',
    'coppa_parental',
    'photo_sharing',
    'data_sharing',
    'email_communications',
    'directory_inclusion',
    'ai_features'
  )),
  granted BOOLEAN NOT NULL,
  parent_user_id VARCHAR(255), -- For COPPA parental consent
  consent_version VARCHAR(50), -- Version of terms/policy consented to
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES members(clerk_id) ON DELETE CASCADE
);

-- Audit Logs Table
-- Comprehensive audit trail for compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255), -- Clerk user ID (nullable for system actions)
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  previous_value JSONB,
  new_value JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Child Accounts Table
-- COPPA compliance for users under 13
CREATE TABLE IF NOT EXISTS child_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_user_id VARCHAR(255) NOT NULL UNIQUE, -- Clerk user ID
  parent_user_id VARCHAR(255) NOT NULL, -- Parent's Clerk user ID
  birth_date DATE NOT NULL,
  parental_consent_given BOOLEAN DEFAULT false,
  consent_date TIMESTAMP WITH TIME ZONE,
  restrictions JSONB DEFAULT '{"ai_features": false, "data_sharing": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (child_user_id) REFERENCES members(clerk_id) ON DELETE CASCADE,
  FOREIGN KEY (parent_user_id) REFERENCES members(clerk_id) ON DELETE CASCADE
);

-- Data Export Requests Table
-- Track GDPR/CCPA data export requests
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  request_type VARCHAR(50) CHECK (request_type IN ('export', 'deletion', 'rectification')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  export_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  FOREIGN KEY (user_id) REFERENCES members(clerk_id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON privacy_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_type ON consent_records(consent_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_child_accounts_parent ON child_accounts(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON data_export_requests(status);

-- Enable Row Level Security
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for privacy_settings
CREATE POLICY "Users can view own privacy settings" ON privacy_settings
  FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update own privacy settings" ON privacy_settings
  FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own privacy settings" ON privacy_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- RLS Policies for consent_records
CREATE POLICY "Users can view own consent records" ON consent_records
  FOR SELECT
  USING (user_id = auth.uid()::text OR parent_user_id = auth.uid()::text);

CREATE POLICY "Users can insert own consent records" ON consent_records
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text OR parent_user_id = auth.uid()::text);

-- RLS Policies for audit_logs
-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.clerk_id = auth.uid()::text
      AND m.role = 'admin'
    )
  );

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- RLS Policies for child_accounts
CREATE POLICY "Parents can manage child accounts" ON child_accounts
  FOR ALL
  USING (parent_user_id = auth.uid()::text);

CREATE POLICY "Admins can view child accounts" ON child_accounts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.clerk_id = auth.uid()::text
      AND m.role = 'admin'
    )
  );

-- RLS Policies for data_export_requests
CREATE POLICY "Users can manage own export requests" ON data_export_requests
  FOR ALL
  USING (user_id = auth.uid()::text);

CREATE POLICY "Admins can view all export requests" ON data_export_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.clerk_id = auth.uid()::text
      AND m.role = 'admin'
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_privacy_settings_updated_at 
  BEFORE UPDATE ON privacy_settings
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_child_accounts_updated_at 
  BEFORE UPDATE ON child_accounts
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create privacy settings for new members
CREATE OR REPLACE FUNCTION create_default_privacy_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO privacy_settings (user_id)
  VALUES (NEW.clerk_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create privacy settings on member creation
CREATE TRIGGER create_member_privacy_settings
  AFTER INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION create_default_privacy_settings();

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id VARCHAR(255),
  p_action VARCHAR(100),
  p_resource_type VARCHAR(100),
  p_resource_id VARCHAR(255),
  p_previous_value JSONB,
  p_new_value JSONB,
  p_metadata JSONB,
  p_ip_address INET,
  p_user_agent TEXT,
  p_session_id VARCHAR(255)
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id, action, resource_type, resource_id,
    previous_value, new_value, metadata,
    ip_address, user_agent, session_id
  ) VALUES (
    p_user_id, p_action, p_resource_type, p_resource_id,
    p_previous_value, p_new_value, p_metadata,
    p_ip_address, p_user_agent, p_session_id
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;