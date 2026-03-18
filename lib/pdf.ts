import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { TimeEntry, Profile } from '@/lib/types'

// ---- shared helpers ----

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pl-PL', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatMonth(month: string) {
  const [year, m] = month.split('-')
  return new Date(Number(year), Number(m) - 1, 1).toLocaleDateString('pl-PL', {
    month: 'long',
    year: 'numeric',
  })
}

function countWorkingDays(year: number, month: number): number {
  const days = new Date(year, month + 1, 0).getDate()
  let count = 0
  for (let d = 1; d <= days; d++) {
    const dow = new Date(year, month, d).getDay()
    if (dow !== 0 && dow !== 6) count++
  }
  return count
}

function drawHeader(doc: jsPDF, opts: {
  orgName: string
  title: string
  subtitle: string
  month: string
}) {
  const pageW = doc.internal.pageSize.getWidth()

  // Top bar
  doc.setFillColor(17, 17, 17)
  doc.rect(0, 0, pageW, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(opts.orgName, 14, 12)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(opts.title, 14, 21)

  // Generated date (right)
  const now = new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
  doc.text(`Wygenerowano: ${now}`, pageW - 14, 21, { align: 'right' })

  // Subtitle block
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(opts.subtitle, 14, 44)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  const monthLabel = formatMonth(opts.month)
  doc.text(monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1), 14, 52)

  doc.setDrawColor(220, 220, 220)
  doc.line(14, 57, pageW - 14, 57)
}

function drawFooter(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  doc.setDrawColor(220, 220, 220)
  doc.line(14, pageH - 18, pageW - 14, pageH - 18)
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.setFont('helvetica', 'normal')
  doc.text('TimeHub — system rejestracji czasu pracy', 14, pageH - 10)
  doc.text(`Strona ${doc.internal.getCurrentPageInfo().pageNumber}`, pageW - 14, pageH - 10, { align: 'right' })
}

// ---- WORKER PDF ----

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

  // Calculations
  const workEntries = opts.entries.filter(e => e.type === 'work')
  const vacationEntries = opts.entries.filter(e => e.type === 'vacation')
  const workHours = workEntries.reduce((s, e) => s + (e.hours || 0), 0)
  const vacationDays = vacationEntries.length
  const workingDays = countWorkingDays(year, monthNum - 1)
  const effectiveDays = Math.max(0, workingDays - vacationDays)
  const expectedHours = effectiveDays * opts.config.hours_per_day
  const overtimeHours = Math.max(0, workHours - expectedHours)
  const regularPay = Math.min(workHours, expectedHours) * opts.config.hourly_rate
  const overtimePay = overtimeHours * opts.config.hourly_rate * opts.config.overtime_multiplier
  const totalPay = regularPay + overtimePay
  const currency = opts.config.currency

  // Header
  drawHeader(doc, {
    orgName: opts.orgName,
    title: 'Raport indywidualny',
    subtitle: opts.workerName || opts.workerEmail,
    month: opts.month,
  })

  let y = 64

  // Summary section
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text('Podsumowanie miesiąca', 14, y)
  y += 6

  const summaryRows = [
    ['Dni robocze w miesiącu', `${workingDays}`],
    ['Dni urlopowe', `${vacationDays}`],
    ['Efektywne dni pracy', `${effectiveDays}`],
    ['Norma godzin', `${expectedHours.toFixed(1)} h`],
    ['Przepracowane godziny', `${workHours.toFixed(1)} h`],
    ['Nadgodziny', `${overtimeHours.toFixed(1)} h`],
    ['Wynagrodzenie regularne', `${regularPay.toFixed(2)} ${currency}`],
    ['Wynagrodzenie za nadgodziny', `${overtimePay.toFixed(2)} ${currency}`],
    ['Łączne wynagrodzenie', `${totalPay.toFixed(2)} ${currency}`],
  ]

  autoTable(doc, {
    startY: y,
    head: [],
    body: summaryRows,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'normal', textColor: [80, 80, 80], cellWidth: 90 },
      1: { fontStyle: 'bold', textColor: [17, 17, 17], halign: 'right' },
    },
    didDrawCell: (data) => {
      // Bold last row (total pay)
      if (data.row.index === summaryRows.length - 1) {
        doc.setFillColor(245, 245, 245)
      }
    },
    margin: { left: 14, right: 14 },
  })

  // Daily entries table
  const afterSummary = (doc as any).lastAutoTable.finalY + 10

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text('Wpisy dzienne', 14, afterSummary)

  const tableRows = opts.entries
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(entry => {
      const isOt = entry.type === 'work' && (entry.hours || 0) > opts.config.hours_per_day
      const overtimeInDay = isOt ? (entry.hours || 0) - opts.config.hours_per_day : 0
      return [
        formatDate(entry.date),
        entry.type === 'vacation' ? 'Urlop' : 'Praca',
        entry.start_time || '—',
        entry.end_time || '—',
        entry.type === 'vacation' ? `${opts.config.hours_per_day}h` : `${(entry.hours || 0).toFixed(1)}h`,
        isOt ? `+${overtimeInDay.toFixed(1)}h` : '—',
        entry.description || '—',
      ]
    })

  autoTable(doc, {
    startY: afterSummary + 5,
    head: [['Data', 'Typ', 'Od', 'Do', 'Godz.', 'Nadgodz.', 'Opis']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [17, 17, 17], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 20 },
      2: { cellWidth: 16 },
      3: { cellWidth: 16 },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 20, halign: 'right', textColor: [200, 100, 0] },
      6: { cellWidth: 'auto' },
    },
    didDrawCell: (data) => {
      if (data.column.index === 1 && data.cell.raw === 'Urlop') {
        doc.setTextColor(180, 120, 0)
      }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: () => drawFooter(doc),
  })

  drawFooter(doc)

  const fileName = `raport_${opts.month}_${(opts.workerName || opts.workerEmail).replace(/\s+/g, '_').toLowerCase()}.pdf`
  doc.save(fileName)
}

// ---- COMPANY PDF ----

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
    subtitle: opts.orgName,
    month: opts.month,
  })

  // Per-member summary
  const memberMap = new Map<string, {
    name: string
    workHours: number
    vacationDays: number
    overtimeHours: number
    workedDays: number
  }>()

  for (const entry of opts.entries) {
    const name = entry.profile?.full_name || entry.profile?.email || 'Nieznany'
    if (!memberMap.has(name)) {
      memberMap.set(name, { name, workHours: 0, vacationDays: 0, overtimeHours: 0, workedDays: 0 })
    }
    const s = memberMap.get(name)!
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

  let y = 64

  // Totals strip
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text(`Pracownicy: ${members.length}   |   Suma godzin: ${totalWork.toFixed(1)}h   |   Dni urlopu: ${totalVacation}   |   Nadgodziny: ${totalOvertime.toFixed(1)}h`, 14, y)
  y += 10

  // Per-member summary table
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text('Podsumowanie per pracownik', 14, y)

  autoTable(doc, {
    startY: y + 4,
    head: [['Pracownik', 'Dni pracy', 'Godziny pracy', 'Dni urlopu', 'Nadgodziny']],
    body: members.map(m => [
      m.name,
      `${m.workedDays}`,
      `${m.workHours.toFixed(1)} h`,
      m.vacationDays > 0 ? `${m.vacationDays} d` : '—',
      m.overtimeHours > 0 ? `+${m.overtimeHours.toFixed(1)} h` : '—',
    ]),
    theme: 'striped',
    headStyles: { fillColor: [17, 17, 17], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 35, halign: 'right', textColor: [200, 100, 0] },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: () => drawFooter(doc),
  })

  // Detailed entries
  const afterTable = (doc as any).lastAutoTable.finalY + 10

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text('Wszystkie wpisy', 14, afterTable)

  const detailRows = opts.entries
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(entry => [
      entry.profile?.full_name || entry.profile?.email || 'Nieznany',
      formatDate(entry.date),
      entry.type === 'vacation' ? 'Urlop' : 'Praca',
      entry.type === 'vacation' ? 'cały dzień' : `${(entry.hours || 0).toFixed(1)}h`,
      entry.description || '—',
    ])

  autoTable(doc, {
    startY: afterTable + 4,
    head: [['Pracownik', 'Data', 'Typ', 'Godziny', 'Opis']],
    body: detailRows,
    theme: 'striped',
    headStyles: { fillColor: [17, 17, 17], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 55 },
      2: { cellWidth: 20 },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: () => drawFooter(doc),
  })

  drawFooter(doc)

  const fileName = `raport_firma_${opts.month}_${opts.orgName.replace(/\s+/g, '_').toLowerCase()}.pdf`
  doc.save(fileName)
}

// ---- EMPLOYEE PDF (admin downloads for one employee) ----

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
