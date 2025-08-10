# Communication System Migration Guide

This guide covers the steps needed to deploy the new communication system to production.

## Prerequisites

Before deploying the communication system, ensure you have:

1. **Resend Account**: Sign up at [resend.com](https://resend.com)
2. **Verified Domain**: Add and verify your sending domain in Resend
3. **API Key**: Generate a production API key in Resend dashboard
4. **Database Access**: Admin access to run migrations

## Step 1: Environment Variables

Add these new environment variables to your production environment (Vercel):

```bash
# Email Service (Required)
RESEND_API_KEY=re_xxxxxxxxxxxxx  # Your Resend API key
EMAIL_FROM=notifications@yourdomain.org  # Verified sender address
EMAIL_REPLY_TO=support@yourdomain.org  # Reply-to address

# Organization Info
NEXT_PUBLIC_ORGANIZATION_NAME=Lincoln Elementary PTSA  # Your PTSA name
NEXT_PUBLIC_BASE_URL=https://yourdomain.org  # Your production URL
```

## Step 2: Database Migration

Run the communication tables migration:

```sql
-- Run this migration in your Supabase SQL editor
-- File: supabase/migrations/20250107_create_communication_tables.sql

-- This creates:
-- - communication_preferences table
-- - email_logs table (privacy-compliant)
-- - email_queue table
-- - announcements table
-- - announcement_views table
-- Plus RLS policies and indexes
```

## Step 3: Install Dependencies

The following packages have been added and need to be installed:

```json
{
  "dependencies": {
    "resend": "^5.0.0",
    "react-email": "^4.2.8",
    "@react-email/components": "^0.5.0"
  }
}
```

These will be automatically installed during deployment if using Vercel.

## Step 4: Verify Email Templates

The system includes 6 email templates that will be automatically used:

1. **Welcome Email** - Sent when new members register
2. **Payment Confirmation** - Sent after successful payments
3. **Event Reminder** - Sent 24 hours before events
4. **Announcement** - Sent when board creates announcements
5. **Volunteer Reminder** - Sent before volunteer shifts
6. **Meeting Minutes** - Sent after meetings

## Step 5: Configure Resend

1. **Add Domain**: In Resend dashboard, add your sending domain
2. **Verify DNS**: Add the required DNS records (SPF, DKIM, DMARC)
3. **Wait for Verification**: Usually takes 5-30 minutes
4. **Test Send**: Use Resend's test feature to verify setup

## Step 6: Test the System

### Test Email Sending (Development)

```bash
# Without RESEND_API_KEY, emails will be logged to console
# This is useful for development testing
```

### Test Email Sending (Production)

1. Create a test announcement:
   - Login as admin/board member
   - Navigate to `/api/announcements` (when UI is ready)
   - Create announcement with `sendEmail: true`

2. Verify email delivery:
   - Check recipient inbox
   - Verify unsubscribe link works
   - Check email logs in database

## Step 7: Privacy Compliance Checklist

Before going live, verify:

- [ ] ✅ Email logs store only hashed email addresses
- [ ] ✅ Consent is checked before sending any email
- [ ] ✅ Unsubscribe links are included in all emails
- [ ] ✅ Communication preferences default to opt-in
- [ ] ✅ COPPA parental consent is tracked

## Step 8: Set Up Communication Preferences

Each user needs communication preferences. You can:

1. **Bulk Initialize** (for existing users):
```sql
-- Set default preferences for existing users
INSERT INTO communication_preferences (
  user_id,
  email_enabled,
  email_frequency,
  payments_enabled,
  created_at
)
SELECT 
  id,
  false,  -- Start with emails disabled (opt-in)
  'weekly',
  true,   -- Payment emails always enabled
  NOW()
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
```

2. **Auto-create on Registration**: New users will get default preferences

## Step 9: Monitor the System

### Check Email Logs

```sql
-- View recent email activity
SELECT 
  recipient_domain,
  subject,
  status,
  created_at
FROM email_logs
ORDER BY created_at DESC
LIMIT 50;
```

### Monitor Queue

```sql
-- Check pending emails
SELECT 
  status,
  COUNT(*) as count
FROM email_queue
GROUP BY status;
```

## Step 10: Troubleshooting

### Common Issues

1. **Emails not sending**:
   - Verify RESEND_API_KEY is set correctly
   - Check Resend dashboard for API errors
   - Verify domain is verified in Resend

2. **Unsubscribe not working**:
   - Verify NEXT_PUBLIC_BASE_URL is correct
   - Check token generation in privacy.ts

3. **Consent errors**:
   - Ensure communication_preferences exist for users
   - Check RLS policies allow user access

### Debug Mode

To debug email issues, temporarily add logging:

```typescript
// In lib/email/client.ts
console.log('[Email Debug]', {
  to: options.to,
  subject: options.subject,
  category: options.category,
  userId: options.userId
});
```

## Post-Deployment Verification

After deployment, verify:

1. [ ] Test user can update communication preferences
2. [ ] Board member can create announcements
3. [ ] Emails are being delivered successfully
4. [ ] Unsubscribe links work correctly
5. [ ] Email logs show activity (without PII)

## Rollback Plan

If issues occur, you can disable email sending by:

1. Remove RESEND_API_KEY from environment
2. System will automatically fall back to console logging
3. No emails will be sent, but system remains functional

## Support

For issues related to:
- **Resend**: Check their [documentation](https://resend.com/docs)
- **Database**: Review Supabase logs
- **Privacy**: Consult privacy-guardian agent
- **User Experience**: Consult volunteer-advocate agent