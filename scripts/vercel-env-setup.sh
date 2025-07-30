#!/bin/bash

# Add placeholder environment variables for initial Vercel deployment
echo "🔐 Setting up placeholder environment variables for Vercel..."
echo "=================================================="
echo ""
echo "These are placeholder values to allow initial deployment."
echo "You'll need to update them with real values in the Vercel dashboard."
echo ""

# Add placeholder values for all environments
echo "NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder_anon_key" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development
echo "SUPABASE_SERVICE_KEY=placeholder_service_key" | vercel env add SUPABASE_SERVICE_KEY production preview development
echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_placeholder" | vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production preview development
echo "CLERK_SECRET_KEY=sk_test_placeholder" | vercel env add CLERK_SECRET_KEY production preview development
echo "CLERK_WEBHOOK_SECRET=whsec_placeholder" | vercel env add CLERK_WEBHOOK_SECRET production preview development

echo ""
echo "✅ Placeholder environment variables added!"
echo ""
echo "🎯 Next steps:"
echo "1. Go to https://vercel.com/allisonwhilden1s-projects/ptsaplus/settings/environment-variables"
echo "2. Update each variable with real values from your services"
echo "3. Redeploy to apply the changes"
echo ""
echo "📚 See VERCEL_ENV_SETUP.md for detailed instructions on where to find each value."