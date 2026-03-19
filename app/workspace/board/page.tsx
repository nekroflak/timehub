import { getOrgTasks, getCurrentUserId, getOrgMembers } from '@/lib/actions/tasks'
import { TaskBoard } from '@/components/workspace/tasks/task-board'
import { CreateTaskDialog } from '@/components/workspace/tasks/create-task-dialog'

export default async function BoardPage() {
  const [tasks, currentUserId, orgMembers] = await Promise.all([
    getOrgTasks(),
    getCurrentUserId(),
    getOrgMembers(),
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

      <TaskBoard tasks={tasks} currentUserId={currentUserId ?? ''} orgMembers={orgMembers} />
    </div>
  )
}
