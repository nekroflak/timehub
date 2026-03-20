import { getOrgDepartments } from '@/lib/actions/tasks'
import { DepartmentsList } from '@/components/admin/departments-list'

export default async function DepartmentsPage() {
  const departments = await getOrgDepartments()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dzialy</h1>
        <p className="text-muted-foreground mt-1">
          Zarządzaj działami organizacji. Pracownicy przypisani do działu widzą tylko zadania swojego działu.
        </p>
      </div>
      <DepartmentsList departments={departments} />
    </div>
  )
}
