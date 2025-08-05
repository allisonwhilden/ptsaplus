'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock } from 'lucide-react';
import { STRIPE_PAYMENT_AMOUNTS, formatAmountForDisplay, formatAmountForStripe } from '@/lib/stripe/client';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  onSuccess?: () => void;
}

// Component for selecting payment amount
function AmountSelector({ onAmountSelected }: { onAmountSelected: (clientSecret: string, amount: number) => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<string>('1500'); // Default $15
  const [customAmount, setCustomAmount] = useState<string>('');

  const getPaymentAmount = (): number => {
    if (selectedAmount === 'custom') {
      const amount = parseFloat(customAmount);
      return isNaN(amount) ? 0 : formatAmountForStripe(amount);
    }
    return parseInt(selectedAmount);
  };

  const handleAmountContinue = async () => {
    const amount = getPaymentAmount();
    
    // Validate amount
    if (amount < 100) {
      setErrorMessage('Please enter an amount of at least $1.00');
      return;
    }
    
    if (amount > 10000) {
      setErrorMessage('Please enter an amount less than $100.00');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // Create payment intent
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentType: 'membership',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment');
      }

      const { clientSecret } = await response.json();

      // Pass client secret and amount to parent
      onAmountSelected(clientSecret, amount);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Join Our PTSA</CardTitle>
        <CardDescription>
          Support your school community with an annual membership
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={selectedAmount} onValueChange={setSelectedAmount}>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="1500" id="r1" />
              <Label htmlFor="r1" className="flex-1 cursor-pointer">
                <div className="font-medium">Basic Membership - $15</div>
                <div className="text-sm text-gray-500">Essential member benefits</div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="2500" id="r2" />
              <Label htmlFor="r2" className="flex-1 cursor-pointer">
                <div className="font-medium">Supporting Membership - $25</div>
                <div className="text-sm text-gray-500">Help fund more programs</div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="5000" id="r3" />
              <Label htmlFor="r3" className="flex-1 cursor-pointer">
                <div className="font-medium">Patron Membership - $50</div>
                <div className="text-sm text-gray-500">Maximum impact for our school</div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="custom" id="r4" />
              <Label htmlFor="r4" className="flex-1 cursor-pointer">
                <div className="font-medium">Choose your amount</div>
                {selectedAmount === 'custom' && (
                  <div className="mt-2">
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      min="1"
                      max="100"
                      step="0.01"
                      className="w-32"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </Label>
            </div>
          </div>
        </RadioGroup>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleAmountContinue}
          disabled={isProcessing || (selectedAmount === 'custom' && !customAmount)}
          className="w-full"
          size="lg"
        >
          {isProcessing ? 'Processing...' : `Continue with ${formatAmountForDisplay(getPaymentAmount())}`}
        </Button>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Lock className="w-4 h-4" />
          <span>Secure payment powered by Stripe</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Component for processing payment (wrapped in Elements)
function PaymentForm({ amount, onSuccess }: { amount: number; onSuccess?: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/membership/payment-success`,
      },
    });

    if (error) {
      setErrorMessage(error.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Complete Your Payment</CardTitle>
          <CardDescription>
            Amount: {formatAmountForDisplay(amount)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <PaymentElement 
            options={{
              layout: 'tabs',
              defaultValues: {
                billingDetails: {
                  email: '',
                }
              }
            }}
          />

          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? 'Processing...' : 'Pay Now'}
          </Button>

          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Your payment info is secure and encrypted</span>
            </div>
            <p className="text-xs">
              You'll receive an email receipt after payment
            </p>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

// Main component that orchestrates the payment flow
export default function MembershipPaymentForm({ onSuccess }: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  
  const handleAmountSelected = (secret: string, amount: number) => {
    setClientSecret(secret);
    setPaymentAmount(amount);
  };

  if (!clientSecret) {
    return <AmountSelector onAmountSelected={handleAmountSelected} />;
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0070f3',
        colorBackground: '#ffffff',
        colorText: '#111827',
        colorDanger: '#dc2626',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm amount={paymentAmount} onSuccess={onSuccess} />
    </Elements>
  );
}