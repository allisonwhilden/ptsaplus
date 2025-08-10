export interface EmailTemplate {
  id: string
  name: string
  subject: string
  category: 'welcome' | 'payment' | 'event' | 'announcement' | 'volunteer' | 'meeting'
}

export interface EmailOptions {
  to: string | string[]
  from?: string
  subject: string
  html?: string
  text?: string
  react?: React.ReactElement
  scheduledFor?: Date
  tags?: string[]
  metadata?: Record<string, any>
}

export interface EmailLog {
  id: string
  recipient: string
  subject: string
  template?: string
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'complained'
  metadata?: Record<string, any>
  error?: string
  sentAt?: Date
  deliveredAt?: Date
  createdAt: Date
}

export interface EmailQueueItem {
  id: string
  to: string | string[]
  subject: string
  template?: string
  data?: Record<string, any>
  scheduledFor?: Date
  attempts: number
  lastAttemptAt?: Date
  status: 'pending' | 'processing' | 'sent' | 'failed'
  error?: string
  createdAt: Date
}

export interface AnnouncementData {
  id: string
  title: string
  content: string
  type: 'general' | 'urgent' | 'event'
  audience: 'all' | 'members' | 'board' | 'committee_chairs' | 'teachers'
  createdBy: string
  publishedAt?: Date
  expiresAt?: Date
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CommunicationPreferences {
  userId: string
  emailEnabled: boolean
  emailFrequency: 'immediate' | 'daily' | 'weekly' | 'monthly'
  categories: {
    announcements: boolean
    events: boolean
    payments: boolean
    volunteer: boolean
    meetings: boolean
  }
  unsubscribedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface EmailTemplateData {
  welcome: {
    memberName: string
    membershipType: string
    organizationName: string
  }
  paymentConfirmation: {
    memberName: string
    amount: number
    paymentDate: Date
    receiptUrl?: string
    membershipType: string
  }
  eventReminder: {
    eventName: string
    eventDate: Date
    eventTime: string
    eventLocation: string
    eventDescription?: string
    rsvpUrl: string
  }
  announcement: {
    title: string
    content: string
    type: 'general' | 'urgent' | 'event'
    authorName: string
    authorRole: string
  }
  volunteerReminder: {
    volunteerName: string
    eventName: string
    slot: string
    eventDate: Date
    eventTime: string
    eventLocation: string
  }
  meetingMinutes: {
    meetingDate: Date
    meetingTitle: string
    attendees: string[]
    minutes: string
    actionItems?: string[]
    nextMeetingDate?: Date
  }
}