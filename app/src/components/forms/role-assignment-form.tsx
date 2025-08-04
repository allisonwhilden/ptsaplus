'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { UserRole } from '@/types/database'

interface RoleAssignmentFormProps {
  userId: string
  currentRole: UserRole
  userName: string
}

export function RoleAssignmentForm({ userId, currentRole, userName }: RoleAssignmentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const roles: { value: UserRole; label: string }[] = [
    { value: 'admin', label: 'Administrator' },
    { value: 'board', label: 'Board Member' },
    { value: 'committee_chair', label: 'Committee Chair' },
    { value: 'teacher', label: 'Teacher/Staff' },
    { value: 'member', label: 'Member' },
  ]

  async function handleSubmit() {
    if (selectedRole === currentRole) {
      setIsOpen(false)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      })

      if (!response.ok) {
        throw new Error('Failed to update role')
      }

      toast({
        title: 'Role updated',
        description: `${userName}'s role has been updated to ${selectedRole}.`,
      })
      
      router.refresh()
      setIsOpen(false)
    } catch {
      toast({
        title: 'Update failed',
        description: 'Failed to update user role.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Change Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Update the role for {userName}. This will change their permissions in the system.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Role</label>
            <p className="text-sm text-muted-foreground">
              {roles.find(r => r.value === currentRole)?.label}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">New Role</label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || selectedRole === currentRole}>
              {isSubmitting ? 'Updating...' : 'Update Role'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}