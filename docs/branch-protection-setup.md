# Branch Protection Setup Guide

This guide explains how to set up branch protection rules for the PTSA+ repository.

## Prerequisites

1. Install GitHub CLI if not already installed:
   ```bash
   brew install gh
   ```

2. Authenticate with GitHub:
   ```bash
   gh auth login
   ```

## Branch Protection Rules

### Main Branch (Production)

The main branch should have the strictest protection since it represents production code.

```bash
# Set up main branch protection
gh api repos/allisonwhilden/ptsaplus/branches/main/protection \
  --method PUT \
  --field "required_status_checks[strict]=true" \
  --field "required_status_checks[contexts][]=test" \
  --field "enforce_admins=true" \
  --field "required_pull_request_reviews[required_approving_review_count]=1" \
  --field "required_pull_request_reviews[dismiss_stale_reviews]=true" \
  --field "required_conversation_resolution=true" \
  --field "allow_force_pushes=false" \
  --field "allow_deletions=false"
```

This configuration:
- ✅ Requires pull request reviews (1 approver minimum)
- ✅ Dismisses stale reviews when new commits are pushed
- ✅ Requires status checks to pass (CI)
- ✅ Requires branches to be up to date
- ✅ Requires conversation resolution
- ✅ Prevents direct pushes (even by admins)
- ✅ Prevents force pushes
- ✅ Prevents branch deletion

### Develop Branch (Integration)

The develop branch has lighter protection to allow for easier collaboration.

```bash
# Set up develop branch protection
gh api repos/allisonwhilden/ptsaplus/branches/develop/protection \
  --method PUT \
  --field "required_status_checks[contexts][]=test" \
  --field "allow_force_pushes=false" \
  --field "allow_deletions=false"
```

This configuration:
- ✅ Requires status checks to pass (CI)
- ✅ Prevents force pushes
- ✅ Prevents branch deletion
- ✅ Allows direct pushes (for quick fixes)
- ❌ Does not require PR reviews (optional)

## Verification

Check the protection status:

```bash
# Check main branch protection
gh api repos/allisonwhilden/ptsaplus/branches/main/protection

# Check develop branch protection
gh api repos/allisonwhilden/ptsaplus/branches/develop/protection
```

## Additional Recommendations

### 1. Create a CODEOWNERS file

Create `.github/CODEOWNERS` to automatically assign reviewers:

```
# Global owners
* @allisonwhilden

# Frontend code
/app/src/components/ @frontend-team
/app/src/app/ @frontend-team

# Backend/API code
/app/src/app/api/ @backend-team

# Documentation
/docs/ @allisonwhilden
*.md @allisonwhilden
```

### 2. Set up Auto-merge for Dependabot

Allow Dependabot PRs to auto-merge when checks pass:

```bash
gh api repos/allisonwhilden/ptsaplus --method PATCH \
  --field allow_auto_merge=true
```

### 3. Configure Merge Options

Set repository preferences for merging:

```bash
gh api repos/allisonwhilden/ptsaplus --method PATCH \
  --field allow_squash_merge=true \
  --field allow_merge_commit=false \
  --field allow_rebase_merge=true \
  --field delete_branch_on_merge=true
```

### 4. Set up Required Status Checks

Once your CI is stable, update the required status checks:

```bash
# Update to include specific job names from your CI
gh api repos/allisonwhilden/ptsaplus/branches/main/protection \
  --method PATCH \
  --field "required_status_checks[contexts][]=build" \
  --field "required_status_checks[contexts][]=test" \
  --field "required_status_checks[contexts][]=lint"
```

## Manual Setup Alternative

If you prefer to set up protection rules through the GitHub UI:

1. Go to Settings → Branches in your repository
2. Click "Add rule" 
3. Enter branch name pattern (e.g., "main")
4. Configure the protection rules
5. Click "Create" or "Save changes"

## Troubleshooting

If you get permission errors, ensure you have admin access to the repository.

To remove protection (if needed):

```bash
# Remove protection from a branch
gh api repos/allisonwhilden/ptsaplus/branches/main/protection \
  --method DELETE
```