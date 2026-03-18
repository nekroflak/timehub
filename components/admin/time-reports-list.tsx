'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, Umbrella, TrendingUp, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimeEntry, Profile } from '@/lib/types'

interface TimeReportsListProps {
  entries: (TimeEntry & { profile: Pick<Profile, 'full_name' | 'email'> | null })[]
}

interface MemberSummary {
  name: string
  workHours: number
  vacationDays: number
  overtimeHours: number
}

export function TimeReportsList({ entries }: TimeReportsListProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Brak wpisów</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Wpisy czasu pracy pojawią się tutaj
          </p>
        </CardContent>
      </Card>
    )
  }

  const workEntries = entries.filter(e => e.type === 'work')
  const vacationEntries = entries.filter(e => e.type === 'vacation')
  const totalWorkHours = workEntries.reduce((sum, e) => sum + (e.hours || 0), 0)
  const totalVacationDays = vacationEntries.length

  // Build per-member summary
  const memberMap = new Map<string, MemberSummary>()
  for (const entry of entries) {
    const name = entry.profile?.full_name || entry.profile?.email || 'Unknown'
    if (!memberMap.has(name)) {
      memberMap.set(name, { name, workHours: 0, vacationDays: 0, overtimeHours: 0 })
    }
    const summary = memberMap.get(name)!
    if (entry.type === 'work') {
      summary.workHours += entry.hours || 0
      // Assume 8h standard day for overtime calc in admin view
      if ((entry.hours || 0) > 8) {
        summary.overtimeHours += (entry.hours || 0) - 8
      }
    } else if (entry.type === 'vacation') {
      summary.vacationDays += 1
    }
  }
  const memberSummaries = Array.from(memberMap.values()).sort((a, b) => b.workHours - a.workHours)
  const totalOvertimeHours = memberSummaries.reduce((sum, m) => sum + m.overtimeHours, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Godziny pracy</p>
            </div>
            <p className="text-2xl font-bold">{totalWorkHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Umbrella className="h-4 w-4 text-amber-500" />
              <p className="text-xs text-muted-foreground">Dni urlopu</p>
            </div>
            <p className="text-2xl font-bold">{totalVacationDays}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <p className="text-xs text-muted-foreground">Nadgodziny</p>
            </div>
            <p className={cn('text-2xl font-bold', totalOvertimeHours > 0 && 'text-orange-600')}>
              {totalOvertimeHours.toFixed(1)}h
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Pracownicy</p>
            </div>
            <p className="text-2xl font-bold">{memberSummaries.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Podsumowanie</TabsTrigger>
          <TabsTrigger value="entries">Wszystkie wpisy</TabsTrigger>
        </TabsList>

        {/* Per-member summary tab */}
        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Podsumowanie per pracownik</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pracownik</TableHead>
                  <TableHead>Godziny pracy</TableHead>
                  <TableHead>Urlop</TableHead>
                  <TableHead>Nadgodziny</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberSummaries.map((member) => (
                  <TableRow key={member.name}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.workHours.toFixed(1)}h</TableCell>
                    <TableCell>
                      {member.vacationDays > 0 ? (
                        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                          <Umbrella className="h-3 w-3 mr-1" />
                          {member.vacationDays}d
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.overtimeHours > 0 ? (
                        <Badge variant="outline" className="text-orange-700 border-orange-300 bg-orange-50">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{member.overtimeHours.toFixed(1)}h
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* All entries tab */}
        <TabsContent value="entries" className="mt-4">
          <Card>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Pracownik</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Od</TableHead>
                  <TableHead>Do</TableHead>
                  <TableHead>Godziny</TableHead>
                  <TableHead>Opis</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {new Date(entry.date + 'T12:00:00').toLocaleDateString('pl-PL', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      {entry.profile?.full_name || entry.profile?.email || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {entry.type === 'vacation' ? (
                        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                          <Umbrella className="h-3 w-3 mr-1" />
                          Urlop
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                          Praca
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.type === 'vacation' ? '—' : (entry.start_time || '—')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.type === 'vacation' ? '—' : (entry.end_time || '—')}
                    </TableCell>
                    <TableCell>
                      {entry.type === 'vacation' ? (
                        <span className="text-muted-foreground">cały dzień</span>
                      ) : (
                        <span className={cn(
                          (entry.hours || 0) > 8 && 'text-orange-600 font-medium'
                        )}>
                          {(entry.hours || 0).toFixed(1)}h
                          {(entry.hours || 0) > 8 && <span className="ml-1 text-xs">(OT)</span>}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {entry.description || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
