# Security Implementation Patterns

Based on the payment integration implementation, use these patterns for all sensitive features.

## 1. Idempotency Keys for Financial Operations

Prevent duplicate charges and operations:

```typescript
// Generate unique idempotency key for each operation
const idempotencyKey = `${operationType}_${userId}_${amount}_${timestamp}`;

// Use with Stripe or other payment providers
const result = await stripe.paymentIntents.create(
  { amount, currency: 'usd', ... },
  { idempotencyKey }
);
```

## 2. Rate Limiting Configuration

Apply to all sensitive endpoints:

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

### Rate Limits by Endpoint Type
- **Payment operations**: 5/min per user, 10/min per IP
- **Event mutations**: 5/min per user, 10/min per IP
- **Email sending**: 3/min per user, 5/min per IP
- **Read operations**: 60/min per user, 100/min per IP

## 3. Comprehensive Audit Logging

Log all security-sensitive operations:

```typescript
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

## 4. Secure Error Handling

Never expose internal errors to users:

```typescript
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

## 5. Input Validation with Strict Limits

Validate all user inputs:

```typescript
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

## 6. Webhook Security

Always verify webhook signatures:

```typescript
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

## 7. Field-Level Encryption

Encrypt PII before storage:

```typescript
import { encryptField, decryptField } from '@/lib/privacy/encryption';

// Encrypt before storing
const user = {
  email: encryptField(email, 'pii'),
  phone: encryptField(phone, 'pii'),
  ssn: encryptField(ssn, 'pii')
};

// Decrypt when reading
const decryptedUser = {
  email: decryptField(user.email, 'pii'),
  phone: decryptField(user.phone, 'pii')
};
```

## 8. Authentication Patterns

Every protected endpoint must verify authentication:

```typescript
export async function POST(request: NextRequest) {
  // 1. Authentication check
  const { userId } = auth();
  if (!userId) return unauthorized();
  
  // 2. Rate limiting
  return withRateLimit(request, 'endpointType', async () => {
    // 3. Input validation
    const body = await validateInput(request);
    
    // 4. Audit logging
    await logAuditEvent({ userId, action, resource });
    
    try {
      // Business logic
    } catch (error) {
      // 5. Secure error handling
      return secureError(error);
    }
  });
}
```

## 9. Database Security

### RLS Policies
```sql
-- Never use auth.uid()::text casting
-- Use secure functions instead
CREATE FUNCTION get_auth_user_id() 
RETURNS uuid AS $$
  SELECT auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;
```

### Secure Queries
```typescript
// Always use parameterized queries
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId) // Safe parameterization
  .single();
```

## 10. Environment Variables

Required security environment variables:

```env
# Encryption Keys (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=        # General encryption
PII_ENCRYPTION_KEY=    # For PII data
FINANCIAL_ENCRYPTION_KEY= # For financial data
HEALTH_ENCRYPTION_KEY= # For health data
HASH_SALT=            # For one-way hashing

# API Keys (keep secure, rotate regularly)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
OPENAI_API_KEY=
```

## Security Checklist for New Features

Before implementing any feature:

- [ ] Review existing security patterns
- [ ] Check if feature handles PII or sensitive data
- [ ] Verify authentication requirements
- [ ] Plan encryption strategy if needed
- [ ] Identify rate limiting needs

Before database changes:

- [ ] Review RLS policies for vulnerabilities
- [ ] Verify no auth.uid()::text casting
- [ ] Ensure proper foreign key constraints
- [ ] Add field-level encryption for PII
- [ ] Create appropriate indexes

Before creating API endpoints:

- [ ] Implement authentication checks
- [ ] Add rate limiting
- [ ] Validate all inputs with schemas
- [ ] Implement audit logging
- [ ] Add secure error handling
- [ ] Test with malicious inputs

Before handling user data:

- [ ] Implement field-level encryption for PII
- [ ] Add privacy settings checks
- [ ] Verify consent before processing
- [ ] Implement data minimization
- [ ] Add audit trail

## When to Apply These Patterns

- **Financial Operations**: All patterns
- **User Data Updates**: Audit logging, validation, secure errors
- **API Endpoints**: Rate limiting, validation
- **Third-party Integrations**: Webhook security, idempotency
- **Admin Actions**: Comprehensive audit logging

## Production Security Requirements

### MANDATORY before production deployment:

1. All environment variables set with secure values
2. HTTPS enforcement enabled
3. Rate limiting active on all endpoints
4. Audit logging configured and tested
5. Encryption keys generated and stored securely
6. Database RLS policies reviewed and tested
7. Input validation on all user inputs
8. Error handling that doesn't leak information
9. Webhook signatures verified
10. COPPA/FERPA compliance verified