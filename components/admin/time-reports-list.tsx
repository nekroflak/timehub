'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Clock } from 'lucide-react'
import type { TimeEntry, Profile } from '@/lib/types'

interface TimeReportsListProps {
  entries: (TimeEntry & { profile: Pick<Profile, 'full_name' | 'email'> | null })[]
}

export function TimeReportsList({ entries }: TimeReportsListProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No time entries yet</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Time entries from team members will appear here
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-3xl font-bold">{totalHours.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Entries</p>
              <p className="text-3xl font-bold">{entries.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Team Member</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </TableCell>
                <TableCell>
                  {entry.profile?.full_name || entry.profile?.email || 'Unknown'}
                </TableCell>
                <TableCell>{entry.hours.toFixed(1)}h</TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {entry.description || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
