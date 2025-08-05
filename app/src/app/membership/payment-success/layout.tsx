// Force dynamic rendering for payment success page
export const dynamic = 'force-dynamic';
export const revalidate = false;

export default function PaymentSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}