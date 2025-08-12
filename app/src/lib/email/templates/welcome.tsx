import * as React from 'react'
import {
  Button,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components'
import { BaseEmailTemplate } from './base-template'

interface WelcomeEmailProps {
  memberName: string
  membershipType: string
  organizationName: string
  loginEmail: string
  unsubscribeUrl?: string
}

export function WelcomeEmail({
  memberName,
  membershipType,
  organizationName,
  loginEmail,
  unsubscribeUrl,
}: WelcomeEmailProps) {
  const preview = `Welcome to ${organizationName}!`
  
  return (
    <BaseEmailTemplate
      preview={preview}
      schoolName={organizationName}
      unsubscribeUrl={unsubscribeUrl}
      category="announcements"
    >
      <Section style={keyInfoBox}>
        <Text style={successIcon}>✅</Text>
        <Text style={keyInfoTitle}>MEMBERSHIP CONFIRMED</Text>
        <Text style={keyInfoText}>Welcome to {organizationName}!</Text>
      </Section>

      <Section style={contentSection}>
        <Text style={greeting}>Hi {memberName},</Text>
        <Text style={bodyText}>
          Thank you for joining {organizationName}! Your {membershipType} membership is now active.
        </Text>
      </Section>

      <Section style={quickStartSection}>
        <Text style={sectionTitle}>WHAT'S NEXT? (5 minutes total)</Text>
        
        <Row style={stepRow}>
          <Column style={stepNumber}>1.</Column>
          <Column style={stepContent}>
            <Text style={stepText}>
              <strong>Set your email preferences</strong> (2 min)<br />
              Choose what updates you want to receive
            </Text>
          </Column>
        </Row>

        <Row style={stepRow}>
          <Column style={stepNumber}>2.</Column>
          <Column style={stepContent}>
            <Text style={stepText}>
              <strong>Browse upcoming events</strong> (1 min)<br />
              See what's happening at school
            </Text>
          </Column>
        </Row>

        <Row style={stepRow}>
          <Column style={stepNumber}>3.</Column>
          <Column style={stepContent}>
            <Text style={stepText}>
              <strong>Sign up to volunteer</strong> (2 min)<br />
              Find opportunities that fit your schedule
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={loginInfoSection}>
        <Text style={loginInfoTitle}>YOUR LOGIN INFO</Text>
        <Text style={loginInfoText}>
          📧 Email: {loginEmail}<br />
          🔐 Password: Use "Forgot Password" to set your password
        </Text>
      </Section>

      <Section style={buttonSection}>
        <Button href="https://ptsaplus.vercel.app/dashboard" style={primaryButton}>
          GET STARTED
        </Button>
      </Section>

      <Section style={helpSection}>
        <Text style={helpText}>
          <strong>Need help?</strong> Just reply to this email - a real person will help you!
        </Text>
      </Section>
    </BaseEmailTemplate>
  )
}

const keyInfoBox = {
  background: '#f0f7ff',
  borderLeft: '4px solid #0066cc',
  padding: '20px',
  marginBottom: '24px',
  borderRadius: '4px',
  textAlign: 'center' as const,
}

const successIcon = {
  fontSize: '32px',
  margin: '0 0 8px 0',
}

const keyInfoTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#0066cc',
  margin: '0 0 8px 0',
}

const keyInfoText = {
  fontSize: '16px',
  color: '#333333',
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
  margin: '0 0 16px 0',
}

const quickStartSection = {
  background: '#fafafa',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '24px',
}

const sectionTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#333333',
  marginBottom: '16px',
}

const stepRow = {
  marginBottom: '16px',
}

const stepNumber = {
  width: '32px',
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#0066cc',
  verticalAlign: 'top' as const,
}

const stepContent = {
  paddingLeft: '8px',
}

const stepText = {
  fontSize: '14px',
  color: '#333333',
  lineHeight: '1.5',
  margin: '0',
}

const loginInfoSection = {
  background: '#fff3cd',
  border: '1px solid #ffc107',
  padding: '16px',
  borderRadius: '4px',
  marginBottom: '24px',
}

const loginInfoTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#856404',
  marginBottom: '8px',
}

const loginInfoText = {
  fontSize: '14px',
  color: '#856404',
  lineHeight: '1.5',
  margin: '0',
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
  fontSize: '18px',
  fontWeight: 'bold',
  padding: '16px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
}

const helpSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const helpText = {
  fontSize: '14px',
  color: '#666666',
  lineHeight: '1.5',
}

export default WelcomeEmail