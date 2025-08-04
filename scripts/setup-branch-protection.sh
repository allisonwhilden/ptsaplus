#!/bin/bash

# Setup Branch Protection Rules for PTSA+ Repository
# This script uses GitHub CLI to configure branch protection

echo "Setting up branch protection rules for PTSA+ repository..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Repository details
REPO="allisonwhilden/ptsaplus"

# Function to check if gh is installed
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        echo "GitHub CLI (gh) is not installed. Please install it first:"
        echo "brew install gh"
        exit 1
    fi
}

# Function to check if authenticated
check_gh_auth() {
    if ! gh auth status &> /dev/null; then
        echo "Not authenticated with GitHub CLI. Please run:"
        echo "gh auth login"
        exit 1
    fi
}

# Check prerequisites
check_gh_cli
check_gh_auth

echo -e "${YELLOW}Setting up protection for main branch...${NC}"

# Main branch protection
gh api repos/$REPO/branches/main/protection \
  --method PUT \
  --field "required_status_checks[strict]=true" \
  --field "required_status_checks[contexts][]=test" \
  --field "enforce_admins=true" \
  --field "required_pull_request_reviews=null" \
  --field "required_conversation_resolution=true" \
  --field "restrictions=null" \
  --field "allow_force_pushes=false" \
  --field "allow_deletions=false" \
  --field "block_creations=false" \
  --field "required_linear_history=false" \
  --field "allow_squash_merge=true" \
  --field "allow_merge_commit=true" \
  --field "allow_rebase_merge=true" \
  --field "allow_auto_merge=false" \
  --field "delete_branch_on_merge=true"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Main branch protection configured successfully${NC}"
else
    echo "Failed to configure main branch protection"
fi

echo -e "${YELLOW}Setting up protection for develop branch...${NC}"

# Develop branch protection (less restrictive)
gh api repos/$REPO/branches/develop/protection \
  --method PUT \
  --field "required_status_checks[strict]=false" \
  --field "required_status_checks[contexts][]=test" \
  --field "enforce_admins=false" \
  --field "required_pull_request_reviews=null" \
  --field "required_conversation_resolution=false" \
  --field "restrictions=null" \
  --field "allow_force_pushes=false" \
  --field "allow_deletions=false" \
  --field "block_creations=false" \
  --field "required_linear_history=false"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Develop branch protection configured successfully${NC}"
else
    echo "Failed to configure develop branch protection"
fi

echo -e "${YELLOW}Current branch protection status:${NC}"
echo "Main branch:"
gh api repos/$REPO/branches/main/protection 2>/dev/null | jq -r '.required_status_checks.strict, .required_pull_request_reviews.required_approving_review_count, .allow_force_pushes.enabled, .allow_deletions.enabled' 2>/dev/null || echo "Not protected"

echo -e "\nDevelop branch:"
gh api repos/$REPO/branches/develop/protection 2>/dev/null | jq -r '.required_status_checks.strict, .allow_force_pushes.enabled, .allow_deletions.enabled' 2>/dev/null || echo "Not protected"

echo -e "\n${GREEN}Branch protection setup complete!${NC}"
echo -e "\nAdditional manual steps recommended:"
echo "1. Go to Settings > Branches in your GitHub repository"
echo "2. Verify the protection rules are applied correctly"
echo "3. Consider adding CODEOWNERS file for automatic review assignments"
echo "4. Set up required status checks once CI is stable"