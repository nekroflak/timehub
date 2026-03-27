// Feature temporarily hidden — code preserved, direct access redirects to My Day.
// To re-enable: restore this page's content and add the nav item back to sidebar.tsx.
import { redirect } from 'next/navigation'

export default function WorkspaceAvailabilityPage() {
  redirect('/workspace/today')
}
