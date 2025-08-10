import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface BaseEmailTemplateProps {
  preview: string
  schoolName?: string
  children: React.ReactNode
  unsubscribeUrl?: string
  category?: string
}

export function BaseEmailTemplate({
  preview,
  schoolName = 'PTSA+',
  children,
  unsubscribeUrl,
  category,
}: BaseEmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>{schoolName}</Text>
          </Section>

          {children}

          {unsubscribeUrl && (
            <Section style={footer}>
              <Text style={footerText}>
                You're receiving this email because you're a member of {schoolName}.
              </Text>
              <Link href={unsubscribeUrl} style={footerLink}>
                Unsubscribe from {category ? `${category} emails` : 'these emails'}
              </Link>
            </Section>
          )}
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 16px',
  maxWidth: '600px',
}

const header = {
  borderBottom: '2px solid #0066cc',
  marginBottom: '24px',
  paddingBottom: '12px',
}

const headerText = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#0066cc',
  margin: '0',
}

const footer = {
  marginTop: '40px',
  paddingTop: '20px',
  borderTop: '1px solid #e5e5e5',
  textAlign: 'center' as const,
}

const footerText = {
  fontSize: '12px',
  color: '#666666',
  marginBottom: '8px',
}

const footerLink = {
  fontSize: '12px',
  color: '#0066cc',
  textDecoration: 'underline',
}