import { EmailQueueItem, EmailOptions } from './types'
import { sendEmail } from './client'
import { createClient } from '@/lib/supabase-server'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 60000

export async function queueEmail(
  options: EmailOptions & { scheduledFor?: Date }
): Promise<{ success: boolean; queueId?: string; error?: string }> {
  try {
    const supabase = await createClient()
    
    const queueItem = {
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: options.subject,
      template: options.react ? 'react-template' : undefined,
      data: {
        html: options.html,
        text: options.text,
        tags: options.tags,
        metadata: options.metadata,
      },
      scheduled_for: options.scheduledFor?.toISOString(),
      attempts: 0,
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('email_queue')
      .insert(queueItem)
      .select()
      .single()

    if (error) throw error

    if (!options.scheduledFor || options.scheduledFor <= new Date()) {
      processQueueItem(data.id)
    }

    return { success: true, queueId: data.id }
  } catch (error) {
    console.error('[EmailQueue] Failed to queue email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to queue email',
    }
  }
}

export async function processEmailQueue(): Promise<void> {
  try {
    const supabase = await createClient()
    
    const { data: items, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`)
      .lt('attempts', MAX_RETRIES)
      .order('created_at', { ascending: true })
      .limit(10)

    if (error) throw error
    if (!items || items.length === 0) return

    for (const item of items) {
      await processQueueItem(item.id)
    }
  } catch (error) {
    console.error('[EmailQueue] Failed to process queue:', error)
  }
}

async function processQueueItem(itemId: string): Promise<void> {
  try {
    const supabase = await createClient()
    
    const { data: item, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('id', itemId)
      .single()

    if (fetchError || !item) {
      console.error('[EmailQueue] Failed to fetch queue item:', fetchError)
      return
    }

    await supabase
      .from('email_queue')
      .update({
        status: 'processing',
        last_attempt_at: new Date().toISOString(),
        attempts: item.attempts + 1,
      })
      .eq('id', itemId)

    const recipients = item.to.split(',').map((r: string) => r.trim())
    const emailOptions: EmailOptions = {
      to: recipients.length === 1 ? recipients[0] : recipients,
      subject: item.subject,
      html: item.data?.html,
      text: item.data?.text,
      tags: item.data?.tags,
      metadata: item.data?.metadata,
    }

    const result = await sendEmail(emailOptions)

    if (result.success) {
      await supabase
        .from('email_queue')
        .update({
          status: 'sent',
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
    } else {
      const shouldRetry = item.attempts + 1 < MAX_RETRIES
      
      await supabase
        .from('email_queue')
        .update({
          status: shouldRetry ? 'pending' : 'failed',
          error: result.error,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)

      if (shouldRetry) {
        setTimeout(() => processQueueItem(itemId), RETRY_DELAY_MS)
      }
    }
  } catch (error) {
    console.error('[EmailQueue] Failed to process item:', error)
    
    try {
      const supabase = await createClient()
      await supabase
        .from('email_queue')
        .update({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Processing failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
    } catch (updateError) {
      console.error('[EmailQueue] Failed to update failed item:', updateError)
    }
  }
}

export async function retryFailedEmails(): Promise<number> {
  try {
    const supabase = await createClient()
    
    const { data: items, error } = await supabase
      .from('email_queue')
      .select('id')
      .eq('status', 'failed')
      .lt('attempts', MAX_RETRIES)

    if (error) throw error
    if (!items || items.length === 0) return 0

    await supabase
      .from('email_queue')
      .update({
        status: 'pending',
        error: null,
        updated_at: new Date().toISOString(),
      })
      .in('id', items.map(item => item.id))

    for (const item of items) {
      processQueueItem(item.id)
    }

    return items.length
  } catch (error) {
    console.error('[EmailQueue] Failed to retry failed emails:', error)
    return 0
  }
}

export async function cancelScheduledEmail(queueId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('email_queue')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', queueId)
      .eq('status', 'pending')

    return !error
  } catch (error) {
    console.error('[EmailQueue] Failed to cancel email:', error)
    return false
  }
}

export async function getQueueStatus(): Promise<{
  pending: number
  processing: number
  sent: number
  failed: number
  cancelled: number
}> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('email_queue')
      .select('status')

    if (error) throw error

    const counts = {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      cancelled: 0,
    }

    data?.forEach(item => {
      if (item.status in counts) {
        counts[item.status as keyof typeof counts]++
      }
    })

    return counts
  } catch (error) {
    console.error('[EmailQueue] Failed to get queue status:', error)
    return {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      cancelled: 0,
    }
  }
}