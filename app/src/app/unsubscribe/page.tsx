'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'processing' | 'success' | 'error' | 'idle'>('idle')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState<string | null>(null)

  const token = searchParams.get('token')
  const categoryParam = searchParams.get('category')

  useEffect(() => {
    if (categoryParam) {
      setCategory(categoryParam)
    }
  }, [categoryParam])

  const handleUnsubscribe = async (unsubscribeAll: boolean) => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid unsubscribe link. Please check your email for the correct link.')
      return
    }

    setStatus('processing')
    
    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          category: unsubscribeAll ? null : category,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(
          unsubscribeAll
            ? 'You have been unsubscribed from all email communications.'
            : `You have been unsubscribed from ${category} emails.`
        )
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to process unsubscribe request.')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred. Please try again later.')
    }
  }

  if (!token) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-500" />
              Invalid Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                This unsubscribe link is invalid or has expired. 
                Please check your email for the correct link or contact support.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Successfully Unsubscribed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
            
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                You can update your communication preferences anytime by logging into your account.
              </p>
              
              <div className="flex gap-4">
                <Button onClick={() => router.push('/')} variant="outline">
                  Return to Home
                </Button>
                <Button onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Unsubscribe from Emails
          </CardTitle>
          <CardDescription>
            Choose which emails you'd like to stop receiving
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'error' && (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === 'idle' && (
            <>
              {category ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium mb-2">You're about to unsubscribe from:</p>
                    <p className="text-lg capitalize">{category} Emails</p>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={() => handleUnsubscribe(false)}
                      className="w-full"
                      size="lg"
                    >
                      Unsubscribe from {category} emails only
                    </Button>
                    
                    <Button
                      onClick={() => handleUnsubscribe(true)}
                      variant="destructive"
                      className="w-full"
                      size="lg"
                    >
                      Unsubscribe from ALL emails
                    </Button>
                    
                    <Button
                      onClick={() => router.push('/')}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      You're about to unsubscribe from all PTSA+ email communications.
                      You will still receive critical account and payment confirmation emails.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <Button
                      onClick={() => handleUnsubscribe(true)}
                      variant="destructive"
                      className="w-full"
                      size="lg"
                    >
                      Confirm Unsubscribe
                    </Button>
                    
                    <Button
                      onClick={() => router.push('/')}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> You will always receive payment confirmations and 
                  critical account-related emails for security reasons.
                </p>
              </div>
            </>
          )}

          {status === 'processing' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Processing your request...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}