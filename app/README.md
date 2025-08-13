# PTSA+ Platform

A comprehensive management platform for Parent-Teacher-Student Associations, designed to simplify operations for volunteer-run organizations while ensuring compliance with educational data privacy laws.

🎉 **MVP Complete as of August 13, 2024!**

## 🌐 Live Production

**Production URL**: https://ptsaplus.vercel.app

## ✨ Features

### Core Functionality (100% Complete)

#### 👥 **Member Management**
- User registration with role-based access (admin, board, committee_chair, member, teacher)
- Privacy-compliant member directory
- Profile management with field-level privacy controls

#### 💳 **Payment Processing**
- Secure Stripe integration for membership dues
- Multiple payment tiers ($15, $25, $50, custom)
- PCI DSS compliant implementation
- Guest checkout support
- Payment confirmation emails

#### 📅 **Event Management**
- Create and manage events (meetings, fundraisers, social, educational)
- RSVP system with guest count management
- Volunteer slot creation and signup
- Location support (in-person, virtual, hybrid)
- Calendar view for event browsing

#### 🔒 **Privacy & Compliance**
- FERPA compliant with audit trails
- COPPA parental consent for users under 13
- GDPR data portability and erasure rights
- Field-level encryption for PII
- Comprehensive audit logging

#### 📧 **Communication System**
- **Email Management**
  - Template-based email composer
  - Audience targeting (all, board, teachers, custom)
  - Schedule or send immediately
  - Email history with delivery statistics
- **Announcements**
  - Create, edit, and manage announcements
  - Pin important messages
  - Schedule publication
  - Auto-save drafts
  - Email notifications

#### 📊 **Dashboard & Analytics**
- Role-based dashboards (admin, treasurer, board, member)
- Revenue tracking and projections
- Membership analytics
- Event participation metrics
- Data visualization with interactive charts

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account
- Clerk account for authentication
- Stripe account for payments
- Resend account for emails (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ptsaplus.git
cd ptsaplus/app
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure required environment variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Stripe Payments
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key

# Encryption Keys (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your_encryption_key
PII_ENCRYPTION_KEY=your_pii_encryption_key
FINANCIAL_ENCRYPTION_KEY=your_financial_encryption_key
```

5. Run database migrations:
```bash
# Apply all migrations in order from /supabase/migrations
```

6. Start the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📱 Key Pages

- `/` - Landing page
- `/dashboard` - Role-based dashboard
- `/members` - Member directory
- `/events` - Event management
- `/communications` - Communication hub (admin/board only)
- `/membership/pay` - Payment page
- `/settings/privacy` - Privacy settings

## 🛠️ Technology Stack

- **Framework**: Next.js 15.4 with TypeScript
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS v3.4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **Payments**: Stripe
- **Email**: Resend
- **Deployment**: Vercel

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 📈 Performance Targets

- Page load time: < 3 seconds on 3G
- API response time: < 200ms (p95)
- Support for 10,000 concurrent users
- 99.9% uptime SLA

## 🔐 Security Features

- Role-based access control (RBAC)
- Field-level encryption for PII
- Rate limiting on all endpoints
- Comprehensive audit logging
- HTTPS enforcement in production
- Input validation and sanitization

## 🚢 Deployment

The application is configured for automatic deployment on Vercel:

1. Push to `main` branch → Production deployment
2. Push to `develop` branch → Preview deployment
3. Pull requests → Preview deployments

## 📝 Documentation

- `/CLAUDE.md` - Development guide and project status
- `/docs` - Detailed documentation
- `/docs/month-1-development-plan.md` - Risk-based development approach
- `/docs/08-security-compliance.md` - Security guidelines

## 🤝 Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Ensure tests pass and type checking succeeds
4. Submit a pull request with agent consultations documented

## 📄 License

Proprietary - All rights reserved

## 🙏 Acknowledgments

- Built with guidance from specialized AI agents
- Designed for volunteer-run organizations
- Compliant with educational privacy laws

---

**Production Ready**: The PTSA+ platform MVP is complete and ready for use by real Parent-Teacher-Student Associations!