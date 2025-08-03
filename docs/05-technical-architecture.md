# PTSA Platform Technical Architecture

**Note**: This document describes the long-term technical architecture vision. The current implementation (January 2025) uses a simplified approach with a modular monolith deployed to Vercel. See the "Current Implementation" section for details on what's actually built.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [System Components](#system-components)
3. [Technology Stack](#technology-stack)
4. [Infrastructure Design](#infrastructure-design)
5. [Data Architecture](#data-architecture)
6. [Security Architecture](#security-architecture)
7. [Integration Architecture](#integration-architecture)
8. [Scalability Strategy](#scalability-strategy)
9. [Deployment Architecture](#deployment-architecture)
10. [Monitoring & Observability](#monitoring--observability)

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Layer                             │
├─────────────────┬─────────────────┬──────────────┬──────────────┤
│   Web App (PWA) │  Mobile Web     │  Admin Portal │  Mobile Apps │
│   (Next.js)     │  (Responsive)   │  (Next.js)    │  (Future)    │
└────────┬────────┴────────┬────────┴───────┬──────┴──────┬───────┘
         │                 │                 │              │
         └─────────────────┴─────────────────┴──────────────┘
                                   │
                          ┌────────┴────────┐
                          │  API Gateway    │
                          │  (AWS ALB)      │
                          └────────┬────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         │                                                     │
┌────────┴────────┐  ┌──────────────┐  ┌──────────────┐  ┌──┴────────┐
│   Core API      │  │  Payment API  │  │  AI Service  │  │ Event Bus │
│   (NestJS)      │  │  (NestJS)     │  │  (Python)    │  │ (SQS/SNS) │
└────────┬────────┘  └──────┬───────┘  └──────┬───────┘  └──┬────────┘
         │                   │                  │              │
         └───────────────────┴──────────────────┴──────────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     │                           │
          ┌──────────┴────────┐      ┌──────────┴────────┐
          │  PostgreSQL       │      │  Redis Cache      │
          │  (Primary DB)     │      │  (Sessions/Cache) │
          └───────────────────┘      └───────────────────┘
                     │                           │
                     └───────────┬───────────────┘
                                 │
                   ┌─────────────┴─────────────┐
                   │   S3 Object Storage       │
                   │   (Files/Documents)       │
                   └───────────────────────────┘
```

### Architectural Principles

1. **Start Simple, Scale Smart**: Begin with modular monolith, extract services as needed
2. **API-First Design**: All functionality exposed through well-documented APIs
3. **Privacy by Default**: FERPA/COPPA compliance built into every feature
4. **Volunteer-Friendly**: 5-minute test for all user-facing features
5. **Security by Design**: Defense in depth with multiple security layers

### Current Implementation (January 2025)

The platform currently uses a simplified architecture optimized for rapid development:

```
┌─────────────────────────────────────────────────┐
│              Client Layer                       │
├─────────────────┬─────────────────┬──────────────┤
│   Web App (PWA) │  Mobile Web     │  Admin View  │
│   (Next.js 15)  │  (Responsive)   │  (Same App)  │
└───────┬────────┴───────┬────────┴──────┬───────┘
         │                  │                  │
         └──────────────────┴──────────────────┘
                            │
                   ┌────────┴────────┐
                   │  Vercel Edge    │
                   │  (CDN + API)    │
                   └────────┬────────┘
                            │
                   ┌────────┴────────┐
                   │  Next.js App    │
                   │  API Routes     │
                   │  (Monolith)     │
                   └────────┬────────┘
                            │
         ┌───────────────────┴───────────────────┐
         │                                         │
┌────────┴────────┐  ┌─────────────┐  ┌────────┴────────┐
│  Clerk Auth     │  │  Supabase   │  │  Stripe API    │
│  (Managed)      │  │  PostgreSQL │  │  (Payments)    │
└─────────────────┘  └─────────────┘  └─────────────────┘
```

**Current Technology Choices**:
- **Frontend**: Next.js 15.4.4 with TypeScript, shadcn/ui components, Tailwind CSS v3.4
- **Backend**: Next.js API Routes (modular monolith approach)
- **Database**: Supabase (managed PostgreSQL with RLS)
- **Authentication**: Clerk (managed service with webhooks)
- **Hosting**: Vercel (edge deployment with automatic scaling)
- **Payments**: Stripe (in development)

### Future Architecture (Months 4-6+)

The architecture below represents the target state as the platform scales:

## System Components

### 1. Frontend Applications

#### Web Application (PWA)
- **Technology**: Next.js 14 with TypeScript (App Router)
- **Features**:
  - Server-side rendering for SEO
  - Progressive Web App capabilities
  - Offline functionality with service workers
  - Responsive design for all devices
- **UI Components**: shadcn/ui - Accessible, customizable React components
- **Styling**: Tailwind CSS - Utility-first CSS framework
- **State Management**: Zustand for client state, React Query for server state
- **Form Handling**: React Hook Form with Zod validation

#### Admin Portal
- **Technology**: Next.js with role-based access
- **Features**:
  - Advanced analytics dashboards
  - System configuration
  - User management
  - Content moderation
- **Authentication**: Separate admin authentication system

### 2. Backend Services

#### Core API Service
- **Framework**: NestJS with TypeScript
- **Responsibilities**:
  - User management and authentication
  - Organization management
  - Event management
  - Communication services
  - Document management
- **Architecture**: Modular with clear domain boundaries

#### Payment Service
- **Framework**: NestJS with TypeScript
- **Responsibilities**:
  - Payment processing
  - Financial reporting
  - Subscription management
  - Refund handling
- **Isolation**: Separate service for PCI compliance

#### AI Service
- **Framework**: FastAPI (Python)
- **Responsibilities**:
  - Content generation
  - Predictive analytics
  - Natural language processing
  - Automated moderation
- **Models**: OpenAI GPT-4, custom trained models

### 3. Data Layer

#### Primary Database
- **Technology**: PostgreSQL 15
- **Features**:
  - JSONB for flexible data
  - Full-text search
  - Partitioning for large tables
  - Read replicas for scaling

#### Caching Layer
- **Technology**: Redis 7
- **Use Cases**:
  - Session management
  - API response caching
  - Real-time data
  - Rate limiting

#### Object Storage
- **Technology**: AWS S3
- **Storage Types**:
  - User uploads
  - Generated reports
  - Static assets
  - Backups

## Technology Stack

### Frontend Stack
```yaml
Framework: Next.js 14 (App Router)
Language: TypeScript 5.0
UI Components: shadcn/ui
Styling: Tailwind CSS 3.4.x (NOT v4 - compatibility requirement)
CSS Animation: tailwindcss-animate 1.0.x
Icons: Lucide React
Forms: React Hook Form + Zod
State: Zustand + React Query (TanStack Query)
Testing: Jest + React Testing Library
Build: Turbo
```

### Backend Stack
```yaml
Framework: NestJS 10
Language: TypeScript 5.0
ORM: Prisma 5
Validation: Class Validator
Authentication: Passport + JWT
Testing: Jest + Supertest
Documentation: OpenAPI/Swagger
```

### Infrastructure Stack
```yaml
Cloud: AWS
Containers: Docker
Orchestration: ECS Fargate
CI/CD: GitHub Actions
IaC: Terraform
Monitoring: DataDog
Secrets: AWS Secrets Manager
```

## Infrastructure Design

### AWS Services Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Route 53 (DNS)                           │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────┐
│                      CloudFront (CDN)                            │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────┐
│                    WAF (Web Application Firewall)                │
└──────────────────────────────┬──────────────────────────────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        │              ALB (Load Balancer)            │
        └──────────────────────┬──────────────────────┘
                               │
   ┌───────────────────────────┼───────────────────────────┐
   │                           │                           │
┌──┴──────────────┐  ┌────────┴──────────┐  ┌────────────┴───┐
│  ECS Fargate    │  │   ECS Fargate     │  │  ECS Fargate   │
│  (Web App)      │  │   (Core API)      │  │  (Payment API) │
└─────────────────┘  └───────────────────┘  └────────────────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │        VPC          │
                    │  ┌───────────────┐  │
                    │  │  RDS (Multi-AZ)│  │
                    │  └───────────────┘  │
                    │  ┌───────────────┐  │
                    │  │  ElastiCache  │  │
                    │  └───────────────┘  │
                    └─────────────────────┘
```

### Network Architecture

#### VPC Design
- **CIDR**: 10.0.0.0/16
- **Availability Zones**: 3 (us-east-1a, us-east-1b, us-east-1c)
- **Subnets**:
  - Public: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
  - Private: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
  - Database: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24

#### Security Groups
- **ALB**: Port 443 from 0.0.0.0/0
- **ECS Tasks**: Port 3000 from ALB security group
- **RDS**: Port 5432 from ECS security group
- **ElastiCache**: Port 6379 from ECS security group

## Data Architecture

### Database Schema Design

#### Core Tables
```sql
-- Organizations (PTSAs)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    school_id UUID,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    profile JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Members
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    roles TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Data Partitioning Strategy

#### Time-based Partitioning
- **Communications**: Partitioned by month
- **Transactions**: Partitioned by month
- **Audit Logs**: Partitioned by day

#### Organization-based Sharding
- Large organizations get dedicated schemas
- Smaller organizations share schemas
- Automatic promotion based on size

### Caching Strategy

#### Cache Levels
1. **CDN Cache**: Static assets, 1 year TTL
2. **API Gateway Cache**: Public endpoints, 5 minute TTL
3. **Redis Cache**:
   - Session data: 30 minute TTL
   - User profiles: 5 minute TTL
   - Organization settings: 10 minute TTL
4. **Application Cache**: In-memory for hot data

## Security Architecture

### Authentication & Authorization

#### Authentication Flow
```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │      │    API   │      │   Auth   │      │    DB    │
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                  │                  │                  │
     │  1. Login Request│                  │                  │
     │─────────────────>│                  │                  │
     │                  │  2. Validate     │                  │
     │                  │─────────────────>│                  │
     │                  │                  │  3. Check User   │
     │                  │                  │─────────────────>│
     │                  │                  │<─────────────────│
     │                  │  4. JWT Token    │                  │
     │                  │<─────────────────│                  │
     │  5. Token + Cookie                  │                  │
     │<─────────────────│                  │                  │
```

#### Authorization Model
- **RBAC**: Role-based access control
- **Hierarchical Roles**: Admin > Board > Member > Parent
- **Resource-based**: Permissions tied to resources
- **Attribute-based**: Context-aware permissions

### Encryption

#### Data at Rest
- **Database**: Encrypted with AWS KMS
- **S3**: SSE-S3 encryption
- **Backups**: Encrypted with separate KMS key

#### Data in Transit
- **TLS 1.3**: All external communications
- **mTLS**: Internal service communication
- **Certificate Management**: AWS Certificate Manager

### Security Controls

#### Application Security
- **Input Validation**: All inputs sanitized
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Content Security Policy
- **CSRF Protection**: Double-submit cookies
- **Rate Limiting**: Per-user and per-IP

#### Infrastructure Security
- **WAF Rules**: OWASP Top 10 protection
- **DDoS Protection**: AWS Shield Standard
- **Secrets Management**: AWS Secrets Manager
- **Audit Logging**: CloudTrail + application logs
- **Vulnerability Scanning**: Weekly automated scans

## Integration Architecture

### External Integrations

#### Payment Processors
```typescript
interface PaymentGateway {
  processPayment(amount: number, token: string): Promise<Transaction>;
  refundTransaction(transactionId: string): Promise<Refund>;
  createCustomer(user: User): Promise<Customer>;
  webhook(event: WebhookEvent): Promise<void>;
}

// Implementations
class StripeGateway implements PaymentGateway { }
class PayPalGateway implements PaymentGateway { }
```

#### School Systems
```typescript
interface SchoolSystemIntegration {
  syncStudents(): Promise<Student[]>;
  syncCalendar(): Promise<Event[]>;
  updateAttendance(data: Attendance): Promise<void>;
}

// Implementations
class PowerSchoolIntegration implements SchoolSystemIntegration { }
class InfiniteCampusIntegration implements SchoolSystemIntegration { }
```

### Internal Integration Patterns

#### Event-Driven Architecture
```yaml
Event Bus: AWS EventBridge
Message Queue: AWS SQS
Topics: AWS SNS

Event Types:
  - user.created
  - payment.completed
  - event.registered
  - volunteer.assigned
  - communication.sent
```

#### API Gateway Pattern
- **Rate Limiting**: 1000 requests/minute per user
- **Authentication**: JWT validation
- **Request Routing**: Path-based routing
- **Response Caching**: 5-minute TTL for GET requests
- **Monitoring**: Request logging and metrics

## Scalability Strategy

### Horizontal Scaling

#### Auto-Scaling Policies
```yaml
Web Application:
  Min: 2 instances
  Max: 20 instances
  Target CPU: 70%
  Target Memory: 80%

API Services:
  Min: 3 instances
  Max: 50 instances
  Target CPU: 60%
  Target Response Time: 200ms

Database:
  Read Replicas: Auto-scale 1-5
  Connection Pooling: PgBouncer
```

### Performance Optimization

#### Database Optimization
- **Indexes**: Covering indexes for common queries
- **Materialized Views**: For complex reports
- **Query Optimization**: Explain analyze all queries
- **Connection Pooling**: Reduce connection overhead

#### Caching Strategy
- **Edge Caching**: CloudFront for static assets
- **API Caching**: Redis for frequently accessed data
- **Query Caching**: PostgreSQL query result cache
- **Application Caching**: In-memory LRU cache

### Load Testing Targets

```yaml
Concurrent Users: 10,000
Requests/Second: 5,000
Payment Transactions/Minute: 1,000
Email Send Rate: 10,000/hour
File Upload: 100 concurrent
Response Time p95: <200ms
Uptime: 99.9%
```

## Deployment Architecture

### CI/CD Pipeline

```yaml
Pipeline Stages:
  1. Source:
     - GitHub webhook trigger
     - Branch protection rules
  
  2. Build:
     - Docker image build
     - Unit tests
     - Linting
  
  3. Test:
     - Integration tests
     - E2E tests
     - Security scanning
  
  4. Deploy to Staging:
     - ECS deployment
     - Database migrations
     - Smoke tests
  
  5. Deploy to Production:
     - Blue-green deployment
     - Health checks
     - Rollback capability
```

### Infrastructure as Code

```hcl
# Terraform example
resource "aws_ecs_service" "api" {
  name            = "ptsa-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.api_instance_count

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3000
  }
}
```

## Monitoring & Observability

### Metrics Collection

#### Application Metrics
- **Response Time**: p50, p95, p99
- **Error Rate**: 4xx, 5xx responses
- **Throughput**: Requests per second
- **Business Metrics**: Signups, payments, events

#### Infrastructure Metrics
- **CPU/Memory**: Usage and limits
- **Network**: Bandwidth and latency
- **Database**: Connections, query time
- **Cache**: Hit rate, evictions

### Logging Strategy

```yaml
Log Levels:
  - ERROR: System errors, failures
  - WARN: Degraded performance, retries
  - INFO: Business events, user actions
  - DEBUG: Detailed execution flow

Log Structure:
  - Timestamp
  - Request ID
  - User ID
  - Organization ID
  - Action
  - Duration
  - Result
```

### Alerting Rules

```yaml
Critical Alerts:
  - API response time > 1s for 5 minutes
  - Error rate > 5% for 2 minutes
  - Database CPU > 90% for 10 minutes
  - Payment failures > 10 in 5 minutes

Warning Alerts:
  - API response time > 500ms for 10 minutes
  - Cache hit rate < 80% for 30 minutes
  - Disk usage > 80%
  - Failed login attempts > 100/minute
```

### Distributed Tracing

- **Tool**: AWS X-Ray
- **Trace Points**: API entry, database queries, external calls
- **Sampling**: 10% of requests, 100% of errors
- **Retention**: 30 days

---

*This architecture is designed to scale from 1,000 to 100,000+ schools while maintaining performance, security, and reliability.*