# Vercel Environment Variables Setup Guide

## 🔐 Required Environment Variables

Copy these to your Vercel project settings. Go to:
**Dashboard → ptsaplus → Settings → Environment Variables**

### 1. Supabase Configuration

```bash
# From your Supabase project settings (Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_KEY=eyJhbGc...your-service-key
```

**Where to find:**
- Go to https://supabase.com/dashboard
- Select your project
- Go to Settings → API
- Copy the URL and keys

### 2. Clerk Authentication

```bash
# From Clerk Dashboard (your-app.clerk.dev)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# These are set automatically
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/register
```

**Where to find:**
- Go to https://dashboard.clerk.com
- Select your application
- API Keys → Copy keys
- Webhooks → Create endpoint for user sync

### 3. Stripe Payments

```bash
# Use test keys initially
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Where to find:**
- Go to https://dashboard.stripe.com
- Developers → API keys
- Use test mode keys initially
- Webhooks will be configured after deployment

### 4. OpenAI (Optional)

```bash
# Only if using AI features
OPENAI_API_KEY=sk-...
```

## 📝 Step-by-Step Setup

### 1. Access Vercel Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your `ptsaplus` project
3. Go to "Settings" tab
4. Click "Environment Variables" in sidebar

### 2. Add Variables
For each variable:
1. Enter the key name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
2. Enter the value
3. Select environments:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
4. Click "Save"

### 3. Configure Webhooks

#### Clerk Webhook:
1. In Clerk Dashboard → Webhooks
2. Add endpoint: `https://ptsaplus.vercel.app/api/webhooks/clerk`
3. Select events:
   - user.created
   - user.updated
   - user.deleted
4. Copy the signing secret to `CLERK_WEBHOOK_SECRET`

#### Stripe Webhook (after adding payment features):
1. In Stripe Dashboard → Webhooks
2. Add endpoint: `https://ptsaplus.vercel.app/api/webhooks/stripe`
3. Select events:
   - payment_intent.succeeded
   - payment_intent.failed
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

## 🧪 Testing Your Setup

### 1. Trigger a Deployment
```bash
git push origin main
```

### 2. Check Build Logs
- Go to Vercel Dashboard
- Click on the deployment
- Check for any build errors

### 3. Test the Deployed Site
- Visit https://ptsaplus.vercel.app
- Try signing up/in with Clerk
- Check browser console for errors

## 🚨 Common Issues

### Build Failures
- **Missing env vars**: Check all NEXT_PUBLIC_ vars are set
- **Type errors**: Run `pnpm type-check` locally first
- **Module not found**: Ensure all dependencies are in package.json

### Runtime Errors
- **401/403 errors**: Check API keys are correct
- **CORS errors**: Add your Vercel domains to service providers
- **Database connection**: Verify Supabase URL and keys

### Debugging Tips
1. Check Vercel Function logs
2. Use `console.log` for debugging (remove before production)
3. Test locally with same env vars

## 🔄 Updating Environment Variables

When you update variables in Vercel:
1. The change takes effect on next deployment
2. Trigger a redeploy:
   ```bash
   vercel --prod
   ```
   Or push a commit to trigger automatic deployment

## 🌍 Domain Configuration (Optional)

### Custom Domain Setup:
1. Go to Settings → Domains
2. Add your domain (e.g., ptsa.yourschool.org)
3. Configure DNS:
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or use Vercel nameservers
4. SSL is automatic

### Subdomain for Preview:
- Automatic: ptsaplus-git-develop.vercel.app
- Custom: preview.yourptsa.org → Configure in Vercel

## ✅ Final Checklist

Before going live:
- [ ] All environment variables set correctly
- [ ] Webhooks configured and tested
- [ ] Database migrations run on Supabase
- [ ] Authentication flow tested
- [ ] Error monitoring configured
- [ ] Custom domain configured (if using)
- [ ] Privacy policy and terms updated with correct URLs

Remember: Start with test/development keys and upgrade to production keys when ready!