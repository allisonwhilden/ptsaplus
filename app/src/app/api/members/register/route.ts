import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
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
      volunteerInterest,
      membershipAmount,
    } = body

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

    // Create the member record
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
        student_info: studentName || studentGrade
          ? {
              name: studentName || null,
              grade: studentGrade || null,
            }
          : null,
        volunteer_interests: volunteerInterest ? ['general'] : [],
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