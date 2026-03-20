import { getOrgTasks, getCurrentUserRole, getOrgMembers, getOrgDepartments } from '@/lib/actions/tasks'
import { TaskBoard } from '@/components/workspace/tasks/task-board'
import { CreateTaskDialog } from '@/components/workspace/tasks/create-task-dialog'

export default async function AdminBoardPage() {
  const [userCtx, orgMembers, departments] = await Promise.all([
    getCurrentUserRole(),
    getOrgMembers(),
    getOrgDepartments(),
  ])

  const isAdmin = userCtx?.orgRole === 'admin'
  const currentUserId = userCtx?.userId ?? ''

  const tasks = await getOrgTasks()

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tablica zadań</h1>
          <p className="text-muted-foreground mt-1">
            Zadania całej organizacji — możesz filtrować według działu
          </p>
        </div>
        <CreateTaskDialog departments={departments} isAdmin={isAdmin} />
      </div>

      <TaskBoard
        tasks={tasks}
        currentUserId={currentUserId}
        orgMembers={orgMembers}
        departments={departments}
        isAdmin={isAdmin}
      />
    </div>
  )
}
