# Event Management System Documentation

## Overview

The Event Management System enables PTSAs to create, manage, and track events with full RSVP and volunteer management capabilities. The system supports various event types including meetings, fundraisers, volunteer opportunities, social events, and educational programs.

**Status**: ✅ Completed (January 9, 2025)

## Key Features

### Event Creation & Management
- **Event Types**: Meeting, Fundraiser, Volunteer, Social, Educational
- **Location Support**: In-person, Virtual, Hybrid
- **Rich Event Details**: Title, description, date/time, location, capacity
- **Privacy Controls**: Public, Members-only, Board-only visibility
- **Role-based Access**: Only board members and admins can create/edit events

### RSVP System
- **Online Registration**: Members can RSVP directly from event pages
- **Guest Support**: Allow guests with configurable limits
- **Capacity Management**: Automatic waitlist when events reach capacity
- **RSVP Status Tracking**: Attending, Not Attending, Maybe
- **Real-time Updates**: Live attendee counts

### Volunteer Management
- **Volunteer Slots**: Create specific volunteer opportunities within events
- **Slot Details**: Title, description, quantity needed
- **Easy Signup**: One-click volunteer registration
- **Progress Tracking**: Visual indicators for filled slots

### Calendar View
- **Monthly Calendar**: Browse all events in calendar format
- **Visual Indicators**: Dates with events are highlighted
- **Quick Preview**: Click dates to see event details
- **Navigation**: Easy month-to-month navigation

## Technical Implementation

### Database Schema

```sql
-- Core events table
events (
  id UUID PRIMARY KEY,
  organization_id UUID,
  title VARCHAR(200),
  description TEXT,
  type EVENT_TYPE,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  location_type LOCATION_TYPE,
  location_details JSONB,
  capacity INTEGER,
  requires_rsvp BOOLEAN,
  allow_guests BOOLEAN,
  visibility EVENT_VISIBILITY,
  created_by TEXT, -- Clerk user ID
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- RSVP tracking
event_rsvps (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events,
  user_id TEXT, -- Clerk user ID
  status RSVP_STATUS,
  guest_count INTEGER,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Volunteer opportunities
event_volunteer_slots (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events,
  title VARCHAR(100),
  description TEXT,
  quantity INTEGER,
  created_at TIMESTAMP
)

-- Volunteer signups
event_volunteer_signups (
  id UUID PRIMARY KEY,
  slot_id UUID REFERENCES event_volunteer_slots,
  user_id TEXT, -- Clerk user ID
  quantity INTEGER,
  notes TEXT,
  created_at TIMESTAMP
)
```

### API Endpoints

#### Event Management
- `GET /api/events` - List events with filtering
  - Query params: type, visibility, start_date, end_date, search
  - Returns paginated results with RSVP counts
- `POST /api/events` - Create new event (board/admin only)
- `GET /api/events/[id]` - Get event details
- `PUT /api/events/[id]` - Update event
- `DELETE /api/events/[id]` - Delete event

#### RSVP Management
- `POST /api/events/[id]/rsvp` - RSVP to event
- `PUT /api/events/[id]/rsvp` - Update RSVP
- `DELETE /api/events/[id]/rsvp` - Cancel RSVP

#### Volunteer Management
- `POST /api/events/volunteer-signup` - Sign up for volunteer slot
- `DELETE /api/events/volunteer-signup/[id]` - Cancel volunteer signup

### Pages & Routes

- `/events` - Event list view with search and filters
- `/events/calendar` - Calendar view of all events
- `/events/new` - Create new event (board/admin only)
- `/events/[id]` - Event details with RSVP and volunteer signup
- `/events/[id]/edit` - Edit event (board/admin only)

## User Experience

### Event Creation Flow
1. Board member clicks "Create Event"
2. Fills out comprehensive form with:
   - Basic info (title, type, description)
   - Date and time
   - Location details (address for in-person, link for virtual)
   - RSVP settings and capacity
   - Volunteer slots (if applicable)
3. Form validates required fields with visual indicators
4. Event is created and immediately visible based on privacy settings

### RSVP Flow
1. Member views event details
2. Clicks "RSVP" button
3. Selects attendance status
4. Optionally adds guests (if allowed)
5. Receives confirmation
6. Can update or cancel RSVP anytime

### Volunteer Signup Flow
1. Member views volunteer opportunities on event page
2. Clicks "Sign Up" on desired slot
3. Confirms signup
4. Sees updated slot availability
5. Can cancel signup if plans change

## Form Validation

### Required Fields
All required fields are marked with a red asterisk (*):
- Event Title *
- Event Type *
- Start Time *
- End Time *
- Address * (for in-person events)
- Virtual Link * (for virtual events)

### Validation Rules
- End time must be after start time
- Capacity must be positive number
- Guest count cannot exceed 10
- Virtual events require valid URL

## Privacy & Security

### Visibility Controls
- **Public**: Anyone can view (including non-members)
- **Members**: Only authenticated members can view
- **Board**: Only board members and admins can view

### Access Control
- Event creation/editing restricted to board/admin roles
- RSVP list visibility based on user role
- Volunteer signups require authentication

## Best Practices

### For Event Organizers
1. Use descriptive titles that clearly indicate the event purpose
2. Provide detailed descriptions including what to bring/expect
3. Set realistic capacity limits
4. Create volunteer slots with clear role descriptions
5. Choose appropriate visibility settings

### For Platform Administrators
1. Regularly review upcoming events for accuracy
2. Monitor RSVP rates to gauge engagement
3. Archive past events to maintain performance
4. Use event analytics to plan future activities

## Future Enhancements (Phase 2)

- **Recurring Events**: Weekly/monthly event templates
- **Event Templates**: Save common event configurations
- **Automated Reminders**: Email reminders 48 hours before events
- **QR Code Check-in**: Generate QR codes for event check-in
- **Advanced Analytics**: Attendance trends, popular event types
- **Integration**: Sync with Google Calendar, iCal feeds
- **Ticketing**: Paid event support with Stripe integration

## Performance Considerations

- Events are paginated (20 per page) for optimal loading
- Calendar view fetches only current month's events
- RSVP counts are calculated efficiently using database aggregation
- Proper indexes on frequently queried fields (start_time, visibility)

## Accessibility

- All form inputs have proper labels
- Calendar is keyboard navigable
- Color alone is not used to convey information
- ARIA labels for interactive elements
- Focus management for modals and dialogs