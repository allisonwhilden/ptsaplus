# GitHub Repository & CI/CD Setup Guide

## 🎯 Overview

This guide will help you set up:
1. GitHub repository with proper branch protection
2. Vercel deployment with preview branches  
3. Git worktrees for parallel development
4. CI/CD pipeline with security scanning

## 📋 Step 1: Create GitHub Repository

### Option A: GitHub CLI (Recommended)
```bash
# Install GitHub CLI if not already installed
# brew install gh (macOS)
# or download from: https://cli.github.com/

# Authenticate with GitHub
gh auth login

# Create repository
gh repo create ptsaplus --public --description "Modern PTSA platform for school community management"

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/ptsaplus.git
git branch -M main
git push -u origin main
```

### Option B: GitHub Web Interface
1. Go to [GitHub](https://github.com/new)
2. Repository name: `ptsaplus`
3. Description: "Modern PTSA platform for school community management"
4. Set to Public (or Private if preferred)
5. Do NOT initialize with README (we have files already)
6. Create repository
7. Follow the "push an existing repository" instructions

## 📋 Step 2: Configure Repository Settings

### Branch Protection Rules:
```bash
# Using GitHub CLI
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null
```

Or via GitHub web interface:
1. Go to repository Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
   - ✅ Dismiss stale PR approvals when new commits are pushed
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators

### Repository Secrets:
Go to Settings → Secrets and variables → Actions, add:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key  
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## 📋 Step 3: Set Up Vercel Deployment

### 1. Connect Vercel to GitHub:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Import Project"
3. Import from GitHub → Select `ptsaplus`
4. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: **app**
   - Build Command: **pnpm build**
   - Output Directory: **.next**
   - Install Command: **pnpm install**

### 2. Environment Variables in Vercel:
Add to Project Settings → Environment Variables:

**Production Environment:**
```
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_KEY=your_production_service_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_production_clerk_key
CLERK_SECRET_KEY=your_production_clerk_secret
CLERK_WEBHOOK_SECRET=your_production_webhook_secret
STRIPE_SECRET_KEY=your_production_stripe_key (use test keys initially)
STRIPE_WEBHOOK_SECRET=your_production_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_production_stripe_publishable_key
```

**Preview Environment:** (Same as production but with staging/test keys)

### 3. Configure Branch Deployments:
- **Production**: `main` branch
- **Preview**: All other branches (automatic)

## 📋 Step 4: Set Up Git Worktrees

### Create Development Branch:
```bash
git checkout -b develop
git push -u origin develop
```

### Test Worktree Scripts:
```bash
# Make scripts executable (already done)
chmod +x scripts/*.sh

# List current worktrees
./scripts/worktree-list.sh

# Create a test worktree
./scripts/worktree-create.sh test-feature develop

# Switch to new worktree
cd ../ptsaplus-test-feature

# Start development server
./scripts/worktree-dev.sh

# When done, clean up
cd ../ptsaplus
./scripts/worktree-cleanup.sh ../ptsaplus-test-feature --delete-branch
```

## 📋 Step 5: Configure Development Workflow

### Recommended Workflow:
1. **Main Branch**: Production-ready code only
2. **Develop Branch**: Integration branch for features  
3. **Feature Branches**: Individual features using worktrees
4. **Pull Requests**: All changes go through PR review

### Example Development Flow:
```bash
# 1. Create feature worktree
./scripts/worktree-create.sh payment-integration develop

# 2. Work in the worktree
cd ../ptsaplus-payment-integration
# ... make changes ...

# 3. Commit and push
git add -A
git commit -m "feat: implement Stripe payment integration"
git push -u origin feature/payment-integration

# 4. Create PR via GitHub CLI or web interface
gh pr create --title "Add Stripe payment integration" --body "Implements payment processing for membership dues"

# 5. After PR is merged, clean up
cd ../ptsaplus
./scripts/worktree-cleanup.sh ../ptsaplus-payment-integration --delete-branch
```

## 📋 Step 6: Verify CI/CD Pipeline

### Push changes to trigger CI:
```bash
git add -A
git commit -m "chore: add CI/CD pipeline and development workflow"
git push origin main
```

### Check GitHub Actions:
1. Go to repository → Actions tab
2. Verify CI workflow runs successfully
3. Check for any failures and fix them

### Check Vercel Deployment:
1. Go to Vercel dashboard
2. Verify deployment succeeded
3. Test the deployed site

## 🔧 Development Tips

### Multiple Claude Instances:
```bash
# Terminal 1: Main development
cd /Users/allisonwhilden/Repos/ptsaplus
./scripts/worktree-dev.sh  # Port 3000

# Terminal 2: Feature development  
./scripts/worktree-create.sh new-feature develop
cd ../ptsaplus-new-feature
./scripts/worktree-dev.sh  # Port 3001 (auto-detected)
```

### Git Worktree Best Practices:
- Use descriptive feature names: `payment-stripe`, `member-dashboard`, `privacy-compliance`
- Always base feature branches on `develop`
- Clean up worktrees after PR merge
- Use `./scripts/worktree-list.sh` to track active worktrees

### Environment Management:
- Keep `.env.local` in each worktree
- Use different database/service instances for testing
- Never commit sensitive environment variables

## ✅ Verification Checklist

### GitHub Setup:
- [ ] Repository created and pushed
- [ ] Branch protection rules configured
- [ ] Secrets added for CI
- [ ] Issue templates working
- [ ] PR template appears on new PRs

### Vercel Setup:
- [ ] Project imported and deployed
- [ ] Environment variables configured
- [ ] Custom domain configured (if applicable)
- [ ] Preview deployments working for PRs

### Git Worktrees:
- [ ] Scripts are executable
- [ ] Can create worktrees successfully
- [ ] Can run dev servers on different ports
- [ ] Can clean up worktrees properly

### CI/CD Pipeline:
- [ ] GitHub Actions workflow running
- [ ] Linting and type checking passing
- [ ] Build succeeds on all branches
- [ ] Security scanning active
- [ ] Vercel deployments automatic

## 🚨 Troubleshooting

### Common Issues:

**Git Worktree Errors:**
```bash
# If worktree creation fails
git worktree prune  # Clean up orphaned worktrees
```

**Vercel Build Failures:**
- Check Node.js version (should be 18+)
- Verify pnpm is available in build environment
- Check environment variables are set correctly

**CI/CD Failures:**
- Check GitHub Actions logs for specific errors
- Verify all secrets are configured
- Check package.json scripts exist

**Port Conflicts:**
```bash
# Find and kill processes using ports
lsof -ti:3000 | xargs kill -9
```

Now you have a professional development setup with proper CI/CD, branch protection, and parallel development capabilities!