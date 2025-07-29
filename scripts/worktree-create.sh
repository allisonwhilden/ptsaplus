#!/bin/bash

# Create a new Git worktree with auto-generated branch name
set -e

if [ $# -eq 0 ]; then
    echo "❌ Error: Please provide a feature name"
    echo "Usage: $0 <feature-name> [base-branch]"
    echo "Example: $0 payment-integration"
    echo "Example: $0 member-dashboard develop"
    exit 1
fi

FEATURE_NAME="$1"
BASE_BRANCH="${2:-main}"
BRANCH_NAME="feature/${FEATURE_NAME}"
WORKTREE_PATH="../ptsaplus-${FEATURE_NAME}"

echo "🌳 Creating new worktree for feature: $FEATURE_NAME"
echo "📁 Worktree path: $WORKTREE_PATH"
echo "🌿 Branch name: $BRANCH_NAME"
echo "🎯 Base branch: $BASE_BRANCH"
echo ""

# Check if base branch exists
if ! git show-ref --verify --quiet refs/heads/$BASE_BRANCH && ! git show-ref --verify --quiet refs/remotes/origin/$BASE_BRANCH; then
    echo "❌ Error: Base branch '$BASE_BRANCH' does not exist"
    exit 1
fi

# Check if branch already exists
if git show-ref --verify --quiet refs/heads/$BRANCH_NAME; then
    echo "❌ Error: Branch '$BRANCH_NAME' already exists"
    echo "💡 Use: git branch -d $BRANCH_NAME to delete it first"
    exit 1
fi

# Check if worktree path already exists
if [ -d "$WORKTREE_PATH" ]; then
    echo "❌ Error: Directory '$WORKTREE_PATH' already exists"
    exit 1
fi

# Create the worktree
echo "Creating worktree..."
git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" "$BASE_BRANCH"

echo ""
echo "✅ Worktree created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. cd $WORKTREE_PATH"
echo "2. Start working on your feature"
echo "3. Use './scripts/worktree-dev.sh' to start development server on available port"
echo ""
echo "📝 When done:"
echo "1. Commit your changes"
echo "2. Push branch: git push -u origin $BRANCH_NAME"
echo "3. Create pull request on GitHub"
echo "4. Clean up: ./scripts/worktree-cleanup.sh $WORKTREE_PATH"
echo ""
echo "🔗 Useful commands:"
echo "   - List worktrees: ./scripts/worktree-list.sh"
echo "   - Switch back to main: cd $(pwd)"