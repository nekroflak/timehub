'use client'

import { useState } from 'react'
import {
  Clock,
  FileCheck,
  KanbanSquare,
  BarChart3,
  Sun,
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type FeatureId = 'time' | 'requests' | 'tasks' | 'approvals' | 'today'

interface Feature {
  id: FeatureId
  icon: React.ReactNode
  label: string
  description: string
}

// ─── Static mock data ─────────────────────────────────────────────────────────

const FEATURES: Feature[] = [
  {
    id: 'time',
    icon: <Clock className="h-5 w-5" />,
    label: 'Czas pracy i nadgodziny',
    description: 'Rejestruj czas pracy w widoku miesięcznym, oznaczaj urlopy i śledź nadgodziny.',
  },
  {
    id: 'requests',
    icon: <FileCheck className="h-5 w-5" />,
    label: 'Wnioski i nieobecności',
    description: 'Składaj wnioski urlopowe i wyjścia prywatne — administrator zatwierdza lub odrzuca.',
  },
  {
    id: 'tasks',
    icon: <KanbanSquare className="h-5 w-5" />,
    label: 'Zadania zespołu',
    description: 'Prosta tablica kanban z kolumnami: do zrobienia, przypisane i zrobione.',
  },
  {
    id: 'approvals',
    icon: <BarChart3 className="h-5 w-5" />,
    label: 'Akceptacje i raporty',
    description: 'Administrator przegląda zgłoszenia miesięcy pracy i generuje raporty PDF.',
  },
  {
    id: 'today',
    icon: <Sun className="h-5 w-5" />,
    label: 'Mój dzień',
    description: 'Widok dnia z przypisanymi zadaniami i nadchodzącymi wydarzeniami z kalendarza.',
  },
]

// ─── Mock preview panels ──────────────────────────────────────────────────────

function TimePreview() {
  const days = [
    { d: 'Pn', n: '03', h: 8, type: 'work' },
    { d: 'Wt', n: '04', h: 8, type: 'work' },
    { d: 'Śr', n: '05', h: 9, type: 'overtime' },
    { d: 'Cz', n: '06', h: 8, type: 'work' },
    { d: 'Pt', n: '07', h: 0, type: 'vacation' },
    { d: 'Pn', n: '10', h: 8, type: 'work' },
    { d: 'Wt', n: '11', h: 10, type: 'overtime' },
    { d: 'Śr', n: '12', h: 8, type: 'work' },
    { d: 'Cz', n: '13', h: 8, type: 'work' },
    { d: 'Pt', n: '14', h: 8, type: 'work' },
  ]
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Marzec 2025</p>
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">82 / 168 h</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {days.map((day) => (
          <div
            key={day.n}
            className={cn(
              'flex flex-col items-center rounded-lg p-2 text-center border text-xs',
              day.type === 'vacation' && 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300',
              day.type === 'overtime' && 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300',
              day.type === 'work' && 'bg-card border-border text-foreground',
            )}
          >
            <span className="text-muted-foreground font-normal">{day.d}</span>
            <span className="font-semibold">{day.n}</span>
            <span className="mt-0.5">{day.type === 'vacation' ? 'urlop' : `${day.h}h`}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-card border border-border inline-block" /> praca</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-200 inline-block" /> nadgodziny</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-200 inline-block" /> urlop</span>
      </div>
    </div>
  )
}

function RequestsPreview() {
  const items = [
    { type: 'Urlop', dates: '07–11.07.2025', status: 'approved', label: 'Zaakceptowany' },
    { type: 'Home office', dates: '14.07.2025', status: 'pending', label: 'Oczekuje' },
    { type: 'Wyjście prywatne', dates: '16.07.2025', status: 'pending', label: 'Oczekuje' },
    { type: 'Chorobowe', dates: '01–03.06.2025', status: 'rejected', label: 'Odrzucony' },
  ]
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Moje wnioski</p>
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2.5 text-sm">
          <div>
            <p className="font-medium">{item.type}</p>
            <p className="text-xs text-muted-foreground">{item.dates}</p>
          </div>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            item.status === 'approved' && 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
            item.status === 'pending' && 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
            item.status === 'rejected' && 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
          )}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function TasksPreview() {
  const cols = [
    {
      label: 'Do zrobienia',
      tasks: ['Aktualizacja regulaminu', 'Przygotowanie oferty'],
    },
    {
      label: 'Przypisane',
      tasks: ['Onboarding – Marta K.', 'Raport Q2'],
    },
    {
      label: 'Zrobione',
      tasks: ['Backup danych', 'Spotkanie kwartalne'],
    },
  ]
  return (
    <div className="grid grid-cols-3 gap-3">
      {cols.map((col) => (
        <div key={col.label} className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{col.label}</p>
          {col.tasks.map((t) => (
            <div key={t} className="rounded-lg border bg-card px-3 py-2 text-xs font-medium leading-snug shadow-sm">
              {t}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function ApprovalsPreview() {
  const rows = [
    { name: 'Anna Kowalska', month: 'Czerwiec 2025', hours: '168h', status: 'submitted', label: 'Do zatwierdzenia' },
    { name: 'Piotr Nowak', month: 'Czerwiec 2025', hours: '172h', label: 'Do zatwierdzenia', status: 'submitted' },
    { name: 'Maria Wiśniewska', month: 'Maj 2025', hours: '160h', status: 'approved', label: 'Zatwierdzone' },
  ]
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Zgłoszenia do akceptacji</p>
        <span className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">2 nowe</span>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2.5 text-sm">
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.month} · {row.hours}</p>
          </div>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            row.status === 'submitted' && 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
            row.status === 'approved' && 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
          )}>
            {row.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function TodayPreview() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Moje zadania na dziś</p>
        <div className="space-y-1.5">
          {[
            { text: 'Przegląd planu projektu', done: true },
            { text: 'Odpowiedź na ofertę klienta', done: false },
            { text: 'Aktualizacja statusu zadań', done: false },
          ].map((t) => (
            <div key={t.text} className="flex items-center gap-2 text-sm">
              {t.done
                ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
              <span className={cn(t.done && 'line-through text-muted-foreground')}>{t.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nadchodzące spotkania</p>
        <div className="space-y-1.5">
          {[
            { time: '10:00', title: 'Stand-up zespołu', now: true },
            { time: '13:00', title: 'Rozmowa z klientem', now: false },
            { time: '15:30', title: 'Przegląd sprintów', now: false },
          ].map((e) => (
            <div key={e.time} className={cn(
              'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm',
              e.now ? 'border-primary/40 bg-primary/5' : 'bg-card',
            )}>
              <span className="text-xs font-mono text-muted-foreground w-10 shrink-0">{e.time}</span>
              <span className="font-medium">{e.title}</span>
              {e.now && <span className="ml-auto text-xs text-primary font-medium">Trwa</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const PREVIEWS: Record<FeatureId, React.ReactNode> = {
  time: <TimePreview />,
  requests: <RequestsPreview />,
  tasks: <TasksPreview />,
  approvals: <ApprovalsPreview />,
  today: <TodayPreview />,
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FeaturePreview() {
  const [active, setActive] = useState<FeatureId>('time')

  return (
    <section className="py-20 md:py-32 bg-card border-y">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold md:text-4xl text-balance">Zobacz, jak to działa</h2>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto text-pretty">
            Kliknij funkcję, żeby zobaczyć podgląd — to statyczna demonstracja bez danych produkcyjnych.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Feature list */}
          <div className="flex flex-col gap-2 lg:w-64 shrink-0">
            {FEATURES.map((f) => (
              <button
                key={f.id}
                onClick={() => setActive(f.id)}
                onMouseEnter={() => setActive(f.id)}
                className={cn(
                  'group flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
                  active === f.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-muted',
                )}
              >
                <span className={cn(
                  'mt-0.5 shrink-0 transition-colors',
                  active === f.id ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
                )}>
                  {f.icon}
                </span>
                <div className="min-w-0">
                  <p className={cn(
                    'text-sm font-medium leading-snug',
                    active === f.id ? 'text-primary-foreground' : 'text-foreground',
                  )}>
                    {f.label}
                  </p>
                  <p className={cn(
                    'mt-0.5 text-xs leading-relaxed hidden lg:block',
                    active === f.id ? 'text-primary-foreground/70' : 'text-muted-foreground',
                  )}>
                    {f.description}
                  </p>
                </div>
                <ChevronRight className={cn(
                  'ml-auto mt-0.5 h-4 w-4 shrink-0 transition-colors',
                  active === f.id ? 'text-primary-foreground' : 'text-muted-foreground',
                )} />
              </button>
            ))}
          </div>

          {/* Preview panel */}
          <div className="flex-1 rounded-xl border bg-background p-6 min-h-64 shadow-sm">
            <div key={active} className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200">
              {PREVIEWS[active]}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
