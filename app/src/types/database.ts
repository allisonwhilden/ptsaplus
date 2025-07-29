// Single PTSA Database Types

export type UserRole = 'admin' | 'board' | 'committee_chair' | 'member' | 'teacher'
export type MembershipType = 'individual' | 'family' | 'teacher'
export type MembershipStatus = 'active' | 'pending' | 'expired'
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'
export type PaymentType = 'membership_dues' | 'donation' | 'event_ticket' | 'fundraiser'
export type AnnouncementPriority = 'urgent' | 'high' | 'normal' | 'low'
export type AnnouncementAudience = 'all' | 'members' | 'board' | 'committees'
export type DocumentAccessLevel = 'public' | 'members' | 'board'

// Privacy-compliant user interface
export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  member_id: string | null
  created_at: string
  updated_at: string | null
  deleted_at: string | null
}

// Student information with privacy controls
export interface StudentInfo {
  name: string | null
  grade: string | null
  // Additional fields can be added as needed with proper privacy controls
}

// Privacy-compliant member interface
export interface Member {
  id: string
  user_id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  membership_type: MembershipType
  membership_status: MembershipStatus
  membership_expires_at: string | null
  student_info: StudentInfo | null // FERPA-protected data
  volunteer_interests: string[] | null
  privacy_consent_given: boolean
  parent_consent_required: boolean // COPPA compliance
  parent_consent_given: boolean | null
  joined_at: string
  updated_at: string | null
  deleted_at: string | null
}

export interface Payment {
  id: string
  user_id: string | null
  stripe_payment_intent_id: string | null
  amount: number // in cents
  currency: string
  status: PaymentStatus
  payment_type: PaymentType
  description: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  user?: User
}

export interface Event {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  location: string | null
  max_volunteers: number | null
  is_public: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  creator?: User
  volunteers?: EventVolunteer[]
}

export interface EventVolunteer {
  id: string
  event_id: string
  user_id: string
  role: string | null
  hours_committed: number | null
  notes: string | null
  created_at: string
  event?: Event
  user?: User
}

export interface Committee {
  id: string
  name: string
  description: string | null
  chair_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  chair?: User
  members?: CommitteeMember[]
}

export interface CommitteeMember {
  id: string
  committee_id: string
  user_id: string
  role: string
  joined_date: string
  committee?: Committee
  user?: User
}

export interface Announcement {
  id: string
  title: string
  content: string
  priority: AnnouncementPriority
  target_audience: AnnouncementAudience
  published_by: string | null
  published_at: string
  expires_at: string | null
  created_at: string
  updated_at: string
  publisher?: User
}

export interface Document {
  id: string
  title: string
  description: string | null
  file_url: string | null
  file_size: number | null
  file_type: string | null
  category: string | null
  access_level: DocumentAccessLevel
  uploaded_by: string | null
  created_at: string
  updated_at: string
  uploader?: User
}

export interface Settings {
  id: number
  ptsa_name: string
  school_name: string | null
  logo_url: string | null
  primary_color: string | null
  membership_fee_individual: number // in cents
  membership_fee_family: number // in cents
  fiscal_year_start: number // month (1-12)
  payment_settings: Record<string, any>
  email_settings: Record<string, any>
  updated_at: string
}