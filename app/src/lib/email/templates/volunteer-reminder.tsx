import * as React from 'react'
import {
  Button,
  Section,
  Text,
  Row,
  Column,
  Hr,
} from '@react-email/components'
import { BaseEmailTemplate } from './base-template'
import { format } from 'date-fns'

interface VolunteerReminderEmailProps {
  volunteerName: string
  eventName: string
  slot: string
  eventDate: Date
  eventTime: string
  eventLocation: string
  role: string
  coordinator: { name: string; phone: string; email: string }
  whatToBring?: string[]
  instructions?: string
  organizationName: string
  cancelUrl: string
  directionsUrl?: string
  unsubscribeUrl?: string
}

export function VolunteerReminderEmail({
  volunteerName,
  eventName,
  slot,
  eventDate,
  eventTime,
  eventLocation,
  role,
  coordinator,
  whatToBring,
  instructions,
  organizationName,
  cancelUrl,
  directionsUrl,
  unsubscribeUrl,
}: VolunteerReminderEmailProps) {
  const isToday = format(eventDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  const isTomorrow = format(eventDate, 'yyyy-MM-dd') === format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')
  
  let dateLabel = format(eventDate, 'EEEE, MMMM d')
  if (isToday) dateLabel = 'TODAY'
  if (isTomorrow) dateLabel = 'TOMORROW'
  
  const preview = `${isTomorrow ? 'Tomorrow' : dateLabel}: Volunteer shift at ${eventName} (${slot})`
  
  return (
    <BaseEmailTemplate
      preview={preview}
      schoolName={organizationName}
      unsubscribeUrl={unsubscribeUrl}
      category="volunteer"
    >
      <Section style={volunteerBox}>
        <Text style={volunteerIcon}>🙋‍♀️</Text>
        <Text style={volunteerTitle}>YOUR VOLUNTEER SHIFT</Text>
        <Text style={volunteerDate}>{dateLabel}</Text>
      </Section>

      <Section style={keyDetailsBox}>
        <Row style={detailRow}>
          <Column style={iconColumn}>🎯</Column>
          <Column style={detailColumn}>
            <Text style={detailLabel}>EVENT</Text>
            <Text style={detailValue}>{eventName}</Text>
          </Column>
        </Row>

        <Row style={detailRow}>
          <Column style={iconColumn}>📅</Column>
          <Column style={detailColumn}>
            <Text style={detailLabel}>DATE & TIME</Text>
            <Text style={detailValue}>
              {format(eventDate, 'EEEE, MMMM d, yyyy')}<br />
              {slot}
            </Text>
          </Column>
        </Row>

        <Row style={detailRow}>
          <Column style={iconColumn}>📍</Column>
          <Column style={detailColumn}>
            <Text style={detailLabel}>LOCATION</Text>
            <Text style={detailValue}>{eventLocation}</Text>
          </Column>
        </Row>

        <Row style={detailRow}>
          <Column style={iconColumn}>👤</Column>
          <Column style={detailColumn}>
            <Text style={detailLabel}>YOUR ROLE</Text>
            <Text style={detailValue}>{role}</Text>
          </Column>
        </Row>
      </Section>

      <Section style={contactBox}>
        <Text style={contactTitle}>DAY-OF CONTACT</Text>
        <Text style={contactInfo}>
          <strong>{coordinator.name}</strong><br />
          📱 {coordinator.phone} (call or text)<br />
          ✉️ {coordinator.email}
        </Text>
        <Text style={contactNote}>
          Save this number in your phone for tomorrow!
        </Text>
      </Section>

      {(whatToBring && whatToBring.length > 0) ? (
        <Section style={bringSection}>
          <Text style={sectionTitle}>WHAT TO BRING</Text>
          {whatToBring.map((item, index) => (
            <Text key={index} style={bringItem}>✓ {item}</Text>
          ))}
        </Section>
      ) : (
        <Section style={bringSection}>
          <Text style={sectionTitle}>WHAT TO BRING</Text>
          <Text style={bringItem}>✓ Nothing needed - just bring yourself!</Text>
        </Section>
      )}

      {instructions && (
        <Section style={instructionsSection}>
          <Text style={sectionTitle}>SPECIAL INSTRUCTIONS</Text>
          <Text style={instructionsText}>{instructions}</Text>
        </Section>
      )}

      <Section style={buttonSection}>
        {directionsUrl && (
          <Button href={directionsUrl} style={primaryButton}>
            GET DIRECTIONS
          </Button>
        )}
        <Button href={cancelUrl} style={cancelButton}>
          I CAN'T MAKE IT
        </Button>
      </Section>

      <Hr style={divider} />

      <Section style={thankYouSection}>
        <Text style={thankYouText}>
          <strong>Thank you for volunteering!</strong><br />
          Your help makes a huge difference for our students and school community.
        </Text>
      </Section>

      <Section style={reminderSection}>
        <Text style={reminderTitle}>HELPFUL REMINDERS</Text>
        <Text style={reminderItem}>• Arrive 5 minutes early if possible</Text>
        <Text style={reminderItem}>• Check in with {coordinator.name} when you arrive</Text>
        <Text style={reminderItem}>• Wear comfortable clothes and shoes</Text>
        <Text style={reminderItem}>• Bring a water bottle if you'll be outside</Text>
      </Section>
    </BaseEmailTemplate>
  )
}

const volunteerBox = {
  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
  borderRadius: '8px',
  padding: '32px',
  marginBottom: '24px',
  textAlign: 'center' as const,
  color: '#ffffff',
}

const volunteerIcon = {
  fontSize: '48px',
  margin: '0 0 12px 0',
}

const volunteerTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  letterSpacing: '1px',
  margin: '0 0 8px 0',
  opacity: 0.95,
}

const volunteerDate = {
  fontSize: '28px',
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

const contactBox = {
  background: '#d4edda',
  border: '1px solid #c3e6cb',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '24px',
}

const contactTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#155724',
  letterSpacing: '0.5px',
  marginBottom: '12px',
}

const contactInfo = {
  fontSize: '15px',
  color: '#155724',
  lineHeight: '1.6',
  marginBottom: '12px',
}

const contactNote = {
  fontSize: '13px',
  color: '#155724',
  fontStyle: 'italic',
  margin: '0',
}

const bringSection = {
  marginBottom: '24px',
}

const sectionTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#666666',
  letterSpacing: '0.5px',
  marginBottom: '12px',
}

const bringItem = {
  fontSize: '15px',
  color: '#333333',
  lineHeight: '1.8',
  margin: '0',
}

const instructionsSection = {
  background: '#fff3cd',
  border: '1px solid #ffc107',
  padding: '16px',
  borderRadius: '8px',
  marginBottom: '24px',
}

const instructionsText = {
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
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '14px 28px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  marginBottom: '12px',
  width: '100%',
  maxWidth: '300px',
}

const cancelButton = {
  backgroundColor: '#dc3545',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '14px 28px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  width: '100%',
  maxWidth: '300px',
}

const divider = {
  borderColor: '#e5e5e5',
  margin: '24px 0',
}

const thankYouSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
  padding: '20px',
  background: '#f0f7ff',
  borderRadius: '8px',
}

const thankYouText = {
  fontSize: '15px',
  color: '#0066cc',
  lineHeight: '1.5',
  margin: '0',
}

const reminderSection = {
  marginBottom: '24px',
}

const reminderTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#666666',
  letterSpacing: '0.5px',
  marginBottom: '12px',
}

const reminderItem = {
  fontSize: '14px',
  color: '#333333',
  lineHeight: '1.8',
  margin: '0',
}

export default VolunteerReminderEmail