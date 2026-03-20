'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2 } from 'lucide-react'
import { createTask } from '@/lib/actions/tasks'
import type { Department } from '@/lib/types'

interface CreateTaskDialogProps {
  departments?: Department[]
  isAdmin?: boolean
  defaultDepartmentId?: string | null
}

export function CreateTaskDialog({ departments = [], isAdmin = false, defaultDepartmentId }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDept, setSelectedDept] = useState<string>(defaultDepartmentId ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)

    if (isAdmin && selectedDept) {
      formData.set('department_id', selectedDept)
    }

    startTransition(async () => {
      const result = await createTask(formData)
      if (result.error) {
        setError(result.error)
      } else {
        form.reset()
        setSelectedDept(defaultDepartmentId ?? '')
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Dodaj zadanie
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nowe zadanie</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Tytuł <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              name="title"
              placeholder="Krótki opis zadania..."
              required
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Opis (opcjonalnie)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Szczegóły zadania..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Department selector — admin only */}
          {isAdmin && departments.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>Dział</Label>
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz dział..." />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Utwórz
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
