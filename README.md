# Our PTSA Platform

> A custom-built platform for our Parent-Teacher-Student Association

## 🎯 Purpose

This platform provides our PTSA with a dedicated solution for managing operations, coordinating volunteers, and engaging with our school community. Built specifically for our needs, it replaces generic school website builders with a tailored system we control.

## 🚀 Current Features

### Phase 1 - Foundation (In Development)
- **Member Management**: Track member families and their information
- **Online Payments**: Process membership dues and donations via Stripe
- **Event Calendar**: List school events and volunteer opportunities  
- **User Accounts**: Secure login for members with role-based access
- **Basic Admin Tools**: Board members can manage content

### Phase 2 - Enhanced Operations (Planned)
- **Committee Management**: Organize committees and track participation
- **Volunteer Hours**: Log and report volunteer contributions
- **Document Library**: Store meeting minutes, bylaws, and guides
- **Email Communications**: Send newsletters and announcements
- **Financial Reporting**: Transparent budget and expense tracking

### Phase 3 - Advanced Features (Future)
- **Mobile Apps**: Native iOS and Android applications
- **School Integration**: Connect with school information systems
- **AI Assistance**: Help with content creation and tasks
- **Advanced Analytics**: Track engagement and impact
- **Multi-language Support**: Serve all families in our community

## 📋 Documentation

Project documentation is available in the `/docs` directory:

- [Platform Overview](./docs/01-platform-overview.md) - Vision for our PTSA platform
- [Future Scaling Guide](./docs/future-scaling-guide.md) - How to expand to multiple PTSAs
- [Month 1 Development Plan](./docs/month-1-development-plan.md) - Initial development roadmap
- [Technical Architecture](./docs/05-technical-architecture.md) - System design details

## 🛠️ Technology Stack

### Current Stack (Simplified for Single PTSA)
- **Frontend**: Next.js 14 with TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS v3.4
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Hosting**: Vercel

### Why These Choices?
- **Next.js**: Modern React framework with great developer experience
- **shadcn/ui**: Beautiful, accessible components we can customize
- **Clerk**: Handles authentication complexity for us
- **Supabase**: Managed PostgreSQL with real-time features
- **Stripe**: Industry-standard payment processing
- **Vercel**: Simple deployment and scaling

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- pnpm package manager
- Git (for worktrees)
- GitHub account
- Supabase account
- Clerk account
- Stripe account

### Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ptsaplus.git
cd ptsaplus

# Navigate to app directory
cd app

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
pnpm dev
```

### Development Workflow

```bash
# Create a new feature branch with worktree
./scripts/worktree-create.sh feature-name

# Switch to the new worktree
cd ../ptsaplus-feature-name

# Start development server (auto-detects available port)
./scripts/worktree-dev.sh

# When done, clean up
cd ../ptsaplus
./scripts/worktree-cleanup.sh ../ptsaplus-feature-name --delete-branch
```

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build           # Build for production
pnpm start           # Start production server

# Code Quality
pnpm lint            # Run ESLint
pnpm lint:fix        # Fix ESLint issues
pnpm type-check      # Run TypeScript checking
pnpm format          # Format code with Prettier
pnpm format:check    # Check code formatting

# Git Worktrees
./scripts/worktree-list.sh     # List all worktrees
./scripts/worktree-create.sh   # Create new worktree
./scripts/worktree-cleanup.sh  # Remove worktree
./scripts/worktree-dev.sh      # Start dev server
```

### Environment Setup

You'll need to add these keys to `.env.local`:
- Supabase URL and keys
- Clerk publishable and secret keys
- Stripe keys
- OpenAI API key (for AI features)

## 📊 Project Status

### Completed ✅
- Project setup and configuration
- Database schema design (single PTSA)
- Basic UI components and layout
- Authentication setup
- Core type definitions

### In Progress 🔄
- Member registration flow
- Payment processing integration
- Event management system
- Admin dashboard

### Upcoming 📅
- Email communications
- Document management
- Volunteer tracking
- Mobile optimization

## 🔒 Security & Privacy

We take family data seriously:
- FERPA compliance for student information
- COPPA compliance for children under 13
- Secure payment processing via Stripe
- Role-based access control
- Regular security updates

## 💰 Costs

### Estimated Monthly Costs (Single PTSA)
- Hosting (Vercel): ~$20
- Database (Supabase): ~$25
- Authentication (Clerk): ~$25
- Domain: ~$1.25 ($15/year)
- **Total**: ~$71.25/month

### Payment Processing
- Stripe: 2.9% + $0.30 per transaction
- Example: $15 membership = $0.74 in fees

## 🤝 Contributing

This is currently a private project for our PTSA. Board members and authorized volunteers can request access to contribute.

### For Board Members
1. Request access to the repository
2. Set up your development environment
3. Work on assigned features
4. Submit changes for review

## 📈 Future Possibilities

While built for our PTSA, the platform architecture could support:
- Multiple PTSAs (multi-tenant)
- District-wide deployment
- White-label solutions
- SaaS offering

See [Future Scaling Guide](./docs/future-scaling-guide.md) for details.

## 🔗 Links

- **Live Site**: [Deployed on Vercel](https://ptsaplus.vercel.app)
- **Documentation**: [Setup Guide](./SETUP.md) | [Deployment Guide](./DEPLOYMENT.md)
- **Development**: [Month 1 Plan](./docs/month-1-development-plan.md)

## 🤝 Contributing

1. Follow the [Setup Guide](./SETUP.md) to configure your development environment
2. Create a feature branch using Git worktrees: `./scripts/worktree-create.sh your-feature`
3. Make your changes following our privacy and security guidelines
4. Ensure all tests pass and code quality checks pass
5. Submit a pull request with a clear description

### Development Guidelines

- **Privacy First**: All features must comply with FERPA/COPPA requirements
- **Volunteer-Friendly**: Features must pass the "5-minute test" for usability
- **Security**: Never commit sensitive data or API keys
- **Testing**: Add tests for critical paths, especially payment and privacy features

## 📞 Contact

For questions about this platform:
- **PTSA Board**: board@ourptsa.org
- **Technical Issues**: tech@ourptsa.org
- **General Info**: info@ourptsa.org

---

*Built by volunteers, for volunteers - making PTSA management simpler for our school community.*