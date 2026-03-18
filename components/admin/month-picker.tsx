'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
]

interface MonthPickerProps {
  currentMonth: string // e.g. "2026-04"
}

export function MonthPicker({ currentMonth }: MonthPickerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [year, month] = currentMonth.split('-').map(Number)
  const monthName = MONTH_NAMES[month - 1]

  function navigate(delta: number) {
    let newMonth = month + delta
    let newYear = year
    if (newMonth < 1) { newMonth = 12; newYear-- }
    if (newMonth > 12) { newMonth = 1; newYear++ }
    const ym = `${newYear}-${String(newMonth).padStart(2, '0')}`
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', ym)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium w-36 text-center">
        {monthName} {year}
      </span>
      <Button variant="outline" size="icon" onClick={() => navigate(1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
