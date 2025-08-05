# Payment Testing Guide

## Running Tests

```bash
# Run all payment tests
pnpm test src/__tests__/payments

# Run tests in watch mode
pnpm test:watch src/__tests__/payments

# Run with coverage
pnpm test:coverage src/__tests__/payments
```

## Manual Testing with Stripe Test Cards

When testing the payment flow at http://localhost:3000/membership/pay, use these Stripe test cards:

### Successful Payment Test Cards

| Card Number | Description | Expected Result |
|-------------|-------------|-----------------|
| `4242 4242 4242 4242` | Standard successful payment | Payment succeeds immediately |
| `4000 0025 0000 3155` | 3D Secure authentication required | Redirects to 3D Secure flow, then succeeds |
| `5555 5555 4444 4242` | Mastercard successful payment | Payment succeeds |

### Failed Payment Test Cards

| Card Number | Description | Expected Result |
|-------------|-------------|-----------------|
| `4000 0000 0000 0002` | Card declined | Shows "Your card was declined" error |
| `4000 0000 0000 9995` | Insufficient funds | Shows "Your card has insufficient funds" error |
| `4000 0000 0000 0119` | Processing error | Shows processing error message |
| `4000 0000 0000 0069` | Expired card | Shows "Your card has expired" error |
| `4000 0000 0000 0127` | Incorrect CVC | Shows "Your card's security code is incorrect" error |

### Test Card Details

For all test cards, you can use:
- **Expiry Date**: Any future date (e.g., 12/34)
- **CVC**: Any 3-digit number (or 4 digits for Amex)
- **ZIP**: Any 5-digit number (e.g., 42424)

## Testing Different Scenarios

### 1. Basic Membership Payment ($15)
1. Navigate to `/membership/pay`
2. Select "Basic Membership - $15"
3. Click "Continue with $15.00"
4. Enter test card `4242 4242 4242 4242`
5. Complete payment
6. Verify redirect to success page

### 2. Custom Amount Payment
1. Select "Choose your amount"
2. Enter amount between $1 and $100
3. Continue with payment flow
4. Test with different cards

### 3. Payment Validation
1. Try amounts below $1 (should show error)
2. Try amounts above $100 (should show error)
3. Try non-numeric values (should be prevented by input)

### 4. 3D Secure Flow
1. Use card `4000 0025 0000 3155`
2. Complete 3D Secure authentication
3. Verify payment succeeds after authentication

### 5. Error Handling
1. Use declined card `4000 0000 0000 0002`
2. Verify error message is user-friendly
3. Verify user can retry with different card

## Webhook Testing

To test webhooks locally:

1. Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

2. Login to Stripe:
```bash
stripe login
```

3. Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

4. The CLI will show your webhook signing secret. Update `STRIPE_WEBHOOK_SECRET` in `.env.local`.

5. Trigger test events:
```bash
# Trigger successful payment
stripe trigger payment_intent.succeeded

# Trigger failed payment
stripe trigger payment_intent.payment_failed
```

## Monitoring Test Results

1. Check browser console for any errors
2. Monitor server logs for API errors
3. Check Stripe Dashboard (test mode) for payment logs
4. Verify database records are created/updated

## Common Issues and Solutions

### "Could not find Elements context" Error
- Ensure Stripe Elements is properly initialized
- Check that payment form is wrapped in Elements provider

### Payment Intent Creation Fails
- Verify Stripe API keys are set correctly
- Check user is authenticated (Clerk)
- Ensure amount is within valid range

### Webhook Not Received
- Verify webhook endpoint URL is correct
- Check webhook signing secret matches
- Ensure Stripe CLI is forwarding to correct port

### Rate Limiting Errors
- Wait 1 minute between excessive requests
- Clear rate limit cache if testing extensively