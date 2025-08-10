import * as React from 'react'
import {
  Button,
  Section,
  Text,
  Hr,
} from '@react-email/components'
import { BaseEmailTemplate } from './base-template'

interface AnnouncementEmailProps {
  title: string
  content: string
  type: 'general' | 'urgent' | 'event'
  authorName: string
  authorRole: string
  organizationName: string
  actionItems?: Array<{ text: string; deadline?: string }>
  ctaButton?: { text: string; url: string }
  unsubscribeUrl?: string
}

export function AnnouncementEmail({
  title,
  content,
  type,
  authorName,
  authorRole,
  organizationName,
  actionItems,
  ctaButton,
  unsubscribeUrl,
}: AnnouncementEmailProps) {
  const typeConfig = {
    general: { emoji: '📢', label: 'ANNOUNCEMENT', color: '#0066cc' },
    urgent: { emoji: '🚨', label: 'URGENT', color: '#dc3545' },
    event: { emoji: '🎉', label: 'EVENT UPDATE', color: '#28a745' },
  }[type]
  
  const preview = `${type === 'urgent' ? 'URGENT: ' : ''}${title}`
  
  const contentParagraphs = content.split('\n\n').filter(p => p.trim())
  
  return (
    <BaseEmailTemplate
      preview={preview}
      schoolName={organizationName}
      unsubscribeUrl={unsubscribeUrl}
      category="announcements"
    >
      <Section style={headerBox}>
        <Text style={typeLabel}>
          <span style={{ fontSize: '20px', marginRight: '8px' }}>{typeConfig.emoji}</span>
          {typeConfig.label}
        </Text>
        <Text style={titleText}>{title}</Text>
      </Section>

      {type === 'urgent' && (
        <Section style={urgentSummaryBox}>
          <Text style={urgentSummaryText}>
            <strong>QUICK SUMMARY:</strong> {contentParagraphs[0]}
          </Text>
        </Section>
      )}

      <Section style={contentSection}>
        {contentParagraphs.map((paragraph, index) => (
          <Text key={index} style={bodyText}>
            {paragraph}
          </Text>
        ))}
      </Section>

      {actionItems && actionItems.length > 0 && (
        <>
          <Hr style={divider} />
          <Section style={actionSection}>
            <Text style={actionTitle}>WHAT YOU NEED TO DO:</Text>
            {actionItems.map((item, index) => (
              <Text key={index} style={actionItem}>
                <span style={checkboxStyle}>☐</span> {item.text}
                {item.deadline && (
                  <span style={deadlineStyle}> (by {item.deadline})</span>
                )}
              </Text>
            ))}
          </Section>
        </>
      )}

      {ctaButton && (
        <Section style={buttonSection}>
          <Button href={ctaButton.url} style={primaryButton}>
            {ctaButton.text}
          </Button>
        </Section>
      )}

      <Hr style={divider} />

      <Section style={fromSection}>
        <Text style={fromText}>
          <strong>FROM:</strong> {authorName}, {authorRole}<br />
          <strong>QUESTIONS?</strong> Reply to this email
        </Text>
      </Section>
    </BaseEmailTemplate>
  )
}

const headerBox = {
  background: '#f8f9fa',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '24px',
  textAlign: 'center' as const,
}

const typeLabel = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#666666',
  letterSpacing: '0.5px',
  marginBottom: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const titleText = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#333333',
  margin: '0',
  lineHeight: '1.3',
}

const urgentSummaryBox = {
  background: '#f8d7da',
  border: '1px solid #f5c6cb',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
}

const urgentSummaryText = {
  fontSize: '15px',
  color: '#721c24',
  lineHeight: '1.5',
  margin: '0',
}

const contentSection = {
  marginBottom: '24px',
}

const bodyText = {
  fontSize: '16px',
  color: '#333333',
  lineHeight: '1.6',
  marginBottom: '16px',
}

const divider = {
  borderColor: '#e5e5e5',
  margin: '24px 0',
}

const actionSection = {
  background: '#fff3cd',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '24px',
}

const actionTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#856404',
  letterSpacing: '0.5px',
  marginBottom: '16px',
}

const actionItem = {
  fontSize: '15px',
  color: '#856404',
  lineHeight: '1.8',
  margin: '0 0 12px 0',
}

const checkboxStyle = {
  fontSize: '18px',
  marginRight: '8px',
}

const deadlineStyle = {
  fontWeight: 'bold',
  color: '#dc3545',
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

const fromSection = {
  marginBottom: '24px',
}

const fromText = {
  fontSize: '14px',
  color: '#666666',
  lineHeight: '1.6',
}

export default AnnouncementEmail