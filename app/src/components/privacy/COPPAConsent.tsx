'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  CreditCard, 
  FileText, 
  User, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  Lock
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { format } from 'date-fns';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface COPPAConsentProps {
  childUserId: string;
  childName: string;
  onComplete?: () => void;
}

export function COPPAConsent({ childUserId, childName, onComplete }: COPPAConsentProps) {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [verificationMethod, setVerificationMethod] = useState<string>('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [consentChecked, setConsentChecked] = useState(false);
  
  // Credit card verification state
  const [cardProcessing, setCardProcessing] = useState(false);
  
  // Knowledge-based verification state
  const [kbaAnswers, setKbaAnswers] = useState({
    previousAddress: '',
    mothersMaidenName: '',
    socialSecurityLastFour: '',
    dateOfBirth: '',
    driversLicenseState: ''
  });

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleCreditCardVerification = async () => {
    setCardProcessing(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe not loaded');

      // Create a token (in production, use Stripe Elements)
      const { error: stripeError } = await stripe.redirectToCheckout({
        lineItems: [{ price: 'price_coppa_verification', quantity: 1 }],
        mode: 'payment',
        successUrl: `${window.location.origin}/coppa/success?child=${childUserId}`,
        cancelUrl: `${window.location.origin}/coppa/cancel`,
        metadata: {
          parent_user_id: userId!,
          child_user_id: childUserId,
          purpose: 'coppa_verification'
        }
      });

      if (stripeError) {
        throw stripeError;
      }
    } catch (error) {
      console.error('Credit card verification error:', error);
      toast({
        title: 'Verification Failed',
        description: 'Unable to process credit card verification',
        variant: 'destructive'
      });
    } finally {
      setCardProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!consentChecked) {
      toast({
        title: 'Consent Required',
        description: 'Please acknowledge that you are the parent or guardian',
        variant: 'destructive'
      });
      return;
    }

    const age = calculateAge(birthDate);
    if (age >= 13) {
      toast({
        title: 'Consent Not Required',
        description: 'This user is 13 or older and does not require parental consent',
      });
      return;
    }

    setLoading(true);
    try {
      let verificationData: any = {};

      switch (verificationMethod) {
        case 'credit_card':
          await handleCreditCardVerification();
          return; // Redirect will handle the rest
          
        case 'knowledge_based':
          verificationData = {
            ...kbaAnswers,
            questionsAnswered: Object.keys(kbaAnswers).filter(k => kbaAnswers[k as keyof typeof kbaAnswers]).length
          };
          break;
          
        case 'government_id':
          verificationData = {
            documentType: 'drivers_license',
            // In production, would include document upload
          };
          break;
          
        case 'signed_consent_form':
          verificationData = {
            formUrl: '/consent-form.pdf',
            signedAt: new Date().toISOString()
          };
          break;
      }

      const response = await fetch('/api/privacy/coppa/verify-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childUserId,
          verificationMethod,
          verificationData,
          childBirthDate: birthDate
        })
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const result = await response.json();

      if (result.verified) {
        toast({
          title: 'Verification Successful',
          description: `Parental consent verified for ${childName}`,
        });
        
        if (onComplete) {
          onComplete();
        }
      } else {
        toast({
          title: 'Verification Pending',
          description: result.nextSteps,
        });
      }
    } catch (error) {
      console.error('COPPA verification error:', error);
      toast({
        title: 'Verification Failed',
        description: 'Unable to complete verification. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Parental Consent Required (COPPA)
        </CardTitle>
        <CardDescription>
          Federal law requires parental consent for children under 13
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>Why is this required?</AlertTitle>
          <AlertDescription>
            The Children's Online Privacy Protection Act (COPPA) requires verifiable 
            parental consent before collecting personal information from children under 13.
          </AlertDescription>
        </Alert>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="birthDate">Child's Date of Birth</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
              {birthDate && (
                <p className="text-sm text-muted-foreground mt-1">
                  Age: {calculateAge(birthDate)} years old
                </p>
              )}
            </div>

            {birthDate && calculateAge(birthDate) < 13 && (
              <>
                <div className="space-y-3">
                  <Label>Select Verification Method</Label>
                  <RadioGroup value={verificationMethod} onValueChange={setVerificationMethod}>
                    <div className="flex items-start space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="credit_card" id="credit_card" />
                      <div className="flex-1">
                        <Label htmlFor="credit_card" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Credit Card Verification (Instant)
                          </div>
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          $0.50 charge will be immediately refunded
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="knowledge_based" id="knowledge_based" />
                      <div className="flex-1">
                        <Label htmlFor="knowledge_based" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Knowledge-Based Questions
                          </div>
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Answer security questions to verify identity
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="government_id" id="government_id" />
                      <div className="flex-1">
                        <Label htmlFor="government_id" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Government ID Upload
                          </div>
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Upload driver's license or ID (24-48 hour review)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="signed_consent_form" id="signed_consent_form" />
                      <div className="flex-1">
                        <Label htmlFor="signed_consent_form" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Print and Sign Consent Form
                          </div>
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Download, sign, and upload form (24-48 hour review)
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="consent"
                    checked={consentChecked}
                    onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="consent" className="cursor-pointer">
                      I am the parent or legal guardian of {childName}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      I consent to the collection and use of my child's information as 
                      described in the Privacy Policy, with the understanding that my 
                      child's data will be protected under COPPA regulations.
                    </p>
                  </div>
                </div>

                {verificationMethod && (
                  <Button 
                    onClick={() => {
                      if (verificationMethod === 'knowledge_based') {
                        setStep(2);
                      } else {
                        handleSubmit();
                      }
                    }}
                    disabled={!consentChecked || loading}
                    className="w-full"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Continue to Verification
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {step === 2 && verificationMethod === 'knowledge_based' && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please answer at least 3 of 5 questions correctly to verify your identity
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <Label htmlFor="previousAddress">Previous Address</Label>
                <Input
                  id="previousAddress"
                  value={kbaAnswers.previousAddress}
                  onChange={(e) => setKbaAnswers(prev => ({ ...prev, previousAddress: e.target.value }))}
                  placeholder="123 Main St, City, State"
                />
              </div>

              <div>
                <Label htmlFor="mothersMaidenName">Mother's Maiden Name</Label>
                <Input
                  id="mothersMaidenName"
                  value={kbaAnswers.mothersMaidenName}
                  onChange={(e) => setKbaAnswers(prev => ({ ...prev, mothersMaidenName: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="socialSecurityLastFour">Last 4 Digits of SSN</Label>
                <Input
                  id="socialSecurityLastFour"
                  maxLength={4}
                  value={kbaAnswers.socialSecurityLastFour}
                  onChange={(e) => setKbaAnswers(prev => ({ ...prev, socialSecurityLastFour: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Your Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={kbaAnswers.dateOfBirth}
                  onChange={(e) => setKbaAnswers(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="driversLicenseState">Driver's License State</Label>
                <Input
                  id="driversLicenseState"
                  maxLength={2}
                  value={kbaAnswers.driversLicenseState}
                  onChange={(e) => setKbaAnswers(prev => ({ ...prev, driversLicenseState: e.target.value.toUpperCase() }))}
                  placeholder="CA"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Identity
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}