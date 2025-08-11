#!/bin/bash

# Communication System Setup Script
echo "🚀 Setting up Communication System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if .env.local exists
echo -e "${YELLOW}Step 1: Checking environment variables...${NC}"
if [ ! -f "app/.env.local" ]; then
    echo -e "${RED}❌ .env.local not found! Creating from example...${NC}"
    if [ -f "app/.env.example" ]; then
        cp app/.env.example app/.env.local
        echo -e "${GREEN}✅ Created .env.local from example${NC}"
    else
        echo -e "${RED}❌ No .env.example found. Please create .env.local manually${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env.local exists${NC}"
fi

# Step 2: Check for required environment variables
echo -e "${YELLOW}Step 2: Checking required environment variables...${NC}"
source app/.env.local

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_URL not set${NC}"
    echo "Please add your Supabase URL to .env.local"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not set${NC}"
    echo "Please add your Supabase anon key to .env.local"
    exit 1
fi

echo -e "${GREEN}✅ Supabase environment variables configured${NC}"

# Step 3: Add Resend configuration
echo -e "${YELLOW}Step 3: Configuring email service...${NC}"
if ! grep -q "RESEND_API_KEY" app/.env.local; then
    echo -e "${YELLOW}Adding Resend configuration to .env.local...${NC}"
    cat >> app/.env.local << 'EOF'

# Email Service (Resend) - Added by setup script
# Get your API key from https://resend.com
RESEND_API_KEY=
EMAIL_FROM="PTSA+ <notifications@your-domain.com>"
EMAIL_REPLY_TO="support@your-domain.com"

# Base URL for unsubscribe links
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Organization Info
NEXT_PUBLIC_ORGANIZATION_NAME="Your PTSA Name"
EOF
    echo -e "${GREEN}✅ Added Resend configuration template${NC}"
    echo -e "${YELLOW}⚠️  Please add your RESEND_API_KEY to .env.local${NC}"
    echo "   Get one free at https://resend.com"
else
    echo -e "${GREEN}✅ Resend configuration already exists${NC}"
fi

# Step 4: Install dependencies
echo -e "${YELLOW}Step 4: Installing dependencies...${NC}"
cd app && npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Step 5: Show migration instructions
echo -e "${YELLOW}Step 5: Database Migrations${NC}"
echo ""
echo "Please run the following migration in your Supabase SQL editor:"
echo "  1. Go to https://supabase.com/dashboard"
echo "  2. Select your project"
echo "  3. Go to SQL Editor"
echo "  4. Copy and run the migration from:"
echo "     app/supabase/migrations/20250107_create_communication_tables.sql"
echo ""

# Step 6: Create a quick test file
echo -e "${YELLOW}Step 6: Creating test utilities...${NC}"
cat > app/test-email.js << 'EOF'
// Quick test script for email functionality
const testEmail = async () => {
  console.log('Testing email configuration...');
  
  if (!process.env.RESEND_API_KEY) {
    console.log('❌ RESEND_API_KEY not set - emails will be logged to console only');
    console.log('   This is fine for development!');
  } else {
    console.log('✅ RESEND_API_KEY configured');
  }
  
  console.log('\nEmail settings:');
  console.log('FROM:', process.env.EMAIL_FROM || 'PTSA+ <notifications@ptsaplus.org>');
  console.log('REPLY TO:', process.env.EMAIL_REPLY_TO || 'support@ptsaplus.org');
  console.log('BASE URL:', process.env.NEXT_PUBLIC_BASE_URL || 'https://ptsaplus.vercel.app');
  console.log('ORGANIZATION:', process.env.NEXT_PUBLIC_ORGANIZATION_NAME || 'PTSA+');
};

testEmail();
EOF
echo -e "${GREEN}✅ Created test-email.js${NC}"

# Step 7: Final instructions
echo ""
echo "========================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Run the database migration in Supabase"
echo "2. (Optional) Add your RESEND_API_KEY to .env.local"
echo "3. Start the development server: npm run dev"
echo "4. Test email config: node test-email.js"
echo ""
echo "The system will work without Resend API key in development."
echo "Emails will be logged to the console instead of sent."
echo ""
echo "For production, you'll need:"
echo "  - A Resend API key (free at resend.com)"
echo "  - Verified domain in Resend"
echo "  - Environment variables in Vercel"