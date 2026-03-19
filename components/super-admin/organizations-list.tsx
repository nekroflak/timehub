'use client'

import { useState } from 'react'
import { deleteOrganization } from '@/lib/actions/super-admin'
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
import { Building2, Trash2, Users } from 'lucide-react'
import type { Organization } from '@/lib/types'

interface OrganizationsListProps {
  organizations: (Organization & { members: { count: number }[] })[]
}

export function OrganizationsList({ organizations }: OrganizationsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    await deleteOrganization(id)
    setDeletingId(null)
  }

  if (organizations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Brak organizacji</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Utwórz pierwszą organizację, aby zacząć
          </p>
        </CardContent>
      </Card>
    )
  }

  const planLabel: Record<string, string> = {
    enterprise: 'Enterprise',
    pro: 'Pro',
    free: 'Bezpłatny',
  }

  const statusLabel: Record<string, string> = {
    active: 'Aktywna',
    trial: 'Próbna',
    blocked: 'Zablokowana',
  }

  const planVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    enterprise: 'default',
    pro: 'secondary',
    free: 'outline',
  }

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    trial: 'secondary',
    blocked: 'destructive',
  }

  return (
    <div className="grid gap-4">
      {organizations.map((org) => {
        const memberCount = org.members?.[0]?.count || 0

        return (
          <Card key={org.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{org.name}</h3>
                    <Badge variant={planVariant[org.plan] ?? 'outline'}>{planLabel[org.plan] ?? org.plan}</Badge>
                    <Badge variant={statusVariant[org.status] ?? 'outline'}>{statusLabel[org.status] ?? org.status}</Badge>
                  </div>
                  {org.slug && (
                    <p className="text-sm text-muted-foreground">/{org.slug}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">{memberCount} członków</span>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Usunąć organizację?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Spowoduje to trwałe usunięcie {org.name} i wszystkich powiązanych danych. Tej operacji nie można cofnąć.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Anuluj</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(org.id)}
                        disabled={deletingId === org.id}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deletingId === org.id ? 'Usuwanie...' : 'Usuń'}
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
