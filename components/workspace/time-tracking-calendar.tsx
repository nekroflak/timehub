'use client'

import { useState } from 'react'
import { createTimeEntry, deleteTimeEntry } from '@/lib/actions/worker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimeEntry } from '@/lib/types'

interface TimeTrackingCalendarProps {
  initialEntries: TimeEntry[]
}

export function TimeTrackingCalendar({ initialEntries }: TimeTrackingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const startDay = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })

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
    setSelectedDate(date)
    setDialogOpen(true)
    setError(null)
  }

  async function handleSubmit(formData: FormData) {
    if (!selectedDate) return
    
    setLoading(true)
    setError(null)
    
    formData.append('date', selectedDate)
    const result = await createTimeEntry(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      // Optimistically update the local state
      const hours = parseFloat(formData.get('hours') as string)
      const description = formData.get('description') as string
      
      setEntries(prev => {
        const existing = prev.find(e => e.date === selectedDate)
        if (existing) {
          return prev.map(e => e.date === selectedDate ? { ...e, hours, description } : e)
        }
        return [...prev, { 
          id: Date.now().toString(), 
          user_id: '', 
          organization_id: '', 
          date: selectedDate, 
          hours, 
          description, 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)

  const days = []
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-20" />)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const entry = getEntryForDate(date)
    const isToday = new Date().toISOString().split('T')[0] === date
    
    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        className={cn(
          'h-20 p-2 border rounded-md text-left transition-colors hover:bg-muted',
          isToday && 'ring-2 ring-primary',
          entry && 'bg-primary/10'
        )}
      >
        <div className="font-medium text-sm">{day}</div>
        {entry && (
          <div className="mt-1">
            <span className="text-xs font-semibold text-primary">{entry.hours}h</span>
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Hours This Month</p>
              <p className="text-3xl font-bold">{totalHours.toFixed(1)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{monthName}</CardTitle>
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
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedEntry ? 'Edit Time Entry' : 'Log Time'}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
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
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="hours">Hours Worked</Label>
                <Input
                  id="hours"
                  name="hours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  defaultValue={selectedEntry?.hours || 8}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="What did you work on?"
                  defaultValue={selectedEntry?.description || ''}
                  rows={3}
                />
              </div>
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
                  Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (selectedEntry ? 'Update' : 'Log Time')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
