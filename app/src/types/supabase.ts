// Generated types for Supabase database schema
// This file should be regenerated when database schema changes
// Run: supabase gen types typescript --project-id <project-id> > src/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string
          user_id: string
          email: string
          first_name: string
          last_name: string
          phone: string | null
          membership_type: 'individual' | 'family' | 'teacher'
          membership_status: 'active' | 'pending' | 'expired'
          membership_expires_at: string | null
          student_info: Json | null
          volunteer_interests: string[] | null
          privacy_consent_given: boolean
          parent_consent_required: boolean
          parent_consent_given: boolean | null
          joined_at: string
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          first_name: string
          last_name: string
          phone?: string | null
          membership_type: 'individual' | 'family' | 'teacher'
          membership_status?: 'active' | 'pending' | 'expired'
          membership_expires_at?: string | null
          student_info?: Json | null
          volunteer_interests?: string[] | null
          privacy_consent_given?: boolean
          parent_consent_required?: boolean
          parent_consent_given?: boolean | null
          joined_at?: string
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          membership_type?: 'individual' | 'family' | 'teacher'
          membership_status?: 'active' | 'pending' | 'expired'
          membership_expires_at?: string | null
          student_info?: Json | null
          volunteer_interests?: string[] | null
          privacy_consent_given?: boolean
          parent_consent_required?: boolean
          parent_consent_given?: boolean | null
          joined_at?: string
          updated_at?: string | null
          deleted_at?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: 'admin' | 'board' | 'committee_chair' | 'member' | 'teacher'
          member_id: string | null
          created_at: string
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          role?: 'admin' | 'board' | 'committee_chair' | 'member' | 'teacher'
          member_id?: string | null
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: 'admin' | 'board' | 'committee_chair' | 'member' | 'teacher'
          member_id?: string | null
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string | null
          stripe_payment_intent_id: string | null
          amount: number
          currency: string
          status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'
          payment_type: 'membership_dues' | 'donation' | 'event_ticket' | 'fundraiser'
          description: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          stripe_payment_intent_id?: string | null
          amount: number
          currency: string
          status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'
          payment_type: 'membership_dues' | 'donation' | 'event_ticket' | 'fundraiser'
          description?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          stripe_payment_intent_id?: string | null
          amount?: number
          currency?: string
          status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'
          payment_type?: 'membership_dues' | 'donation' | 'event_ticket' | 'fundraiser'
          description?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
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
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_date: string
          end_date?: string | null
          location?: string | null
          max_volunteers?: number | null
          is_public?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string | null
          location?: string | null
          max_volunteers?: number | null
          is_public?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      event_volunteers: {
        Row: {
          id: string
          event_id: string
          user_id: string
          role: string | null
          hours_committed: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          role?: string | null
          hours_committed?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          role?: string | null
          hours_committed?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      committees: {
        Row: {
          id: string
          name: string
          description: string | null
          chair_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          chair_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          chair_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      committee_members: {
        Row: {
          id: string
          committee_id: string
          user_id: string
          role: string
          joined_date: string
        }
        Insert: {
          id?: string
          committee_id: string
          user_id: string
          role: string
          joined_date?: string
        }
        Update: {
          id?: string
          committee_id?: string
          user_id?: string
          role?: string
          joined_date?: string
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          priority: 'urgent' | 'high' | 'normal' | 'low'
          target_audience: 'all' | 'members' | 'board' | 'committees'
          published_by: string | null
          published_at: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          priority?: 'urgent' | 'high' | 'normal' | 'low'
          target_audience?: 'all' | 'members' | 'board' | 'committees'
          published_by?: string | null
          published_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          priority?: 'urgent' | 'high' | 'normal' | 'low'
          target_audience?: 'all' | 'members' | 'board' | 'committees'
          published_by?: string | null
          published_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          title: string
          description: string | null
          file_url: string | null
          file_size: number | null
          file_type: string | null
          category: string | null
          access_level: 'public' | 'members' | 'board'
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          file_url?: string | null
          file_size?: number | null
          file_type?: string | null
          category?: string | null
          access_level?: 'public' | 'members' | 'board'
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          file_url?: string | null
          file_size?: number | null
          file_type?: string | null
          category?: string | null
          access_level?: 'public' | 'members' | 'board'
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          id: number
          ptsa_name: string
          school_name: string | null
          logo_url: string | null
          primary_color: string | null
          membership_fee_individual: number
          membership_fee_family: number
          fiscal_year_start: number
          payment_settings: Json
          email_settings: Json
          updated_at: string
        }
        Insert: {
          id?: number
          ptsa_name: string
          school_name?: string | null
          logo_url?: string | null
          primary_color?: string | null
          membership_fee_individual?: number
          membership_fee_family?: number
          fiscal_year_start?: number
          payment_settings?: Json
          email_settings?: Json
          updated_at?: string
        }
        Update: {
          id?: number
          ptsa_name?: string
          school_name?: string | null
          logo_url?: string | null
          primary_color?: string | null
          membership_fee_individual?: number
          membership_fee_family?: number
          fiscal_year_start?: number
          payment_settings?: Json
          email_settings?: Json
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}