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
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  MessageSquare,
  Calendar as CalendarIcon,
  Users,
  AlertCircle,
  Eye,
  EyeOff,
  Pin,
  Mail,
  Save
} from 'lucide-react'

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['general', 'urgent', 'event']),
  audience: z.enum(['all', 'members', 'board', 'committee_chairs', 'teachers']),
  publishedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  isPinned: z.boolean().optional(),
  sendEmail: z.boolean().optional(),
})

type AnnouncementFormData = z.infer<typeof announcementSchema>

const announcementTypes = [
  { value: 'general', label: 'General', description: 'Regular updates and information' },
  { value: 'urgent', label: 'Urgent', description: 'Time-sensitive information' },
  { value: 'event', label: 'Event', description: 'Event-related announcements' },
]

const audienceOptions = [
  { value: 'all', label: 'All Members', description: 'Visible to everyone' },
  { value: 'members', label: 'Members Only', description: 'Registered members only' },
  { value: 'board', label: 'Board Only', description: 'Board members only' },
  { value: 'committee_chairs', label: 'Committee Chairs', description: 'Committee chairs only' },
  { value: 'teachers', label: 'Teachers', description: 'Teachers only' },
]

export default function NewAnnouncementPage() {
  const { user } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      type: 'general',
      audience: 'all',
      isPinned: false,
      sendEmail: false,
    }
  })

  const formData = watch()

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !isDirty) return

    const timer = setTimeout(() => {
      // In production, this would save to a draft endpoint
      localStorage.setItem('announcementDraft', JSON.stringify(formData))
      setLastSaved(new Date())
    }, 2000)

    return () => clearTimeout(timer)
  }, [formData, autoSaveEnabled, isDirty])

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('announcementDraft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        Object.keys(parsed).forEach((key) => {
          if (key === 'publishedAt' || key === 'expiresAt') {
            setValue(key as any, parsed[key] ? new Date(parsed[key]) : undefined)
          } else {
            setValue(key as any, parsed[key])
          }
        })
        toast({
          title: 'Draft Restored',
          description: 'Your previous draft has been loaded.',
        })
      } catch (error) {
        console.error('Failed to load draft:', error)
      }
    }
  }, [setValue, toast])

  const onSubmit = async (data: AnnouncementFormData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          publishedAt: data.publishedAt?.toISOString(),
          expiresAt: data.expiresAt?.toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create announcement')
      }

      const result = await response.json()
      
      // Clear draft
      localStorage.removeItem('announcementDraft')
      
      toast({
        title: 'Announcement Created',
        description: data.publishedAt && data.publishedAt > new Date()
          ? 'Your announcement has been scheduled.'
          : 'Your announcement has been published.',
      })

      router.push('/communications/announcements')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create announcement',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  const isScheduled = formData.publishedAt && formData.publishedAt > new Date()

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Announcement Details</CardTitle>
              <CardDescription>Provide the basic information for your announcement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Enter announcement title"
                  maxLength={255}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  {...register('content')}
                  placeholder="Write your announcement content..."
                  rows={8}
                  className="resize-none"
                />
                {errors.content && (
                  <p className="text-sm text-red-500 mt-1">{errors.content.message}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Tip: Keep it concise and clear. Members appreciate brief, informative announcements.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={watch('type')}
                    onValueChange={(value) => setValue('type', value as any)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {announcementTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Publishing Options */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing Options</CardTitle>
              <CardDescription>Control when and how your announcement is published</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Publish Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch('publishedAt') ? format(watch('publishedAt')!, 'PPP') : 'Publish immediately'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={watch('publishedAt')}
                        onSelect={(date) => setValue('publishedAt', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to publish immediately
                  </p>
                </div>

                <div>
                  <Label>Expiration Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch('expiresAt') ? format(watch('expiresAt')!, 'PPP') : 'No expiration'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={watch('expiresAt')}
                        onSelect={(date) => setValue('expiresAt', date)}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: Auto-hide after this date
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isPinned">Pin to Top</Label>
                    <p className="text-sm text-muted-foreground">
                      Keep this announcement at the top of the list
                    </p>
                  </div>
                  <Switch
                    id="isPinned"
                    checked={watch('isPinned')}
                    onCheckedChange={(checked) => setValue('isPinned', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sendEmail">Send Email Notification</Label>
                    <p className="text-sm text-muted-foreground">
                      Email members about this announcement
                    </p>
                  </div>
                  <Switch
                    id="sendEmail"
                    checked={watch('sendEmail')}
                    onCheckedChange={(checked) => setValue('sendEmail', checked)}
                  />
                </div>
              </div>

              {watch('sendEmail') && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    An email will be sent to all members in the selected audience who have email consent.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Auto-save indicator */}
          {autoSaveEnabled && lastSaved && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>Draft auto-saved {format(lastSaved, 'h:mm a')}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAutoSaveEnabled(false)}
              >
                Disable auto-save
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Preview
                </>
              )}
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/communications/announcements')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>Creating...</>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {isScheduled ? 'Schedule Announcement' : 'Publish Announcement'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle>Announcement Preview</CardTitle>
                <CardDescription>This is how your announcement will appear to members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">{formData.title || 'Untitled Announcement'}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Badge variant={formData.type === 'urgent' ? 'destructive' : 'secondary'}>
                          {formData.type}
                        </Badge>
                        <span>•</span>
                        <span>{formData.audience}</span>
                        {formData.isPinned && (
                          <>
                            <span>•</span>
                            <Pin className="h-3 w-3" />
                            <span>Pinned</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{formData.content || 'No content provided'}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isScheduled ? (
                      <span>Scheduled for {format(formData.publishedAt!, 'PPP')}</span>
                    ) : (
                      <span>Will be published immediately</span>
                    )}
                    {formData.expiresAt && (
                      <span> • Expires {format(formData.expiresAt, 'PPP')}</span>
                    )}
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