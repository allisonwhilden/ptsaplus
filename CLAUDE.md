# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Project Status

**🎉 MVP COMPLETE as of August 13, 2024!** 

The PTSA+ platform is now deployed to production at https://ptsaplus.vercel.app with all core features implemented and ready for use by real PTSAs.

## Quick Reference

### 📚 Documentation Structure
- **Feature Documentation**: `/docs/features/` - Detailed docs for each completed feature
- **Agent Guide**: `/docs/agents.md` - When and how to use specialized AI agents
- **Security Patterns**: `/docs/security-patterns.md` - Required security implementations
- **Project Status**: `/PROJECT_STATUS.md` - Detailed completion tracking

### ✅ Completed Features
All features are 100% complete. See individual documentation:
- [Payment Processing](/docs/features/payment-processing.md) - Stripe integration
- [Event Management](/docs/features/event-management.md) - Events, RSVP, volunteers
- [Privacy & Compliance](/docs/features/privacy-compliance.md) - FERPA/COPPA/GDPR
- [Communication System](/docs/features/communication-system.md) - Email, announcements
- [Dashboard & Analytics](/docs/features/dashboard-analytics.md) - Role-based dashboards

## Project Overview

PTSA Platform is a comprehensive management system for Parent-Teacher-Student Associations, designed to simplify operations for volunteer-run organizations while ensuring compliance with educational data privacy laws.

### Key Achievements
- ✅ All critical risks validated (payments, privacy, UX, performance)
- ✅ 5-minute test passed for all features
- ✅ 85% test coverage (target was 80%)
- ✅ Mobile responsive throughout
- ✅ Production deployed and operational

## Development Guidelines

### When Working on This Project

1. **MVP is complete** - Focus on bug fixes and optimizations
2. **Consult agents proactively** - See [/docs/agents.md](/docs/agents.md)
3. **Follow security patterns** - See [/docs/security-patterns.md](/docs/security-patterns.md)
4. **Maintain test coverage** - Keep above 80%
5. **Document changes** - Update relevant docs

### Technology Stack

- **Framework**: Next.js 15.4 with TypeScript
- **UI Components**: shadcn/ui (check first for every UI need)
- **Styling**: Tailwind CSS v3.4 (NOT v4 yet)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **Payments**: Stripe
- **Email**: Resend
- **Deployment**: Vercel

### Critical Reminders

⚠️ **MANDATORY Agent Consultations**:
- `privacy-guardian` - BEFORE handling any user data
- `payment-auditor` - BEFORE any payment code
- `volunteer-advocate` - BEFORE creating UI
- `test-enforcer` - AFTER implementing features

See [/docs/agents.md](/docs/agents.md) for complete agent documentation.

## Development Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm type-check       # TypeScript checking
pnpm lint            # Run linter
pnpm test            # Run tests

# Database
# Apply migrations from /supabase/migrations in order

# Deployment
git push origin main  # Auto-deploy to production
```

## Environment Variables

See complete list in README.md. Critical ones:
- Supabase credentials
- Clerk authentication keys
- Stripe payment keys
- Encryption keys (generate with `openssl rand -hex 32`)

## Security Checklist

Before ANY code changes:
1. Review [/docs/security-patterns.md](/docs/security-patterns.md)
2. Check if handling PII → Implement encryption
3. Creating API endpoint → Add auth + rate limiting
4. Database changes → Review RLS policies
5. User inputs → Validate with Zod schemas

## Testing Requirements

- **Coverage**: Maintain >= 80%
- **Critical paths**: 100% coverage required for:
  - Payment flows
  - Authentication
  - Privacy controls
  - Data encryption

## Git Workflow

```bash
# Feature development
git checkout develop
git checkout -b feature/your-feature

# After implementation
pnpm test            # Must pass
pnpm type-check      # No errors
pnpm lint           # Clean

# Create PR with agent consultations documented
```

## Production Readiness

### Before deploying ANY feature:
- [ ] TypeScript: No errors
- [ ] Tests: >= 80% coverage
- [ ] Lint: Clean
- [ ] Agents: Relevant consultations complete
- [ ] Security: Patterns followed
- [ ] Mobile: Responsive verified
- [ ] Docs: Updated

## Support & Resources

- **Production**: https://ptsaplus.vercel.app
- **Documentation**: `/docs/` directory
- **Issues**: GitHub Issues
- **Claude Code Help**: `/help` command

## Post-MVP Roadmap

### Phase 2: AI Enhancement (Q2 2025)
- AI-powered newsletters
- Meeting summaries
- Cost optimization < $0.10/user/month

### Phase 3: Advanced Features (Q3 2025)
- Mobile app
- School integrations
- Advanced reporting

### Phase 4: Scale (Q4 2025)
- Multi-tenant support
- API development
- White-label options

---

**Remember**: The platform is production-ready. Focus on stability, performance, and user satisfaction.