import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import MembershipPaymentForm from '@/components/payments/MembershipPaymentForm';

export default async function PaymentPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in?redirect_url=/membership/pay');
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">PTSA Membership</h1>
        <p className="text-gray-600">
          Join our school community and make a difference
        </p>
      </div>

      <MembershipPaymentForm />

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Questions about membership? Contact us at{' '}
          <a href="mailto:membership@ptsa.org" className="text-primary hover:underline">
            membership@ptsa.org
          </a>
        </p>
      </div>
    </div>
  );
}