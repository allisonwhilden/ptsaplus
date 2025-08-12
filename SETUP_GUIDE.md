# Communication System Setup Guide

## Prerequisites
- Node.js 18+ installed
- Supabase project set up
- Vercel account (for deployment)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Run Database Migrations

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the following migrations in order:

### Migration 1: Communication Tables
```sql
-- File: app/supabase/migrations/20250107_create_communication_tables.sql
-- Or use the combined file: MIGRATION_COMMUNICATION.sql
-- Copy and paste the entire file content into Supabase SQL editor
```

### Migration 2: Audit Logs Table
```sql
-- File: app/supabase/migrations/20250110_add_audit_logs_table.sql
-- Copy and paste the entire file content into Supabase SQL editor
```

## Step 3: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM="PTSA+ <notifications@your-domain.com>"
EMAIL_REPLY_TO="support@your-domain.com"

# Base URL for unsubscribe links
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Or your production URL

# Organization Info
NEXT_PUBLIC_ORGANIZATION_NAME="Your PTSA Name"
```

### How to get a Resend API Key:
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your domain (or use their test domain)
4. Go to API Keys → Create API Key
5. Copy the key and add it to `.env.local`

## Step 4: Verify Supabase RLS Policies

Check that these Row Level Security policies exist:

```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename IN ('communication_preferences', 'email_logs', 'announcements', 'announcement_views');
```

If policies are missing, create them:

```sql
-- Enable RLS on tables
ALTER TABLE communication_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_views ENABLE ROW LEVEL SECURITY;

-- Communication preferences policies
CREATE POLICY "Users can view own preferences" ON communication_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON communication_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON communication_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Email logs policies (admin only)
CREATE POLICY "Admins can view email logs" ON email_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'board')
    )
  );

-- Announcements policies
CREATE POLICY "Anyone can view published announcements" ON announcements
  FOR SELECT USING (
    published_at IS NOT NULL 
    AND published_at <= NOW()
    AND (expires_at IS NULL OR expires_at > NOW())
  );

CREATE POLICY "Board/Admin can create announcements" ON announcements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'board')
    )
  );

CREATE POLICY "Creator or admin can update announcements" ON announcements
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Creator or admin can delete announcements" ON announcements
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Announcement views policies
CREATE POLICY "Users can track their own views" ON announcement_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can see their own views" ON announcement_views
  FOR SELECT USING (auth.uid() = user_id);
```

## Step 5: Test the Setup

### 1. Start the development server:
```bash
npm run dev
```

### 2. Test email functionality (without sending real emails):
The system will work in development mode without a Resend API key. Check the console for:
```
[Email] Skipping email send in development (no RESEND_API_KEY)
[Email] Would send to: user@example.com
[Email] Subject: Your subject here
```

### 3. Test announcements API:
```bash
# Create a test announcement (requires auth)
curl -X POST http://localhost:3000/api/announcements \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Announcement",
    "content": "This is a test",
    "type": "general",
    "audience": "all"
  }'
```

### 4. Test communication preferences API:
```bash
# Get user preferences (requires auth)
curl http://localhost:3000/api/communications/preferences
```

## Step 6: Verify in Production

After deploying to Vercel:

1. Add environment variables in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - Redeploy for changes to take effect

2. Test email sending with real Resend API key:
   - Create an announcement with "Send Email" checked
   - Check Resend dashboard for email status
   - Verify email delivery

## Troubleshooting

### Issue: "RESEND_API_KEY not configured" warning
**Solution**: This is normal in development. Emails will be logged to console instead of sent.

### Issue: Database tables not found
**Solution**: Run the migrations in order (communication tables first, then announcements).

### Issue: Permission denied on API routes
**Solution**: Check that you're authenticated and have the correct role (admin/board for creating announcements).

### Issue: Emails not sending in production
**Solution**: 
1. Verify RESEND_API_KEY is set in Vercel environment variables
2. Check domain verification in Resend dashboard
3. Review email logs in Supabase for error messages

## Features Overview

### ✅ Email System
- Privacy-compliant logging (SHA-256 hashing)
- Consent checking before sends
- Unsubscribe token generation
- 6 professional email templates

### ✅ Announcement System
- Role-based CRUD operations
- Audience targeting
- Scheduled publishing
- Email distribution

### ✅ Communication Preferences
- Granular consent by category
- COPPA compliance tracking
- Unsubscribe management

## Next Steps

1. **Configure Resend domain**: Verify your sending domain in Resend for better deliverability
2. **Customize email templates**: Edit templates in `app/src/lib/email/templates/`
3. **Set up email webhooks**: Configure Resend webhooks for delivery tracking
4. **Add UI components**: Build announcement creation and preference management pages

## Support

For issues or questions:
- Check the logs in Vercel Functions tab
- Review Supabase logs for database errors
- Inspect browser console for client-side errors
- Check Resend dashboard for email delivery status