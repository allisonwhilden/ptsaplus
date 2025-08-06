#!/bin/bash

# Script to set up .env.local in new worktrees

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Find the main worktree (where .git directory lives)
MAIN_WORKTREE=$(git worktree list | grep -E '\[.*\]$' | head -1 | awk '{print $1}')

if [ -z "$MAIN_WORKTREE" ]; then
    echo "Error: Could not find main worktree"
    exit 1
fi

# Environment files are in the app folder
ENV_SOURCE="$MAIN_WORKTREE/app/.env.local"
ENV_TARGET="app/.env.local"

if [ ! -f "$ENV_SOURCE" ]; then
    echo -e "${YELLOW}Warning: No .env.local found in main worktree at $ENV_SOURCE${NC}"
    echo "Please create .env.local in your main worktree's app folder first"
    echo "You can copy app/.env.example to app/.env.local as a starting point"
    exit 1
fi

# Check if we're in a worktree (not the main one)
CURRENT_DIR=$(pwd)
if [ "$CURRENT_DIR" = "$MAIN_WORKTREE" ]; then
    echo "You're in the main worktree. No need to copy .env.local"
    exit 0
fi

# Make sure app directory exists
if [ ! -d "app" ]; then
    echo -e "${YELLOW}Warning: 'app' directory not found. Are you in the project root?${NC}"
    exit 1
fi

# Create symlink to main worktree's .env.local
if [ -f "$ENV_TARGET" ]; then
    echo -e "${YELLOW}app/.env.local already exists. Skipping...${NC}"
else
    ln -s "$ENV_SOURCE" "$ENV_TARGET"
    echo -e "${GREEN}✓ Created symlink to app/.env.local from main worktree${NC}"
fi

# Also handle .env if it exists
if [ -f "$MAIN_WORKTREE/app/.env" ] && [ ! -f "app/.env" ]; then
    ln -s "$MAIN_WORKTREE/app/.env" "app/.env"
    echo -e "${GREEN}✓ Created symlink to app/.env from main worktree${NC}"
fi

echo -e "${GREEN}Environment setup complete!${NC}"