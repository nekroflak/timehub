'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Layers, Plus, Trash2, Loader2 } from 'lucide-react'
import { createDepartment, deleteDepartment } from '@/lib/actions/tasks'
import type { Department } from '@/lib/types'

interface DepartmentsListProps {
  departments: Department[]
}

export function DepartmentsList({ departments: initial }: DepartmentsListProps) {
  const [departments, setDepartments] = useState(initial)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createDepartment(newName)
      if (result.error) {
        setError(result.error)
      } else {
        // Optimistically add — the page will revalidate, but we show it immediately
        setNewName('')
        // Force a page reload to get fresh data from server
        window.location.reload()
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteDepartment(id)
      if (!result.error) {
        setDepartments(prev => prev.filter(d => d.id !== id))
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Create new department */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dodaj nowy dział</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex items-center gap-3">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nazwa działu, np. Sprzedaż..."
              className="max-w-xs"
              required
            />
            <Button type="submit" size="sm" disabled={isPending || !newName.trim()}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Dodaj
            </Button>
          </form>
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {/* List */}
      {departments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Brak działów</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Dodaj pierwszy dział, aby przypisywać do niego pracowników i zadania.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {departments.map(dept => (
            <Card key={dept.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">{dept.name}</span>
                  {dept.name === 'Ogólne' && (
                    <Badge variant="secondary" className="text-xs">domyślny</Badge>
                  )}
                </div>
                {dept.name !== 'Ogólne' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" disabled={isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Usunąć dział "{dept.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Pracownicy i zadania przypisane do tego działu stracą przypisanie działu (zostaną bez działu).
                          Ta operacja jest nieodwracalna.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(dept.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Usuń dział
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
