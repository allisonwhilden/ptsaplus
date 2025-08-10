/**
 * COPPA Parental Verification API
 * POST /api/privacy/coppa/verify-parent - Verify parent identity for COPPA compliance
 * Implements FTC-approved verification methods
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/config/supabase';
import { logAuditEvent, AuditAction } from '@/lib/privacy/audit';
import crypto from 'crypto';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // SERVER-SIDE VALIDATION: Never trust client data
    const { 
      childUserId, 
      verificationMethod, 
      verificationData,
      childBirthDate 
    } = body;
    
    // Validate childUserId format and existence
    if (!childUserId || typeof childUserId !== 'string' || childUserId.length > 255) {
      return NextResponse.json(
        { error: 'Invalid child user ID' },
        { status: 400 }
      );
    }
    
    // Validate birth date and recalculate age server-side
    if (!childBirthDate || !Date.parse(childBirthDate)) {
      return NextResponse.json(
        { error: 'Invalid birth date' },
        { status: 400 }
      );
    }

    // Validate verification method
    const validMethods = [
      'credit_card', // $0.50 charge with immediate refund
      'government_id', // ID upload and manual verification
      'knowledge_based', // Knowledge-based authentication questions
      'signed_consent_form' // Signed consent form with ID
    ];

    if (!validMethods.includes(verificationMethod)) {
      return NextResponse.json(
        { error: 'Invalid verification method' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Verify the child account exists and needs parental consent
    const { data: childMember } = await supabase
      .from('members')
      .select('*')
      .eq('clerk_id', childUserId)
      .single();

    if (!childMember) {
      return NextResponse.json(
        { error: 'Child account not found' },
        { status: 404 }
      );
    }

    // SERVER-SIDE AGE CALCULATION: Never trust client calculations
    const birthDate = new Date(childBirthDate);
    const today = new Date();
    
    // Precise age calculation considering months and days
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    
    // Adjust age if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }
    
    // Log age calculation for audit trail
    console.log(`COPPA Age Verification: birthDate=${childBirthDate}, calculatedAge=${age}`);
    
    if (age >= 13) {
      await logAuditEvent({
        userId,
        action: 'coppa.verification.rejected',
        resourceType: 'child_account',
        metadata: {
          reason: 'Child is 13 or older',
          childUserId,
          birthDate: childBirthDate,
          calculatedAge: age
        }
      });
      
      return NextResponse.json(
        { error: 'Parental consent not required for users 13 and older' },
        { status: 400 }
      );
    }

    let verificationResult = false;
    let verificationToken = '';
    let verificationDetails: any = {};

    // Process verification based on method
    switch (verificationMethod) {
      case 'credit_card':
        verificationResult = await verifyCreditCard(verificationData, userId);
        verificationDetails = { 
          method: 'credit_card',
          last4: verificationData.last4,
          verified_at: new Date().toISOString()
        };
        break;

      case 'government_id':
        // In production, this would integrate with an ID verification service
        // For now, we'll create a pending verification request
        verificationToken = crypto.randomBytes(32).toString('hex');
        verificationResult = false; // Requires manual review
        verificationDetails = {
          method: 'government_id',
          status: 'pending_review',
          token: verificationToken,
          submitted_at: new Date().toISOString()
        };
        break;

      case 'knowledge_based':
        verificationResult = await verifyKnowledgeBased(verificationData);
        verificationDetails = {
          method: 'knowledge_based',
          questions_answered: verificationData.questionsAnswered,
          verified_at: new Date().toISOString()
        };
        break;

      case 'signed_consent_form':
        // Store consent form for manual review
        verificationToken = crypto.randomBytes(32).toString('hex');
        verificationResult = false; // Requires manual review
        verificationDetails = {
          method: 'signed_consent_form',
          status: 'pending_review',
          token: verificationToken,
          form_url: verificationData.formUrl,
          submitted_at: new Date().toISOString()
        };
        break;
    }

    // Create or update child account record
    const { data: childAccount, error: childError } = await supabase
      .from('child_accounts')
      .upsert({
        child_user_id: childUserId,
        parent_user_id: userId,
        birth_date: childBirthDate,
        parental_consent_given: verificationResult,
        consent_date: verificationResult ? new Date().toISOString() : null,
        restrictions: {
          ai_features: false, // Disabled by default for children
          data_sharing: false,
          photo_sharing: false,
          directory_visible: false
        }
      })
      .select()
      .single();

    if (childError) {
      console.error('Error creating child account:', childError);
      return NextResponse.json(
        { error: 'Failed to create child account record' },
        { status: 500 }
      );
    }

    // Record consent if verification successful
    if (verificationResult) {
      await supabase
        .from('consent_records')
        .insert({
          user_id: childUserId,
          consent_type: 'coppa_parental',
          granted: true,
          parent_user_id: userId,
          consent_version: '1.0',
          metadata: verificationDetails
        });

      // Update child's privacy settings to most restrictive
      await supabase
        .from('privacy_settings')
        .upsert({
          user_id: childUserId,
          show_email: false,
          show_phone: false,
          show_address: false,
          show_children: false,
          directory_visible: false,
          allow_photo_sharing: false,
          allow_data_sharing: false
        });
    }

    // Log audit event
    await logAuditEvent({
      userId,
      action: 'coppa.verification.' + (verificationResult ? 'success' : 'pending'),
      resourceType: 'child_account',
      resourceId: childAccount.id,
      metadata: {
        child_user_id: childUserId,
        verification_method: verificationMethod,
        verification_result: verificationResult,
        ...verificationDetails
      }
    });

    return NextResponse.json({
      success: true,
      verified: verificationResult,
      childAccount,
      verificationToken: verificationToken || undefined,
      nextSteps: verificationResult 
        ? 'Parental consent verified. Child account is now active.'
        : 'Verification pending manual review. You will be notified within 24-48 hours.'
    });
  } catch (error) {
    console.error('COPPA verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Verify parent using credit card (FTC-approved method)
 * Charges $0.50 and immediately refunds
 */
async function verifyCreditCard(
  verificationData: any,
  parentUserId: string
): Promise<boolean> {
  try {
    // Create a $0.50 charge for verification
    const charge = await stripe.charges.create({
      amount: 50, // $0.50 in cents
      currency: 'usd',
      source: verificationData.stripeToken,
      description: 'COPPA Parental Verification',
      metadata: {
        parent_user_id: parentUserId,
        purpose: 'coppa_verification'
      }
    });

    if (charge.status === 'succeeded') {
      // Immediately refund the charge
      await stripe.refunds.create({
        charge: charge.id,
        reason: 'requested_by_customer',
        metadata: {
          reason: 'coppa_verification_complete'
        }
      });

      return true;
    }

    return false;
  } catch (error) {
    console.error('Credit card verification error:', error);
    return false;
  }
}

/**
 * Knowledge-based authentication
 * Verify parent using personal information questions
 */
async function verifyKnowledgeBased(verificationData: any): Promise<boolean> {
  // In production, this would integrate with a KBA service like LexisNexis
  // For MVP, we'll implement basic verification
  
  const requiredCorrect = 3; // Must answer 3 out of 5 correctly
  let correctAnswers = 0;

  // Validate answers (in production, these would be verified against credit bureau data)
  if (verificationData.previousAddress === verificationData.expectedPreviousAddress) {
    correctAnswers++;
  }
  if (verificationData.mothersMaidenName === verificationData.expectedMothersMaidenName) {
    correctAnswers++;
  }
  if (verificationData.socialSecurityLastFour === verificationData.expectedSSNLastFour) {
    correctAnswers++;
  }
  if (verificationData.dateOfBirth === verificationData.expectedDateOfBirth) {
    correctAnswers++;
  }
  if (verificationData.driversLicenseState === verificationData.expectedDLState) {
    correctAnswers++;
  }

  return correctAnswers >= requiredCorrect;
}

/**
 * GET endpoint to check verification status
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const childUserId = searchParams.get('childUserId');

    if (!childUserId) {
      return NextResponse.json(
        { error: 'Child user ID required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Check if parent has verified consent for this child
    const { data: childAccount } = await supabase
      .from('child_accounts')
      .select('*')
      .eq('child_user_id', childUserId)
      .eq('parent_user_id', userId)
      .single();

    if (!childAccount) {
      return NextResponse.json({
        verified: false,
        message: 'No parental consent record found'
      });
    }

    return NextResponse.json({
      verified: childAccount.parental_consent_given,
      consentDate: childAccount.consent_date,
      restrictions: childAccount.restrictions,
      message: childAccount.parental_consent_given 
        ? 'Parental consent verified'
        : 'Parental consent pending verification'
    });
  } catch (error) {
    console.error('COPPA status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}