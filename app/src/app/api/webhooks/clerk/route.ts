import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
  // Get the webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env.local')
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data

    // Create a user record in our database
    const { error } = await supabase.from('users').insert({
      id: id,
      email: email_addresses[0]?.email_address || '',
      first_name: first_name || '',
      last_name: last_name || '',
      role: 'member', // Default role for new users
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Error creating user:', error)
      return new Response('Error creating user', { status: 500 })
    }

    // Note: We'll redirect users to registration after sign-in
    // This is handled in the sign-in callback
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data

    // Update user record
    const { error } = await supabase
      .from('users')
      .update({
        email: email_addresses[0]?.email_address || '',
        first_name: first_name || '',
        last_name: last_name || '',
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating user:', error)
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    // Soft delete or handle user deletion
    const { error } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deleting user:', error)
    }
  }

  return new Response('', { status: 200 })
}