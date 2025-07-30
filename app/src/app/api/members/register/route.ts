import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient()
    // Verify the user is authenticated
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate the userId matches
    if (body.userId !== userId) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 403 })
    }

    const {
      email,
      firstName,
      lastName,
      phone,
      membershipType,
      studentName,
      studentGrade,
      hasStudentInfo,
      volunteerInterest,
      membershipAmount,
      consentData,
    } = body

    // Get IP address for audit logging
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip')

    // Check if member already exists
    const { data: existingMember } = await supabase
      .from('members')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'Member already registered' },
        { status: 400 }
      )
    }

    // Create the member record with privacy compliance
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert({
        user_id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        membership_type: membershipType,
        membership_status: membershipAmount > 0 ? 'pending' : 'active',
        membership_expires_at: membershipAmount > 0 
          ? null 
          : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        // Only store student info if explicitly consented to
        student_info: hasStudentInfo && consentData?.studentData && (studentName || studentGrade)
          ? {
              name: studentName || null,
              grade: studentGrade || null,
            }
          : null,
        volunteer_interests: volunteerInterest ? ['general'] : null,
        // Privacy compliance fields
        privacy_consent_given: consentData?.privacy || false,
        parent_consent_required: false, // TODO: Implement age verification for COPPA
        parent_consent_given: consentData?.parentalConsent || null,
        consent_date: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (memberError) {
      console.error('Error creating member:', memberError)
      return NextResponse.json(
        { error: 'Failed to create member' },
        { status: 500 }
      )
    }

    // Record consent history for compliance audit trail
    if (member && consentData) {
      const consentRecords = []
      
      if (consentData.privacy) {
        consentRecords.push({
          member_id: member.id,
          consent_type: 'privacy',
          consent_given: consentData.privacy,
          consent_method: consentData.consentMethod,
          ip_address: ip,
          user_agent: consentData.userAgent,
        })
      }
      
      if (consentData.studentData) {
        consentRecords.push({
          member_id: member.id,
          consent_type: 'student_data',
          consent_given: consentData.studentData,
          consent_method: consentData.consentMethod,
          ip_address: ip,
          user_agent: consentData.userAgent,
        })
      }
      
      if (consentRecords.length > 0) {
        await supabase.from('consent_history').insert(consentRecords)
      }
    }

    // If it's a free membership (teacher), also update the user record
    if (membershipAmount === 0 && member) {
      await supabase
        .from('users')
        .update({
          role: 'teacher',
          member_id: member.id,
        })
        .eq('id', userId)
    }

    return NextResponse.json({
      success: true,
      memberId: member?.id,
      requiresPayment: membershipAmount > 0,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}