#!/bin/bash

# Vercel Setup Helper Script
set -e

echo "🚀 Vercel Setup for PTSA+ Platform"
echo "=================================="
echo ""

# Check if already in app directory
if [ -f "package.json" ]; then
    echo "✅ Already in app directory"
elif [ -d "app" ]; then
    echo "📁 Switching to app directory..."
    cd app
else
    echo "❌ Error: Cannot find app directory"
    exit 1
fi

echo ""
echo "📋 Step 1: Vercel Login"
echo "----------------------"
echo "If you're not already logged in, you'll be prompted to authenticate."
echo ""
vercel login

echo ""
echo "📋 Step 2: Link to Vercel Project"
echo "---------------------------------"
echo "This will create a new Vercel project or link to an existing one."
echo ""
echo "When prompted:"
echo "- Set up and deploy: Y"
echo "- Which scope: Select your personal account"
echo "- Link to existing project: N (create new)"
echo "- Project name: ptsaplus (or keep default)"
echo "- Directory: ./ (current directory)"
echo "- Override settings: N"
echo ""
read -p "Press Enter to continue..."
vercel link

echo ""
echo "📋 Step 3: Pull Environment Variables"
echo "------------------------------------"
echo "This creates a .env.local file with your Vercel environment variables."
echo ""
vercel env pull

echo ""
echo "✅ Vercel Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Find your 'ptsaplus' project"
echo "3. Go to Settings → Environment Variables"
echo "4. Add all required environment variables from .env.example"
echo ""
echo "🔐 Required Environment Variables:"
echo "- NEXT_PUBLIC_SUPABASE_URL"
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "- SUPABASE_SERVICE_KEY"
echo "- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
echo "- CLERK_SECRET_KEY"
echo "- CLERK_WEBHOOK_SECRET"
echo "- STRIPE_SECRET_KEY (use test key for now)"
echo "- STRIPE_WEBHOOK_SECRET"
echo "- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
echo ""
echo "💡 Tips:"
echo "- Use test/development keys initially"
echo "- Set variables for all environments (Production, Preview, Development)"
echo "- Preview deployments will happen automatically on push"
echo ""
echo "🌐 Your project will be available at:"
echo "- Production: https://ptsaplus.vercel.app"
echo "- Preview: https://ptsaplus-git-[branch-name].vercel.app"
echo ""
echo "Run 'vercel' to deploy manually, or push to GitHub for automatic deployment."