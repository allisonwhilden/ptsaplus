# Deployment Guide

## 🚀 Vercel Deployment Setup

### Prerequisites
1. GitHub repository created and pushed
2. Vercel account connected to GitHub
3. Environment variables configured

### Environment Variables Setup

#### Required for Production:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Stripe Payments
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# OpenAI (Optional - for AI features)
OPENAI_API_KEY=your_openai_api_key
```

### Vercel Project Setup

1. **Import Project**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Import Project"
   - Select your GitHub repository
   - Choose "ptsaplus" repository

2. **Configure Build Settings**:
   - Framework Preset: Next.js
   - Root Directory: `app`
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

3. **Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all required variables above
   - Set appropriate environments (Production, Preview, Development)

4. **Domain Setup** (Optional):
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS settings as instructed

### Branch Deployment Strategy

- **Production**: `main` branch → your-ptsa.vercel.app
- **Staging**: `develop` branch → ptsa-staging.vercel.app  
- **Feature Previews**: All PR branches get automatic preview URLs

### Database Setup

#### Supabase Configuration:
1. Create new Supabase project
2. Run the SQL schema from `app/supabase/schema-single-ptsa.sql`
3. Configure Row Level Security policies
4. Add environment variables to Vercel

#### Authentication Setup:
1. Create Clerk application
2. Configure allowed domains (add Vercel preview domains)
3. Set up webhooks pointing to your Vercel domain
4. Add Clerk keys to Vercel environment variables

#### Payment Setup:
1. Create Stripe account
2. Get API keys (use test keys for development)
3. Configure webhooks for your Vercel domain
4. Add Stripe keys to Vercel environment variables

### Security Considerations

#### Environment Variables:
- Never commit `.env.local` to git
- Use Vercel's environment variable encryption
- Rotate keys regularly
- Use different keys for production/staging

#### Webhook Security:
- Always verify webhook signatures
- Use HTTPS only
- Implement rate limiting
- Log all webhook events for audit

### Monitoring & Alerts

#### Vercel Analytics:
- Enable Vercel Analytics for performance monitoring
- Set up error tracking with Sentry (optional)
- Monitor Core Web Vitals

#### Database Monitoring:
- Monitor Supabase dashboard for query performance
- Set up alerts for connection limits
- Monitor storage usage

### Backup & Recovery

#### Database Backups:
- Supabase provides automatic backups
- Export critical data regularly
- Test restore procedures

#### Code Backups:
- GitHub provides redundancy
- Consider additional remote backups
- Document recovery procedures

## 🔧 Local Development with Vercel CLI

### Setup:
```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Pull environment variables
vercel env pull app/.env.local
```

### Development:
```bash
# Start local development
cd app
vercel dev
```

## 📊 Deployment Checklist

### Before First Deployment:
- [ ] GitHub repository created and pushed
- [ ] Vercel project configured
- [ ] All environment variables set
- [ ] Database schema deployed
- [ ] Authentication configured
- [ ] Payment webhooks configured
- [ ] Domain configured (if using custom domain)

### Before Each Release:
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Privacy compliance verified
- [ ] Database migrations run
- [ ] Environment variables updated
- [ ] Monitoring configured
- [ ] Rollback plan ready

### Post-Deployment:
- [ ] Smoke test critical paths
- [ ] Verify authentication works
- [ ] Test payment processing
- [ ] Check error monitoring
- [ ] Verify SSL certificate
- [ ] Test mobile responsiveness

## 🚨 Troubleshooting

### Common Issues:

#### Build Failures:
- Check Node.js version compatibility
- Verify all dependencies installed
- Check for TypeScript errors
- Verify environment variables

#### Runtime Errors:
- Check Vercel function logs
- Verify database connections
- Check API key validity
- Monitor error tracking

#### Performance Issues:
- Analyze Core Web Vitals
- Check database query performance
- Monitor API response times
- Optimize images and assets

### Support Resources:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Integration](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [Clerk Deployment](https://clerk.com/docs/deployments/overview)