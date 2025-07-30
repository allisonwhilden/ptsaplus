#!/bin/bash

# Add placeholder environment variables for initial Vercel deployment
echo "🔐 Setting up placeholder environment variables for Vercel..."
echo "=================================================="
echo ""
echo "These are placeholder values to allow initial deployment."
echo "You'll need to update them with real values in the Vercel dashboard."
echo ""

# Add placeholder values for all environments
echo "https://placeholder.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "https://placeholder.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview
echo "https://placeholder.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL development

echo "placeholder_anon_key" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "placeholder_anon_key" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
echo "placeholder_anon_key" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development

echo "placeholder_service_key" | vercel env add SUPABASE_SERVICE_KEY production
echo "placeholder_service_key" | vercel env add SUPABASE_SERVICE_KEY preview
echo "placeholder_service_key" | vercel env add SUPABASE_SERVICE_KEY development

echo "pk_test_placeholder" | vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
echo "pk_test_placeholder" | vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY preview
echo "pk_test_placeholder" | vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY development

echo "sk_test_placeholder" | vercel env add CLERK_SECRET_KEY production
echo "sk_test_placeholder" | vercel env add CLERK_SECRET_KEY preview
echo "sk_test_placeholder" | vercel env add CLERK_SECRET_KEY development

echo "whsec_placeholder" | vercel env add CLERK_WEBHOOK_SECRET production
echo "whsec_placeholder" | vercel env add CLERK_WEBHOOK_SECRET preview
echo "whsec_placeholder" | vercel env add CLERK_WEBHOOK_SECRET development

echo ""
echo "✅ Placeholder environment variables added!"
echo ""
echo "🎯 Next steps:"
echo "1. Go to https://vercel.com/allisonwhilden1s-projects/ptsaplus/settings/environment-variables"
echo "2. Update each variable with real values from your services"
echo "3. Redeploy to apply the changes"
echo ""
echo "📚 See VERCEL_ENV_SETUP.md for detailed instructions on where to find each value."