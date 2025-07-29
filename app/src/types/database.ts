export interface Organization {
  id: string
  name: string
  slug: string
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  clerk_id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type MemberRole = 'admin' | 'treasurer' | 'member' | 'parent'

export interface OrganizationMember {
  id: string
  user_id: string
  organization_id: string
  role: MemberRole
  created_at: string
  updated_at: string
  user?: User
  organization?: Organization
}

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'
export type PaymentType = 'membership_dues' | 'donation' | 'event_ticket' | 'fundraiser'

export interface Payment {
  id: string
  organization_id: string
  user_id: string | null
  stripe_payment_intent_id: string | null
  amount: number // in cents
  currency: string
  status: PaymentStatus
  payment_type: PaymentType
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  user?: User
  organization?: Organization
}