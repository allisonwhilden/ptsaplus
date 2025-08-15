'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { 
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Pin,
  Clock,
  Users,
  AlertCircle,
  Calendar,
  Archive,
  Filter
} from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  type: 'general' | 'urgent' | 'event'
  audience: string
  published_at: string
  expires_at: string | null
  is_pinned: boolean
  created_at: string
  created_by: string
  view_count: number
}

export default function AnnouncementsPage() {
  const { user } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'scheduled' | 'expired'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'pinned'>('pinned')

  useEffect(() => {
    loadAnnouncements()
  }, [filter, typeFilter])

  const loadAnnouncements = async () => {
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (filter === 'expired') params.append('includeExpired', 'true')
      
      const response = await fetch(`/api/announcements?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements || [])
      }
    } catch (error) {
      console.error('Failed to load announcements:', error)
      toast({
        title: 'Error',
        description: 'Failed to load announcements',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Announcement Deleted',
          description: 'The announcement has been archived.',
        })
        loadAnnouncements()
      } else {
        throw new Error('Failed to delete announcement')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete announcement',
        variant: 'destructive',
      })
    }
  }

  const handlePin = async (id: string, currentPinned: boolean) => {
    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !currentPinned }),
      })

      if (response.ok) {
        toast({
          title: currentPinned ? 'Unpinned' : 'Pinned',
          description: `Announcement has been ${currentPinned ? 'unpinned' : 'pinned to the top'}.`,
        })
        loadAnnouncements()
      } else {
        throw new Error('Failed to update announcement')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update announcement',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (announcement: Announcement) => {
    const now = new Date()
    const publishedAt = new Date(announcement.published_at)
    const expiresAt = announcement.expires_at ? new Date(announcement.expires_at) : null

    if (publishedAt > now) {
      return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
    } else if (expiresAt && expiresAt < now) {
      return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800">Published</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>
      case 'event':
        return <Badge className="bg-purple-100 text-purple-800">Event</Badge>
      default:
        return <Badge variant="secondary">General</Badge>
    }
  }

  const filteredAnnouncements = announcements
    .filter((announcement) => {
      const now = new Date()
      const publishedAt = new Date(announcement.published_at)
      const expiresAt = announcement.expires_at ? new Date(announcement.expires_at) : null

      switch (filter) {
        case 'active':
          return publishedAt <= now && (!expiresAt || expiresAt >= now)
        case 'scheduled':
          return publishedAt > now
        case 'expired':
          return expiresAt && expiresAt < now
        default:
          return true
      }
    })
    .sort((a, b) => {
      if (sortBy === 'pinned') {
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  if (!user) {
    return null
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header and Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Announcements</h1>
            <p className="text-muted-foreground">Create and manage member announcements</p>
          </div>
          <Link href="/communications/announcements/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Announcements</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pinned">Pinned First</SelectItem>
                  <SelectItem value="date">Date Created</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Announcements List */}
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                <p className="text-muted-foreground">Loading announcements...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredAnnouncements.length > 0 ? (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <Card key={announcement.id} className={announcement.is_pinned ? 'border-yellow-400' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {announcement.is_pinned && (
                          <Pin className="h-4 w-4 text-yellow-600" />
                        )}
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {getTypeBadge(announcement.type)}
                        {getStatusBadge(announcement)}
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {announcement.audience}
                        </Badge>
                        <span className="text-muted-foreground">
                          • {announcement.view_count || 0} views
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePin(announcement.id, announcement.is_pinned)}
                      >
                        <Pin className={`h-4 w-4 ${announcement.is_pinned ? 'fill-current' : ''}`} />
                      </Button>
                      <Link href={`/communications/announcements/${announcement.id}/edit`}>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(announcement.id)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {announcement.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Created {new Date(announcement.created_at).toLocaleDateString()}</span>
                    </div>
                    {announcement.published_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(announcement.published_at) > new Date() 
                            ? `Scheduled for ${new Date(announcement.published_at).toLocaleDateString()}`
                            : `Published ${new Date(announcement.published_at).toLocaleDateString()}`
                          }
                        </span>
                      </div>
                    )}
                    {announcement.expires_at && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Expires {new Date(announcement.expires_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No announcements found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {filter !== 'all' 
                    ? `No ${filter} announcements to display`
                    : 'Create your first announcement to get started'
                  }
                </p>
                {filter === 'all' && (
                  <Link href="/communications/announcements/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Announcement
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}