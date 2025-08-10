import * as React from 'react'
import {
  Button,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components'
import { BaseEmailTemplate } from './base-template'
import { format } from 'date-fns'

interface EventReminderEmailProps {
  recipientName: string
  eventName: string
  eventDate: Date
  eventTime: string
  eventLocation: string
  eventDescription?: string
  rsvpStatus: 'attending' | 'maybe' | 'not_attending'
  rsvpUrl: string
  directionsUrl?: string
  organizationName: string
  unsubscribeUrl?: string
}

export function EventReminderEmail({
  recipientName,
  eventName,
  eventDate,
  eventTime,
  eventLocation,
  eventDescription,
  rsvpStatus,
  rsvpUrl,
  directionsUrl,
  organizationName,
  unsubscribeUrl,
}: EventReminderEmailProps) {
  const isToday = format(eventDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  const isTomorrow = format(eventDate, 'yyyy-MM-dd') === format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')
  
  let dateLabel = format(eventDate, 'EEEE, MMMM d')
  if (isToday) dateLabel = 'TODAY'
  if (isTomorrow) dateLabel = 'TOMORROW'
  
  const preview = `${isTomorrow ? 'Tomorrow' : dateLabel}: ${eventName} at ${eventTime}`
  
  const rsvpStatusDisplay = {
    attending: { emoji: '✅', text: 'You\'re attending', color: '#28a745' },
    maybe: { emoji: '🤔', text: 'You might attend', color: '#ffc107' },
    not_attending: { emoji: '❌', text: 'You\'re not attending', color: '#dc3545' },
  }[rsvpStatus]
  
  return (
    <BaseEmailTemplate
      preview={preview}
      schoolName={organizationName}
      unsubscribeUrl={unsubscribeUrl}
      category="events"
    >
      <Section style={eventBox}>
        <Text style={eventIcon}>🎯</Text>
        <Text style={eventTitle}>{dateLabel}'S EVENT</Text>
        <Text style={eventNameText}>{eventName}</Text>
      </Section>

      <Section style={keyDetailsBox}>
        <Row style={detailRow}>
          <Column style={iconColumn}>📅</Column>
          <Column style={detailColumn}>
            <Text style={detailLabel}>WHEN</Text>
            <Text style={detailValue}>
              {format(eventDate, 'EEEE, MMMM d, yyyy')}<br />
              {eventTime}
            </Text>
          </Column>
        </Row>

        <Row style={detailRow}>
          <Column style={iconColumn}>📍</Column>
          <Column style={detailColumn}>
            <Text style={detailLabel}>WHERE</Text>
            <Text style={detailValue}>{eventLocation}</Text>
            <Text style={addressNote}>
              Copy this address for your GPS
            </Text>
          </Column>
        </Row>

        <Row style={detailRow}>
          <Column style={iconColumn}>{rsvpStatusDisplay.emoji}</Column>
          <Column style={detailColumn}>
            <Text style={detailLabel}>YOUR RSVP</Text>
            <Text style={{...detailValue, color: rsvpStatusDisplay.color}}>
              {rsvpStatusDisplay.text}
            </Text>
          </Column>
        </Row>
      </Section>

      {eventDescription && (
        <Section style={descriptionSection}>
          <Text style={descriptionTitle}>EVENT DETAILS</Text>
          <Text style={descriptionText}>{eventDescription}</Text>
        </Section>
      )}

      <Section style={reminderNote}>
        <Text style={reminderIcon}>📱</Text>
        <Text style={reminderText}>
          <strong>BRING THIS EMAIL</strong> to the event for easy check-in
        </Text>
      </Section>

      <Section style={buttonSection}>
        {directionsUrl && (
          <Button href={directionsUrl} style={primaryButton}>
            GET DIRECTIONS
          </Button>
        )}
        <Button href={rsvpUrl} style={secondaryButton}>
          CHANGE MY RSVP
        </Button>
      </Section>

      <Section style={whatToBringSection}>
        <Text style={sectionTitle}>WHAT TO BRING</Text>
        <Text style={listItem}>• Your enthusiasm!</Text>
        <Text style={listItem}>• Any items mentioned in event details</Text>
        <Text style={listItem}>• Friends and family (if it's an open event)</Text>
      </Section>

      <Section style={helpSection}>
        <Text style={helpText}>
          <strong>Questions about this event?</strong><br />
          Reply to this email and we'll help you out!
        </Text>
      </Section>
    </BaseEmailTemplate>
  )
}

const eventBox = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '8px',
  padding: '32px',
  marginBottom: '24px',
  textAlign: 'center' as const,
  color: '#ffffff',
}

const eventIcon = {
  fontSize: '48px',
  margin: '0 0 12px 0',
}

const eventTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  letterSpacing: '1px',
  margin: '0 0 8px 0',
  opacity: 0.9,
}

const eventNameText = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
}

const keyDetailsBox = {
  background: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '24px',
}

const detailRow = {
  marginBottom: '20px',
}

const iconColumn = {
  width: '40px',
  fontSize: '24px',
  verticalAlign: 'top' as const,
}

const detailColumn = {
  paddingLeft: '12px',
}

const detailLabel = {
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#666666',
  letterSpacing: '0.5px',
  marginBottom: '4px',
}

const detailValue = {
  fontSize: '16px',
  color: '#333333',
  lineHeight: '1.4',
  margin: '0',
  fontWeight: '500',
}

const addressNote = {
  fontSize: '12px',
  color: '#666666',
  fontStyle: 'italic',
  marginTop: '4px',
}

const descriptionSection = {
  marginBottom: '24px',
  padding: '16px',
  background: '#ffffff',
  border: '1px solid #e5e5e5',
  borderRadius: '8px',
}

const descriptionTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#666666',
  marginBottom: '8px',
  letterSpacing: '0.5px',
}

const descriptionText = {
  fontSize: '15px',
  color: '#333333',
  lineHeight: '1.5',
  margin: '0',
}

const reminderNote = {
  background: '#fff3cd',
  border: '1px solid #ffc107',
  padding: '16px',
  borderRadius: '8px',
  marginBottom: '24px',
  textAlign: 'center' as const,
}

const reminderIcon = {
  fontSize: '24px',
  marginBottom: '8px',
}

const reminderText = {
  fontSize: '14px',
  color: '#856404',
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
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '14px 28px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  marginBottom: '12px',
  width: '100%',
  maxWidth: '300px',
}

const secondaryButton = {
  backgroundColor: '#ffffff',
  border: '2px solid #0066cc',
  borderRadius: '8px',
  color: '#0066cc',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 26px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  width: '100%',
  maxWidth: '300px',
}

const whatToBringSection = {
  marginBottom: '24px',
}

const sectionTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#666666',
  marginBottom: '12px',
  letterSpacing: '0.5px',
}

const listItem = {
  fontSize: '14px',
  color: '#333333',
  lineHeight: '1.8',
  margin: '0',
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

export default EventReminderEmail