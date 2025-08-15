'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Mail, 
  Send, 
  Calendar as CalendarIcon,
  Users,
  AlertCircle,
  Eye,
  Clock
} from 'lucide-react'

const emailComposeSchema = z.object({
  template: z.string().min(1, 'Please select a template'),
  audience: z.enum(['all', 'board', 'committee_chairs', 'teachers', 'custom']),
  customRecipients: z.array(z.string()).optional(),
  subject: z.string().min(1, 'Subject is required').max(200),
  scheduledFor: z.date().optional(),
})

type EmailFormData = z.infer<typeof emailComposeSchema>

const emailTemplates = [
  { id: 'welcome', name: 'Welcome Email', description: 'Welcome new members to the PTSA' },
  { id: 'payment_confirmation', name: 'Payment Confirmation', description: 'Confirm membership dues payment' },
  { id: 'event_reminder', name: 'Event Reminder', description: 'Remind members about upcoming events' },
  { id: 'announcement', name: 'General Announcement', description: 'Share important news and updates' },
  { id: 'volunteer_reminder', name: 'Volunteer Reminder', description: 'Remind volunteers about shifts' },
  { id: 'meeting_minutes', name: 'Meeting Minutes', description: 'Share meeting summaries and action items' },
]

const audienceOptions = [
  { value: 'all', label: 'All Members' },
  { value: 'board', label: 'Board Only' },
  { value: 'committee_chairs', label: 'Committee Chairs' },
  { value: 'teachers', label: 'Teachers' },
  { value: 'custom', label: 'Custom Selection' },
]

export default function EmailComposePage() {
  const { user } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [templateData, setTemplateData] = useState<any>({})
  const [recipientCounts, setRecipientCounts] = useState<Record<string, number>>({})  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailComposeSchema),
    defaultValues: {
      audience: 'all',
      subject: '',
    }
  })

  const selectedTemplate = watch('template')
  const selectedAudience = watch('audience')

  useEffect(() => {
    // Load members if custom audience is selected
    if (selectedAudience === 'custom') {
      loadMembers()
    } else {
      // Load recipient counts for other audiences
      loadRecipientCounts()
    }
  }, [selectedAudience])

  useEffect(() => {
    // Update subject based on template
    if (selectedTemplate) {
      const template = emailTemplates.find(t => t.id === selectedTemplate)
      if (template) {
        // Set default subject based on template
        const subjects = {
          welcome: 'Welcome to Our PTSA!',
          payment_confirmation: 'Payment Confirmation - Thank You!',
          event_reminder: 'Upcoming Event Reminder',
          announcement: 'Important PTSA Announcement',
          volunteer_reminder: 'Volunteer Shift Reminder',
          meeting_minutes: 'Meeting Minutes - Action Required',
        }
        setValue('subject', subjects[selectedTemplate as keyof typeof subjects] || '')
      }
    }
  }, [selectedTemplate, setValue])

  const loadMembers = async () => {
    try {
      const response = await fetch('/api/members')
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error('Failed to load members:', error)
    }
  }

  const loadRecipientCounts = async () => {
    try {
      const response = await fetch('/api/members/counts')
      if (response.ok) {
        const data = await response.json()
        setRecipientCounts(data)
      }
    } catch (error) {
      // Fallback to defaults if API fails
      setRecipientCounts({
        all: 0,
        board: 0,
        committee_chairs: 0,
        teachers: 0,
      })
    }
  }

  const searchMembers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    
    try {
      const response = await fetch(`/api/members/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.members || [])
      }
    } catch (error) {
      console.error('Failed to search members:', error)
    }
  }

  const onSubmit = async (data: EmailFormData) => {
    setLoading(true)
    try {
      // Prepare email data
      const emailData = {
        template: data.template,
        audience: data.audience,
        customRecipients: data.audience === 'custom' ? selectedMembers : undefined,
        subject: data.subject,
        scheduledFor: data.scheduledFor?.toISOString(),
        templateData: templateData,
      }

      const response = await fetch('/api/communications/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send email')
      }

      const result = await response.json()
      
      toast({
        title: 'Email Queued Successfully',
        description: `${result.queuedCount} emails have been queued for delivery.`,
      })

      router.push('/communications/email/history')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send email',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getRecipientCount = () => {
    if (selectedAudience === 'custom') {
      return selectedMembers.length
    }
    return recipientCounts[selectedAudience] || 0
  }

  if (!user) {
    return null
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Email Template</CardTitle>
              <CardDescription>Choose a pre-built template for your email</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <Label htmlFor="template">Template *</Label>
                <Select
                  value={watch('template')}
                  onValueChange={(value) => setValue('template', value)}
                >
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {emailTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.template && (
                  <p className="text-sm text-red-500">{errors.template.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Audience Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Recipients</CardTitle>
              <CardDescription>Choose who will receive this email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="audience">Audience *</Label>
                <Select
                  value={watch('audience')}
                  onValueChange={(value) => setValue('audience', value as any)}
                >
                  <SelectTrigger id="audience">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    {audienceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAudience === 'custom' && (
                <div className="space-y-2">
                  <Label>Select Members</Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                    {members.map((member) => (
                      <label key={member.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          value={member.id}
                          checked={selectedMembers.includes(member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembers([...selectedMembers, member.id])
                            } else {
                              setSelectedMembers(selectedMembers.filter(id => id !== member.id))
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">
                          {member.first_name} {member.last_name} ({member.email})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  This email will be sent to approximately <strong>{getRecipientCount()}</strong> recipients.
                  Only members with email consent will receive the message.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Email Details */}
          <Card>
            <CardHeader>
              <CardTitle>Email Details</CardTitle>
              <CardDescription>Customize your email subject and schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject Line *</Label>
                <Input
                  id="subject"
                  {...register('subject')}
                  placeholder="Enter email subject"
                  maxLength={200}
                />
                {errors.subject && (
                  <p className="text-sm text-red-500 mt-1">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <Label>Send Options</Label>
                <div className="flex gap-4 mt-2">
                  <Button
                    type="button"
                    variant={!watch('scheduledFor') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setValue('scheduledFor', undefined)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Now
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant={watch('scheduledFor') ? 'default' : 'outline'}
                        size="sm"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Schedule for Later
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={watch('scheduledFor')}
                        onSelect={(date) => setValue('scheduledFor', date)}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {watch('scheduledFor') && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Scheduled for: {format(watch('scheduledFor')!, 'PPP')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Template Data (if needed) */}
          {selectedTemplate === 'event_reminder' && (
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
                <CardDescription>Provide event information for the reminder</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="eventName">Event Name</Label>
                  <Input
                    id="eventName"
                    value={templateData.eventName || ''}
                    onChange={(e) => setTemplateData({ ...templateData, eventName: e.target.value })}
                    placeholder="e.g., Fall Fundraiser"
                  />
                </div>
                <div>
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    type="datetime-local"
                    value={templateData.eventDate || ''}
                    onChange={(e) => setTemplateData({ ...templateData, eventDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="eventLocation">Event Location</Label>
                  <Input
                    id="eventLocation"
                    value={templateData.eventLocation || ''}
                    onChange={(e) => setTemplateData({ ...templateData, eventLocation: e.target.value })}
                    placeholder="e.g., School Gymnasium"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/communications')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {watch('scheduledFor') ? 'Schedule Email' : 'Send Email'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Email Preview */}
          {showPreview && selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Email Preview</CardTitle>
                <CardDescription>This is how your email will appear to recipients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="mb-3 pb-3 border-b">
                    <p className="text-sm text-gray-600">Subject: <strong>{watch('subject')}</strong></p>
                    <p className="text-sm text-gray-600">From: <strong>PTSA Notifications</strong></p>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    {/* This would render the actual template with data */}
                    <p className="text-gray-600">
                      [Email template preview would appear here with your selected template and data]
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </MainLayout>
  )
}