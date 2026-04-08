import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { TimeEntry, Profile } from '@/lib/types'
import { countWorkingDaysExcludingHolidays } from '@/lib/polish-holidays'

// ---------------------------------------------------------------------------
// Polish character transliteration for jsPDF built-in fonts
// jsPDF's helvetica/courier use Latin-1 (ISO 8859-1), which doesn't include
// Polish diacritics. We transliterate them so text renders cleanly instead of
// showing boxes or question marks. Data values (names, descriptions) are also
// passed through this to avoid broken glyphs.
// ---------------------------------------------------------------------------
function pl(text: string): string {
  return text
    .replace(/Ą/g, 'A').replace(/ą/g, 'a')
    .replace(/Ć/g, 'C').replace(/ć/g, 'c')
    .replace(/Ę/g, 'E').replace(/ę/g, 'e')
    .replace(/Ł/g, 'L').replace(/ł/g, 'l')
    .replace(/Ń/g, 'N').replace(/ń/g, 'n')
    .replace(/Ó/g, 'O').replace(/ó/g, 'o')
    .replace(/Ś/g, 'S').replace(/ś/g, 's')
    .replace(/Ź/g, 'Z').replace(/ź/g, 'z')
    .replace(/Ż/g, 'Z').replace(/ż/g, 'z')
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = String(d.getDate()).padStart(2, '0')
  const months = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paz', 'lis', 'gru']
  const weekdays = ['Nd', 'Pn', 'Wt', 'Sr', 'Cz', 'Pt', 'So']
  return `${weekdays[d.getDay()]} ${day} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function formatMonth(month: string) {
  const [year, m] = month.split('-')
  const months = [
    'Styczen', 'Luty', 'Marzec', 'Kwiecien', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpien', 'Wrzesien', 'Pazdziernik', 'Listopad', 'Grudzien',
  ]
  return `${months[Number(m) - 1]} ${year}`
}

function formatGeneratedDate() {
  const d = new Date()
  const months = [
    'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
    'lipca', 'sierpnia', 'wrzesnia', 'pazdziernika', 'listopada', 'grudnia',
  ]
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function countWorkingDays(year: number, month: number): number {
  return countWorkingDaysExcludingHolidays(year, month)
}

function drawHeader(doc: jsPDF, opts: {
  orgName: string
  title: string
  subtitle: string
  month: string
}) {
  const pageW = doc.internal.pageSize.getWidth()

  // Top bar
  doc.setFillColor(28, 28, 28)
  doc.rect(0, 0, pageW, 26, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setCharSpace(0)
  doc.setFontSize(13)
  doc.text(pl(opts.orgName), 14, 10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text(pl(opts.title), 14, 19)

  const genDate = `Wygenerowano: ${formatGeneratedDate()}`
  doc.text(pl(genDate), pageW - 14, 19, { align: 'right' })

  // Subtitle
  doc.setTextColor(20, 20, 20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.setCharSpace(0)
  doc.text(pl(opts.subtitle), 14, 42)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(110, 110, 110)
  doc.text(formatMonth(opts.month), 14, 50)

  doc.setDrawColor(210, 210, 210)
  doc.line(14, 55, pageW - 14, 55)
}

function drawFooter(doc: jsPDF, pageNumber?: number) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  doc.setDrawColor(210, 210, 210)
  doc.line(14, pageH - 16, pageW - 14, pageH - 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(160, 160, 160)
  doc.setCharSpace(0)
  doc.text('TimeHub - system rejestracji czasu pracy', 14, pageH - 9)
  doc.text(
    `Strona ${pageNumber ?? doc.getNumberOfPages()}`,
    pageW - 14,
    pageH - 9,
    { align: 'right' }
  )
}

// ---------------------------------------------------------------------------
// WORKER PDF
// ---------------------------------------------------------------------------
export interface WorkerPdfOptions {
  orgName: string
  workerName: string
  workerEmail: string
  month: string
  entries: TimeEntry[]
  config: {
    hours_per_day: number
    hourly_rate: number
    overtime_multiplier: number
    currency: string
  }
}

export function generateWorkerPdf(opts: WorkerPdfOptions) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const [year, monthNum] = opts.month.split('-').map(Number)

  const workEntries = opts.entries.filter(e => e.type === 'work')
  const vacationEntries = opts.entries.filter(e => e.type === 'vacation')
  const workHours = workEntries.reduce((s, e) => s + (e.hours || 0), 0)
  const vacationDays = vacationEntries.length
  const workingDays = countWorkingDays(year, monthNum - 1)
  const effectiveDays = Math.max(0, workingDays - vacationDays)
  const expectedHours = effectiveDays * opts.config.hours_per_day
  const overtimeHours = Math.max(0, workHours - expectedHours)

  drawHeader(doc, {
    orgName: opts.orgName,
    title: 'Raport indywidualny',
    subtitle: opts.workerName || opts.workerEmail,
    month: opts.month,
  })

  let y = 62

  // Summary
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.setCharSpace(0)
  doc.text('Podsumowanie miesiaca', 14, y)
  y += 5

  const summaryRows: [string, string][] = [
    ['Dni robocze w miesiacu', `${workingDays}`],
    ['Dni urlopowe', `${vacationDays}`],
    ['Efektywne dni pracy', `${effectiveDays}`],
    ['Norma godzin', `${expectedHours.toFixed(1)} h`],
    ['Przepracowane godziny', `${workHours.toFixed(1)} h`],
    ['Nadgodziny', `${overtimeHours.toFixed(1)} h`],
  ]

  autoTable(doc, {
    startY: y,
    head: [],
    body: summaryRows,
    theme: 'plain',
    styles: {
      fontSize: 9.5,
      cellPadding: 2.8,
      font: 'helvetica',
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { fontStyle: 'normal', textColor: [80, 80, 80], cellWidth: 95 },
      1: { fontStyle: 'bold', textColor: [20, 20, 20], halign: 'right', cellWidth: 30 },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => drawFooter(doc, data.pageNumber),
  })

  const afterSummary = (doc as any).lastAutoTable.finalY + 10

  // Daily entries
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.setCharSpace(0)
  doc.text('Wpisy dzienne', 14, afterSummary)

  const tableRows = opts.entries
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(entry => {
      const isOt = entry.type === 'work' && (entry.hours || 0) > opts.config.hours_per_day
      const overtimeInDay = isOt ? (entry.hours || 0) - opts.config.hours_per_day : 0
      return [
        formatDate(entry.date),
        entry.type === 'vacation' ? 'Urlop' : 'Praca',
        entry.start_time || '-',
        entry.end_time || '-',
        entry.type === 'vacation'
          ? `${opts.config.hours_per_day}h`
          : `${(entry.hours || 0).toFixed(1)}h`,
        isOt ? `+${overtimeInDay.toFixed(1)}h` : '-',
        pl(entry.description || '-'),
      ]
    })

  autoTable(doc, {
    startY: afterSummary + 5,
    head: [['Data', 'Typ', 'Od', 'Do', 'Godz.', 'Nadgodz.', 'Opis']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [28, 28, 28],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      font: 'helvetica',
      overflow: 'linebreak',
    },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 18 },
      2: { cellWidth: 14 },
      3: { cellWidth: 14 },
      4: { cellWidth: 16, halign: 'right' },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => drawFooter(doc, data.pageNumber),
  })

  drawFooter(doc)

  const safeName = pl(opts.workerName || opts.workerEmail)
    .replace(/\s+/g, '_')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
  doc.save(`raport_${opts.month}_${safeName}.pdf`)
}

// ---------------------------------------------------------------------------
// COMPANY PDF
// ---------------------------------------------------------------------------
export interface CompanyPdfOptions {
  orgName: string
  month: string
  entries: (TimeEntry & { profile: Pick<Profile, 'full_name' | 'email'> | null })[]
}

export function generateCompanyPdf(opts: CompanyPdfOptions) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  drawHeader(doc, {
    orgName: opts.orgName,
    title: 'Raport firmowy',
    subtitle: pl(opts.orgName),
    month: opts.month,
  })

  // Per-member aggregation
  const memberMap = new Map<string, {
    name: string
    workHours: number
    vacationDays: number
    overtimeHours: number
    workedDays: number
  }>()

  for (const entry of opts.entries) {
    const key = entry.profile?.email || 'unknown'
    const name = pl(entry.profile?.full_name || entry.profile?.email || 'Nieznany')
    if (!memberMap.has(key)) {
      memberMap.set(key, { name, workHours: 0, vacationDays: 0, overtimeHours: 0, workedDays: 0 })
    }
    const s = memberMap.get(key)!
    if (entry.type === 'work') {
      s.workHours += entry.hours || 0
      s.workedDays++
      if ((entry.hours || 0) > 8) s.overtimeHours += (entry.hours || 0) - 8
    } else {
      s.vacationDays++
    }
  }

  const members = Array.from(memberMap.values()).sort((a, b) => b.workHours - a.workHours)
  const totalWork = members.reduce((s, m) => s + m.workHours, 0)
  const totalVacation = members.reduce((s, m) => s + m.vacationDays, 0)
  const totalOvertime = members.reduce((s, m) => s + m.overtimeHours, 0)

  let y = 62

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(90, 90, 90)
  doc.setCharSpace(0)
  doc.text(
    `Pracownicy: ${members.length}   |   Suma godzin: ${totalWork.toFixed(1)}h   |   Dni urlopu: ${totalVacation}   |   Nadgodziny: ${totalOvertime.toFixed(1)}h`,
    14, y
  )
  y += 9

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.text('Podsumowanie per pracownik', 14, y)

  autoTable(doc, {
    startY: y + 4,
    head: [['Pracownik', 'Dni pracy', 'Godziny pracy', 'Dni urlopu', 'Nadgodziny']],
    body: members.map(m => [
      m.name,
      `${m.workedDays}`,
      `${m.workHours.toFixed(1)} h`,
      m.vacationDays > 0 ? `${m.vacationDays}` : '-',
      m.overtimeHours > 0 ? `+${m.overtimeHours.toFixed(1)} h` : '-',
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: [28, 28, 28],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      cellPadding: 3,
    },
    bodyStyles: { fontSize: 9, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { cellWidth: 75 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => drawFooter(doc, data.pageNumber),
  })

  const afterTable = (doc as any).lastAutoTable.finalY + 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.setCharSpace(0)
  doc.text('Wszystkie wpisy', 14, afterTable)

  const detailRows = opts.entries
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(entry => [
      pl(entry.profile?.full_name || entry.profile?.email || 'Nieznany'),
      formatDate(entry.date),
      entry.type === 'vacation' ? 'Urlop' : 'Praca',
      entry.type === 'vacation' ? 'caly dzien' : `${(entry.hours || 0).toFixed(1)}h`,
      pl(entry.description || '-'),
    ])

  autoTable(doc, {
    startY: afterTable + 4,
    head: [['Pracownik', 'Data', 'Typ', 'Godziny', 'Opis']],
    body: detailRows,
    theme: 'striped',
    headStyles: {
      fillColor: [28, 28, 28],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: 3,
    },
    bodyStyles: { fontSize: 8.5, cellPadding: 2.5, overflow: 'linebreak' },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 52 },
      2: { cellWidth: 20 },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => drawFooter(doc, data.pageNumber),
  })

  drawFooter(doc)

  const safeOrg = pl(opts.orgName).replace(/\s+/g, '_').toLowerCase().replace(/[^a-z0-9_]/g, '')
  doc.save(`raport_firma_${opts.month}_${safeOrg}.pdf`)
}

// ---------------------------------------------------------------------------
// EMPLOYEE PDF (admin downloads for one employee)
// ---------------------------------------------------------------------------
export interface EmployeePdfOptions {
  orgName: string
  month: string
  employee: Pick<Profile, 'full_name' | 'email'>
  entries: TimeEntry[]
  hoursPerDay?: number
}

export function generateEmployeePdf(opts: EmployeePdfOptions) {
  const hoursPerDay = opts.hoursPerDay || 8
  generateWorkerPdf({
    orgName: opts.orgName,
    workerName: opts.employee.full_name || opts.employee.email,
    workerEmail: opts.employee.email,
    month: opts.month,
    entries: opts.entries,
    config: {
      hours_per_day: hoursPerDay,
      hourly_rate: 0,
      overtime_multiplier: 1.5,
      currency: 'PLN',
    },
  })
}
