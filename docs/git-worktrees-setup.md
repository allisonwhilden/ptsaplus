# Git Worktrees Setup for PTSA+

## Overview

Git worktrees allow running multiple Claude Code sessions in parallel, each working on different features without context switching. This setup is scheduled for **Week 1, Friday afternoon** after the initial codebase is established.

## Scripts to Implement

### 1. worktree-list.sh
Lists all active worktrees with their status and current branch.

```bash
#!/bin/bash
# scripts/worktree-list.sh

echo "Active Git Worktrees for PTSA+"
echo "==============================="
git worktree list --porcelain | grep -E "^worktree|^branch" | paste - - | \
  awk '{print $2 " -> " $4}' | column -t

# Also show which ports are in use
echo -e "\nActive Development Servers:"
echo "=========================="
lsof -ti:3000-3010 2>/dev/null | while read pid; do
  port=$(lsof -Pan -p $pid -i | grep -oE ':[0-9]+' | head -1 | tr -d ':')
  dir=$(pwdx $pid 2>/dev/null | cut -d' ' -f2)
  echo "Port $port: $dir"
done
```

### 2. worktree-create.sh
Creates a new worktree with automatic branch naming.

```bash
#!/bin/bash
# scripts/worktree-create.sh

if [ $# -lt 1 ]; then
  echo "Usage: ./worktree-create.sh <branch-name> [worktree-path]"
  echo "Example: ./worktree-create.sh feature/payment-flow"
  exit 1
fi

BRANCH_NAME=$1
WORKTREE_PATH=${2:-"../ptsaplus-${BRANCH_NAME##*/}"}

# Create branch if it doesn't exist
if ! git show-ref --verify --quiet refs/heads/$BRANCH_NAME; then
  echo "Creating new branch: $BRANCH_NAME"
  git branch $BRANCH_NAME
fi

# Create worktree
echo "Creating worktree at: $WORKTREE_PATH"
git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"

# Copy environment files
if [ -f .env.local ]; then
  cp .env.local "$WORKTREE_PATH/"
  echo "✓ Copied .env.local"
fi

# Install dependencies
echo "Installing dependencies..."
cd "$WORKTREE_PATH"
pnpm install

echo "✅ Worktree created successfully!"
echo "To start development: cd $WORKTREE_PATH && pnpm dev"
```

### 3. worktree-cleanup.sh
Removes worktree and optionally deletes the branch.

```bash
#!/bin/bash
# scripts/worktree-cleanup.sh

if [ $# -lt 1 ]; then
  echo "Usage: ./worktree-cleanup.sh <worktree-path>"
  echo "Example: ./worktree-cleanup.sh ../ptsaplus-payment-flow"
  exit 1
fi

WORKTREE_PATH=$1

# Get branch name before removal
BRANCH_NAME=$(git -C "$WORKTREE_PATH" branch --show-current 2>/dev/null)

if [ -z "$BRANCH_NAME" ]; then
  echo "Error: Could not determine branch name for worktree"
  exit 1
fi

# Remove worktree
echo "Removing worktree at: $WORKTREE_PATH"
git worktree remove "$WORKTREE_PATH" --force

# Ask about branch deletion
read -p "Delete branch '$BRANCH_NAME'? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  git branch -D "$BRANCH_NAME"
  
  # Check if branch exists on remote
  if git ls-remote --exit-code --heads origin "$BRANCH_NAME" >/dev/null 2>&1; then
    read -p "Delete remote branch 'origin/$BRANCH_NAME'? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      git push origin --delete "$BRANCH_NAME"
    fi
  fi
fi

echo "✅ Cleanup complete!"
```

### 4. worktree-dev.sh
Starts development server on an available port.

```bash
#!/bin/bash
# scripts/worktree-dev.sh

# Function to check if port is available
is_port_available() {
  ! lsof -ti:$1 >/dev/null 2>&1
}

# Find available port starting from 3000
PORT=3000
while ! is_port_available $PORT; do
  PORT=$((PORT + 1))
  if [ $PORT -gt 3010 ]; then
    echo "Error: No available ports in range 3000-3010"
    exit 1
  fi
done

# Get current worktree name for display
WORKTREE_NAME=$(basename $(git rev-parse --show-toplevel))
BRANCH_NAME=$(git branch --show-current)

echo "🚀 Starting PTSA+ Development Server"
echo "==================================="
echo "Worktree: $WORKTREE_NAME"
echo "Branch: $BRANCH_NAME"
echo "Port: $PORT"
echo "URL: http://localhost:$PORT"
echo "==================================="

# Start development server with the found port
PORT=$PORT pnpm dev
```

## Workflow Example

```bash
# 1. Create a new feature worktree
./scripts/worktree-create.sh feature/payment-optimization

# 2. In a new terminal, navigate to the worktree
cd ../ptsaplus-payment-optimization

# 3. Start Claude Code in this directory
claude --workspace .

# 4. Start development server (auto-finds port)
./scripts/worktree-dev.sh

# 5. Work on the feature...

# 6. When done, clean up
./scripts/worktree-cleanup.sh ../ptsaplus-payment-optimization
```

## Best Practices

1. **Naming Convention**: Use descriptive branch names like `feature/`, `fix/`, `experiment/`
2. **Port Management**: Main branch uses 3000, worktrees use 3001-3010
3. **Environment Files**: Always copy `.env.local` to new worktrees
4. **Cleanup**: Remove worktrees when features are merged
5. **Parallel Work**: Ideal for testing different approaches simultaneously

## Integration with Claude Code

Each worktree provides:
- Isolated workspace for Claude Code
- Separate git history
- Independent node_modules
- Own development server
- Dedicated terminal context

This allows multiple Claude Code instances to work on different features without interference.

## Troubleshooting

### Port conflicts
If you get "Port already in use" errors:
```bash
# Find what's using the port
lsof -ti:3000

# Kill the process if needed
kill -9 $(lsof -ti:3000)
```

### Worktree conflicts
If git complains about existing worktrees:
```bash
# List all worktrees
git worktree list

# Prune stale worktrees
git worktree prune
```

### Dependencies out of sync
After pulling changes in main:
```bash
# Update all worktrees
for worktree in $(git worktree list --porcelain | grep "^worktree" | cut -d' ' -f2); do
  echo "Updating $worktree"
  (cd "$worktree" && git pull && pnpm install)
done
```