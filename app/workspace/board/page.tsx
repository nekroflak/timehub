import { getOrgTasks, getCurrentUserId } from '@/lib/actions/tasks'
import { TaskBoard } from '@/components/workspace/tasks/task-board'
import { CreateTaskDialog } from '@/components/workspace/tasks/create-task-dialog'
import { ClipboardList } from 'lucide-react'

export default async function BoardPage() {
  const [tasks, currentUserId] = await Promise.all([
    getOrgTasks(),
    getCurrentUserId(),
  ])

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tablica zadań</h1>
          <p className="text-muted-foreground mt-1">
            Zadania organizacji — widoczne dla wszystkich członków
          </p>
        </div>
        <CreateTaskDialog />
      </div>

      <TaskBoard tasks={tasks} currentUserId={currentUserId ?? ''} />
    </div>
  )
}
