# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Project Status

**IMPORTANT**: This project is currently in the planning and documentation phase. No code has been implemented yet. When working on this project:
1. Always consult the comprehensive documentation in `/docs` before suggesting implementations
2. Ensure all suggestions align with the documented architecture and requirements
3. Target MVP launch is April 2025

## Project Overview

PTSA+ is a modern, AI-powered platform for Parent-Teacher-Student Associations designed to simplify operations for volunteer-run organizations while ensuring compliance with educational data privacy laws.

## Development Philosophy

### Documentation-First Approach
Before implementing any feature:
1. Review relevant documentation in `/docs`
2. Ensure alignment with documented requirements
3. Consider the comprehensive market research in `PTSA_Platform_Market_Research_2024.md`
4. Reference user personas in `/docs/03-user-personas-stories.md`

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

## Development Commands

### Project Setup
```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations  
pnpm db:migrate

# Start development server
pnpm dev
```

### Testing
```bash
# Run all unit tests
pnpm test

# Run specific test file
pnpm test -- path/to/test.spec.ts

# Run integration tests
pnpm test:integration  

# Run E2E tests
pnpm test:e2e

# Generate coverage report
pnpm test:coverage
```

### Database Management
```bash
# Create new migration
pnpm prisma migrate dev --name <migration_name>

# Apply migrations
pnpm prisma migrate deploy

# Reset database (development only)
pnpm prisma migrate reset

# Generate Prisma client
pnpm prisma generate
```

### Code Quality
```bash
# Run ESLint
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code with Prettier
pnpm format

# Type checking
pnpm type-check
```

### Build & Deploy
```bash
# Build for production
pnpm build

# Build Docker image
docker build -t ptsa-plus:latest .

# Run production build locally
pnpm start
```

## Planned Architecture

### System Design (Planned)
The platform will follow a microservices architecture with three main services:

1. **Core API Service** (NestJS/TypeScript)
   - Will handle user management, organizations, events, communications
   - Planned location: `/apps/api` (in monorepo structure)
   - Modular architecture with domain boundaries

2. **Payment Service** (NestJS/TypeScript) 
   - Isolated service for PCI compliance
   - Will handle all payment processing via Stripe
   - Planned location: `/apps/payment-api`

3. **AI Service** (Python/FastAPI)
   - Content generation, predictive analytics, NLP
   - Will use OpenAI GPT-4 and custom models
   - Planned location: `/apps/ai-service`

### Frontend Architecture (Planned)
- **Main Web App**: Next.js 14 PWA planned for `/apps/web`
- **Admin Portal**: Separate Next.js app planned for `/apps/admin`
- **Shared UI Components**: Will be in `/packages/ui`
- **State Management**: Zustand for client state, React Query for server state

### Data Flow (Planned)
1. All requests will go through AWS ALB (API Gateway)
2. Services will communicate via AWS SQS/SNS for async operations
3. PostgreSQL for primary data, Redis for caching/sessions
4. S3 for file storage

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

### AI Integration
- OpenAI API key required for AI features
- Implement caching for AI responses
- User consent required for AI-generated content
- Cost monitoring for API usage

## Key Documents to Review

Essential reading for understanding the project:
- `/docs/01-platform-overview.md` - Vision and differentiators
- `/docs/02-requirements-specification.md` - Detailed functional/non-functional requirements  
- `/docs/03-user-personas-stories.md` - Understanding our users
- `/docs/05-technical-architecture.md` - System design details
- `/docs/10-feature-specifications.md` - MVP and future features
- `/docs/mvp-features.md` - 3-month MVP scope
- `PTSA_Platform_Market_Research_2024.md` - Comprehensive market analysis

## Environment Variables

Required for development:
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
STRIPE_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
JWT_SECRET=...
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