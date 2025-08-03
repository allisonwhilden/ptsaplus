'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

const membershipTypes = [
  { value: 'individual', label: 'Individual - $15/year', amount: 15 },
  { value: 'family', label: 'Family - $25/year', amount: 25 },
  { value: 'teacher', label: 'Teacher/Staff - Free', amount: 0 },
] as const

const registrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  membershipType: z.enum(['individual', 'family', 'teacher']),
  // Student information (FERPA protected)
  studentName: z.string().optional(),
  studentGrade: z.string().optional(),
  hasStudentInfo: z.boolean(),
  // Privacy and consent (COPPA/FERPA compliance)
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: 'You must consent to our privacy policy',
  }),
  studentDataConsent: z.boolean().optional(), // Required only if student info provided
  parentalConsent: z.boolean().optional(), // Required for COPPA compliance
  volunteerInterest: z.boolean(),
}).refine((data) => {
  // If student info is provided, student data consent is required
  if (data.hasStudentInfo && (data.studentName || data.studentGrade)) {
    return data.studentDataConsent === true
  }
  return true
}, {
  message: 'You must consent to student data collection if providing student information',
  path: ['studentDataConsent']
})

type RegistrationFormValues = z.infer<typeof registrationSchema>

export function RegistrationForm({ userId }: { userId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      membershipType: 'individual',
      studentName: '',
      studentGrade: '',
      hasStudentInfo: false,
      agreeToTerms: false,
      privacyConsent: false,
      studentDataConsent: false,
      parentalConsent: false,
      volunteerInterest: false,
    },
  })

  const selectedMembershipType = form.watch('membershipType')
  const hasStudentInfo = form.watch('hasStudentInfo')
  const membershipAmount = membershipTypes.find(
    (type) => type.value === selectedMembershipType
  )?.amount || 0

  async function onSubmit(values: RegistrationFormValues) {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/members/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          userId,
          membershipAmount,
          // Include consent tracking
          consentData: {
            privacy: values.privacyConsent,
            terms: values.agreeToTerms,
            studentData: values.studentDataConsent,
            parentalConsent: values.parentalConsent,
            consentMethod: 'web_form',
            ipAddress: null, // Will be captured server-side
            userAgent: navigator.userAgent,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Registration failed')
      }

      const data = await response.json()

      if (membershipAmount > 0) {
        // Redirect to payment if membership requires payment
        router.push(`/payments/checkout?memberId=${data.memberId}&amount=${membershipAmount}`)
      } else {
        // Teacher/staff - no payment needed
        toast({
          title: 'Registration successful!',
          description: 'Welcome to our PTSA community.',
        })
        router.push('/dashboard')
      }
    } catch {
      toast({
        title: 'Registration failed',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jane@example.com" {...field} />
              </FormControl>
              <FormDescription>
                We&apos;ll use this for PTSA communications
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="(555) 123-4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="membershipType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Membership Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select membership type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {membershipTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedMembershipType !== 'teacher' && (
          <>
            <FormField
              control={form.control}
              name="hasStudentInfo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I want to provide student information
                    </FormLabel>
                    <FormDescription>
                      Check this box if you&apos;d like to associate your child&apos;s information with your membership
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {hasStudentInfo && (
              <>
                <FormField
                  control={form.control}
                  name="studentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormDescription>
                        Name of your child attending our school
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studentGrade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Grade</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="K">Kindergarten</SelectItem>
                          <SelectItem value="1">1st Grade</SelectItem>
                          <SelectItem value="2">2nd Grade</SelectItem>
                          <SelectItem value="3">3rd Grade</SelectItem>
                          <SelectItem value="4">4th Grade</SelectItem>
                          <SelectItem value="5">5th Grade</SelectItem>
                          <SelectItem value="6">6th Grade</SelectItem>
                          <SelectItem value="7">7th Grade</SelectItem>
                          <SelectItem value="8">8th Grade</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studentDataConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Student Data Consent (Required)
                        </FormLabel>
                        <FormDescription className="text-xs">
                          I consent to the collection and storage of my child&apos;s educational information in compliance with FERPA. This information will only be used for PTSA activities and will not be shared with third parties.
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </>
            )}
          </>
        )}

        <FormField
          control={form.control}
          name="volunteerInterest"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  I&apos;m interested in volunteering
                </FormLabel>
                <FormDescription>
                  We&apos;ll contact you about volunteer opportunities
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="space-y-4 rounded-md border p-4">
          <h3 className="text-sm font-medium">Privacy and Consent</h3>
          
          <FormField
            control={form.control}
            name="privacyConsent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I consent to the privacy policy
                  </FormLabel>
                  <FormDescription>
                    I understand how my personal information will be collected, used, and protected
                  </FormDescription>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agreeToTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I agree to the terms and conditions
                  </FormLabel>
                  <FormDescription>
                    I agree to the PTSA membership terms and conditions
                  </FormDescription>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4">
          {membershipAmount > 0 && (
            <p className="text-sm text-muted-foreground mb-4">
              Membership fee: ${membershipAmount}/year
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 
             membershipAmount > 0 ? 'Continue to Payment' : 'Complete Registration'}
          </Button>
        </div>
      </form>
    </Form>
  )
}