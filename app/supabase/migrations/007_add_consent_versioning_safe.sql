-- Consent Version Tracking System (Safe version - checks for existing objects)
-- Tracks privacy policy and terms of service versions with full history

-- Create policy versions table
CREATE TABLE IF NOT EXISTS policy_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_type VARCHAR(50) NOT NULL CHECK (policy_type IN ('privacy_policy', 'terms_of_service', 'cookie_policy', 'coppa_notice')),
  version VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  summary_of_changes TEXT,
  effective_date TIMESTAMP WITH TIME ZONE NOT NULL,
  published_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published_by VARCHAR(255),
  requires_reconsent BOOLEAN DEFAULT false,
  minimum_age INTEGER DEFAULT 13,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(policy_type, version)
);

-- Create consent versions tracking table
CREATE TABLE IF NOT EXISTS consent_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  policy_version_id UUID NOT NULL,
  consent_given BOOLEAN NOT NULL,
  consent_method VARCHAR(50) CHECK (consent_method IN ('explicit', 'implicit', 'parental', 'opt_out')),
  ip_address INET,
  user_agent TEXT,
  parent_user_id VARCHAR(255), -- For COPPA parental consent
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (policy_version_id) REFERENCES policy_versions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES members(clerk_id) ON DELETE CASCADE
);

-- Create consent requirements table
CREATE TABLE IF NOT EXISTS consent_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  required_consent_types TEXT[] NOT NULL, -- Array of policy types required
  minimum_age INTEGER DEFAULT 13,
  requires_parental_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add versioning columns to existing consent_records table (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'consent_records' 
                 AND column_name = 'policy_version_id') THEN
    ALTER TABLE consent_records 
      ADD COLUMN policy_version_id UUID REFERENCES policy_versions(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'consent_records' 
                 AND column_name = 'superseded_by') THEN
    ALTER TABLE consent_records 
      ADD COLUMN superseded_by UUID REFERENCES consent_records(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'consent_records' 
                 AND column_name = 'is_current') THEN
    ALTER TABLE consent_records 
      ADD COLUMN is_current BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Create indexes for performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_policy_versions_type_date ON policy_versions(policy_type, effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_consent_versions_user ON consent_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_versions_policy ON consent_versions(policy_version_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_current ON consent_records(user_id, consent_type) WHERE is_current = true;

-- Function to get current policy version
CREATE OR REPLACE FUNCTION get_current_policy_version(p_policy_type VARCHAR)
RETURNS UUID AS $$
DECLARE
  v_policy_id UUID;
BEGIN
  SELECT id INTO v_policy_id
  FROM policy_versions
  WHERE policy_type = p_policy_type
    AND effective_date <= CURRENT_TIMESTAMP
  ORDER BY effective_date DESC
  LIMIT 1;
  
  RETURN v_policy_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has consented to current version
CREATE OR REPLACE FUNCTION has_current_consent(
  p_user_id VARCHAR,
  p_policy_type VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_version_id UUID;
  v_has_consent BOOLEAN;
BEGIN
  -- Get current policy version
  v_current_version_id := get_current_policy_version(p_policy_type);
  
  IF v_current_version_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has consented to this version
  SELECT EXISTS (
    SELECT 1 
    FROM consent_versions cv
    WHERE cv.user_id = p_user_id
      AND cv.policy_version_id = v_current_version_id
      AND cv.consent_given = true
  ) INTO v_has_consent;
  
  RETURN v_has_consent;
END;
$$ LANGUAGE plpgsql;

-- Function to get required reconsents for a user
CREATE OR REPLACE FUNCTION get_required_reconsents(p_user_id VARCHAR)
RETURNS TABLE (
  policy_type VARCHAR,
  version VARCHAR,
  title VARCHAR,
  effective_date TIMESTAMP WITH TIME ZONE,
  requires_reconsent BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    pv.policy_type,
    pv.version,
    pv.title,
    pv.effective_date,
    pv.requires_reconsent
  FROM policy_versions pv
  WHERE pv.effective_date <= CURRENT_TIMESTAMP
    AND pv.requires_reconsent = true
    AND NOT EXISTS (
      SELECT 1
      FROM consent_versions cv
      WHERE cv.user_id = p_user_id
        AND cv.policy_version_id = pv.id
        AND cv.consent_given = true
    )
  ORDER BY pv.effective_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists before creating
DROP TRIGGER IF EXISTS update_consent_current_trigger ON consent_records;

-- Trigger to mark old consents as not current when new consent is given
CREATE OR REPLACE FUNCTION update_consent_current_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark all previous consents of the same type as not current
  UPDATE consent_records
  SET is_current = false,
      superseded_by = NEW.id
  WHERE user_id = NEW.user_id
    AND consent_type = NEW.consent_type
    AND id != NEW.id
    AND is_current = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_consent_current_trigger
  AFTER INSERT ON consent_records
  FOR EACH ROW
  EXECUTE FUNCTION update_consent_current_status();

-- Insert initial policy versions (ON CONFLICT DO NOTHING to avoid duplicates)
INSERT INTO policy_versions (policy_type, version, title, content, effective_date, requires_reconsent)
VALUES 
  ('privacy_policy', '1.0', 'PTSA+ Privacy Policy', 
   'Full privacy policy content here...', 
   '2024-01-01'::timestamp, false),
  ('terms_of_service', '1.0', 'PTSA+ Terms of Service', 
   'Full terms of service content here...', 
   '2024-01-01'::timestamp, false),
  ('coppa_notice', '1.0', 'COPPA Privacy Notice', 
   'Information for parents about children under 13...', 
   '2024-01-01'::timestamp, false)
ON CONFLICT (policy_type, version) DO NOTHING;

-- Insert consent requirements for features (ON CONFLICT DO NOTHING)
INSERT INTO consent_requirements (feature_name, description, required_consent_types, minimum_age, requires_parental_consent)
VALUES
  ('basic_membership', 'Basic PTSA membership features', 
   ARRAY['terms_of_service', 'privacy_policy'], 13, false),
  ('photo_sharing', 'Share photos in PTSA materials', 
   ARRAY['privacy_policy', 'photo_sharing'], 13, false),
  ('ai_features', 'AI-powered content generation', 
   ARRAY['privacy_policy', 'ai_features'], 13, false),
  ('child_account', 'Account for users under 13', 
   ARRAY['terms_of_service', 'privacy_policy', 'coppa_notice'], 0, true),
  ('payment_processing', 'Process payments and donations', 
   ARRAY['terms_of_service', 'privacy_policy'], 18, false)
ON CONFLICT (feature_name) DO NOTHING;

-- RLS Policies for new tables
ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_requirements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read policy versions" ON policy_versions;
DROP POLICY IF EXISTS "Admins can manage policy versions" ON policy_versions;
DROP POLICY IF EXISTS "Users can view own consent versions" ON consent_versions;
DROP POLICY IF EXISTS "Users can insert own consent versions" ON consent_versions;
DROP POLICY IF EXISTS "Anyone can read consent requirements" ON consent_requirements;
DROP POLICY IF EXISTS "Admins can manage consent requirements" ON consent_requirements;

-- Everyone can read policy versions (they're public)
CREATE POLICY "Anyone can read policy versions" ON policy_versions
  FOR SELECT
  USING (true);

-- Only admins can manage policy versions
CREATE POLICY "Admins can manage policy versions" ON policy_versions
  FOR ALL
  USING (is_admin_or_board());

-- Users can view their own consent versions
CREATE POLICY "Users can view own consent versions" ON consent_versions
  FOR SELECT
  USING (user_id = get_current_user_id() OR parent_user_id = get_current_user_id());

-- Users can insert their own consent versions
CREATE POLICY "Users can insert own consent versions" ON consent_versions
  FOR INSERT
  WITH CHECK (user_id = get_current_user_id() OR parent_user_id = get_current_user_id());

-- Everyone can read consent requirements
CREATE POLICY "Anyone can read consent requirements" ON consent_requirements
  FOR SELECT
  USING (true);

-- Only admins can manage consent requirements
CREATE POLICY "Admins can manage consent requirements" ON consent_requirements
  FOR ALL
  USING (is_admin_or_board());