'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';
import { formatAmountForDisplay } from '@/lib/stripe/client';

interface PaymentConfirmationProps {
  status: 'success' | 'failed' | 'processing';
  amount?: number;
  errorMessage?: string;
  paymentIntentId?: string;
}

export default function PaymentConfirmation({ 
  status, 
  amount, 
  errorMessage,
  paymentIntentId 
}: PaymentConfirmationProps) {
  if (status === 'processing') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <CardTitle>Processing Your Payment</CardTitle>
          <CardDescription>
            Please wait while we confirm your payment...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status === 'failed') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <CardTitle>Payment Failed</CardTitle>
          <CardDescription>
            We couldn&apos;t process your payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-sm text-gray-600">
            <p>Common reasons for payment failure:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Insufficient funds</li>
              <li>Incorrect card information</li>
              <li>Card declined by bank</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/membership/pay">
                Try Again
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">
                Return to Dashboard
                <Home className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <CardTitle>Payment Successful!</CardTitle>
        <CardDescription>
          Thank you for joining our PTSA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Amount paid</span>
            <span className="font-medium">
              {amount ? formatAmountForDisplay(amount) : 'N/A'}
            </span>
          </div>
          {paymentIntentId && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Confirmation #</span>
              <span className="text-sm font-mono">{paymentIntentId.slice(-8)}</span>
            </div>
          )}
        </div>

        <Alert>
          <AlertDescription>
            A receipt has been sent to your email address. You can also view your payment history in your account dashboard.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-2">What&apos;s next?</p>
            <ul className="space-y-1">
              <li>• You now have full access to member benefits</li>
              <li>• Join committees and volunteer for events</li>
              <li>• Vote in PTSA elections and decisions</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/events">
                Browse Upcoming Events
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}