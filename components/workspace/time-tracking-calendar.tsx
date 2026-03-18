'use client'

import { useState } from 'react'
import { createTimeEntry, deleteTimeEntry } from '@/lib/actions/worker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Trash2, Briefcase, Umbrella, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimeEntry } from '@/lib/types'

interface MonthlySummary {
  workingDays: number
  vacationDays: number
  effectiveWorkingDays: number
  expectedHours: number
  workHours: number
  overtimeHours: number
  undertimeHours: number
  overtimePay: number
  regularPay: number
  totalPay: number
  currency: string
  hoursPerDay: number
}

interface TimeTrackingCalendarProps {
  initialEntries: TimeEntry[]
  summary: MonthlySummary | null
}

type EntryType = 'work' | 'vacation'

export function TimeTrackingCalendar({ initialEntries, summary: initialSummary }: TimeTrackingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [entryType, setEntryType] = useState<EntryType>('work')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  // Start week on Monday: 0=Sun→6, 1=Mon→0, ...
  const rawStartDay = firstDayOfMonth.getDay()
  const startDay = rawStartDay === 0 ? 6 : rawStartDay - 1
  const daysInMonth = lastDayOfMonth.getDate()

  const monthName = currentDate.toLocaleString('pl-PL', { month: 'long', year: 'numeric' })

  function getEntryForDate(date: string) {
    return entries.find(e => e.date === date)
  }

  function handlePrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  function handleNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  function handleDateClick(day: number) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const existing = getEntryForDate(date)
    setSelectedDate(date)
    setEntryType((existing?.type as EntryType) || 'work')
    setDialogOpen(true)
    setError(null)
  }

  async function handleSubmit(formData: FormData) {
    if (!selectedDate) return
    setLoading(true)
    setError(null)

    formData.append('date', selectedDate)
    formData.set('type', entryType)

    const result = await createTimeEntry(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      const hours = entryType === 'vacation'
        ? (initialSummary?.hoursPerDay || 8)
        : parseFloat(formData.get('hours') as string)
      const description = formData.get('description') as string

      setEntries(prev => {
        const existing = prev.find(e => e.date === selectedDate)
        if (existing) {
          return prev.map(e => e.date === selectedDate
            ? { ...e, hours, type: entryType, description }
            : e)
        }
        return [...prev, {
          id: Date.now().toString(),
          user_id: '',
          organization_id: '',
          date: selectedDate,
          hours,
          type: entryType,
          start_time: null,
          end_time: null,
          description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]
      })

      setDialogOpen(false)
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!selectedDate) return
    const entry = getEntryForDate(selectedDate)
    if (!entry) return

    setLoading(true)
    const result = await deleteTimeEntry(entry.id)

    if (result?.error) {
      setError(result.error)
    } else {
      setEntries(prev => prev.filter(e => e.id !== entry.id))
      setDialogOpen(false)
    }
    setLoading(false)
  }

  const selectedEntry = selectedDate ? getEntryForDate(selectedDate) : null

  // Compute local summary from current entries
  const hoursPerDay = initialSummary?.hoursPerDay || 8
  const workEntries = entries.filter(e => e.type === 'work')
  const vacationEntries = entries.filter(e => e.type === 'vacation')
  const workHours = workEntries.reduce((sum, e) => sum + (e.hours || 0), 0)
  const vacationDays = vacationEntries.length

  // Count working days in current month
  function countWorkingDays(y: number, m: number) {
    const days = new Date(y, m + 1, 0).getDate()
    let count = 0
    for (let d = 1; d <= days; d++) {
      const dow = new Date(y, m, d).getDay()
      if (dow !== 0 && dow !== 6) count++
    }
    return count
  }
  const workingDays = countWorkingDays(year, month)
  const effectiveDays = Math.max(0, workingDays - vacationDays)
  const expectedHours = effectiveDays * hoursPerDay
  const overtimeHours = Math.max(0, workHours - expectedHours)
  const undertimeHours = Math.max(0, expectedHours - workHours)

  // Build calendar grid (Mon–Sun)
  const days = []
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-20" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const entry = getEntryForDate(date)
    const isToday = new Date().toISOString().split('T')[0] === date
    const isVacation = entry?.type === 'vacation'
    const isWork = entry?.type === 'work'
    const dow = new Date(year, month, day).getDay()
    const isWeekend = dow === 0 || dow === 6

    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        className={cn(
          'h-20 p-2 border rounded-md text-left transition-colors hover:bg-muted',
          isToday && 'ring-2 ring-primary',
          isVacation && 'bg-amber-50 border-amber-200',
          isWork && 'bg-primary/10 border-primary/20',
          isWeekend && !entry && 'bg-muted/40 opacity-60',
        )}
      >
        <div className={cn('font-medium text-sm', isWeekend && 'text-muted-foreground')}>{day}</div>
        {isVacation && (
          <div className="mt-1 flex items-center gap-1">
            <Umbrella className="h-3 w-3 text-amber-600" />
            <span className="text-xs font-medium text-amber-700">Urlop</span>
          </div>
        )}
        {isWork && (
          <div className="mt-1">
            <span className="text-xs font-semibold text-primary">{(entry.hours || 0).toFixed(1)}h</span>
            {(entry.hours || 0) > hoursPerDay && (
              <span className="ml-1 text-xs text-orange-500 font-medium">OT</span>
            )}
          </div>
        )}
      </button>
    )
  }

  const currency = initialSummary?.currency || 'PLN'

  return (
    <div className="flex flex-col gap-6">
      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Przepracowane</p>
            <p className="text-2xl font-bold">{workHours.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground mt-1">z {expectedHours.toFixed(0)}h normy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Urlop</p>
            <p className="text-2xl font-bold">{vacationDays}d</p>
            <p className="text-xs text-muted-foreground mt-1">{(vacationDays * hoursPerDay).toFixed(0)}h odliczone</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Nadgodziny</p>
            <p className={cn('text-2xl font-bold', overtimeHours > 0 ? 'text-orange-600' : '')}>
              {overtimeHours > 0 ? `+${overtimeHours.toFixed(1)}h` : '0h'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {overtimeHours > 0 ? 'ponad normę' : 'brak nadgodzin'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">
              {undertimeHours > 0 ? 'Niedobór' : 'Status'}
            </p>
            <p className={cn('text-2xl font-bold', undertimeHours > 0 ? 'text-destructive' : 'text-green-600')}>
              {undertimeHours > 0 ? `-${undertimeHours.toFixed(1)}h` : 'OK'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {undertimeHours > 0 ? 'poniżej normy' : 'norma wypełniona'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="capitalize">{monthName}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary/20 border border-primary/30" />
              <span className="text-xs text-muted-foreground">Praca</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />
              <span className="text-xs text-muted-foreground">Urlop</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-orange-500">OT</span>
              <span className="text-xs text-muted-foreground">Nadgodziny</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entry Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedEntry ? 'Edytuj wpis' : 'Dodaj wpis'}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && new Date(selectedDate + 'T12:00:00').toLocaleDateString('pl-PL', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit}>
            <div className="flex flex-col gap-4 py-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              {/* Type Switch */}
              <div className="flex flex-col gap-2">
                <Label>Typ wpisu</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEntryType('work')}
                    className={cn(
                      'flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border text-sm font-medium transition-colors',
                      entryType === 'work'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-input bg-background hover:bg-muted'
                    )}
                  >
                    <Briefcase className="h-4 w-4" />
                    Praca
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryType('vacation')}
                    className={cn(
                      'flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border text-sm font-medium transition-colors',
                      entryType === 'vacation'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'border-input bg-background hover:bg-muted'
                    )}
                  >
                    <Umbrella className="h-4 w-4" />
                    Urlop
                  </button>
                </div>
              </div>

              {entryType === 'vacation' ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
                  Urlop — odejmie pełny dzień ({hoursPerDay}h) z normy miesięcznej
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="hours">Godziny pracy</Label>
                  <Input
                    id="hours"
                    name="hours"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    defaultValue={selectedEntry?.type === 'work' ? (selectedEntry?.hours || 8) : 8}
                    required
                  />
                  {selectedEntry?.type === 'work' && (selectedEntry.hours || 0) > hoursPerDay && (
                    <div className="flex items-center gap-1.5 text-xs text-orange-600">
                      <TrendingUp className="h-3 w-3" />
                      {((selectedEntry.hours || 0) - hoursPerDay).toFixed(1)}h nadgodzin w tym dniu
                    </div>
                  )}
                </div>
              )}

              {entryType === 'work' && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Opis (opcjonalnie)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Czym się zajmowałeś?"
                    defaultValue={selectedEntry?.type === 'work' ? (selectedEntry?.description || '') : ''}
                    rows={3}
                  />
                </div>
              )}
            </div>
            <DialogFooter className="flex justify-between">
              {selectedEntry && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Usuń
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Anuluj
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Zapisuję...' : (selectedEntry ? 'Zaktualizuj' : 'Zapisz')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
