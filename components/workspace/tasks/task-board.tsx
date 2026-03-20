'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClipboardList, AlertTriangle, Inbox, Layers } from 'lucide-react'
import type { Task, TaskStatus, Department } from '@/lib/types'
import { TaskCard } from './task-card'

type Filter = 'all' | 'mine' | 'overdue'

interface Column {
  id: TaskStatus
  label: string
  emptyLabel: string
}

const COLUMNS: Column[] = [
  { id: 'todo',     label: 'Do zrobienia', emptyLabel: 'Brak zadań do zrobienia' },
  { id: 'assigned', label: 'Przypisane',   emptyLabel: 'Brak przypisanych zadań' },
  { id: 'done',     label: 'Zrobione',     emptyLabel: 'Brak ukończonych zadań' },
]

const COLUMN_HEADER_CLASSES: Record<TaskStatus, string> = {
  todo:     'text-muted-foreground',
  assigned: 'text-primary',
  done:     'text-green-700',
}

const COLUMN_BADGE_CLASSES: Record<TaskStatus, string> = {
  todo:     'bg-muted text-muted-foreground',
  assigned: 'bg-primary/10 text-primary',
  done:     'bg-green-100 text-green-700',
}

function isOverdue(task: Task): boolean {
  if (task.status !== 'assigned' || !task.assigned_at) return false
  return Date.now() - new Date(task.assigned_at).getTime() >= 48 * 60 * 60 * 1000
}

interface OrgMember {
  id: string
  full_name: string | null
  email: string
}

interface TaskBoardProps {
  tasks: Task[]
  currentUserId: string
  orgMembers: OrgMember[]
  departments: Department[]
  isAdmin: boolean
}

export function TaskBoard({ tasks, currentUserId, orgMembers, departments, isAdmin }: TaskBoardProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [deptFilter, setDeptFilter] = useState<string>('all')

  const filtered = tasks.filter(t => {
    // Department filter (admin only)
    if (isAdmin && deptFilter !== 'all' && t.department_id !== deptFilter) return false
    // Status/assignment filter
    if (filter === 'mine') return t.assigned_to === currentUserId || t.created_by === currentUserId
    if (filter === 'overdue') return isOverdue(t)
    return true
  })

  const overdueCount = tasks.filter(isOverdue).length

  return (
    <div className="flex flex-col gap-6">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Wszystkie
          <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-xs">{tasks.length}</Badge>
        </Button>
        <Button
          variant={filter === 'mine' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('mine')}
        >
          Moje
        </Button>
        <Button
          variant={filter === 'overdue' ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => setFilter('overdue')}
          className={cn(filter !== 'overdue' && overdueCount > 0 && 'border-destructive/40 text-destructive hover:bg-destructive/10')}
        >
          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
          Po terminie
          {overdueCount > 0 && (
            <Badge variant="destructive" className="ml-1.5 h-4 px-1 text-xs">
              {overdueCount}
            </Badge>
          )}
        </Button>

        {/* Department filter — admin only */}
        {isAdmin && departments.length > 0 && (
          <div className="flex items-center gap-1.5 ml-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="Wszystkie działy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie działy</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Board columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map(col => {
          const colTasks = filtered.filter(t => t.status === col.id)
          return (
            <div key={col.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 px-1">
                <span className={cn('text-sm font-semibold', COLUMN_HEADER_CLASSES[col.id])}>
                  {col.label}
                </span>
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', COLUMN_BADGE_CLASSES[col.id])}>
                  {colTasks.length}
                </span>
              </div>

              <div className={cn(
                'flex flex-col gap-2 rounded-xl border-2 border-dashed p-3 min-h-[200px]',
                col.id === 'todo'     && 'border-muted bg-muted/20',
                col.id === 'assigned' && 'border-primary/20 bg-primary/5',
                col.id === 'done'     && 'border-green-200 bg-green-50/50',
              )}>
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 py-8 text-center">
                    <Inbox className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground/60">{col.emptyLabel}</p>
                  </div>
                ) : (
                  colTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      currentUserId={currentUserId}
                      orgMembers={orgMembers}
                      showDepartment={isAdmin}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
