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
          paymentDate={data.paymentDate || new Date().toLocaleDateString()}
          paymentMethod={data.paymentMethod || 'Credit Card'}
          receiptNumber={data.receiptNumber || `RCP-${Date.now()}`}
          organizationName={data.organizationName || organizationName}
          unsubscribeUrl={data.unsubscribeUrl}
        />
      )
      break
      
    case 'event_reminder':
      emailComponent = (
        <EventReminderEmail
          memberName={memberName}
          eventName={data.eventName || 'Upcoming Event'}
          eventDate={data.eventDate || ''}
          eventTime={data.eventTime || ''}
          eventLocation={data.eventLocation || ''}
          eventDescription={data.eventDescription || ''}
          rsvpUrl={data.rsvpUrl || ''}
          organizationName={data.organizationName || organizationName}
          unsubscribeUrl={data.unsubscribeUrl}
        />
      )
      break
      
    case 'announcement':
      emailComponent = (
        <AnnouncementEmail
          memberName={memberName}
          title={data.title || 'Important Announcement'}
          content={data.content || ''}
          announcementType={data.announcementType || 'general'}
          organizationName={data.organizationName || organizationName}
          unsubscribeUrl={data.unsubscribeUrl}
        />
      )
      break
      
    case 'volunteer_reminder':
      emailComponent = (
        <VolunteerReminderEmail
          memberName={memberName}
          volunteerRole={data.volunteerRole || 'Volunteer'}
          shiftDate={data.shiftDate || ''}
          shiftTime={data.shiftTime || ''}
          location={data.location || ''}
          coordinator={data.coordinator || ''}
          coordinatorPhone={data.coordinatorPhone || ''}
          organizationName={data.organizationName || organizationName}
          unsubscribeUrl={data.unsubscribeUrl}
        />
      )
      break
      
    case 'meeting_minutes':
      emailComponent = (
        <MeetingMinutesEmail
          memberName={memberName}
          meetingDate={data.meetingDate || new Date().toLocaleDateString()}
          meetingType={data.meetingType || 'Board Meeting'}
          keyDecisions={data.keyDecisions || []}
          actionItems={data.actionItems || []}
          nextMeetingDate={data.nextMeetingDate || ''}
          organizationName={data.organizationName || organizationName}
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