'use client'

import { useState } from 'react'
import { createOrganization } from '@/lib/actions/super-admin'
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

export function CreateOrganizationDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [plan, setPlan] = useState('free')
  const [status, setStatus] = useState('active')

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.append('plan', plan)
    formData.append('status', status)

    const result = await createOrganization(formData)

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
    setPlan('free')
    setStatus('active')
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nowa organizacja
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {inviteLink ? 'Organizacja utworzona' : 'Utwórz organizację'}
          </DialogTitle>
          <DialogDescription>
            {inviteLink
              ? 'Udostępnij ten link pierwszemu administratorowi firmy. Wygasa po 7 dniach.'
              : 'Utwórz nową organizację i zaproś pierwszego administratora.'}
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
                <Label htmlFor="name">Nazwa organizacji *</Label>
                <Input id="name" name="name" placeholder="Acme Sp. z o.o." required />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="slug">Slug (opcjonalnie)</Label>
                <Input id="slug" name="slug" placeholder="acme-sp-zoo" />
                <p className="text-xs text-muted-foreground">Generowany automatycznie z nazwy, jeśli pozostawiony pusty</p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="adminEmail">E-mail administratora *</Label>
                <Input
                  id="adminEmail"
                  name="adminEmail"
                  type="email"
                  placeholder="admin@firma.pl"
                  required
                />
                <p className="text-xs text-muted-foreground">Zaproszenie zostanie wysłane na ten adres</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Plan</Label>
                  <Select value={plan} onValueChange={setPlan}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Bezpłatny</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktywna</SelectItem>
                      <SelectItem value="trial">Próbna</SelectItem>
                      <SelectItem value="blocked">Zablokowana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Anuluj
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Tworzenie...' : 'Utwórz i zaproś'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
