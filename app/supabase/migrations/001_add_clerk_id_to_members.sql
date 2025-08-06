-- Add clerk_id to members table for compatibility with event system
-- This migration adds a clerk_id column to track Clerk authentication IDs

-- Add clerk_id column if it doesn't exist
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(255);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_members_clerk_id ON members(clerk_id);

-- Update existing members with their Clerk ID from users table
UPDATE members m
SET clerk_id = u.id
FROM users u
WHERE m.user_id = u.id
AND m.clerk_id IS NULL;

-- Add role column to members table for easier access
ALTER TABLE members
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member' 
CHECK (role IN ('admin', 'board', 'committee_chair', 'member', 'teacher'));

-- Update roles from users table
UPDATE members m
SET role = u.role
FROM users u
WHERE m.user_id = u.id;