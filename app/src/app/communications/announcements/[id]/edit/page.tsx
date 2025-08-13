'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  Save,
  Archive,
  Clock,
  Info
} from 'lucide-react'

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['general', 'urgent', 'event']),
  audience: z.enum(['all', 'members', 'board', 'committee_chairs', 'teachers']),
  publishedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  isPinned: z.boolean().optional(),
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

export default function EditAnnouncementPage() {
  const { user } = useUser()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [announcement, setAnnouncement] = useState<any>(null)
  const [metadata, setMetadata] = useState<any>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty }
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
  })

  useEffect(() => {
    if (params.id) {
      loadAnnouncement(params.id as string)
    }
  }, [params.id])

  const loadAnnouncement = async (id: string) => {
    try {
      const response = await fetch(`/api/announcements/${id}`)
      if (response.ok) {
        const data = await response.json()
        setAnnouncement(data.announcement)
        setMetadata({
          createdAt: data.announcement.created_at,
          updatedAt: data.announcement.updated_at,
          viewCount: data.announcement.view_count,
          createdBy: data.announcement.created_by,
        })
        
        // Reset form with announcement data
        reset({
          title: data.announcement.title,
          content: data.announcement.content,
          type: data.announcement.type,
          audience: data.announcement.audience,
          publishedAt: data.announcement.published_at ? new Date(data.announcement.published_at) : undefined,
          expiresAt: data.announcement.expires_at ? new Date(data.announcement.expires_at) : undefined,
          isPinned: data.announcement.is_pinned,
        })
      } else {
        throw new Error('Failed to load announcement')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load announcement',
        variant: 'destructive',
      })
      router.push('/communications/announcements')
    }
  }

  const onSubmit = async (data: AnnouncementFormData) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/announcements/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          publishedAt: data.publishedAt?.toISOString(),
          expiresAt: data.expiresAt?.toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update announcement')
      }

      toast({
        title: 'Announcement Updated',
        description: 'Your changes have been saved.',
      })

      router.push('/communications/announcements')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update announcement',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this announcement? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/announcements/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to archive announcement')
      }

      toast({
        title: 'Announcement Archived',
        description: 'The announcement has been archived.',
      })

      router.push('/communications/announcements')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to archive announcement',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user || !announcement) {
    return null
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Metadata Info */}
        {metadata && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="flex flex-col md:flex-row md:items-center gap-2 text-sm">
                <span>Created: {new Date(metadata.createdAt).toLocaleDateString()}</span>
                <span className="hidden md:inline">•</span>
                <span>Last modified: {new Date(metadata.updatedAt).toLocaleDateString()}</span>
                <span className="hidden md:inline">•</span>
                <span>Views: {metadata.viewCount || 0}</span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Announcement Details</CardTitle>
              <CardDescription>Update the announcement information</CardDescription>
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
              <CardDescription>Update when and how your announcement is published</CardDescription>
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
                        {watch('publishedAt') ? format(watch('publishedAt')!, 'PPP') : 'Not scheduled'}
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
                </div>
              </div>

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
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleArchive}
              disabled={loading}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive Announcement
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/communications/announcements')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !isDirty}>
                {loading ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}