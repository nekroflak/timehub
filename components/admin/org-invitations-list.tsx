'use client'

import { useState } from 'react'
import { revokeOrgInvitation } from '@/lib/actions/admin'
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
import { Mail, Trash2, CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { Invitation } from '@/lib/types'

interface OrgInvitationsListProps {
  invitations: Invitation[]
}

export function OrgInvitationsList({ invitations }: OrgInvitationsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleRevoke(id: string) {
    setDeletingId(id)
    await revokeOrgInvitation(id)
    setDeletingId(null)
  }

  function getStatus(invitation: Invitation) {
    if (invitation.accepted_at) {
      return { label: 'Accepted', variant: 'default' as const, icon: CheckCircle2 }
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return { label: 'Expired', variant: 'secondary' as const, icon: XCircle }
    }
    return { label: 'Pending', variant: 'outline' as const, icon: Clock }
  }

  const pendingInvitations = invitations.filter(i => !i.accepted_at)

  if (pendingInvitations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No pending invitations</h3>
          <p className="text-muted-foreground text-sm mt-1">
            All invitations have been accepted or expired
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {pendingInvitations.map((invitation) => {
        const status = getStatus(invitation)
        const StatusIcon = status.icon
        
        return (
          <Card key={invitation.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{invitation.email}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {invitation.role}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge variant={status.variant} className="gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will revoke the invitation sent to {invitation.email}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleRevoke(invitation.id)}
                        disabled={deletingId === invitation.id}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deletingId === invitation.id ? 'Revoking...' : 'Revoke'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
