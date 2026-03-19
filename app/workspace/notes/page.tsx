import { getMyNotes } from '@/lib/actions/worker'
import { NotesList } from '@/components/workspace/notes-list'
import { CreateNoteDialog } from '@/components/workspace/create-note-dialog'

export default async function NotesPage() {
  const notes = await getMyNotes()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Notatki</h1>
          <p className="text-muted-foreground mt-1">
            Twoje prywatne notatki — widoczne tylko dla Ciebie
          </p>
        </div>
        <CreateNoteDialog />
      </div>

      <NotesList notes={notes} />
    </div>
  )
}
