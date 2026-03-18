'use client'

import { useState } from 'react'
import { revokeInvitation } from '@/lib/actions/super-admin'
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

interface InvitationsListProps {
  invitations: (Invitation & { organization: { name: string } | null })[]
}

export function InvitationsList({ invitations }: InvitationsListProps) {
  const [revokingId, setRevokingId] = useState<string | null>(null)

  async function handleRevoke(id: string) {
    setRevokingId(id)
    await revokeInvitation(id)
    setRevokingId(null)
  }

  function getStatusDisplay(invitation: Invitation) {
    switch (invitation.status) {
      case 'accepted':
        return { label: 'Accepted', variant: 'default' as const, Icon: CheckCircle2 }
      case 'expired':
        return { label: 'Expired', variant: 'secondary' as const, Icon: XCircle }
      case 'cancelled':
        return { label: 'Cancelled', variant: 'destructive' as const, Icon: XCircle }
      default:
        return { label: 'Pending', variant: 'outline' as const, Icon: Clock }
    }
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No invitations yet</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Invitations appear here when you create an organization
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {invitations.map((invitation) => {
        const { label, variant, Icon } = getStatusDisplay(invitation)
        const canRevoke = invitation.status === 'pending'

        return (
          <Card key={invitation.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{invitation.email}</h3>
                  <p className="text-sm text-muted-foreground">
                    {invitation.organization?.name || 'Unknown org'} &mdash; {invitation.role}
                  </p>
                  {invitation.expires_at && (
                    <p className="text-xs text-muted-foreground">
                      Expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Badge variant={variant} className="gap-1">
                  <Icon className="h-3 w-3" />
                  {label}
                </Badge>

                {canRevoke && (
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
                          The invite link sent to {invitation.email} will no longer work.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRevoke(invitation.id)}
                          disabled={revokingId === invitation.id}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {revokingId === invitation.id ? 'Revoking...' : 'Revoke'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
