'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ConsentType, ConsentRecord } from '@/lib/privacy/types';

interface ConsentOption {
  type: ConsentType;
  label: string;
  description: string;
  required: boolean;
  link?: string;
}

const consentOptions: ConsentOption[] = [
  {
    type: 'terms_of_service',
    label: 'Terms of Service',
    description: 'I agree to the PTSA Terms of Service',
    required: true,
    link: '/terms',
  },
  {
    type: 'privacy_policy',
    label: 'Privacy Policy',
    description: 'I have read and accept the Privacy Policy',
    required: true,
    link: '/privacy',
  },
  {
    type: 'email_communications',
    label: 'Email Communications',
    description: 'I consent to receive PTSA newsletters and event notifications',
    required: false,
  },
  {
    type: 'photo_sharing',
    label: 'Photo Sharing',
    description: 'I allow photos of me/my children to be used in PTSA materials',
    required: false,
  },
  {
    type: 'directory_inclusion',
    label: 'Member Directory',
    description: 'Include my information in the member directory',
    required: false,
  },
  {
    type: 'ai_features',
    label: 'AI-Powered Features',
    description: 'Use AI to help generate content and provide assistance',
    required: false,
  },
];

export function ConsentManager({ onComplete }: { onComplete?: () => void }) {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [consents, setConsents] = useState<Record<ConsentType, boolean>>({} as Record<ConsentType, boolean>);
  const [existingConsents, setExistingConsents] = useState<Record<ConsentType, ConsentRecord>>({});
  const [showDialog, setShowDialog] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState<ConsentOption | null>(null);

  useEffect(() => {
    if (userId) {
      fetchExistingConsents();
    }
  }, [userId]);

  const fetchExistingConsents = async () => {
    try {
      const response = await fetch('/api/privacy/consent');
      if (!response.ok) throw new Error('Failed to fetch consent records');
      
      const data = await response.json();
      setExistingConsents(data.current || {});
      
      // Initialize consent state based on existing records
      const initialConsents: Record<string, boolean> = {};
      consentOptions.forEach(option => {
        initialConsents[option.type] = data.current[option.type]?.granted || false;
      });
      setConsents(initialConsents as Record<ConsentType, boolean>);
    } catch (error) {
      console.error('Error fetching consent records:', error);
      toast({
        title: 'Error',
        description: 'Failed to load consent preferences',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = (type: ConsentType, checked: boolean) => {
    setConsents(prev => ({
      ...prev,
      [type]: checked,
    }));
  };

  const handleViewDocument = (option: ConsentOption) => {
    if (option.link) {
      window.open(option.link, '_blank');
    } else {
      setSelectedConsent(option);
      setShowDialog(true);
    }
  };

  const handleSubmit = async () => {
    // Check required consents
    const missingRequired = consentOptions
      .filter(opt => opt.required && !consents[opt.type])
      .map(opt => opt.label);

    if (missingRequired.length > 0) {
      toast({
        title: 'Required Consents Missing',
        description: `Please accept: ${missingRequired.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Submit each consent that has changed
      const promises = Object.entries(consents).map(async ([type, granted]) => {
        const existing = existingConsents[type as ConsentType];
        if (!existing || existing.granted !== granted) {
          const response = await fetch('/api/privacy/consent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              consentType: type,
              granted,
              consentVersion: '1.0', // TODO: Version management
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to record consent for ${type}`);
          }
        }
      });

      await Promise.all(promises);

      toast({
        title: 'Success',
        description: 'Your consent preferences have been updated',
      });

      if (onComplete) {
        onComplete();
      } else {
        fetchExistingConsents(); // Refresh the data
      }
    } catch (error) {
      console.error('Error submitting consents:', error);
      toast({
        title: 'Error',
        description: 'Failed to update consent preferences',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const allRequiredConsented = consentOptions
    .filter(opt => opt.required)
    .every(opt => consents[opt.type]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consent Preferences
          </CardTitle>
          <CardDescription>
            Manage your consent for data processing and communications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!allRequiredConsented && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Action Required</AlertTitle>
              <AlertDescription>
                Please review and accept the required agreements to continue using the platform.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {consentOptions.map((option) => (
              <div key={option.type} className="space-y-2">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id={option.type}
                    checked={consents[option.type] || false}
                    onCheckedChange={(checked) => 
                      handleConsentChange(option.type, checked as boolean)
                    }
                  />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={option.type} className="font-medium">
                        {option.label}
                        {option.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      {option.link && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => handleViewDocument(option)}
                        >
                          View
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                    {existingConsents[option.type] && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Last updated: {new Date(existingConsents[option.type].createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              You can withdraw or modify your consent at any time through your privacy settings. 
              Some features may become unavailable if you withdraw certain consents.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={submitting || !allRequiredConsented}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedConsent?.label}</DialogTitle>
            <DialogDescription>
              {selectedConsent?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Full document content would be displayed here.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}