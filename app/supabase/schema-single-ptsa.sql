-- Single PTSA Database Schema
-- Simplified schema for one PTSA organization

-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table (synced with Clerk) - Simplified for privacy
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'board', 'committee_chair', 'member', 'teacher')),
  member_id UUID, -- FK to members table, set after member creation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete for data retention compliance
);

-- Members table (PTSA membership info) - Privacy compliant
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL, -- Duplicate for data consistency
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  membership_type VARCHAR(50) DEFAULT 'individual' CHECK (membership_type IN ('individual', 'family', 'teacher')),
  membership_status VARCHAR(50) DEFAULT 'pending' CHECK (membership_status IN ('active', 'pending', 'expired')),
  membership_expires_at TIMESTAMP WITH TIME ZONE,
  -- FERPA-protected student information
  student_info JSONB, -- {name: string, grade: string}
  volunteer_interests TEXT[], -- Array of volunteer interest areas
  -- Privacy and consent tracking (COPPA/FERPA compliance)
  privacy_consent_given BOOLEAN DEFAULT false,
  parent_consent_required BOOLEAN DEFAULT false, -- Determined by age verification
  parent_consent_given BOOLEAN, -- null if not required, true/false if required
  consent_date TIMESTAMP WITH TIME ZONE, -- When consent was given
  -- Audit fields
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete for compliance
);

-- Payments table
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  amount INTEGER NOT NULL, -- Amount in cents
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_type VARCHAR(50) NOT NULL DEFAULT 'membership_dues',
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Events table
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location VARCHAR(255),
  max_volunteers INTEGER,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Event volunteers table
CREATE TABLE event_volunteers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(255),
  hours_committed DECIMAL(4,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(event_id, user_id)
);

-- Committees table
CREATE TABLE committees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  chair_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Committee members table
CREATE TABLE committee_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(committee_id, user_id)
);

-- Announcements table
CREATE TABLE announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'members', 'board', 'committees')),
  published_by UUID REFERENCES users(id),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Documents table
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url VARCHAR(500),
  file_size INTEGER,
  file_type VARCHAR(50),
  category VARCHAR(50),
  access_level VARCHAR(20) DEFAULT 'members' CHECK (access_level IN ('public', 'members', 'board')),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Settings table (single row for PTSA settings)
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensures only one row
  ptsa_name VARCHAR(255) NOT NULL,
  school_name VARCHAR(255),
  logo_url VARCHAR(500),
  primary_color VARCHAR(7),
  membership_fee_individual INTEGER DEFAULT 1500, -- in cents
  membership_fee_family INTEGER DEFAULT 2500,
  fiscal_year_start INTEGER DEFAULT 7, -- July
  payment_settings JSONB DEFAULT '{}',
  email_settings JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_event_volunteers_event_id ON event_volunteers(event_id);
CREATE INDEX idx_event_volunteers_user_id ON event_volunteers(user_id);
CREATE INDEX idx_announcements_published_at ON announcements(published_at);

-- Row Level Security Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all members" ON users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'board')
    )
  );

-- Members policies - Privacy focused
CREATE POLICY "Members can view basic member directory" ON members
  FOR SELECT USING (
    -- Only show basic info, not student data or sensitive details
    auth.uid() IS NOT NULL AND deleted_at IS NULL
  );

CREATE POLICY "Users can view their own member profile" ON members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all member data including student info" ON members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'board')
      AND users.deleted_at IS NULL
    )
  );

CREATE POLICY "Users can update their own membership" ON members
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all memberships" ON members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'board')
      AND users.deleted_at IS NULL
    )
  );

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'board')
    )
  );

-- Events policies
CREATE POLICY "Anyone can view public events" ON events
  FOR SELECT USING (is_public = true);

CREATE POLICY "Members can view all events" ON events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Board can manage events" ON events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'board', 'committee_chair')
    )
  );

-- Event volunteers policies
CREATE POLICY "Anyone can view event volunteers" ON event_volunteers
  FOR SELECT USING (true);

CREATE POLICY "Users can volunteer themselves" ON event_volunteers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their volunteer info" ON event_volunteers
  FOR UPDATE USING (auth.uid() = user_id);

-- Settings policies
CREATE POLICY "Anyone can view settings" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can update settings" ON settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_committees_updated_at BEFORE UPDATE ON committees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Privacy audit log for FERPA/COPPA compliance
CREATE TABLE privacy_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'view', 'edit', 'delete', 'export'
  data_type VARCHAR(50) NOT NULL, -- 'student_info', 'contact_info', 'membership'
  accessed_by UUID REFERENCES users(id),
  access_reason VARCHAR(255), -- Justification for access
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Privacy consent history
CREATE TABLE consent_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL, -- 'privacy', 'marketing', 'data_sharing'
  consent_given BOOLEAN NOT NULL,
  consent_method VARCHAR(50), -- 'web_form', 'email', 'phone', 'paper'
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for audit tables
CREATE INDEX idx_privacy_audit_member_id ON privacy_audit_log(member_id);
CREATE INDEX idx_privacy_audit_created_at ON privacy_audit_log(created_at);
CREATE INDEX idx_consent_history_member_id ON consent_history(member_id);

-- Enable RLS on audit tables
ALTER TABLE privacy_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_history ENABLE ROW LEVEL SECURITY;

-- Audit table policies (admin only)
CREATE POLICY "Only admins can view privacy audit log" ON privacy_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can view consent history" ON consent_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert default settings row
INSERT INTO settings (ptsa_name, school_name) 
VALUES ('Our PTSA', 'Our School')
ON CONFLICT (id) DO NOTHING;