# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Project Status

**IMPORTANT**: This project is currently in the planning and documentation phase. Development follows a risk-based approach as outlined in `/docs/month-1-development-plan.md`. When working on this project:
1. Start with the Month 1 development plan for immediate priorities
2. Focus on validating critical risks before building full infrastructure
3. Use simplified technology stack for rapid prototyping
4. Target MVP launch is April 2025

## Project Overview

PTSA+ is a modern, AI-powered platform for Parent-Teacher-Student Associations designed to simplify operations for volunteer-run organizations while ensuring compliance with educational data privacy laws.

## Development Philosophy

### Risk-Based Development
Prioritize validation over complete implementation:
1. **Payment Processing**: Validate Stripe integration and compliance first
2. **User Experience**: Ensure non-technical volunteers can use the platform
3. **Data Privacy**: Prove FERPA/COPPA compliance approach works
4. **AI Costs**: Confirm costs stay under $0.10/user/month
5. Build minimal prototypes to test assumptions before full implementation

### Documentation-First Approach
Before implementing any feature:
1. Review relevant documentation in `/docs`
2. Start with `/docs/month-1-development-plan.md` for current priorities
3. Ensure alignment with documented requirements
4. Consider the comprehensive market research in `PTSA_Platform_Market_Research_2024.md`
5. Reference user personas in `/docs/03-user-personas-stories.md`

### Volunteer-Centric Design
Remember the primary users are non-technical volunteers:
- Every feature must pass the "5-minute test" (learnable in 5 minutes)
- Provide clear help text and documentation
- Use familiar UI patterns
- Avoid technical jargon in user-facing content
- Design for high volunteer turnover (yearly board changes)

### AI Implementation Guidelines
When implementing AI features:
- Always require user consent for AI-generated content
- Implement caching to reduce API costs
- Provide human review options for critical content
- Monitor usage to prevent cost overruns
- Use AI to reduce volunteer workload, not add complexity

## Data Privacy Considerations

### Educational Data Handling
This platform handles sensitive student and family data. For every feature:
1. **FERPA Compliance**: Never expose student records without proper authorization
2. **COPPA Compliance**: Special handling for users under 13
3. **Data Minimization**: Only collect necessary information
4. **Privacy by Default**: Opt-in for data sharing, not opt-out
5. **Audit Trail**: Log all access to sensitive data

### Security First
- Never store PII in logs
- Implement field-level encryption for sensitive data
- Use role-based access control (RBAC) consistently
- Follow the security guidelines in `/docs/08-security-compliance.md`

## Success Metrics

### User Experience Validation
- **Registration Time**: < 2 minutes
- **Payment Completion**: < 60 seconds
- **5-Minute Test**: Pass for all core features
- **User Satisfaction**: 4+ star rating from volunteers

### Technical Validation
- **Payment Success Rate**: > 90%
- **AI Cost per User**: < $0.10/month
- **Page Load Time**: < 3 seconds on 3G
- **Uptime**: > 99%

### Business Validation
- **First PTSA Onboarded**: Week 4 of Month 1
- **10 PTSAs**: End of Month 1
- **User Activation Rate**: > 80%
- **Support Tickets**: < 5% of users

## Frontend Technology Requirements

**IMPORTANT**: The frontend uses this specific technology stack for consistency and rapid development:

### Required Frontend Stack
- **Framework**: Next.js 14 with TypeScript (App Router)
- **Primary UI Components**: shadcn/ui - Pre-built, accessible, customizable components
- **Styling**: Tailwind CSS v3.4.x (NOT v4 yet - see compatibility note below)
- **Icons**: Lucide React (included with shadcn/ui)
- **Forms**: React Hook Form + Zod for validation
- **State Management**: Zustand (lightweight) for client state
- **Data Fetching**: React Query (TanStack Query) for server state

### ⚠️ Tailwind CSS Version Compatibility
**IMPORTANT**: Use Tailwind CSS v3.4.x for this project
- shadcn/ui officially supports both v3 and v4, but v4 is still in alpha/beta
- Tailwind v4 requires modern browsers (Safari 16.4+, Chrome 111+, Firefox 128+)
- Many shadcn/ui community components may not work correctly with v4 yet
- Stay with v3.4.x for stability until v4 is fully stable and widely adopted

```json
// package.json - Correct versions
{
  "dependencies": {
    "tailwindcss": "^3.4.0",
    "tailwindcss-animate": "^1.0.7"
  }
}
```

### Component Library Strategy
1. **ALWAYS check shadcn/ui first** - It should solve 90%+ of UI needs
2. **If shadcn/ui doesn't have what you need**:
   - Document the specific requirement
   - Research alternatives (Radix UI primitives, Arco Design, Tremor for charts)
   - Present options with pros/cons
   - Get approval before implementing
3. **Custom components**: Only build if no suitable library exists
4. **Maintain consistency**: Any additional libraries must work well with Tailwind CSS

### Why This Stack?
1. **Next.js**: Server-side rendering, API routes, excellent DX
2. **shadcn/ui**: Beautiful, accessible components that can be customized
3. **Tailwind CSS**: Rapid styling, consistent design system, small bundle size
4. **TypeScript**: Type safety catches errors early

### Decision Process for UI Components
```
1. Need a UI component?
   ↓
2. Check shadcn/ui docs
   ↓
3. Found it? → Use it (customize if needed)
   ↓
4. Not found? → Document need and research alternatives
   ↓
5. Present plan for review before implementing
```

### Component Architecture
```tsx
// Example component structure using shadcn/ui
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function PaymentCard() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Pay Membership Dues</CardTitle>
      </CardHeader>
      <CardContent>
        <Button className="w-full" size="lg">
          Pay $15
        </Button>
      </CardContent>
    </Card>
  )
}
```

### Component Decision Template
When you need a component not in shadcn/ui, document it like this:
```markdown
## Component Need: [Component Name]
**Date**: [Date]
**Feature**: [What feature needs this]
**Requirement**: [Specific functionality needed]

### Options Considered:
1. **shadcn/ui solution**: [How close can we get with existing components]
2. **Alternative library**: [Name and pros/cons]
3. **Custom build**: [Effort estimate and maintenance implications]

### Recommendation: [Your choice with rationale]
### Decision: [To be filled after review]
```

## Month 1 Technology Stack

For rapid development and validation, use these managed services:

### Frontend (See detailed requirements above)
- **Framework**: Next.js 14 with TypeScript
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

### Backend
- **API**: Next.js API Routes (start simple)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Clerk
- **Payments**: Stripe Connect

### Infrastructure
- **Hosting**: Vercel
- **Redis**: Upstash
- **Monitoring**: Posthog + Sentry
- **AI**: OpenAI API with strict limits

## Development Commands

### Month 1 Setup
```bash
# Create new Next.js project with TypeScript
pnpm create next-app@latest ptsaplus --typescript --tailwind --app --src-dir --import-alias "@/*"
cd ptsaplus

# IMPORTANT: Verify Tailwind CSS version (should be v3.4.x)
pnpm list tailwindcss
# If v4 was installed, downgrade:
# pnpm remove tailwindcss postcss autoprefixer
# pnpm add tailwindcss@^3.4.0 postcss autoprefixer

# Initialize shadcn/ui
pnpm dlx shadcn-ui@latest init
# Select: TypeScript, Default style, Slate base color, CSS variables

# Install essential shadcn/ui components
pnpm dlx shadcn-ui@latest add button card form input label select 
pnpm dlx shadcn-ui@latest add dialog dropdown-menu toast avatar badge
pnpm dlx shadcn-ui@latest add table tabs separator skeleton

# Install additional dependencies
pnpm add @tanstack/react-query zustand react-hook-form zod
pnpm add @clerk/nextjs @supabase/supabase-js stripe
pnpm add -D @types/node

# Verify all versions are compatible
pnpm list tailwindcss tailwindcss-animate

# Environment setup
cp .env.example .env.local
# Add Clerk, Supabase, Stripe, OpenAI keys

# Start development
pnpm dev
```

### Testing
```bash
# Run all tests
pnpm test

# Run specific test
pnpm test -- path/to/test.spec.ts

# E2E tests
pnpm test:e2e
```

### Code Quality
```bash
# Linting
pnpm lint
pnpm lint:fix

# Type checking
pnpm type-check

# Format code
pnpm format
```

### Deployment
```bash
# Deploy to Vercel
vercel

# Preview deployment
vercel --preview
```

### Git Worktrees for Parallel Development

Use Git worktrees to run multiple Claude Code sessions simultaneously:

```bash
# List all active worktrees
./scripts/worktree-list.sh

# Create a new worktree (auto-generates branch name)
./scripts/worktree-create.sh feature/payment-flow
# Creates worktree at ../ptsaplus-payment-flow

# Create worktree with custom location
./scripts/worktree-create.sh feature/ai-chat ../custom-location

# Start development server (finds available port)
./scripts/worktree-dev.sh
# Automatically detects current worktree and starts on free port

# Clean up worktree and optionally delete branch
./scripts/worktree-cleanup.sh ../ptsaplus-payment-flow
# Prompts to delete remote branch if desired

# Port allocation strategy
# Main: 3000
# Worktree 1: 3001
# Worktree 2: 3002
# etc.
```

#### Benefits of Worktrees
- Run multiple features in parallel
- Test different approaches simultaneously
- Keep main branch stable
- Avoid context switching overhead
- Each Claude Code instance has its own workspace

## Architecture Evolution

### Phase 1: Modular Monolith (Months 1-3)
Start with a single Next.js application:
- API routes for backend logic
- Modular code organization
- Clear domain boundaries
- Prepared for future extraction

### Phase 2: Service Extraction (Months 4-6)
Extract services as needed:
1. **Payment Service**: When PCI compliance requires isolation
2. **AI Service**: When Python-based ML models are added
3. **Communication Service**: When email volume requires dedicated handling

### Phase 3: Full Microservices (Months 7+)
Implement planned architecture:
- Core API (NestJS)
- Payment API (NestJS)
- AI Service (FastAPI)
- Event-driven communication (AWS SQS/SNS)

## Key Design Patterns

### API Design
- RESTful endpoints with consistent naming
- JWT authentication with refresh tokens
- Standardized error responses
- Pagination for list endpoints
- Rate limiting per user/IP

### Security Patterns
- Role-based access control (RBAC)
- Data encryption at rest and in transit
- COPPA/FERPA compliance built into data models
- Audit logging for sensitive operations

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Minimum 80% code coverage requirement

## Development Workflow

### Git Flow
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Emergency fixes

### Commit Standards
Format: `<type>(<scope>): <subject>`

Types: feat, fix, docs, style, refactor, test, chore

### Pull Request Process
1. Create feature branch from develop
2. Make changes with proper commits
3. Ensure all tests pass
4. Submit PR with template
5. Requires 2 approvals
6. Squash merge to develop

## Important Considerations

### Compliance Requirements
- All features must consider FERPA (student data privacy)
- COPPA compliance for users under 13
- PCI DSS for payment processing
- State-specific student privacy laws

### Performance Targets
- Page load time < 3 seconds on 3G
- API response time < 200ms (p95)
- Support 10,000 concurrent users
- 99.9% uptime SLA

### Mobile-First Development
- All features must work on mobile devices
- PWA functionality is critical
- Offline capability for key features
- Touch-friendly UI elements

### UI/UX Design Guidelines
- **Component Library**: Start with shadcn/ui components (check first for every need)
- **Styling**: Use Tailwind CSS classes as primary styling method
- **Consistency**: Follow shadcn/ui's design patterns and conventions
- **Customization**: Extend components in `/components/ui` when needed
- **Accessibility**: shadcn/ui components are accessible by default - maintain this
- **Responsive**: Use Tailwind's responsive prefixes (sm:, md:, lg:)
- **Theme**: Use CSS variables for colors to support dark mode

### When shadcn/ui Isn't Enough
If you need a component that shadcn/ui doesn't provide:
1. **Document the gap**: What specific functionality is missing?
2. **Research options**:
   - Can you compose existing shadcn/ui components?
   - Is there a Radix UI primitive to build on?
   - Are there Tailwind-compatible alternatives?
3. **Present findings**: Show options with trade-offs
4. **Get approval**: Review the plan before implementing
5. **Document decision**: Add to project decisions log

### AI Integration
- OpenAI API key required for AI features
- Implement caching for AI responses
- User consent required for AI-generated content
- Cost monitoring for API usage

## Key Documents to Review

Essential reading for understanding the project:
- `/docs/month-1-development-plan.md` - **START HERE** - Risk-based development approach
- `/docs/01-platform-overview.md` - Vision and differentiators
- `/docs/02-requirements-specification.md` - Detailed functional/non-functional requirements  
- `/docs/03-user-personas-stories.md` - Understanding our users
- `/docs/05-technical-architecture.md` - Long-term system design
- `/docs/10-feature-specifications.md` - MVP and future features
- `/docs/mvp-features.md` - 3-month MVP scope
- `PTSA_Platform_Market_Research_2024.md` - Comprehensive market analysis

## Environment Variables

Required for Month 1 development:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Special Considerations

### Seasonal Usage
- Peak usage: August-September (back to school)
- Major fundraising: October-November, March-April
- Plan deployments to avoid these periods

### User Support
- Remember: Users are volunteers with limited time
- Provide extensive documentation
- Design self-service features
- Quick resolution is critical during events

### Development Priorities
1. Validate payment processing works
2. Ensure privacy controls are effective
3. Confirm AI costs are sustainable
4. Prove volunteers can use the platform
5. Then build additional features