#!/bin/bash

# Generate TypeScript types from Supabase database schema
# This script requires the Supabase CLI to be installed
# Install with: npm install -g supabase

# Exit on any error
set -e

echo "Generating Supabase database types..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if we have a project ID
if [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "Error: SUPABASE_PROJECT_ID environment variable is not set."
    echo "You can find your project ID in your Supabase dashboard URL."
    echo "Export it with: export SUPABASE_PROJECT_ID=your-project-id"
    exit 1
fi

# Generate types
echo "Fetching types from project: $SUPABASE_PROJECT_ID"
supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > src/types/supabase.ts

echo "Types generated successfully at src/types/supabase.ts"
echo ""
echo "Note: You may need to manually update the generated types if you have:"
echo "  - Custom enums"
echo "  - Specific business logic types"
echo "  - Additional type safety requirements"