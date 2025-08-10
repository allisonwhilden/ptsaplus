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

interface MeetingMinutesEmailProps {
  meetingDate: Date
  meetingTitle: string
  attendees: string[]
  keyDecisions: string[]
  actionItems?: Array<{
    task: string
    assignee: string
    deadline: string
  }>
  nextMeetingDate?: Date
  minutesUrl?: string
  recordingUrl?: string
  organizationName: string
  secretaryName: string
  unsubscribeUrl?: string
}

export function MeetingMinutesEmail({
  meetingDate,
  meetingTitle,
  attendees,
  keyDecisions,
  actionItems,
  nextMeetingDate,
  minutesUrl,
  recordingUrl,
  organizationName,
  secretaryName,
  unsubscribeUrl,
}: MeetingMinutesEmailProps) {
  const preview = `Meeting summary + your action items - ${meetingTitle}`
  const hasPersonalActions = actionItems && actionItems.length > 0
  
  return (
    <BaseEmailTemplate
      preview={preview}
      schoolName={organizationName}
      unsubscribeUrl={unsubscribeUrl}
      category="meetings"
    >
      <Section style={headerBox}>
        <Text style={headerIcon}>📝</Text>
        <Text style={headerTitle}>MEETING SUMMARY</Text>
        <Text style={meetingName}>{meetingTitle}</Text>
        <Text style={meetingDateText}>
          {format(meetingDate, 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
        </Text>
      </Section>

      {hasPersonalActions && (
        <Section style={actionAlertBox}>
          <Text style={actionAlertTitle}>⚡ YOU HAVE ACTION ITEMS</Text>
          <Text style={actionAlertText}>
            Scroll down to see your assigned tasks with deadlines
          </Text>
        </Section>
      )}

      <Section style={decisionsSection}>
        <Text style={sectionTitle}>DECISIONS MADE</Text>
        {keyDecisions.map((decision, index) => (
          <Text key={index} style={decisionItem}>
            <span style={bulletStyle}>•</span> {decision}
          </Text>
        ))}
      </Section>

      {hasPersonalActions && (
        <>
          <Hr style={divider} />
          <Section style={yourActionsSection}>
            <Text style={yourActionsTitle}>YOUR ACTION ITEMS</Text>
            {actionItems.map((item, index) => (
              <Section key={index} style={actionItemBox}>
                <Text style={actionCheckbox}>☐</Text>
                <Text style={actionTask}>{item.task}</Text>
                <Text style={actionMeta}>
                  Assigned to: <strong>{item.assignee}</strong><br />
                  Due by: <strong style={deadlineStyle}>{item.deadline}</strong>
                </Text>
              </Section>
            ))}
          </Section>
        </>
      )}

      <Section style={attendeesSection}>
        <Text style={sectionTitle}>ATTENDEES ({attendees.length})</Text>
        <Text style={attendeesList}>
          {attendees.join(', ')}
        </Text>
      </Section>

      {nextMeetingDate && (
        <Section style={nextMeetingBox}>
          <Text style={nextMeetingTitle}>NEXT MEETING</Text>
          <Text style={nextMeetingDate}>
            📅 {format(nextMeetingDate, 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
          </Text>
          <Button 
            href={`https://ptsaplus.vercel.app/events?date=${format(nextMeetingDate, 'yyyy-MM-dd')}`} 
            style={addToCalendarButton}
          >
            ADD TO CALENDAR
          </Button>
        </Section>
      )}

      <Section style={resourcesSection}>
        <Text style={sectionTitle}>MEETING RESOURCES</Text>
        <Text style={resourceItem}>
          {minutesUrl ? (
            <>📄 <Link href={minutesUrl} style={resourceLink}>View full meeting minutes</Link></>
          ) : (
            <>📄 Full minutes will be posted soon</>
          )}
        </Text>
        {recordingUrl && (
          <Text style={resourceItem}>
            🎥 <Link href={recordingUrl} style={resourceLink}>Watch meeting recording</Link>
          </Text>
        )}
        <Text style={resourceItem}>
          📧 <Link href={`mailto:${secretaryName.toLowerCase().replace(/\s+/g, '.')}@${organizationName.toLowerCase().replace(/\s+/g, '')}.org`} style={resourceLink}>
            Contact {secretaryName} with questions
          </Link>
        </Text>
      </Section>

      <Hr style={divider} />

      <Section style={reminderSection}>
        <Text style={reminderText}>
          <strong>Didn't attend?</strong> No worries! This summary contains everything you need to know. 
          Review your action items above and reach out if you have questions.
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

const headerIcon = {
  fontSize: '48px',
  margin: '0 0 12px 0',
}

const headerTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#666666',
  letterSpacing: '0.5px',
  marginBottom: '8px',
}

const meetingName = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#333333',
  marginBottom: '8px',
}

const meetingDateText = {
  fontSize: '14px',
  color: '#666666',
  margin: '0',
}

const actionAlertBox = {
  background: '#fff3cd',
  border: '2px solid #ffc107',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
  textAlign: 'center' as const,
}

const actionAlertTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#856404',
  marginBottom: '8px',
}

const actionAlertText = {
  fontSize: '14px',
  color: '#856404',
  margin: '0',
}

const decisionsSection = {
  marginBottom: '24px',
}

const sectionTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#666666',
  letterSpacing: '0.5px',
  marginBottom: '12px',
}

const decisionItem = {
  fontSize: '15px',
  color: '#333333',
  lineHeight: '1.8',
  marginBottom: '8px',
}

const bulletStyle = {
  color: '#0066cc',
  fontWeight: 'bold',
  marginRight: '8px',
}

const divider = {
  borderColor: '#e5e5e5',
  margin: '24px 0',
}

const yourActionsSection = {
  marginBottom: '24px',
}

const yourActionsTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#dc3545',
  marginBottom: '16px',
}

const actionItemBox = {
  background: '#f8d7da',
  border: '1px solid #f5c6cb',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '12px',
  position: 'relative' as const,
}

const actionCheckbox = {
  fontSize: '24px',
  position: 'absolute' as const,
  left: '16px',
  top: '16px',
}

const actionTask = {
  fontSize: '15px',
  fontWeight: 'bold',
  color: '#721c24',
  marginLeft: '36px',
  marginBottom: '8px',
}

const actionMeta = {
  fontSize: '13px',
  color: '#721c24',
  marginLeft: '36px',
  lineHeight: '1.5',
}

const deadlineStyle = {
  color: '#dc3545',
  textDecoration: 'underline',
}

const attendeesSection = {
  marginBottom: '24px',
}

const attendeesList = {
  fontSize: '14px',
  color: '#666666',
  lineHeight: '1.5',
  margin: '0',
}

const nextMeetingBox = {
  background: '#d4edda',
  border: '1px solid #c3e6cb',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
  textAlign: 'center' as const,
}

const nextMeetingTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#155724',
  letterSpacing: '0.5px',
  marginBottom: '12px',
}

const nextMeetingDate = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#155724',
  marginBottom: '16px',
}

const addToCalendarButton = {
  backgroundColor: '#28a745',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '10px 20px',
  textDecoration: 'none',
  textAlign: 'center' as const,
}

const resourcesSection = {
  marginBottom: '24px',
}

const resourceItem = {
  fontSize: '14px',
  color: '#333333',
  lineHeight: '1.8',
  marginBottom: '8px',
}

const resourceLink = {
  color: '#0066cc',
  textDecoration: 'underline',
}

const reminderSection = {
  background: '#f0f7ff',
  padding: '16px',
  borderRadius: '8px',
  marginBottom: '24px',
}

const reminderText = {
  fontSize: '14px',
  color: '#0066cc',
  lineHeight: '1.5',
  margin: '0',
}

export default MeetingMinutesEmail