# Vercel + pnpm Monorepo Performance Optimization Guide

## Quick Fixes for Deployment Failures

### 1. Environment Variables in Vercel Dashboard
Add these to your Vercel project settings:
```
PNPM_VERSION=9.0.0
NODE_VERSION=18
ENABLE_EXPERIMENTAL_COREPACK=1
```

### 2. Build & Development Settings in Vercel
- Framework Preset: Next.js
- Root Directory: `app`
- Build Command: `cd .. && pnpm run build`
- Install Command: `cd .. && pnpm install --frozen-lockfile`
- Output Directory: `.next`

## Performance Optimizations Applied

### 1. **pnpm Configuration** (`.npmrc`)
- `shamefully-hoist=true` - Improves compatibility with Vercel
- `prefer-frozen-lockfile=true` - Faster installs
- `package-import-method=copy` - Better for Vercel's file system

### 2. **Build Optimizations** (`next.config.ts`)
- Parallel compilation enabled
- Package imports optimized for tree-shaking
- Standalone output for smaller deployments
- Source maps disabled in production

### 3. **Monorepo Structure**
- Proper workspace configuration
- Filtered commands for targeted builds
- Shared dependencies hoisted to root

## Monitoring Build Performance

### Expected Build Times
- Initial build: 2-4 minutes
- Subsequent builds (with cache): 45-90 seconds
- Cold start: < 50ms

### Build Size Targets
- JavaScript bundle: < 250KB (gzipped)
- First Load JS: < 85KB
- Total deployment size: < 50MB

## Troubleshooting Slow Builds

### 1. Check Vercel Build Logs for:
- "Installing dependencies" duration
- "Building application" duration
- Cache hit/miss messages

### 2. Common Issues:
- **Missing pnpm-lock.yaml**: Always commit this file
- **Large dependencies**: Check bundle analyzer
- **Unoptimized images**: Use next/image
- **Too many API routes**: Consider edge functions

### 3. Advanced Optimizations:
```javascript
// For extremely large projects, consider:
// 1. Incremental Static Regeneration (ISR)
// 2. Edge Runtime for API routes
// 3. Middleware for auth instead of API routes
```

## Vercel-Specific Environment Optimizations

### Add to Vercel Environment Variables:
```
# Turbo build cache (if you add Turborepo later)
TURBO_TOKEN=your-token
TURBO_TEAM=your-team

# Node.js memory for large builds
NODE_OPTIONS=--max-old-space-size=4096

# pnpm specific
PNPM_DEDUPE_PEER_DEPENDENTS=false
```

## Bundle Analysis

To identify what's making your builds slow:

1. Add to `package.json`:
```json
"analyze": "ANALYZE=true pnpm build"
```

2. Install bundle analyzer:
```bash
pnpm add -D @next/bundle-analyzer
```

3. Update `next.config.ts`:
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
module.exports = withBundleAnalyzer(nextConfig)
```

## Caching Strategy

### Vercel automatically caches:
- `node_modules` (based on lockfile)
- `.next/cache` (build cache)
- pnpm store (with proper configuration)

### To maximize cache hits:
1. Don't change `pnpm-lock.yaml` unnecessarily
2. Use exact versions in package.json
3. Avoid dynamic imports in critical paths

## Performance Monitoring

### Set up monitoring for:
1. **Build Times**: Track in Vercel Analytics
2. **Bundle Size**: Use Vercel's bundle analysis
3. **Core Web Vitals**: Monitor LCP, FID, CLS
4. **API Response Times**: < 200ms target

## Emergency Rollback

If deployments are still failing:

1. **Simplified vercel.json**:
```json
{
  "buildCommand": "cd app && pnpm build",
  "installCommand": "cd app && pnpm install",
  "framework": "nextjs"
}
```

2. **Remove monorepo temporarily**:
- Move app contents to root
- Deploy as single Next.js app
- Add monorepo structure later

## Future Scalability

As your project grows, consider:

1. **Turborepo**: For better monorepo builds
2. **Remote Caching**: Share build cache across team
3. **Incremental Builds**: Only rebuild changed packages
4. **Edge Functions**: For geo-distributed performance

Remember: Start simple, optimize based on actual metrics, not assumptions.
EOF < /dev/null