import * as React from 'react'
import { render } from '@react-email/render'
import {
  WelcomeEmail,
  PaymentConfirmationEmail,
  EventReminderEmail,
  AnnouncementEmail,
  VolunteerReminderEmail,
  MeetingMinutesEmail,
} from './templates'

export interface TemplateData {
  // Common fields
  memberName?: string
  firstName?: string
  lastName?: string
  
  // Welcome email
  membershipType?: string
  organizationName?: string
  loginEmail?: string
  
  // Payment confirmation
  amount?: number
  paymentDate?: string
  paymentMethod?: string
  receiptNumber?: string
  
  // Event reminder
  eventName?: string
  eventDate?: string
  eventTime?: string
  eventLocation?: string
  eventDescription?: string
  rsvpUrl?: string
  
  // Announcement
  title?: string
  content?: string
  announcementType?: string
  
  // Volunteer reminder
  volunteerRole?: string
  shiftDate?: string
  shiftTime?: string
  location?: string
  coordinator?: string
  coordinatorPhone?: string
  
  // Meeting minutes
  meetingDate?: string
  meetingType?: string
  keyDecisions?: string[]
  actionItems?: string[]
  nextMeetingDate?: string
  
  // Common
  unsubscribeUrl?: string
}

export async function renderEmailTemplate(
  template: string,
  data: TemplateData
): Promise<{ html: string; text: string }> {
  const organizationName = 'PTSA+' // Default, should come from settings
  const memberName = data.memberName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Member'
  
  let emailComponent: React.ReactElement | null = null
  
  switch (template) {
    case 'welcome':
      emailComponent = (
        <WelcomeEmail
          memberName={memberName}
          membershipType={data.membershipType || 'Standard'}
          organizationName={data.organizationName || organizationName}
          loginEmail={data.loginEmail || ''}
          unsubscribeUrl={data.unsubscribeUrl}
        />
      )
      break
      
    case 'payment_confirmation':
      emailComponent = (
        <PaymentConfirmationEmail
          memberName={memberName}
          amount={data.amount || 0}
          paymentDate={data.paymentDate ? new Date(data.paymentDate) : new Date()}
          receiptUrl={undefined}
          membershipType={data.membershipType || 'Standard'}
          organizationName={data.organizationName || organizationName}
          membershipExpiresAt={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // 1 year from now
          unsubscribeUrl={data.unsubscribeUrl}
        />
      )
      break
      
    case 'event_reminder':
      emailComponent = (
        <EventReminderEmail
          recipientName={memberName}
          eventName={data.eventName || 'Upcoming Event'}
          eventDate={data.eventDate ? new Date(data.eventDate) : new Date()}
          eventTime={data.eventTime || ''}
          eventLocation={data.eventLocation || ''}
          eventDescription={data.eventDescription}
          rsvpStatus={'maybe'}
          rsvpUrl={data.rsvpUrl || '#'}
          directionsUrl={undefined}
          organizationName={data.organizationName || organizationName}
          unsubscribeUrl={data.unsubscribeUrl}
        />
      )
      break
      
    case 'announcement':
      emailComponent = (
        <AnnouncementEmail
          title={data.title || 'Important Announcement'}
          content={data.content || ''}
          type={(data.announcementType || 'general') as 'general' | 'urgent' | 'event'}
          authorName={'PTSA Board'}
          authorRole={'Administrator'}
          organizationName={data.organizationName || organizationName}
          actionItems={undefined}
          ctaButton={undefined}
          unsubscribeUrl={data.unsubscribeUrl}
        />
      )
      break
      
    case 'volunteer_reminder':
      emailComponent = (
        <VolunteerReminderEmail
          volunteerName={memberName}
          eventName={data.eventName || 'Volunteer Event'}
          slot={data.volunteerRole || 'Volunteer'}
          eventDate={data.shiftDate ? new Date(data.shiftDate) : new Date()}
          eventTime={data.shiftTime || ''}
          eventLocation={data.location || ''}
          role={data.volunteerRole || 'Volunteer'}
          coordinator={{
            name: data.coordinator || 'Volunteer Coordinator',
            phone: data.coordinatorPhone || '',
            email: ''
          }}
          whatToBring={undefined}
          instructions={undefined}
          organizationName={data.organizationName || organizationName}
          cancelUrl={'#'}
          directionsUrl={undefined}
          unsubscribeUrl={data.unsubscribeUrl}
        />
      )
      break
      
    case 'meeting_minutes':
      emailComponent = (
        <MeetingMinutesEmail
          meetingDate={data.meetingDate ? new Date(data.meetingDate) : new Date()}
          meetingTitle={data.meetingType || 'Board Meeting'}
          attendees={[]} // Would be populated from actual data
          keyDecisions={data.keyDecisions || []}
          actionItems={data.actionItems ? 
            data.actionItems.map(item => ({
              task: typeof item === 'string' ? item : item,
              assignee: 'TBD',
              deadline: ''
            })) : []
          }
          nextMeetingDate={data.nextMeetingDate ? new Date(data.nextMeetingDate) : undefined}
          minutesUrl={undefined}
          recordingUrl={undefined}
          organizationName={data.organizationName || organizationName}
          secretaryName={'PTSA Secretary'}
          unsubscribeUrl={data.unsubscribeUrl}
        />
      )
      break
      
    default:
      // Fallback to simple HTML if template not found
      return {
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${data.title || 'PTSA+ Notification'}</h2>
            <p>Dear ${memberName},</p>
            <p>${data.content || 'You have a new notification from PTSA+.'}</p>
            <p>Best regards,<br/>PTSA+ Team</p>
            ${data.unsubscribeUrl ? `<p style="font-size: 12px; color: #666;"><a href="${data.unsubscribeUrl}">Unsubscribe</a></p>` : ''}
          </div>
        `,
        text: `${data.title || 'PTSA+ Notification'}\n\nDear ${memberName},\n\n${data.content || 'You have a new notification from PTSA+.'}\n\nBest regards,\nPTSA+ Team`,
      }
  }
  
  if (!emailComponent) {
    throw new Error(`Unknown email template: ${template}`)
  }
  
  // Render the email component to HTML and text
  const html = await render(emailComponent)
  const text = await render(emailComponent, { plainText: true })
  
  return { html, text }
}