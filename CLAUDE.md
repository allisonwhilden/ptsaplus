# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Project Status

**IMPORTANT**: This project has successfully pivoted from a multi-tenant PTSA+ platform to a single PTSA solution and is now deployed to production at https://ptsaplus.vercel.app. Development follows a risk-based approach as outlined in `/docs/month-1-development-plan.md`.

### Completed Features (as of January 2025)
✅ User authentication (Clerk integration)
✅ Member registration and management
✅ Role-based access control (admin, board, committee_chair, member, teacher)
✅ Privacy-compliant data handling (FERPA/COPPA considerations)
✅ Basic admin dashboard
✅ Member directory with privacy controls
✅ Production deployment to Vercel
✅ CI/CD pipeline with GitHub integration
✅ **Payment processing (Stripe integration) - Completed Jan 8**
  - Secure payment collection for membership dues ($15, $25, $50, custom)
  - PCI DSS compliant implementation (no card data touches servers)
  - Comprehensive security measures:
    - Idempotency keys prevent duplicate charges
    - Input validation with amount limits ($1-100 membership, $1-1000 donations)
    - Rate limiting (5 req/min per user, 10 per IP)
    - Webhook signature verification
    - Comprehensive audit logging
  - API Endpoints:
    - `POST /api/payments/create-payment-intent` - Create payment for membership
    - `POST /api/webhooks/stripe` - Handle Stripe webhook events
  - Payment page: `/membership/pay`
  - Guest checkout support (no authentication required)
  - Full test coverage including Stripe test card scenarios:
    - Success: 4242 4242 4242 4242
    - Decline: 4000 0000 0000 0002
    - 3D Secure: 4000 0025 0000 3155
  - Implementation based on payment-auditor agent recommendations
✅ **Event Management System - Completed Jan 9**
  - Complete event creation, listing, and management
  - Event types: meetings, fundraisers, volunteer opportunities, social, educational
  - Location support: in-person, virtual, hybrid
  - RSVP system with guest count management
  - Volunteer slot creation and signup
  - Capacity management with automatic waitlist
  - Privacy controls: public, members-only, board-only visibility
  - Calendar view for browsing events by month
  - Form validation with required field indicators
  - API Endpoints:
    - `GET /api/events` - List events with filtering
    - `POST /api/events` - Create event (board/admin only)
    - `GET /api/events/[id]` - Get event details
    - `PUT /api/events/[id]` - Update event
    - `DELETE /api/events/[id]` - Delete event
    - `POST /api/events/[id]/rsvp` - RSVP to event
    - `POST /api/events/volunteer-signup` - Sign up for volunteer slot
  - Pages:
    - `/events` - Event list view
    - `/events/calendar` - Calendar view
    - `/events/new` - Create event (board/admin)
    - `/events/[id]` - Event details
    - `/events/[id]/edit` - Edit event
  - Implementation validated with volunteer-advocate for usability

### In Progress
🔄 Email communications
🔄 AI-assisted features
🔄 Payment reporting and treasurer dashboard

### When working on this project:
1. Build on the existing foundation - authentication and member management are complete
2. Focus on validating remaining critical risks (payments, AI costs)
3. Continue using the simplified technology stack for rapid development
4. Target MVP completion is April 2025

## Project Overview

PTSA Platform (originally PTSA+) is a modern, AI-powered platform for a single Parent-Teacher-Student Association designed to simplify operations for volunteer-run organizations while ensuring compliance with educational data privacy laws. The project has pivoted from a multi-tenant SaaS approach to focus on building a robust solution for a single PTSA, with the architecture designed to potentially scale to multiple PTSAs in the future.

## Development Philosophy

### Risk-Based Development
Prioritize validation over complete implementation:
1. **Payment Processing**: Validate Stripe integration and compliance first
   - Risk checkpoint: Can process test payment successfully?
   - Agent: Consult `payment-auditor` before proceeding
2. **User Experience**: Ensure non-technical volunteers can use the platform
   - Risk checkpoint: Does feature pass 5-minute test?
   - Agent: Consult `volunteer-advocate` for validation
3. **Data Privacy**: Prove FERPA/COPPA compliance approach works
   - Risk checkpoint: Are consent flows implemented?
   - Agent: Consult `privacy-guardian` for compliance
4. **AI Costs**: Confirm costs stay under $0.10/user/month
   - Risk checkpoint: Is caching implemented? Cost projections verified?
   - Agent: Consult `ai-economist` for optimization
5. Build minimal prototypes to test assumptions before full implementation

**IMPORTANT**: Each risk must be validated with appropriate agent consultation before moving to full implementation.

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

## Specialized Agents Available

The following specialized agents are configured to assist with PTSA+ development. Use them proactively:

### privacy-guardian
- **When to use**: Implementing features that handle student/family data, reviewing data models, creating consent flows
- **Examples**: User registration, grade storage, family contact info, FERPA compliance checks

### payment-auditor
- **When to use**: Any code touching payment processing, Stripe integration, financial transactions
- **Examples**: Membership dues collection, fundraising features, payment webhooks

### ai-economist
- **When to use**: Implementing AI features, OpenAI API usage, designing caching strategies
- **Examples**: Newsletter generation, meeting summaries, monitoring AI costs

### volunteer-advocate
- **When to use**: Designing user flows, creating documentation, reviewing UX decisions
- **Examples**: Registration flow design, help documentation, 5-minute test validation

### arch-reviewer
- **When to use**: Creating new modules, planning service boundaries, architectural decisions
- **Examples**: New feature modules, service extraction planning, modular monolith patterns

### perf-optimizer
- **When to use**: Analyzing performance, mobile optimization, database query reviews
- **Examples**: Slow page loads, bundle size optimization, handling 10,000 concurrent users

### test-enforcer
- **When to use**: After implementing features, reviewing test coverage, critical path testing
- **Examples**: Payment flow tests, privacy control tests, authentication tests

### Agent Decision Priority
When multiple agents apply, use this priority order:
1. privacy-guardian (compliance is non-negotiable)
2. payment-auditor (financial security critical)
3. volunteer-advocate (user experience paramount)
4. Others as needed

### Agent Invocation Triggers

Claude should proactively suggest agent consultation when detecting these patterns:

#### Code Pattern Triggers
- **privacy-guardian**: 
  - Keywords: `user`, `student`, `child`, `family`, `email`, `phone`, `address`, `grade`
  - Database operations on: `users`, `students`, `families`, `members` tables
  - Creating forms that collect personal information
  - Example: "Let me add a field for student grade level" → "I should consult privacy-guardian first"

- **payment-auditor**:
  - Keywords: `stripe`, `payment`, `charge`, `refund`, `subscription`, `invoice`
  - Files: Any file containing `stripe` imports or payment-related API routes
  - Example: "Implementing the membership dues form" → "I'll consult payment-auditor for this payment flow"

- **ai-economist**:
  - Keywords: `openai`, `gpt`, `completion`, `embedding`, `ai`, `llm`
  - Imports: `import OpenAI` or similar AI libraries
  - Example: "Creating email draft generator" → "Let me consult ai-economist for cost optimization"

- **volunteer-advocate**:
  - Creating any new user-facing component or page
  - Modifying registration or onboarding flows
  - Writing help text or documentation
  - Example: "Building the event signup form" → "I'll check with volunteer-advocate for usability"

#### Automatic Invocation Rules
1. **Before Implementation**: Consult relevant agents during planning
2. **After Implementation**: Run test-enforcer and perf-optimizer
3. **During PR Creation**: List all agent consultations in PR description

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

## Security Implementation Patterns

Based on the payment integration implementation, use these patterns for all sensitive features:

### 1. Idempotency Keys for Financial Operations
```typescript
// Generate unique idempotency key for each operation
const idempotencyKey = `${operationType}_${userId}_${amount}_${timestamp}`;

// Use with Stripe or other payment providers
const result = await stripe.paymentIntents.create(
  { amount, currency: 'usd', ... },
  { idempotencyKey }
);
```

### 2. Rate Limiting Configuration
```typescript
// Configure per-user and per-IP limits
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,      // per user
  maxRequestsPerIP: 10 // per IP address
};

// Apply to sensitive endpoints
return withRateLimit(request, handler, userId);
```

### 3. Comprehensive Audit Logging
```typescript
// Log all security-sensitive operations
export function logPaymentOperation(event: {
  type: string;
  userId: string;
  amount: number;
  metadata?: Record<string, any>;
}) {
  console.log(JSON.stringify({
    event: event.type,
    userId: event.userId,
    amount: event.amount,
    timestamp: new Date().toISOString(),
    metadata: event.metadata,
    level: 'audit',
    service: 'payment',
    environment: process.env.NODE_ENV,
  }));
}
```

### 4. Secure Error Handling
```typescript
// Never expose internal errors to users
export function createSecureErrorResponse(error: unknown) {
  // Log full error internally
  console.error('Internal error:', error);
  
  // Return generic message to user
  if (error instanceof ValidationError) {
    return { error: error.message, status: 400 };
  }
  
  return { 
    error: 'An error occurred. Please try again.',
    status: 500 
  };
}
```

### 5. Input Validation with Strict Limits
```typescript
// Validate all user inputs with appropriate limits
export function validatePaymentAmount(
  amount: number, 
  type: 'membership' | 'donation'
): void {
  const limits = {
    membership: { min: 100, max: 10000 },    // $1-$100
    donation: { min: 100, max: 100000 }      // $1-$1000
  };
  
  const { min, max } = limits[type];
  
  if (amount < min || amount > max) {
    throw new ValidationError(
      `Amount must be between $${min/100} and $${max/100}`
    );
  }
}
```

### 6. Webhook Security
```typescript
// Always verify webhook signatures
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const event = await stripe.webhooks.constructEvent(
    payload,
    signature,
    secret
  );
  return true; // Throws if invalid
}
```

### When to Apply These Patterns
- **Financial Operations**: All patterns
- **User Data Updates**: Audit logging, validation, secure errors
- **API Endpoints**: Rate limiting, validation
- **Third-party Integrations**: Webhook security, idempotency
- **Admin Actions**: Comprehensive audit logging

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
- **Platform Deployment**: ✅ Completed (https://ptsaplus.vercel.app)
- **Core Features**: Member management operational
- **User Activation Rate**: > 80% (target)
- **Support Tickets**: < 5% of users (target)

## Agent Usage Guidelines

### When to Use Multiple Agents
Some features require multiple agent perspectives:

#### User Registration Flow
1. `privacy-guardian`: COPPA compliance, data collection
2. `volunteer-advocate`: Ease of use, time to complete
3. `test-enforcer`: Edge case coverage

#### Payment Features
1. `payment-auditor`: Security and PCI compliance
2. `perf-optimizer`: Transaction speed
3. `test-enforcer`: Payment failure scenarios

#### AI Features
1. `ai-economist`: Cost optimization
2. `privacy-guardian`: User consent flows
3. `arch-reviewer`: Service boundaries

### Agent Conflict Resolution
When agents provide conflicting advice:
1. **Compliance always wins** (privacy-guardian, payment-auditor)
2. **User experience next** (volunteer-advocate)
3. **Technical excellence last** (arch-reviewer, perf-optimizer)

Document conflicts and resolutions for future reference.

### Agent Consultation Documentation

When consulting agents, document the outcomes:

#### In Code Comments
```typescript
// Implemented based on payment-auditor recommendations:
// - Added idempotency keys to prevent duplicate charges
// - Rate limiting: 5 requests/minute per user
// - Webhook signature verification for security
const paymentIntent = await createPaymentIntent({...});
```

#### In PR Descriptions
```markdown
## Agent Consultations
- **payment-auditor**: Implemented all security recommendations
  - ✅ Idempotency keys for payment operations
  - ✅ Input validation with strict limits
  - ✅ Rate limiting configuration
  - ✅ Audit logging for all payment events
- **volunteer-advocate**: Simplified payment flow
  - ✅ Guest checkout option added
  - ✅ Clear error messages for common issues
```

#### Tracking Template
```markdown
## Agent: [agent-name]
**Date**: [consultation date]
**Feature**: [feature being reviewed]

### Recommendations:
1. [First recommendation]
2. [Second recommendation]

### Implementation Status:
- ✅ [Implemented recommendation]
- ❌ [Not implemented - reason]
- 🔄 [Partially implemented - details]

### Notes:
[Any additional context or decisions made]
```

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

### Component Decision Documentation

All non-shadcn/ui component decisions must be documented:

1. **Location**: `/docs/decisions/components/[date]-[component-name].md`
2. **Template**: Use the component decision template
3. **Review**: Requires arch-reviewer agent consultation
4. **Tracking**: Update `/docs/decisions/README.md` index

Example workflow:
```bash
# Need a chart component not in shadcn/ui
1. Check shadcn/ui docs ❌ Not available
2. Create decision doc: /docs/decisions/components/2024-01-15-chart-library.md
3. Consult arch-reviewer agent
4. Research options (Recharts, Tremor, Victory)
5. Document recommendation
6. Get approval before implementing
```

## Month 1 Technology Stack

For rapid development and validation, use these managed services:

### Frontend (Implemented)
- **Framework**: Next.js 15.4.4 with TypeScript ✅
- **UI Components**: shadcn/ui ✅
- **Styling**: Tailwind CSS v3.4.17 ✅
- **Deployment**: Vercel ✅

### Backend (Implemented/In Progress)
- **API**: Next.js API Routes ✅
- **Database**: Supabase (PostgreSQL) ✅
- **Auth**: Clerk ✅
- **Payments**: Stripe Connect 🔄

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
cp app/.env.example app/.env.local
# Add Clerk, Supabase, Stripe, OpenAI keys

# Start development
pnpm dev
```

### Testing
```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test:unit        # Unit tests with Jest
pnpm test:integration # API integration tests
pnpm test:e2e        # End-to-end tests with Playwright

# Check coverage (must be >= 80%)
pnpm test:coverage

# Watch mode for development
pnpm test:watch
```

### Testing Best Practices
```bash
# Run targeted tests when debugging specific issues
pnpm test path/to/test.test.ts
pnpm test -t "test name pattern"

# Check test results efficiently
pnpm test 2>&1 | grep -A2 "Test Suites:"  # Quick summary
pnpm test --verbose 2>&1 | grep "✕"       # Find failures

# Debug specific test failures
pnpm test path/to/failing.test.ts -t "specific test" --verbose

# Clear test caches when tests behave unexpectedly
jest --clearCache
```

When to use each approach:
- Full test suite: Before committing or creating PRs
- Targeted tests: When working on specific features
- Test summary: Quick health check during development
- Verbose single test: Debugging specific failures

### Testing Stack
- **Unit Testing**: Jest + React Testing Library
- **Integration Testing**: Jest with Supertest
- **E2E Testing**: Playwright
- **Coverage**: Jest built-in coverage (istanbul)

### Coverage Requirements
```json
// jest.config.js
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
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
**IMPORTANT**: Always work from the `develop` branch, not `main`.

- `main`: Production-ready code (auto-deploys to production)
- `develop`: Integration branch (auto-deploys to preview)
- `feature/*`: New features (branch from develop)
- `bugfix/*`: Bug fixes (branch from develop)
- `hotfix/*`: Emergency fixes (branch from main, merge to both main and develop)

### Starting New Work
```bash
# Use worktree script (recommended)
./scripts/worktree-create.sh payment-integration  # Creates feature/payment-integration from develop

# Or manually
git checkout develop
git pull origin develop
git checkout -b feature/payment-integration
```

See `/docs/git-workflow.md` for complete Git workflow documentation.

### Development Process with Agent Checkpoints
1. **Planning Phase**
   - Consult `volunteer-advocate` for UX design
   - Consult `arch-reviewer` for architectural decisions

2. **Implementation Phase**
   - Consult `privacy-guardian` before handling user data
   - Consult `payment-auditor` before payment code
   - Consult `ai-economist` before AI features

3. **Review Phase**
   - Run `test-enforcer` for test coverage
   - Run `perf-optimizer` for performance issues

4. **Pre-Commit Checklist**
   - Relevant agent consultations complete
   - Tests passing (80% coverage minimum)
   - Lint and type checks pass

### Agent Consultation Matrix

| Action | Required Agents | When |
|--------|----------------|------|
| Creating new API endpoint | privacy-guardian (if user data), arch-reviewer | Before implementation |
| Adding database table | privacy-guardian, arch-reviewer | During schema design |
| Implementing payment feature | payment-auditor, test-enforcer | Before and after coding |
| Building new UI component | volunteer-advocate, ui-consistency* | Before implementation |
| Adding AI feature | ai-economist, privacy-guardian | During planning |
| Optimizing performance | perf-optimizer | After implementation |
| Writing tests | test-enforcer | After feature completion |
| Deploying to production | All relevant agents | During PR review |

*Note: ui-consistency agent not yet configured but planned

### Commit Standards
Format: `<type>(<scope>): <subject>`

Types: feat, fix, docs, style, refactor, test, chore

### Pull Request Process
1. Create feature branch from develop
2. Make changes with proper commits
3. Consult relevant agents based on changes
4. Ensure all tests pass
5. Submit PR with template (include agent consultations)
6. Requires 2 approvals
7. Squash merge to develop

### Feature Completion Workflow
When a feature is complete:

1. **Run Final Checks**:
   ```bash
   pnpm test              # All tests must pass
   pnpm lint:fix          # Fix any linting issues
   pnpm type-check        # No TypeScript errors
   ```

2. **Update Documentation**:
   - Update CLAUDE.md if feature adds new capabilities
   - Document any new API endpoints or components
   - Update environment variables if needed

3. **Create Pull Request**:
   ```bash
   git push -u origin feature/your-feature
   gh pr create --title "feat: your feature description" \
     --body "## Summary
     - What was implemented
     
     ## Agent Consultations
     - Document all agent consultations
     
     ## Testing
     - Describe test coverage"
   ```

4. **Post-Merge Tasks**:
   - Update project status in CLAUDE.md
   - Close related issues
   - Plan next features based on risk validation

### Example PR Description
```markdown
## Summary
- Implemented Stripe payment processing for membership dues
- Added secure payment collection with PCI DSS compliance
- Created guest checkout flow

## Agent Consultations
- **payment-auditor**: Implemented all 7 security recommendations
  - ✅ Idempotency keys for payment operations
  - ✅ Input validation with strict limits
  - ✅ Rate limiting (5/min per user, 10/min per IP)
  - ✅ Webhook signature verification
  - ✅ Comprehensive audit logging
  - ✅ Secure error handling
  - ✅ HTTPS enforcement in production

## Testing
- Unit tests: Payment validation, error handling
- Integration tests: API endpoints, webhooks
- Component tests: All Stripe test card scenarios
- Coverage: 95% for payment modules

## Checklist
- [x] Tests passing
- [x] Documentation updated
- [x] Agent recommendations implemented
- [x] Security review complete
```

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

### Performance Monitoring Tools

#### Development Monitoring
```bash
# Bundle size analysis
pnpm analyze

# Lighthouse CI (run before commits)
pnpm lighthouse

# Web Vitals monitoring
# Automatically tracked via Vercel Analytics
```

#### Performance Budget
```json
// .lighthouserc.js
{
  "ci": {
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 3000}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "total-bundle-size": ["error", {"maxNumericValue": 300000}]
      }
    }
  }
}
```

#### Monitoring Dashboard
- **Vercel Analytics**: Core Web Vitals
- **Sentry**: Performance monitoring
- **Custom Dashboard**: `/admin/performance` (Week 3 deliverable)

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

Required environment variables (configured in Vercel):
```
# Supabase ✅
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Clerk ✅
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Stripe ✅
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# OpenAI (when implementing AI features)
OPENAI_API_KEY=

# Upstash Redis (when implementing caching)
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