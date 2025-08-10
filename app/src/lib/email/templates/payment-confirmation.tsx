import * as React from 'react'
import {
  Button,
  Section,
  Text,
  Hr,
  Link,
} from '@react-email/components'
import { BaseEmailTemplate } from './base-template'
import { format } from 'date-fns'

interface PaymentConfirmationEmailProps {
  memberName: string
  amount: number
  paymentDate: Date
  receiptUrl?: string
  membershipType: string
  organizationName: string
  membershipExpiresAt: Date
  unsubscribeUrl?: string
}

export function PaymentConfirmationEmail({
  memberName,
  amount,
  paymentDate,
  receiptUrl,
  membershipType,
  organizationName,
  membershipExpiresAt,
  unsubscribeUrl,
}: PaymentConfirmationEmailProps) {
  const preview = `Payment confirmed - $${amount} membership dues`
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
  
  return (
    <BaseEmailTemplate
      preview={preview}
      schoolName={organizationName}
      unsubscribeUrl={unsubscribeUrl}
      category="payments"
    >
      <Section style={successBox}>
        <Text style={successIcon}>✅</Text>
        <Text style={successTitle}>PAYMENT SUCCESS</Text>
        <Text style={successAmount}>{formattedAmount}</Text>
        <Text style={successDate}>
          {format(paymentDate, 'MMMM d, yyyy \'at\' h:mm a')}
        </Text>
      </Section>

      <Section style={contentSection}>
        <Text style={greeting}>Hi {memberName},</Text>
        <Text style={bodyText}>
          Thank you for your payment! Your {membershipType} membership dues have been successfully processed.
        </Text>
      </Section>

      <Section style={detailsBox}>
        <Text style={detailsTitle}>PAYMENT DETAILS</Text>
        
        <Text style={detailRow}>
          <strong>Amount Paid:</strong> {formattedAmount}
        </Text>
        <Text style={detailRow}>
          <strong>Payment Date:</strong> {format(paymentDate, 'MMMM d, yyyy')}
        </Text>
        <Text style={detailRow}>
          <strong>Membership Type:</strong> {membershipType}
        </Text>
        <Text style={detailRow}>
          <strong>Valid Through:</strong> {format(membershipExpiresAt, 'MMMM d, yyyy')}
        </Text>
      </Section>

      {receiptUrl && (
        <Section style={buttonSection}>
          <Button href={receiptUrl} style={primaryButton}>
            DOWNLOAD RECEIPT (PDF)
          </Button>
          <Text style={taxNote}>
            Save this receipt for tax purposes. Membership dues may be tax-deductible.
          </Text>
        </Section>
      )}

      <Section style={membershipBenefitsSection}>
        <Text style={benefitsTitle}>YOUR MEMBERSHIP INCLUDES:</Text>
        <Text style={benefitItem}>• Voting rights in PTSA decisions</Text>
        <Text style={benefitItem}>• Access to member-only events</Text>
        <Text style={benefitItem}>• School directory access</Text>
        <Text style={benefitItem}>• Volunteer opportunities</Text>
        <Text style={benefitItem}>• Monthly newsletter</Text>
      </Section>

      <Hr style={divider} />

      <Section style={helpSection}>
        <Text style={helpTitle}>QUESTIONS?</Text>
        <Text style={helpText}>
          • Reply to this email for payment questions<br />
          • Visit your <Link href="https://ptsaplus.vercel.app/membership" style={inlineLink}>account page</Link> to view payment history<br />
          • Contact treasurer@{organizationName.toLowerCase().replace(/\s+/g, '')}.org for tax questions
        </Text>
      </Section>

      <Section style={importantNote}>
        <Text style={noteText}>
          <strong>Important:</strong> This is your official payment confirmation. 
          Please save this email for your records.
        </Text>
      </Section>
    </BaseEmailTemplate>
  )
}

const successBox = {
  background: '#d4edda',
  border: '1px solid #c3e6cb',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '24px',
  textAlign: 'center' as const,
}

const successIcon = {
  fontSize: '48px',
  margin: '0 0 12px 0',
}

const successTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#155724',
  margin: '0 0 12px 0',
}

const successAmount = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#155724',
  margin: '0 0 8px 0',
}

const successDate = {
  fontSize: '14px',
  color: '#155724',
  margin: '0',
}

const contentSection = {
  marginBottom: '24px',
}

const greeting = {
  fontSize: '16px',
  color: '#333333',
  marginBottom: '12px',
}

const bodyText = {
  fontSize: '16px',
  color: '#333333',
  lineHeight: '1.5',
  margin: '0',
}

const detailsBox = {
  background: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '24px',
}

const detailsTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#666666',
  marginBottom: '16px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const detailRow = {
  fontSize: '15px',
  color: '#333333',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
}

const buttonSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const primaryButton = {
  backgroundColor: '#0066cc',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '14px 28px',
  textDecoration: 'none',
  textAlign: 'center' as const,
}

const taxNote = {
  fontSize: '12px',
  color: '#666666',
  marginTop: '12px',
  fontStyle: 'italic',
}

const membershipBenefitsSection = {
  background: '#f0f7ff',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '24px',
}

const benefitsTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#0066cc',
  marginBottom: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const benefitItem = {
  fontSize: '14px',
  color: '#333333',
  lineHeight: '1.8',
  margin: '0',
}

const divider = {
  borderColor: '#e5e5e5',
  margin: '24px 0',
}

const helpSection = {
  marginBottom: '24px',
}

const helpTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#666666',
  marginBottom: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const helpText = {
  fontSize: '14px',
  color: '#666666',
  lineHeight: '1.6',
  margin: '0',
}

const inlineLink = {
  color: '#0066cc',
  textDecoration: 'underline',
}

const importantNote = {
  background: '#fff3cd',
  border: '1px solid #ffc107',
  padding: '12px',
  borderRadius: '4px',
  marginBottom: '24px',
}

const noteText = {
  fontSize: '13px',
  color: '#856404',
  margin: '0',
}

export default PaymentConfirmationEmail