'use client'

import { useState } from 'react'
import { removeMember, updateMemberRole } from '@/lib/actions/admin'
import { assignMemberDepartment } from '@/lib/actions/tasks'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users, MoreVertical, Shield, User, Layers } from 'lucide-react'
import type { OrgMember, Profile, Department } from '@/lib/types'

interface TeamMembersListProps {
  members: (OrgMember & { profile: Profile | null })[]
  departments: Department[]
}

export function TeamMembersList({ members, departments }: TeamMembersListProps) {
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

  async function handleDepartmentChange(membershipId: string, departmentId: string) {
    setProcessingId(membershipId)
    await assignMemberDepartment(membershipId, departmentId === 'none' ? null : departmentId)
    setProcessingId(null)
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Brak członków zespołu</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Zaproś pierwszego członka zespołu, aby zacząć
          </p>
        </CardContent>
      </Card>
    )
  }

  const deptMap = Object.fromEntries(departments.map(d => [d.id, d.name]))

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
                  {member.profile?.full_name || 'Użytkownik bez nazwy'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {member.profile?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Department selector */}
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <Select
                  value={member.department_id ?? 'none'}
                  onValueChange={(val) => handleDepartmentChange(member.id, val)}
                  disabled={processingId === member.id}
                >
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue placeholder="Brak działu">
                      {member.department_id ? deptMap[member.department_id] ?? 'Nieznany' : 'Brak działu'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Brak działu</SelectItem>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                {member.role === 'admin' ? (
                  <><Shield className="h-3 w-3 mr-1" /> Administrator</>
                ) : (
                  <><User className="h-3 w-3 mr-1" /> Pracownik</>
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
                    {member.role === 'admin' ? 'Zmień na pracownika' : 'Zmień na administratora'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive"
                      >
                        Usuń z zespołu
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Usunąć członka zespołu?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Spowoduje to usunięcie {member.profile?.full_name || member.profile?.email} z organizacji.
                          Osoba ta straci dostęp do wszystkich danych organizacji.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemove(member.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Usuń
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
