'use client'

import { useState } from 'react'
import { removeMember, updateMemberRole } from '@/lib/actions/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Users, Trash2, MoreVertical, Shield, User } from 'lucide-react'
import type { Membership, Profile } from '@/lib/types'

interface TeamMembersListProps {
  members: (Membership & { profile: Profile | null })[]
}

export function TeamMembersList({ members }: TeamMembersListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)

  async function handleRemove(id: string) {
    setProcessingId(id)
    await removeMember(id)
    setProcessingId(null)
  }

  async function handleRoleChange(id: string, newRole: 'admin' | 'worker') {
    setProcessingId(id)
    await updateMemberRole(id, newRole)
    setProcessingId(null)
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No team members yet</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Invite your first team member to get started
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {members.map((member) => (
        <Card key={member.id}>
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <span className="text-lg font-semibold text-primary">
                  {(member.profile?.full_name || member.profile?.email || '?')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-semibold">
                  {member.profile?.full_name || 'Unnamed User'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {member.profile?.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                {member.role === 'admin' ? (
                  <><Shield className="h-3 w-3 mr-1" /> Admin</>
                ) : (
                  <><User className="h-3 w-3 mr-1" /> Worker</>
                )}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={processingId === member.id}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleRoleChange(member.id, member.role === 'admin' ? 'worker' : 'admin')}
                  >
                    {member.role === 'admin' ? 'Demote to Worker' : 'Promote to Admin'}
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive"
                      >
                        Remove from team
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove {member.profile?.full_name || member.profile?.email} from the organization.
                          They will lose access to all organization data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemove(member.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
