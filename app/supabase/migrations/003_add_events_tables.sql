-- Events table for PTSA+ Event Management System
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000', -- Single PTSA for now
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('meeting', 'fundraiser', 'volunteer', 'social', 'educational')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location_type TEXT NOT NULL CHECK (location_type IN ('in_person', 'virtual', 'hybrid')),
    location_details JSONB DEFAULT '{}', -- { address, room, virtual_link, etc }
    capacity INTEGER,
    requires_rsvp BOOLEAN DEFAULT false,
    allow_guests BOOLEAN DEFAULT true,
    visibility TEXT NOT NULL DEFAULT 'members' CHECK (visibility IN ('public', 'members', 'board')),
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Ensure end time is after start time
    CONSTRAINT valid_event_times CHECK (end_time > start_time)
);

-- Event RSVPs table
CREATE TABLE IF NOT EXISTS event_rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Clerk user ID
    status TEXT NOT NULL CHECK (status IN ('attending', 'not_attending', 'maybe')),
    guest_count INTEGER DEFAULT 0 CHECK (guest_count >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- Event volunteer slots table (for volunteer events)
CREATE TABLE IF NOT EXISTS event_volunteer_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Volunteer signups table
CREATE TABLE IF NOT EXISTS event_volunteer_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID NOT NULL REFERENCES event_volunteer_slots(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Clerk user ID
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(slot_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_events_organization_id ON events(organization_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_visibility ON events(visibility);
CREATE INDEX idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX idx_event_rsvps_user_id ON event_rsvps(user_id);
CREATE INDEX idx_event_volunteer_slots_event_id ON event_volunteer_slots(event_id);
CREATE INDEX idx_event_volunteer_signups_slot_id ON event_volunteer_signups(slot_id);
CREATE INDEX idx_event_volunteer_signups_user_id ON event_volunteer_signups(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_volunteer_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_volunteer_signups ENABLE ROW LEVEL SECURITY;

-- Events policies
-- Public events are visible to everyone
CREATE POLICY "Public events are viewable by all" ON events
    FOR SELECT
    USING (visibility = 'public');

-- Members can view member and public events
CREATE POLICY "Members can view member events" ON events
    FOR SELECT
    USING (visibility IN ('public', 'members'));

-- Board members can view all events
CREATE POLICY "Board members can view all events" ON events
    FOR SELECT
    USING (visibility IN ('public', 'members', 'board'));

-- Only board members and admins can create events
CREATE POLICY "Board members can create events" ON events
    FOR INSERT
    WITH CHECK (true); -- Will implement proper auth check in application

-- Only board members and admins can update events
CREATE POLICY "Board members can update events" ON events
    FOR UPDATE
    USING (true); -- Will implement proper auth check in application

-- Only board members and admins can delete events
CREATE POLICY "Board members can delete events" ON events
    FOR DELETE
    USING (true); -- Will implement proper auth check in application

-- RSVP policies
-- Users can view their own RSVPs
CREATE POLICY "Users can view own RSVPs" ON event_rsvps
    FOR SELECT
    USING (user_id = auth.uid()::text);

-- Event organizers can view all RSVPs for their events
CREATE POLICY "Organizers can view event RSVPs" ON event_rsvps
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_rsvps.event_id
        AND events.created_by = auth.uid()
    ));

-- Users can create their own RSVPs
CREATE POLICY "Users can create own RSVPs" ON event_rsvps
    FOR INSERT
    WITH CHECK (user_id = auth.uid()::text);

-- Users can update their own RSVPs
CREATE POLICY "Users can update own RSVPs" ON event_rsvps
    FOR UPDATE
    USING (user_id = auth.uid()::text);

-- Users can delete their own RSVPs
CREATE POLICY "Users can delete own RSVPs" ON event_rsvps
    FOR DELETE
    USING (user_id = auth.uid()::text);

-- Volunteer slots policies
-- Anyone who can see an event can see its volunteer slots
CREATE POLICY "View volunteer slots for visible events" ON event_volunteer_slots
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_volunteer_slots.event_id
    ));

-- Only event organizers can manage volunteer slots
CREATE POLICY "Organizers can manage volunteer slots" ON event_volunteer_slots
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_volunteer_slots.event_id
        AND events.created_by = auth.uid()
    ));

-- Volunteer signup policies
-- Users can view their own signups
CREATE POLICY "Users can view own volunteer signups" ON event_volunteer_signups
    FOR SELECT
    USING (user_id = auth.uid()::text);

-- Event organizers can view all signups
CREATE POLICY "Organizers can view volunteer signups" ON event_volunteer_signups
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM event_volunteer_slots
        JOIN events ON events.id = event_volunteer_slots.event_id
        WHERE event_volunteer_slots.id = event_volunteer_signups.slot_id
        AND events.created_by = auth.uid()
    ));

-- Users can create their own signups
CREATE POLICY "Users can create own volunteer signups" ON event_volunteer_signups
    FOR INSERT
    WITH CHECK (user_id = auth.uid()::text);

-- Users can update their own signups
CREATE POLICY "Users can update own volunteer signups" ON event_volunteer_signups
    FOR UPDATE
    USING (user_id = auth.uid()::text);

-- Users can delete their own signups
CREATE POLICY "Users can delete own volunteer signups" ON event_volunteer_signups
    FOR DELETE
    USING (user_id = auth.uid()::text);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_rsvps_updated_at BEFORE UPDATE ON event_rsvps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check event capacity
CREATE OR REPLACE FUNCTION check_event_capacity()
RETURNS TRIGGER AS $$
DECLARE
    current_attendees INTEGER;
    event_capacity INTEGER;
    event_allows_guests BOOLEAN;
BEGIN
    -- Get event details
    SELECT capacity, allow_guests INTO event_capacity, event_allows_guests
    FROM events
    WHERE id = NEW.event_id;
    
    -- If no capacity limit, allow
    IF event_capacity IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Count current attendees (including guests)
    SELECT COALESCE(SUM(
        CASE 
            WHEN status = 'attending' THEN 1 + CASE WHEN event_allows_guests THEN guest_count ELSE 0 END
            ELSE 0
        END
    ), 0) INTO current_attendees
    FROM event_rsvps
    WHERE event_id = NEW.event_id
    AND id != COALESCE(NEW.id, gen_random_uuid());
    
    -- Check if adding this RSVP would exceed capacity
    IF NEW.status = 'attending' AND 
       (current_attendees + 1 + CASE WHEN event_allows_guests THEN NEW.guest_count ELSE 0 END) > event_capacity THEN
        RAISE EXCEPTION 'Event capacity exceeded';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to check capacity on RSVP insert/update
CREATE TRIGGER check_event_capacity_trigger
    BEFORE INSERT OR UPDATE ON event_rsvps
    FOR EACH ROW
    EXECUTE FUNCTION check_event_capacity();

-- Function to check volunteer slot capacity
CREATE OR REPLACE FUNCTION check_volunteer_slot_capacity()
RETURNS TRIGGER AS $$
DECLARE
    current_signups INTEGER;
    slot_capacity INTEGER;
BEGIN
    -- Get slot capacity
    SELECT quantity INTO slot_capacity
    FROM event_volunteer_slots
    WHERE id = NEW.slot_id;
    
    -- Count current signups
    SELECT COALESCE(SUM(quantity), 0) INTO current_signups
    FROM event_volunteer_signups
    WHERE slot_id = NEW.slot_id
    AND id != COALESCE(NEW.id, gen_random_uuid());
    
    -- Check if adding this signup would exceed capacity
    IF (current_signups + NEW.quantity) > slot_capacity THEN
        RAISE EXCEPTION 'Volunteer slot capacity exceeded';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to check volunteer slot capacity
CREATE TRIGGER check_volunteer_slot_capacity_trigger
    BEFORE INSERT OR UPDATE ON event_volunteer_signups
    FOR EACH ROW
    EXECUTE FUNCTION check_volunteer_slot_capacity();