'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { createLeaveRequest } from '@/lib/actions/leave-requests'
import { LEAVE_TYPE_LABELS } from '@/lib/types'
import type { LeaveRequestType } from '@/lib/types'

export function CreateLeaveRequestDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState<LeaveRequestType>('vacation')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('type', type)

    startTransition(async () => {
      const result = await createLeaveRequest(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        setType('vacation')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nowy wniosek
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nowy wniosek</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="type">Typ wniosku</Label>
            <Select value={type} onValueChange={(v) => setType(v as LeaveRequestType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(LEAVE_TYPE_LABELS) as [LeaveRequestType, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date_from">Od</Label>
              <Input id="date_from" name="date_from" type="date" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date_to">Do</Label>
              <Input id="date_to" name="date_to" type="date" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="worker_note">Uwagi (opcjonalnie)</Label>
            <Textarea
              id="worker_note"
              name="worker_note"
              rows={3}
              placeholder="Dodaj notatkę do wniosku..."
              className="resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Wysyłanie...' : 'Wyślij wniosek'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
