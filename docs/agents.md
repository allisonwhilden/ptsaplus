# Specialized AI Agents Documentation

This document describes the specialized AI agents configured for PTSA+ development. Use them proactively to ensure code quality, security, and usability.

## Agent Descriptions

### 🔒 privacy-guardian
**Purpose**: Ensure compliance with educational data privacy laws (FERPA, COPPA, GDPR)

**When to use**:
- Implementing features that handle student/family data
- Reviewing data models and API endpoints
- Creating consent flows or privacy controls
- Auditing existing code for compliance issues

**Example triggers**:
- Creating user registration forms
- Storing student grades or contact information
- Building parental consent workflows
- Implementing data export/deletion features

**Priority**: HIGHEST - Compliance is non-negotiable

### 💳 payment-auditor
**Purpose**: Ensure secure payment processing and PCI DSS compliance

**When to use**:
- Implementing payment flows
- Reviewing financial transaction code
- Setting up Stripe integrations
- Auditing security of payment-related features

**Example triggers**:
- Membership dues collection
- Fundraising features
- Payment webhook handlers
- Stripe Connect setup

**Priority**: HIGHEST - Financial security is critical

### 💰 ai-economist
**Purpose**: Optimize AI costs to stay under $0.10/user/month target

**When to use**:
- Implementing AI-powered features
- Reviewing OpenAI API usage patterns
- Designing caching strategies for AI responses
- Calculating cost projections for new AI features

**Example triggers**:
- Newsletter generation with GPT
- Meeting summary creation
- Automated thank-you notes
- Event recommendations

**Priority**: HIGH - Cost overruns could kill the project

### 👥 volunteer-advocate
**Purpose**: Ensure features pass the "5-minute test" for non-technical volunteers

**When to use**:
- Designing user flows
- Creating documentation
- Reviewing UX decisions
- Testing usability

**Example triggers**:
- Registration flow design
- Help documentation writing
- Form complexity assessment
- Mobile interface design

**Priority**: HIGH - User adoption depends on ease of use

### 🏗️ arch-reviewer
**Purpose**: Ensure proper modular monolith architecture

**When to use**:
- Creating new modules or features
- Reviewing architectural decisions
- Planning service boundaries
- Checking scalability concerns

**Example triggers**:
- New feature module creation
- Service extraction planning
- Database schema design
- API structure decisions

**Priority**: MEDIUM - Important for long-term maintainability

### ⚡ perf-optimizer
**Purpose**: Ensure performance targets are met (< 3s load time on 3G)

**When to use**:
- Analyzing performance bottlenecks
- Mobile optimization
- Database query reviews
- Bundle size optimization

**Example triggers**:
- Slow page loads
- Large data displays
- Complex database queries
- Mobile performance issues

**Priority**: MEDIUM - Critical for user experience

### ✅ test-enforcer
**Purpose**: Ensure comprehensive test coverage (>= 80%)

**When to use**:
- After implementing new features
- During code reviews
- For critical paths (payments, privacy, auth)

**Example triggers**:
- Payment flow implementation
- Privacy control features
- Authentication system changes
- API endpoint creation

**Priority**: HIGH - Essential for production stability

### 🎨 ui-consistency
**Purpose**: Maintain consistent UI/UX using shadcn/ui components

**When to use**:
- Creating new UI components or pages
- Reviewing UI code for consistency
- Finding the right shadcn/ui component
- Checking accessibility compliance

**Example triggers**:
- New page creation
- Form implementation
- Dashboard components
- Mobile interface design

**Priority**: MEDIUM - Important for professional appearance

## Agent Consultation Matrix

| Action | Required Agents | When |
|--------|----------------|------|
| Creating new API endpoint | privacy-guardian (if user data), arch-reviewer | Before implementation |
| Adding database table | privacy-guardian, arch-reviewer | During schema design |
| Implementing payment feature | payment-auditor, test-enforcer | Before and after coding |
| Building new UI component | volunteer-advocate, ui-consistency | Before implementation |
| Adding AI feature | ai-economist, privacy-guardian | During planning |
| Optimizing performance | perf-optimizer | After implementation |
| Writing tests | test-enforcer | After feature completion |
| Deploying to production | All relevant agents | During PR review |

## Mandatory Consultations

### CRITICAL: These consultations are NOT optional

| Feature Type | Required Agent | Why It's Mandatory |
|-------------|---------------|-------------------|
| User Data Handling | privacy-guardian | Prevent FERPA/COPPA violations |
| Payment Processing | payment-auditor | Ensure PCI compliance |
| Child Accounts (<13) | privacy-guardian | COPPA compliance required |
| AI Features | ai-economist | Prevent cost overruns |
| User Interfaces | volunteer-advocate | Ensure 5-minute test passes |
| Database Changes | privacy-guardian | Prevent data exposure |
| API Endpoints | test-enforcer | Ensure security coverage |
| Production Deploy | ALL relevant agents | Comprehensive review |

## Agent Conflict Resolution

When agents provide conflicting advice:
1. **Compliance always wins** (privacy-guardian, payment-auditor)
2. **User experience next** (volunteer-advocate)
3. **Technical excellence last** (arch-reviewer, perf-optimizer)

Document conflicts and resolutions for future reference.

## Consultation Documentation

### In Code Comments
```typescript
// Implemented based on payment-auditor recommendations:
// - Added idempotency keys to prevent duplicate charges
// - Rate limiting: 5 requests/minute per user
// - Webhook signature verification for security
```

### In PR Descriptions
```markdown
## Agent Consultations
- **payment-auditor**: Implemented all security recommendations
  - ✅ Idempotency keys for payment operations
  - ✅ Input validation with strict limits
  - ✅ Rate limiting configuration
```

### Tracking Template
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
```

## Agent Invocation Commands

Agents should be invoked proactively when their triggers are detected. Use the Task tool with the appropriate `subagent_type`:

- `privacy-guardian`
- `payment-auditor`
- `ai-economist`
- `volunteer-advocate`
- `arch-reviewer`
- `perf-optimizer`
- `test-enforcer`
- `ui-consistency`

## Success Metrics

Track agent consultation effectiveness:
- Compliance violations prevented: 0 (target)
- Security vulnerabilities found: Track and fix
- Cost overruns prevented: Stay under $0.10/user/month
- UX issues identified: Fix before release
- Test coverage maintained: >= 80%