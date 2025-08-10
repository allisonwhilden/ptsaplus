import { createClient } from '@/lib/supabase-server'
import { AnnouncementData } from '@/lib/email/types'
import { sendBulkEmailsSecure } from '@/lib/email/client'
import { AnnouncementEmail } from '@/lib/email/templates'

export interface CreateAnnouncementInput {
  title: string
  content: string
  type: 'general' | 'urgent' | 'event'
  audience: 'all' | 'members' | 'board' | 'committee_chairs' | 'teachers'
  publishedAt?: Date
  expiresAt?: Date
  isPinned?: boolean
  sendEmail?: boolean
}

export interface UpdateAnnouncementInput {
  title?: string
  content?: string
  type?: 'general' | 'urgent' | 'event'
  audience?: 'all' | 'members' | 'board' | 'committee_chairs' | 'teachers'
  publishedAt?: Date | null
  expiresAt?: Date | null
  isPinned?: boolean
}

export async function createAnnouncement(
  userId: string,
  input: CreateAnnouncementInput
): Promise<{ success: boolean; announcement?: AnnouncementData; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, first_name, last_name')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }

    if (!['admin', 'board'].includes(user.role)) {
      return { success: false, error: 'Unauthorized to create announcements' }
    }

    const announcementData = {
      title: input.title,
      content: input.content,
      type: input.type,
      audience: input.audience,
      created_by: userId,
      published_at: input.publishedAt?.toISOString() || new Date().toISOString(),
      expires_at: input.expiresAt?.toISOString(),
      is_pinned: input.isPinned || false,
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert(announcementData)
      .select()
      .single()

    if (error) throw error

    const announcement: AnnouncementData = {
      id: data.id,
      title: data.title,
      content: data.content,
      type: data.type,
      audience: data.audience,
      createdBy: data.created_by,
      publishedAt: data.published_at ? new Date(data.published_at) : undefined,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      isPinned: data.is_pinned,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at || data.created_at),
    }

    if (input.sendEmail && (!input.publishedAt || input.publishedAt <= new Date())) {
      await sendAnnouncementEmail(
        announcement,
        `${user.first_name} ${user.last_name}`,
        user.role
      )
    }

    return { success: true, announcement }
  } catch (error) {
    console.error('[Announcements] Failed to create announcement:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create announcement',
    }
  }
}

export async function updateAnnouncement(
  userId: string,
  announcementId: string,
  input: UpdateAnnouncementInput
): Promise<{ success: boolean; announcement?: AnnouncementData; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }

    const { data: existing, error: fetchError } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', announcementId)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: 'Announcement not found' }
    }

    if (existing.created_by !== userId && user.role !== 'admin') {
      return { success: false, error: 'Unauthorized to update this announcement' }
    }

    const updateData: any = {}
    if (input.title !== undefined) updateData.title = input.title
    if (input.content !== undefined) updateData.content = input.content
    if (input.type !== undefined) updateData.type = input.type
    if (input.audience !== undefined) updateData.audience = input.audience
    if (input.publishedAt !== undefined) updateData.published_at = input.publishedAt?.toISOString()
    if (input.expiresAt !== undefined) updateData.expires_at = input.expiresAt?.toISOString()
    if (input.isPinned !== undefined) updateData.is_pinned = input.isPinned

    const { data, error } = await supabase
      .from('announcements')
      .update(updateData)
      .eq('id', announcementId)
      .select()
      .single()

    if (error) throw error

    const announcement: AnnouncementData = {
      id: data.id,
      title: data.title,
      content: data.content,
      type: data.type,
      audience: data.audience,
      createdBy: data.created_by,
      publishedAt: data.published_at ? new Date(data.published_at) : undefined,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      isPinned: data.is_pinned,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at || data.created_at),
    }

    return { success: true, announcement }
  } catch (error) {
    console.error('[Announcements] Failed to update announcement:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update announcement',
    }
  }
}

export async function deleteAnnouncement(
  userId: string,
  announcementId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }

    const { data: existing, error: fetchError } = await supabase
      .from('announcements')
      .select('created_by')
      .eq('id', announcementId)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: 'Announcement not found' }
    }

    if (existing.created_by !== userId && user.role !== 'admin') {
      return { success: false, error: 'Unauthorized to delete this announcement' }
    }

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('[Announcements] Failed to delete announcement:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete announcement',
    }
  }
}

export async function getAnnouncements(
  userId?: string,
  filters?: {
    type?: 'general' | 'urgent' | 'event'
    audience?: string
    includeExpired?: boolean
    pinnedOnly?: boolean
  }
): Promise<AnnouncementData[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })

    query = query.not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())

    if (!filters?.includeExpired) {
      query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    }

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.audience) {
      query = query.eq('audience', filters.audience)
    }

    if (filters?.pinnedOnly) {
      query = query.eq('is_pinned', true)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      type: item.type,
      audience: item.audience,
      createdBy: item.created_by,
      publishedAt: item.published_at ? new Date(item.published_at) : undefined,
      expiresAt: item.expires_at ? new Date(item.expires_at) : undefined,
      isPinned: item.is_pinned,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at || item.created_at),
    }))
  } catch (error) {
    console.error('[Announcements] Failed to get announcements:', error)
    return []
  }
}

export async function getAnnouncementById(
  announcementId: string,
  userId?: string
): Promise<AnnouncementData | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', announcementId)
      .single()

    if (error || !data) return null

    if (userId) {
      await supabase
        .from('announcement_views')
        .upsert({
          announcement_id: announcementId,
          user_id: userId,
          viewed_at: new Date().toISOString(),
        }, {
          onConflict: 'announcement_id,user_id',
        })

      await supabase
        .from('announcements')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', announcementId)
    }

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      type: data.type,
      audience: data.audience,
      createdBy: data.created_by,
      publishedAt: data.published_at ? new Date(data.published_at) : undefined,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      isPinned: data.is_pinned,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at || data.created_at),
    }
  } catch (error) {
    console.error('[Announcements] Failed to get announcement:', error)
    return null
  }
}

async function sendAnnouncementEmail(
  announcement: AnnouncementData,
  authorName: string,
  authorRole: string
): Promise<void> {
  try {
    const supabase = await createClient()

    let query = supabase.from('users').select('id')

    switch (announcement.audience) {
      case 'board':
        query = query.eq('role', 'board')
        break
      case 'committee_chairs':
        query = query.eq('role', 'committee_chair')
        break
      case 'teachers':
        query = query.eq('role', 'teacher')
        break
      case 'members':
        query = query.in('role', ['member', 'board', 'committee_chair', 'teacher', 'admin'])
        break
      case 'all':
        break
    }

    const { data: users, error } = await query

    if (error || !users || users.length === 0) {
      console.log('[Announcements] No users to send announcement to')
      return
    }

    const userIds = users.map(u => u.id)

    const organizationName = process.env.NEXT_PUBLIC_ORGANIZATION_NAME || 'PTSA+'

    const actionItems = announcement.type === 'urgent' 
      ? extractActionItems(announcement.content)
      : undefined

    await sendBulkEmailsSecure(
      userIds,
      'announcements',
      announcement.title,
      (userId) => {
        const emailProps = {
          title: announcement.title,
          content: announcement.content,
          type: announcement.type,
          authorName,
          authorRole,
          organizationName,
          actionItems,
          ctaButton: announcement.type === 'event' 
            ? { text: 'View Event Details', url: `https://ptsaplus.vercel.app/announcements/${announcement.id}` }
            : undefined,
          unsubscribeUrl: `https://ptsaplus.vercel.app/unsubscribe?token=${userId}&category=announcements`,
        }
        
        return AnnouncementEmail(emailProps)
      },
      'announcement'
    )
  } catch (error) {
    console.error('[Announcements] Failed to send announcement email:', error)
  }
}

function extractActionItems(content: string): Array<{ text: string; deadline?: string }> | undefined {
  const lines = content.split('\n')
  const actionItems: Array<{ text: string; deadline?: string }> = []
  
  const actionKeywords = ['action:', 'todo:', 'must:', 'deadline:', 'by:']
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    if (actionKeywords.some(keyword => lowerLine.includes(keyword))) {
      const deadlineMatch = line.match(/by\s+(\d{1,2}\/\d{1,2}|\w+\s+\d{1,2})/i)
      actionItems.push({
        text: line.replace(/^[-•*]\s*/, '').trim(),
        deadline: deadlineMatch ? deadlineMatch[1] : undefined,
      })
    }
  }
  
  return actionItems.length > 0 ? actionItems : undefined
}

export async function markAnnouncementAsRead(
  userId: string,
  announcementId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('announcement_views')
      .upsert({
        announcement_id: announcementId,
        user_id: userId,
        viewed_at: new Date().toISOString(),
      }, {
        onConflict: 'announcement_id,user_id',
      })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('[Announcements] Failed to mark as read:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark announcement as read',
    }
  }
}

export async function getUserAnnouncementViews(userId: string): Promise<string[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('announcement_views')
      .select('announcement_id')
      .eq('user_id', userId)

    if (error) throw error

    return (data || []).map(view => view.announcement_id)
  } catch (error) {
    console.error('[Announcements] Failed to get user views:', error)
    return []
  }
}