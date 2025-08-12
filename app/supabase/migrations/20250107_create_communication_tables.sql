-- Communication preferences with COPPA compliance
CREATE TABLE IF NOT EXISTS communication_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email preferences
  email_enabled BOOLEAN DEFAULT false, -- PRIVACY: Opt-in by default
  email_frequency VARCHAR(20) DEFAULT 'weekly' CHECK (email_frequency IN ('immediate', 'daily', 'weekly', 'monthly')),
  
  -- Granular category consent
  announcements_enabled BOOLEAN DEFAULT false,
  events_enabled BOOLEAN DEFAULT false,
  payments_enabled BOOLEAN DEFAULT true, -- Required for transactions
  volunteer_enabled BOOLEAN DEFAULT false,
  meetings_enabled BOOLEAN DEFAULT false,
  
  -- COPPA compliance fields
  parent_consent_verified BOOLEAN DEFAULT false,
  parent_consent_method VARCHAR(50), -- 'web_form', 'email', 'phone', 'paper'
  parent_consent_date TIMESTAMP WITH TIME ZONE,
  parent_consent_ip VARCHAR(45), -- For audit trail
  
  -- Unsubscribe tracking
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  unsubscribe_reason TEXT,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(user_id)
);

-- Secure email logs with data minimization
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Link to user, not email
  recipient_hash VARCHAR(64) NOT NULL, -- SHA-256 of email for deduplication
  recipient_domain VARCHAR(255), -- For analytics only
  subject VARCHAR(255) NOT NULL,
  template VARCHAR(100),
  category VARCHAR(50), -- 'welcome', 'payment', 'event', etc.
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  
  -- Metadata without PII
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- Delivery tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  -- COMPLIANCE: Auto-expiration for FERPA 7-year retention
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 years'),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Email queue with privacy controls
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Don't send to deleted users
  template VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  
  -- Template data (no PII stored here)
  template_data JSONB DEFAULT '{}',
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Processing
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('general', 'urgent', 'event')),
  audience VARCHAR(50) NOT NULL CHECK (audience IN ('all', 'members', 'board', 'committee_chairs', 'teachers')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Publishing
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_pinned BOOLEAN DEFAULT false,
  
  -- Tracking
  view_count INTEGER DEFAULT 0,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Announcement views tracking (for read receipts)
CREATE TABLE IF NOT EXISTS announcement_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(announcement_id, user_id)
);

-- Indexes for performance and compliance
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_expires_at ON email_logs(expires_at); -- For auto-cleanup
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_for ON email_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_communication_preferences_user_id ON communication_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at);
CREATE INDEX IF NOT EXISTS idx_announcements_audience ON announcements(audience);
CREATE INDEX IF NOT EXISTS idx_announcement_views_user ON announcement_views(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_communication_preferences_updated_at BEFORE UPDATE ON communication_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON email_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired email logs (FERPA compliance)
CREATE OR REPLACE FUNCTION cleanup_expired_email_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM email_logs 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Row Level Security policies
ALTER TABLE communication_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_views ENABLE ROW LEVEL SECURITY;

-- Communication preferences policies
CREATE POLICY "Users can view own communication preferences" ON communication_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own communication preferences" ON communication_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own communication preferences" ON communication_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Email logs policies (users can view their own logs)
CREATE POLICY "Users can view own email logs" ON email_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Email queue policies (admin only)
CREATE POLICY "Admins can manage email queue" ON email_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'board')
    )
  );

-- Announcement policies
CREATE POLICY "Anyone can view published announcements" ON announcements
  FOR SELECT USING (
    published_at IS NOT NULL 
    AND published_at <= NOW() 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (
      audience = 'all' 
      OR (audience = 'members' AND auth.uid() IS NOT NULL)
      OR (audience IN ('board', 'committee_chairs', 'teachers') AND EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = ANY(ARRAY[audience, 'admin'])
      ))
    )
  );

CREATE POLICY "Board and admin can create announcements" ON announcements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'board')
    )
  );

CREATE POLICY "Board and admin can update own announcements" ON announcements
  FOR UPDATE USING (
    created_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Board and admin can delete own announcements" ON announcements
  FOR DELETE USING (
    created_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Announcement views policies
CREATE POLICY "Users can track own announcement views" ON announcement_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own announcement views" ON announcement_views
  FOR SELECT USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON communication_preferences TO authenticated;
GRANT SELECT ON email_logs TO authenticated;
GRANT ALL ON announcements TO authenticated;
GRANT ALL ON announcement_views TO authenticated;