'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Eye, EyeOff, Users, Camera, Share2, Mail } from 'lucide-react';
import { PrivacySettings as PrivacySettingsType } from '@/lib/privacy/types';

export function PrivacySettings() {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PrivacySettingsType | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchSettings();
    }
  }, [userId]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/privacy/settings');
      if (!response.ok) throw new Error('Failed to fetch privacy settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load privacy settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (field: keyof PrivacySettingsType) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [field]: !settings[field],
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/privacy/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          show_email: settings.showEmail,
          show_phone: settings.showPhone,
          show_address: settings.showAddress,
          show_children: settings.showChildren,
          directory_visible: settings.directoryVisible,
          allow_photo_sharing: settings.allowPhotoSharing,
          allow_data_sharing: settings.allowDataSharing,
        }),
      });

      if (!response.ok) throw new Error('Failed to update privacy settings');

      const data = await response.json();
      setSettings(data);
      setHasChanges(false);
      
      toast({
        title: 'Success',
        description: 'Privacy settings updated successfully',
      });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update privacy settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <Alert>
        <AlertDescription>
          Unable to load privacy settings. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const privacyOptions = [
    {
      id: 'directoryVisible',
      label: 'Visible in Member Directory',
      description: 'Allow other members to see you in the directory',
      icon: Users,
      field: 'directoryVisible' as keyof PrivacySettingsType,
    },
    {
      id: 'showEmail',
      label: 'Show Email Address',
      description: 'Display your email to other members',
      icon: Mail,
      field: 'showEmail' as keyof PrivacySettingsType,
    },
    {
      id: 'showPhone',
      label: 'Show Phone Number',
      description: 'Display your phone number to other members',
      icon: settings.showPhone ? Eye : EyeOff,
      field: 'showPhone' as keyof PrivacySettingsType,
    },
    {
      id: 'showAddress',
      label: 'Show Address',
      description: 'Display your address to other members',
      icon: settings.showAddress ? Eye : EyeOff,
      field: 'showAddress' as keyof PrivacySettingsType,
    },
    {
      id: 'showChildren',
      label: 'Show Children Information',
      description: 'Display information about your children',
      icon: settings.showChildren ? Eye : EyeOff,
      field: 'showChildren' as keyof PrivacySettingsType,
    },
    {
      id: 'allowPhotoSharing',
      label: 'Allow Photo Sharing',
      description: 'Permit photos of you/your children to be shared in PTSA materials',
      icon: Camera,
      field: 'allowPhotoSharing' as keyof PrivacySettingsType,
    },
    {
      id: 'allowDataSharing',
      label: 'Allow Data Sharing',
      description: 'Share your information with school district when necessary',
      icon: Share2,
      field: 'allowDataSharing' as keyof PrivacySettingsType,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>
            Control what information is visible to other PTSA members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {privacyOptions.map((option) => {
            const Icon = option.icon;
            return (
              <div key={option.id} className="flex items-center justify-between space-x-4">
                <div className="flex items-start space-x-3 flex-1">
                  <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div className="space-y-1">
                    <Label htmlFor={option.id} className="font-medium">
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={option.id}
                  checked={settings[option.field] as boolean}
                  onCheckedChange={() => handleToggle(option.field)}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your privacy is important to us. Administrators and board members may still access 
          your information for official PTSA business, in compliance with FERPA regulations.
        </AlertDescription>
      </Alert>

      {hasChanges && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              fetchSettings();
              setHasChanges(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}