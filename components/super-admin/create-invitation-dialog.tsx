'use client'

import { useState } from 'react'
import { createInvitation } from '@/lib/actions/super-admin'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Copy, Check } from 'lucide-react'
import type { Organization } from '@/lib/types'

interface CreateInvitationDialogProps {
  organizations: Organization[]
}

export function CreateInvitationDialog({ organizations }: CreateInvitationDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [role, setRole] = useState('admin')
  const [organizationId, setOrganizationId] = useState('')

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.append('role', role)
    formData.append('organizationId', organizationId)

    const result = await createInvitation(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.inviteLink) {
      setInviteLink(result.inviteLink)
      setLoading(false)
    }
  }

  function handleCopy() {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleClose() {
    setOpen(false)
    setInviteLink(null)
    setError(null)
    setRole('admin')
    setOrganizationId('')
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nowe zaproszenie
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{inviteLink ? 'Zaproszenie utworzone' : 'Utwórz zaproszenie'}</DialogTitle>
          <DialogDescription>
            {inviteLink
              ? 'Udostępnij ten link. Wygasa po 7 dniach.'
              : 'Zaproś kogoś do dołączenia do organizacji.'}
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="flex flex-col gap-4 py-4">
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Gotowe</Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={handleSubmit}>
            <div className="flex flex-col gap-4 py-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Adres e-mail</Label>
                <Input id="email" name="email" type="email" placeholder="uzytkownik@example.com" required />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Rola</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="worker">Pracownik</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Organizacja</Label>
                <Select value={organizationId} onValueChange={setOrganizationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz organizację" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {organizations.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Brak organizacji. Najpierw utwórz organizację.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Anuluj</Button>
              <Button type="submit" disabled={loading || !organizationId}>
                {loading ? 'Tworzenie...' : 'Utwórz zaproszenie'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
