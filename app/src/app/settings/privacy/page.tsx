'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrivacySettings } from '@/components/privacy/PrivacySettings';
import { ConsentManager } from '@/components/privacy/ConsentManager';
import { Shield, FileText, Download, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@clerk/nextjs';

export default function PrivacySettingsPage() {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDataExport = async () => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/privacy/export', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to request data export');

      toast({
        title: 'Export Requested',
        description: 'Your data export has been requested. You will receive an email when it\'s ready.',
      });
    } catch (error) {
      console.error('Error requesting data export:', error);
      toast({
        title: 'Error',
        description: 'Failed to request data export',
        variant: 'destructive',
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleDataDeletion = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch('/api/privacy/delete', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to request account deletion');

      toast({
        title: 'Deletion Requested',
        description: 'Your account deletion has been requested. You will receive a confirmation email.',
      });
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      toast({
        title: 'Error',
        description: 'Failed to request account deletion',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Privacy & Data Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your privacy preferences and data rights
        </p>
      </div>

      <Tabs defaultValue="privacy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="consent">Consent</TabsTrigger>
          <TabsTrigger value="data">Your Data</TabsTrigger>
        </TabsList>

        <TabsContent value="privacy" className="space-y-6">
          <PrivacySettings />
        </TabsContent>

        <TabsContent value="consent" className="space-y-6">
          <ConsentManager />
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Your Data
              </CardTitle>
              <CardDescription>
                Download a copy of all your personal data stored in our system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  You have the right to request a copy of your personal data. The export will include 
                  your profile information, membership details, event registrations, and activity history.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={handleDataExport}
                disabled={exportLoading}
                className="w-full sm:w-auto"
              >
                {exportLoading ? 'Processing...' : 'Request Data Export'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Your Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Warning:</strong> This action is permanent and cannot be undone. 
                  All your data will be deleted or anonymized in compliance with data protection regulations. 
                  You will lose access to all PTSA services and benefits.
                </AlertDescription>
              </Alert>
              <Button 
                variant="destructive"
                onClick={handleDataDeletion}
                disabled={deleteLoading}
                className="w-full sm:w-auto"
              >
                {deleteLoading ? 'Processing...' : 'Delete My Account'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Data Retention Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Active Members:</strong> Data retained for duration of membership plus 1 year
                </p>
                <p>
                  <strong>Financial Records:</strong> 7 years as required by law
                </p>
                <p>
                  <strong>Event Registrations:</strong> 2 years after event date
                </p>
                <p>
                  <strong>Audit Logs:</strong> 3 years for compliance purposes
                </p>
                <p>
                  <strong>Deleted Accounts:</strong> Anonymized immediately, audit logs retained as required
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}