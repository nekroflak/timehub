'use client'

import { useState, useTransition } from 'react'
import { getOrgTeamMembers, getTeamAvailability, type TeamMember, type AvailabilityResult } from '@/lib/actions/availability'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar, Info, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  initialMembers: TeamMember[]
}

export function TeamAvailability({ initialMembers }: Props) {
  const [selectedUserId, setSelectedUserId] = useState<string>(initialMembers[0]?.userId ?? '')
  const [selectedDate, setSelectedDate] = useState<string>(getTodayUTC())
  const [result, setResult] = useState<AvailabilityResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleFetch() {
    if (!selectedUserId) return
    setError(null)
    startTransition(async () => {
      const data = await getTeamAvailability(selectedUserId, selectedDate)
      if (!data) {
        setError('Nie udało się pobrać dostępności')
      } else {
        setResult(data)
      }
    })
  }

  function prevDay() {
    const d = new Date(selectedDate)
    d.setUTCDate(d.getUTCDate() - 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  function nextDay() {
    const d = new Date(selectedDate)
    d.setUTCDate(d.getUTCDate() + 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  function resetToToday() {
    setSelectedDate(getTodayUTC())
  }

  const selectedMember = initialMembers.find(m => m.userId === selectedUserId)

  return (
    <div className="space-y-6">
      {/* Controls Row */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Member Select */}
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Pracownik</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {initialMembers.map(m => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.fullName || m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Navigation */}
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Data</label>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={prevDay} disabled={isPending}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="flex-1" onClick={resetToToday} disabled={isPending}>
                <Calendar className="h-4 w-4 mr-2" />
                {formatPolishDate(selectedDate)}
              </Button>
              <Button variant="outline" size="icon" onClick={nextDay} disabled={isPending}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Fetch Button */}
          <div className="flex items-end">
            <Button onClick={handleFetch} disabled={isPending || !selectedUserId}>
              {isPending ? 'Sprawdzam...' : 'Sprawdź dostępność'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Result Display */}
      {error && (
        <Card className="p-6 border-destructive">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          {/* Header */}
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {result.member.fullName || result.member.email}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatPolishDate(result.date)}
                </p>
              </div>
              {result.isFullDayAbsent && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Info className="h-5 w-5" />
                  <span className="text-sm font-medium">Nieobecność</span>
                </div>
              )}
            </div>
          </Card>

          {/* Availability Grid */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-semibold">Dostępność godzinowa</h4>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {result.slots.map(slot => {
                const isOffHours = slot.status === 'off-hours'
                const isBusy = slot.status === 'busy'
                const isVacation = slot.status === 'vacation'
                const isFree = slot.status === 'free'

                return (
                  <div
                    key={slot.hour}
                    className={cn(
                      'relative rounded-md p-3 text-center border transition-colors',
                      isOffHours && 'bg-muted/30 border-muted text-muted-foreground',
                      isFree && 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400',
                      isBusy && 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400',
                      isVacation && 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400'
                    )}
                  >
                    <div className="text-sm font-medium">{slot.label}</div>
                    <div className="text-xs mt-1">
                      {isOffHours && 'Poza godz.'}
                      {isFree && 'Wolny'}
                      {isBusy && 'Zajęty'}
                      {isVacation && 'Urlop'}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900" />
                <span>Wolny</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900" />
                <span>Zajęty</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900" />
                <span>Urlop / Nieobecność</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted/30 border border-muted" />
                <span>Po godzinach</span>
              </div>
            </div>
          </Card>

          {/* Privacy Notice */}
          <Card className="p-4 bg-muted/30">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Informacja o prywatności</p>
                <p>
                  Wyświetlana jest tylko informacja o zajętości czasowej. Szczegóły spotkań, tytuły wydarzeń i notatki
                  pozostają prywatne i nie są widoczne.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function getTodayUTC(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function formatPolishDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  const months = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 
                  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia']
  const days = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota']
  
  return `${days[d.getUTCDay()]}, ${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}
