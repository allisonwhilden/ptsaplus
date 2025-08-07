-- Fix events table to use Clerk user IDs instead of UUIDs for created_by
-- This migration handles all dependencies

-- Step 1: Drop all policies that reference events.created_by
DROP POLICY IF EXISTS "Organizers can view event RSVPs" ON event_rsvps;
DROP POLICY IF EXISTS "Organizers can manage volunteer slots" ON event_volunteer_slots;
DROP POLICY IF EXISTS "Organizers can view volunteer signups" ON event_volunteer_signups;

-- Step 2: Change the column type
ALTER TABLE events 
ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

-- Step 3: Recreate the policies with the correct column type
-- RSVP policy - Event organizers can view all RSVPs for their events
CREATE POLICY "Organizers can view event RSVPs" ON event_rsvps
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_rsvps.event_id
        AND events.created_by = auth.uid()::text
    ));

-- Volunteer slots policy - Only event organizers can manage volunteer slots
CREATE POLICY "Organizers can manage volunteer slots" ON event_volunteer_slots
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_volunteer_slots.event_id
        AND events.created_by = auth.uid()::text
    ));

-- Volunteer signups policy - Event organizers can view all signups
CREATE POLICY "Organizers can view volunteer signups" ON event_volunteer_signups
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM event_volunteer_slots
        JOIN events ON events.id = event_volunteer_slots.event_id
        WHERE event_volunteer_slots.id = event_volunteer_signups.slot_id
        AND events.created_by = auth.uid()::text
    ));

-- Add an index for performance
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- Add a comment to document the change
COMMENT ON COLUMN events.created_by IS 'Clerk user ID of the event creator';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully updated created_by column to TEXT type for Clerk user IDs';
END $$;