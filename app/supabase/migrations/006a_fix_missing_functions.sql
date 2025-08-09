-- Fix for missing functions needed by migration 007
-- Run this BEFORE running 007_add_consent_versioning.sql

-- Create a secure function to get the current user's Clerk ID
-- This is needed for RLS policies to work correctly
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT AS $$
BEGIN
  -- For Supabase with Clerk, we need to extract the user ID from JWT
  -- This is a simplified version - you may need to adjust based on your auth setup
  
  -- Try to get from auth.jwt() claim
  RETURN auth.jwt() ->> 'sub';
  
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, return NULL (no access)
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is admin or board member
CREATE OR REPLACE FUNCTION is_admin_or_board()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user has admin or board role
  RETURN EXISTS (
    SELECT 1 FROM members 
    WHERE clerk_id = get_current_user_id()
    AND role IN ('admin', 'board')
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, return FALSE (no admin access)
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_board() TO authenticated;