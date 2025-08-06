-- Initial Schema for PTSA+ Platform
-- This creates the basic tables needed for the application to function

-- Create members table (stores PTSA membership information)
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id VARCHAR(255) UNIQUE NOT NULL, -- Clerk user ID
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'board', 'committee_chair', 'member', 'teacher')),
  membership_type VARCHAR(50) DEFAULT 'individual' CHECK (membership_type IN ('individual', 'family', 'teacher')),
  membership_status VARCHAR(50) DEFAULT 'active' CHECK (membership_status IN ('active', 'pending', 'expired')),
  membership_expires_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_members_clerk_id ON members(clerk_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_role ON members(role);

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for members table
-- Allow authenticated users to view basic member info
CREATE POLICY "Members can view member directory" ON members
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own member record
CREATE POLICY "Users can update own member record" ON members
  FOR UPDATE
  USING (clerk_id = auth.uid()::text);

-- Allow admins and board members to manage all members
CREATE POLICY "Admins can manage all members" ON members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.clerk_id = auth.uid()::text
      AND m.role IN ('admin', 'board')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_members_updated_at 
  BEFORE UPDATE ON members
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();