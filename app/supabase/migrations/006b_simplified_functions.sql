-- Simplified version for Clerk + Supabase setup
-- Use this if 006a doesn't work with your auth setup

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_current_user_id() CASCADE;
DROP FUNCTION IF EXISTS is_admin_or_board() CASCADE;

-- Simplified function that returns NULL (will rely on API-level auth)
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT AS $$
BEGIN
  -- Since we're using Clerk, RLS will be handled at API level
  -- This returns NULL to prevent direct database access
  -- All access should go through your Next.js API routes
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simplified admin check (also returns false for direct DB access)
CREATE OR REPLACE FUNCTION is_admin_or_board()
RETURNS BOOLEAN AS $$
BEGIN
  -- Admin checks are handled at API level with Clerk
  -- This returns FALSE to prevent direct database access
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_board() TO authenticated;

-- Add a comment explaining the setup
COMMENT ON FUNCTION get_current_user_id() IS 'Returns NULL - Auth is handled by Clerk at API level';
COMMENT ON FUNCTION is_admin_or_board() IS 'Returns FALSE - Admin checks are handled by Clerk at API level';