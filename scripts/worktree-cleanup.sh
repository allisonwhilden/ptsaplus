#!/bin/bash

# Remove a Git worktree and optionally delete the branch
set -e

if [ $# -eq 0 ]; then
    echo "❌ Error: Please provide a worktree path"
    echo "Usage: $0 <worktree-path> [--delete-branch]"
    echo "Example: $0 ../ptsaplus-payment-integration"
    echo "Example: $0 ../ptsaplus-payment-integration --delete-branch"
    exit 1
fi

WORKTREE_PATH="$1"
DELETE_BRANCH="$2"

echo "🧹 Cleaning up worktree: $WORKTREE_PATH"

# Check if worktree exists
if [ ! -d "$WORKTREE_PATH" ]; then
    echo "❌ Error: Worktree directory '$WORKTREE_PATH' does not exist"
    exit 1
fi

# Get the branch name from the worktree
cd "$WORKTREE_PATH"
BRANCH_NAME=$(git branch --show-current)
cd - > /dev/null

echo "🌿 Branch: $BRANCH_NAME"

# Check for uncommitted changes
cd "$WORKTREE_PATH"
if ! git diff-index --quiet HEAD -- 2>/dev/null || [ -n "$(git ls-files --others --exclude-standard 2>/dev/null)" ]; then
    echo ""
    echo "⚠️  WARNING: This worktree has uncommitted changes or untracked files!"
    echo ""
    echo "Uncommitted changes:"
    git status --short
    echo ""
    read -p "Do you want to continue? This will lose all uncommitted work! (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cleanup cancelled"
        exit 1
    fi
fi

cd - > /dev/null

# Remove the worktree
echo "🗑️  Removing worktree..."
git worktree remove "$WORKTREE_PATH" --force

# Optionally delete the branch
if [ "$DELETE_BRANCH" = "--delete-branch" ]; then
    echo "🌿 Deleting branch '$BRANCH_NAME'..."
    
    # Check if branch has been pushed to remote
    if git show-ref --verify --quiet refs/remotes/origin/$BRANCH_NAME; then
        echo "⚠️  Branch '$BRANCH_NAME' exists on remote"
        read -p "Do you want to delete it from remote as well? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push origin --delete "$BRANCH_NAME"
            echo "🗑️  Remote branch deleted"
        fi
    fi
    
    # Delete local branch
    git branch -D "$BRANCH_NAME"
    echo "🗑️  Local branch deleted"
fi

echo ""
echo "✅ Worktree cleanup completed!"
echo ""
echo "📋 Summary:"
echo "   - Worktree removed: $WORKTREE_PATH"
if [ "$DELETE_BRANCH" = "--delete-branch" ]; then
    echo "   - Branch deleted: $BRANCH_NAME"
else
    echo "   - Branch preserved: $BRANCH_NAME"
    echo "   💡 Add '--delete-branch' flag to delete the branch as well"
fi
echo ""
echo "🔗 List remaining worktrees: ./scripts/worktree-list.sh"