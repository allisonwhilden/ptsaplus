# Git Workflow & Branching Strategy

This document outlines our Git workflow and branching strategy for the PTSA+ platform.

## Branch Structure

```
main (production)
  ├── develop (integration)
  │     ├── feature/payment-integration
  │     ├── feature/event-management
  │     └── bugfix/search-filters
  └── hotfix/critical-auth-fix
```

### Branch Types

1. **main** - Production branch
   - Always deployable
   - Protected branch (requires PR)
   - Auto-deploys to production on push

2. **develop** - Integration branch
   - Default branch for new features
   - Auto-deploys to preview environment
   - Merged to main for releases

3. **feature/** - Feature branches
   - Created from develop
   - For new functionality
   - Naming: `feature/descriptive-name`

4. **bugfix/** - Bug fix branches
   - Created from develop
   - For non-critical fixes
   - Naming: `bugfix/issue-description`

5. **hotfix/** - Emergency fixes
   - Created from main
   - For critical production issues
   - Merged to both main AND develop
   - Naming: `hotfix/critical-issue`

## Development Workflow

### 1. Starting New Work

```bash
# Update your local develop branch
git checkout develop
git pull origin develop

# Create a new feature branch
git checkout -b feature/payment-integration

# OR use the worktree script (recommended)
./scripts/worktree-create.sh payment-integration
```

### 2. Working with Worktrees

Our project supports Git worktrees for parallel development:

```bash
# Create a feature branch worktree (defaults to develop base)
./scripts/worktree-create.sh payment-integration

# Create a bugfix branch worktree
./scripts/worktree-create.sh search-fix bugfix

# Create a hotfix branch worktree (defaults to main base)
./scripts/worktree-create.sh critical-auth-fix hotfix

# List all worktrees
./scripts/worktree-list.sh

# Clean up when done
./scripts/worktree-cleanup.sh ../ptsaplus-feature-payment-integration
```

### 3. Making Changes

```bash
# Make your changes
git add .
git commit -m "feat(payments): add Stripe payment form"

# Follow conventional commits:
# - feat: New feature
# - fix: Bug fix
# - docs: Documentation changes
# - style: Code style changes
# - refactor: Code refactoring
# - test: Test additions/changes
# - chore: Maintenance tasks
```

### 4. Pushing Changes

```bash
# First push
git push -u origin feature/payment-integration

# Subsequent pushes
git push
```

### 5. Creating Pull Requests

1. Go to GitHub
2. Create PR from your branch → develop
3. Fill out the PR template
4. Request reviews from team members
5. Address feedback
6. Squash and merge when approved

### 6. Release Process

When ready to deploy to production:

```bash
# Ensure develop is up to date
git checkout develop
git pull origin develop

# Create a PR from develop → main
# After approval and merge, production auto-deploys
```

## Deployment Triggers

- **Push to main** → Production deployment (https://ptsaplus.vercel.app)
- **Push to develop** → Preview deployment
- **PR creation** → Preview deployment for PR

## Best Practices

### Commit Messages
Use conventional commits format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Example:
```
feat(payments): add Stripe payment integration

- Add payment form component
- Integrate Stripe Elements
- Handle payment confirmation

Closes #123
```

### Pull Request Guidelines

1. **Keep PRs small and focused**
   - One feature/fix per PR
   - Easier to review
   - Faster to merge

2. **Write descriptive PR descriptions**
   - What changed
   - Why it changed
   - How to test
   - Screenshots if UI changes

3. **Update tests and documentation**
   - Add/update tests for new code
   - Update relevant documentation
   - Include in same PR

4. **Request reviews early**
   - Draft PRs for work in progress
   - Get feedback before investing too much time

### Branch Hygiene

1. **Delete merged branches**
   ```bash
   # After PR is merged
   git branch -d feature/payment-integration
   git push origin --delete feature/payment-integration
   ```

2. **Keep branches up to date**
   ```bash
   # While working on a feature branch
   git checkout develop
   git pull origin develop
   git checkout feature/payment-integration
   git merge develop
   ```

3. **Use worktrees for parallel work**
   - Keep main workspace on develop
   - Use worktrees for feature branches
   - Easier context switching

## Emergency Procedures

### Hotfix Process

For critical production issues:

```bash
# Create hotfix from main
./scripts/worktree-create.sh auth-bypass-fix hotfix

# Or manually
git checkout main
git pull origin main
git checkout -b hotfix/auth-bypass-fix

# Fix the issue
git add .
git commit -m "fix: patch authentication bypass vulnerability"

# Push and create PR to main
git push -u origin hotfix/auth-bypass-fix

# After merge to main, also merge to develop
git checkout develop
git pull origin develop
git merge hotfix/auth-bypass-fix
git push origin develop
```

### Rollback Procedure

If a deployment causes issues:

1. **Revert in GitHub**
   - Go to the merge commit
   - Click "Revert"
   - Merge the revert PR

2. **Or use Vercel**
   - Go to Vercel dashboard
   - Find previous working deployment
   - Promote to production

## CI/CD Integration

Our GitHub Actions workflow enforces:
- Linting on all PRs
- Type checking
- Build verification
- Automated security scanning

All checks must pass before merging.

## FAQ

### When should I use develop vs main?
- Always branch from develop for new features
- Only branch from main for hotfixes

### How often do we release to production?
- When features are tested and ready
- Typically weekly, but can be more frequent
- Hotfixes deploy immediately

### What if I need to work on multiple features?
- Use worktrees to work on multiple branches
- Each worktree is independent
- Run dev servers on different ports

### How do I handle merge conflicts?
```bash
# Update your branch with latest develop
git checkout develop
git pull origin develop
git checkout feature/your-branch
git merge develop
# Resolve conflicts
git add .
git commit -m "fix: resolve merge conflicts with develop"
```

## Tools & Scripts

- `worktree-create.sh` - Create new worktrees with proper branch naming
- `worktree-list.sh` - List all active worktrees
- `worktree-dev.sh` - Start dev server with auto-port selection
- `worktree-cleanup.sh` - Remove worktrees safely

See `/scripts/` directory for all available tools.