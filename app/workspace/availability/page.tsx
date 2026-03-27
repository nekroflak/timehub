import { getOrgTeamMembers } from '@/lib/actions/availability'
import { TeamAvailability } from '@/components/availability/team-availability'
import { Users2 } from 'lucide-react'

export const metadata = {
  title: 'Dostępność zespołu',
}

export default async function AvailabilityPage() {
  const members = await getOrgTeamMembers()

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Users2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Brak współpracowników</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          W Twojej organizacji nie ma jeszcze innych pracowników. Zaproś ich przez panel administratora.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dostępność zespołu</h1>
        <p className="text-muted-foreground mt-1">
          Sprawdź dostępność współpracownika na wybrany dzień.
        </p>
      </div>

      <TeamAvailability initialMembers={members} />
    </div>
  )
}
