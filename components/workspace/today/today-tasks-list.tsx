import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KanbanSquare, AlertTriangle } from 'lucide-react'
import type { Task } from '@/lib/types'

interface TodayTasksListProps {
  tasks: Task[]
}

function isOverdue(task: Task): boolean {
  if (task.status !== 'assigned' || !task.assigned_at) return false
  return Date.now() - new Date(task.assigned_at).getTime() >= 48 * 60 * 60 * 1000
}

export function TodayTasksList({ tasks }: TodayTasksListProps) {
  const assigned = tasks.filter(t => t.status === 'assigned')
  const todo = tasks.filter(t => t.status === 'todo')

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <KanbanSquare className="h-4 w-4" />
          Moje zadania
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {tasks.length} {tasks.length === 1 ? 'zadanie' : tasks.length < 5 ? 'zadania' : 'zadań'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Brak przypisanych zadań.
          </p>
        ) : (
          <>
            {assigned.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Przypisane</p>
                {assigned.map(task => {
                  const overdue = isOverdue(task)
                  return (
                    <Link href="/workspace/board" key={task.id}>
                      <div className={`flex items-start gap-2.5 rounded-md border p-3 text-sm transition-colors hover:bg-muted/50 ${overdue ? 'border-destructive/40 bg-destructive/5' : ''}`}>
                        <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-500 mt-1.5" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-snug truncate">{task.title}</p>
                          {task.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                          )}
                        </div>
                        {overdue && (
                          <div className="shrink-0 flex items-center gap-1 text-destructive text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            <span>48h+</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
            {todo.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 mt-3">Do zrobienia</p>
                {todo.map(task => (
                  <Link href="/workspace/board" key={task.id}>
                    <div className="flex items-start gap-2.5 rounded-md border p-3 text-sm transition-colors hover:bg-muted/50">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug truncate">{task.title}</p>
                        {task.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/workspace/board" className="block pt-1">
              <p className="text-xs text-muted-foreground hover:text-foreground transition-colors text-right">
                Przejdz do tablicy &rarr;
              </p>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  )
}
