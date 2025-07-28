# PTSA+ API Design Documentation

## Overview

The PTSA+ API follows RESTful principles with a focus on developer experience, consistency, and security. This document outlines our API standards, endpoints, and integration guidelines.

## API Standards

### Base URL Structure
```
Production: https://api.ptsaplus.com/v1
Staging: https://api-staging.ptsaplus.com/v1
Development: http://localhost:3000/api/v1
```

### Authentication
All API requests require authentication using JWT Bearer tokens:
```http
Authorization: Bearer <jwt_token>
```

### Request/Response Format
- **Content-Type**: `application/json`
- **Accept**: `application/json`
- **Charset**: `UTF-8`

### HTTP Status Codes
```yaml
Success:
  200: OK - Request succeeded
  201: Created - Resource created
  204: No Content - Success with no response body

Client Errors:
  400: Bad Request - Invalid parameters
  401: Unauthorized - Invalid/missing auth
  403: Forbidden - No permission
  404: Not Found - Resource doesn't exist
  409: Conflict - Resource conflict
  422: Unprocessable Entity - Validation errors
  429: Too Many Requests - Rate limited

Server Errors:
  500: Internal Server Error
  502: Bad Gateway
  503: Service Unavailable
```

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "request_id": "req_abc123",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

### Pagination
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 156,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

### Rate Limiting
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Core API Endpoints

### Authentication Endpoints

#### POST /auth/register
Register a new user account
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "SecurePassword123!",
  "name": "Jane Smith",
  "organization_code": "ELEM2025"
}

Response: 201 Created
{
  "user": {
    "id": "usr_123abc",
    "email": "parent@example.com",
    "name": "Jane Smith",
    "created_at": "2025-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "refresh_xyz789"
}
```

#### POST /auth/login
Authenticate existing user
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "SecurePassword123!"
}

Response: 200 OK
{
  "user": {
    "id": "usr_123abc",
    "email": "parent@example.com",
    "name": "Jane Smith",
    "roles": ["parent", "volunteer"]
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "refresh_xyz789",
  "expires_in": 3600
}
```

#### POST /auth/refresh
Refresh access token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "refresh_xyz789"
}

Response: 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}
```

### User Management Endpoints

#### GET /users/me
Get current user profile
```http
GET /api/v1/users/me
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "usr_123abc",
  "email": "parent@example.com",
  "name": "Jane Smith",
  "phone": "+1234567890",
  "profile": {
    "avatar_url": "https://cdn.ptsaplus.com/avatars/123.jpg",
    "timezone": "America/New_York",
    "language": "en",
    "children": [
      {
        "name": "Emma Smith",
        "grade": "3",
        "teacher": "Ms. Johnson"
      }
    ]
  },
  "preferences": {
    "email_notifications": true,
    "sms_notifications": false,
    "newsletter": true
  },
  "organizations": [
    {
      "id": "org_456def",
      "name": "Lincoln Elementary PTSA",
      "roles": ["parent", "volunteer"]
    }
  ]
}
```

#### PATCH /users/me
Update user profile
```http
PATCH /api/v1/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane M. Smith",
  "phone": "+1234567890",
  "profile": {
    "timezone": "America/Chicago"
  }
}

Response: 200 OK
{
  "id": "usr_123abc",
  "email": "parent@example.com",
  "name": "Jane M. Smith",
  "updated_at": "2025-01-15T11:00:00Z"
}
```

### Organization Endpoints

#### GET /organizations/:id
Get organization details
```http
GET /api/v1/organizations/org_456def
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "org_456def",
  "name": "Lincoln Elementary PTSA",
  "school": {
    "name": "Lincoln Elementary School",
    "district": "City School District",
    "address": "123 School St, City, ST 12345"
  },
  "settings": {
    "fiscal_year_start": "07-01",
    "membership_fee": 15.00,
    "currency": "USD",
    "timezone": "America/New_York"
  },
  "stats": {
    "total_members": 342,
    "active_volunteers": 67,
    "upcoming_events": 5
  }
}
```

#### GET /organizations/:id/members
List organization members
```http
GET /api/v1/organizations/org_456def/members?page=1&per_page=20
Authorization: Bearer <token>

Response: 200 OK
{
  "data": [
    {
      "id": "mem_789ghi",
      "user": {
        "id": "usr_123abc",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "roles": ["parent", "volunteer"],
      "joined_at": "2024-08-15T10:00:00Z",
      "membership_expires": "2025-06-30T23:59:59Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 342,
    "total_pages": 18
  }
}
```

### Event Endpoints

#### POST /events
Create new event
```http
POST /api/v1/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "organization_id": "org_456def",
  "title": "Spring Carnival",
  "description": "Annual spring carnival fundraiser",
  "start_time": "2025-04-15T10:00:00Z",
  "end_time": "2025-04-15T14:00:00Z",
  "location": {
    "name": "School Playground",
    "address": "123 School St"
  },
  "settings": {
    "registration_required": true,
    "capacity": 500,
    "ticket_price": 5.00,
    "allow_guests": true
  },
  "volunteer_needs": [
    {
      "role": "Setup Crew",
      "slots": 10,
      "time_slot": "2025-04-15T08:00:00Z"
    }
  ]
}

Response: 201 Created
{
  "id": "evt_101jkl",
  "title": "Spring Carnival",
  "status": "upcoming",
  "registration_url": "https://ptsaplus.com/e/evt_101jkl",
  "created_at": "2025-01-15T12:00:00Z"
}
```

#### GET /events
List events
```http
GET /api/v1/events?organization_id=org_456def&status=upcoming
Authorization: Bearer <token>

Response: 200 OK
{
  "data": [
    {
      "id": "evt_101jkl",
      "title": "Spring Carnival",
      "start_time": "2025-04-15T10:00:00Z",
      "location": {
        "name": "School Playground"
      },
      "registration_count": 127,
      "capacity": 500,
      "ticket_price": 5.00
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 5
  }
}
```

#### POST /events/:id/register
Register for event
```http
POST /api/v1/events/evt_101jkl/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "attendees": [
    {
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    {
      "name": "Emma Smith",
      "age_group": "child"
    }
  ],
  "payment_method_id": "pm_xyz789"
}

Response: 201 Created
{
  "registration": {
    "id": "reg_202mno",
    "confirmation_code": "CARN2025-202",
    "total_amount": 10.00,
    "payment_status": "completed"
  },
  "tickets": [
    {
      "id": "tkt_303pqr",
      "attendee_name": "Jane Smith",
      "qr_code": "https://api.ptsaplus.com/tickets/tkt_303pqr/qr"
    }
  ]
}
```

### Payment Endpoints

#### POST /payments/checkout
Create payment session
```http
POST /api/v1/payments/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "membership",
  "organization_id": "org_456def",
  "amount": 15.00,
  "metadata": {
    "member_name": "Jane Smith",
    "school_year": "2024-2025"
  }
}

Response: 200 OK
{
  "checkout_session": {
    "id": "cs_test_123",
    "payment_intent": "pi_test_456",
    "client_secret": "pi_test_456_secret_789",
    "amount": 15.00,
    "currency": "usd"
  }
}
```

#### GET /payments/history
Get payment history
```http
GET /api/v1/payments/history?organization_id=org_456def
Authorization: Bearer <token>

Response: 200 OK
{
  "data": [
    {
      "id": "pay_404stu",
      "amount": 15.00,
      "currency": "usd",
      "description": "PTSA Membership 2024-2025",
      "status": "completed",
      "created_at": "2024-08-15T10:30:00Z",
      "receipt_url": "https://pay.stripe.com/receipts/..."
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 23
  }
}
```

### Communication Endpoints

#### POST /messages/send
Send message to members
```http
POST /api/v1/messages/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "organization_id": "org_456def",
  "recipients": {
    "type": "segment",
    "segment": "grade_3_parents"
  },
  "message": {
    "subject": "Field Trip Permission Forms Due",
    "body": "Dear Parents, Please remember to submit...",
    "priority": "normal"
  },
  "channels": ["email"],
  "schedule_at": "2025-01-16T09:00:00Z"
}

Response: 202 Accepted
{
  "message_id": "msg_505vwx",
  "status": "scheduled",
  "recipient_count": 45,
  "scheduled_for": "2025-01-16T09:00:00Z"
}
```

#### GET /messages/:id/stats
Get message statistics
```http
GET /api/v1/messages/msg_505vwx/stats
Authorization: Bearer <token>

Response: 200 OK
{
  "message_id": "msg_505vwx",
  "sent_at": "2025-01-16T09:00:00Z",
  "stats": {
    "sent": 45,
    "delivered": 44,
    "opened": 38,
    "clicked": 12,
    "bounced": 1,
    "unsubscribed": 0
  }
}
```

### Financial Endpoints

#### GET /financial/summary
Get financial summary
```http
GET /api/v1/financial/summary?organization_id=org_456def&year=2025
Authorization: Bearer <token>

Response: 200 OK
{
  "organization_id": "org_456def",
  "fiscal_year": "2024-2025",
  "summary": {
    "total_income": 45678.90,
    "total_expenses": 32456.78,
    "net_income": 13222.12,
    "cash_balance": 25678.90
  },
  "income_by_category": {
    "memberships": 5130.00,
    "fundraising": 35678.90,
    "donations": 4870.00
  },
  "expenses_by_category": {
    "programs": 25678.90,
    "administration": 3456.78,
    "events": 3321.10
  }
}
```

#### POST /financial/transactions
Record transaction
```http
POST /api/v1/financial/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "organization_id": "org_456def",
  "type": "income",
  "category": "fundraising",
  "amount": 1234.56,
  "description": "Fall Festival proceeds",
  "date": "2025-01-15",
  "payment_method": "check",
  "reference": "CHK-1234"
}

Response: 201 Created
{
  "id": "txn_606yza",
  "type": "income",
  "amount": 1234.56,
  "balance_after": 26913.46,
  "created_at": "2025-01-15T14:00:00Z"
}
```

## Webhook Events

### Event Types
```yaml
Events:
  - user.created
  - user.updated
  - member.joined
  - member.renewed
  - payment.completed
  - payment.failed
  - event.created
  - event.registration
  - event.cancelled
  - message.sent
  - message.delivered
  - message.bounced
```

### Webhook Payload Format
```json
{
  "id": "webhook_123abc",
  "type": "payment.completed",
  "created_at": "2025-01-15T10:30:00Z",
  "data": {
    "payment_id": "pay_404stu",
    "amount": 15.00,
    "user_id": "usr_123abc",
    "organization_id": "org_456def"
  }
}
```

### Webhook Security
```http
POST /webhooks/stripe
X-Webhook-Signature: sha256=abc123...
Content-Type: application/json

{
  "type": "payment_intent.succeeded",
  "data": {...}
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { PTSAClient } from '@ptsaplus/sdk';

const client = new PTSAClient({
  apiKey: process.env.PTSA_API_KEY,
  organizationId: 'org_456def'
});

// Create event
const event = await client.events.create({
  title: 'Spring Carnival',
  startTime: new Date('2025-04-15T10:00:00Z'),
  location: {
    name: 'School Playground'
  }
});

// Send message
const message = await client.messages.send({
  recipients: { segment: 'all_members' },
  subject: 'Important Update',
  body: 'Dear Members...'
});
```

### Python
```python
from ptsaplus import PTSAClient

client = PTSAClient(
    api_key=os.environ['PTSA_API_KEY'],
    organization_id='org_456def'
)

# List members
members = client.members.list(page=1, per_page=50)

# Process payment
payment = client.payments.create(
    type='membership',
    amount=15.00,
    metadata={'member_name': 'Jane Smith'}
)
```

## API Versioning

### Version Strategy
- **URL Versioning**: `/v1/`, `/v2/`
- **Deprecation Notice**: 6 months minimum
- **Sunset Period**: 12 months after deprecation
- **Version Header**: `X-API-Version: 1`

### Breaking Changes
Examples of breaking changes:
- Removing endpoints
- Changing required parameters
- Modifying response structure
- Changing authentication methods

### Non-Breaking Changes
Examples of non-breaking changes:
- Adding optional parameters
- Adding response fields
- Adding new endpoints
- Performance improvements

## Rate Limiting

### Limits by Plan
```yaml
Free Tier:
  - 100 requests/hour
  - 1,000 requests/day

Standard Tier:
  - 1,000 requests/hour
  - 10,000 requests/day

Premium Tier:
  - 10,000 requests/hour
  - 100,000 requests/day

Enterprise:
  - Custom limits
```

### Rate Limit Headers
```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Reset-After: 3600
```

### Rate Limit Error
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "retry_after": 3600
  }
}
```

## Testing

### Test Environment
```
Base URL: https://api-sandbox.ptsaplus.com/v1
Test API Key: test_pk_abc123...
```

### Test Data
```yaml
Test Cards:
  - Success: 4242 4242 4242 4242
  - Declined: 4000 0000 0000 0002
  - 3D Secure: 4000 0000 0000 3220

Test Users:
  - admin@test.ptsaplus.com / TestPass123!
  - parent@test.ptsaplus.com / TestPass123!
  - treasurer@test.ptsaplus.com / TestPass123!
```

## API Changelog

### Version 1.0.0 (January 2025)
- Initial API release
- Core endpoints for auth, users, organizations
- Event management
- Payment processing
- Basic messaging

### Planned Features
- Volunteer management endpoints
- Advanced analytics API
- Bulk operations
- GraphQL support
- WebSocket real-time updates

---

*For API support, contact api@ptsaplus.com or visit our developer portal.*