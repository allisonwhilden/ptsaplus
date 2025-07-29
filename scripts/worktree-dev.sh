#!/bin/bash

# Start development server on available port for current worktree
set -e

echo "🚀 Starting development server for worktree..."

# Check if we're in a project directory with package.json
if [ ! -f "app/package.json" ]; then
    echo "❌ Error: No app/package.json found. Are you in the correct worktree directory?"
    exit 1
fi

# Function to check if port is available
is_port_available() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1  # Port is in use
    else
        return 0  # Port is available
    fi
}

# Find an available port starting from 3000
PORT=3000
while ! is_port_available $PORT; do
    echo "📡 Port $PORT is in use, trying $((PORT + 1))..."
    PORT=$((PORT + 1))
    
    # Safety check to prevent infinite loop
    if [ $PORT -gt 3010 ]; then
        echo "❌ Error: No available ports found between 3000-3010"
        echo "💡 Try stopping other development servers first"
        exit 1
    fi
done

echo "🎯 Using port $PORT"
echo "🌐 Server will be available at: http://localhost:$PORT"
echo ""

# Show current branch info
BRANCH_NAME=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "🌿 Current branch: $BRANCH_NAME"
echo "📁 Working directory: $(pwd)"
echo ""

# Check for environment variables
if [ ! -f "app/.env.local" ]; then
    echo "⚠️  Warning: app/.env.local not found"
    echo "💡 Copy app/.env.example to app/.env.local and configure your environment variables"
    echo ""
fi

# Start the development server
echo "🚀 Starting Next.js development server..."
cd app
export PORT=$PORT
pnpm dev