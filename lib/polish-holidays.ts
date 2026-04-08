/**
 * Polish public holidays (ustawowo wolne od pracy)
 * 
 * Includes both fixed-date and movable holidays.
 * Used for monthly work norm calculation and calendar display.
 */

/**
 * Calculate Easter Sunday using the Anonymous Gregorian algorithm
 * https://en.wikipedia.org/wiki/Date_of_Easter#Anonymous_Gregorian_algorithm
 */
function calculateEaster(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1 // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1
  
  return new Date(year, month, day)
}

export interface Holiday {
  date: string // YYYY-MM-DD
  name: string
}

/**
 * Returns all Polish public holidays for a given year.
 * Holidays falling on Saturday/Sunday are still included (they are public holidays by law),
 * but won't reduce the monthly working-day norm further since Sat/Sun are already excluded.
 */
export function getPolishHolidays(year: number): Holiday[] {
  const easter = calculateEaster(year)
  const easterMonth = easter.getMonth()
  const easterDay = easter.getDate()

  // Easter Monday (1 day after Easter)
  const easterMonday = new Date(year, easterMonth, easterDay + 1)
  
  // Pentecost (49 days after Easter)
  const pentecost = new Date(year, easterMonth, easterDay + 49)
  
  // Corpus Christi (60 days after Easter)
  const corpusChristi = new Date(year, easterMonth, easterDay + 60)

  const holidays: Holiday[] = [
    { date: `${year}-01-01`, name: 'Nowy Rok' },
    { date: `${year}-01-06`, name: 'Trzech Króli' },
    { 
      date: `${easter.getFullYear()}-${String(easter.getMonth() + 1).padStart(2, '0')}-${String(easter.getDate()).padStart(2, '0')}`,
      name: 'Wielkanoc'
    },
    {
      date: `${easterMonday.getFullYear()}-${String(easterMonday.getMonth() + 1).padStart(2, '0')}-${String(easterMonday.getDate()).padStart(2, '0')}`,
      name: 'Poniedziałek Wielkanocny'
    },
    { date: `${year}-05-01`, name: 'Święto Pracy' },
    { date: `${year}-05-03`, name: 'Święto Konstytucji 3 Maja' },
    {
      date: `${pentecost.getFullYear()}-${String(pentecost.getMonth() + 1).padStart(2, '0')}-${String(pentecost.getDate()).padStart(2, '0')}`,
      name: 'Zielone Świątki'
    },
    {
      date: `${corpusChristi.getFullYear()}-${String(corpusChristi.getMonth() + 1).padStart(2, '0')}-${String(corpusChristi.getDate()).padStart(2, '0')}`,
      name: 'Boże Ciało'
    },
    { date: `${year}-08-15`, name: 'Wniebowzięcie NMP' },
    { date: `${year}-11-01`, name: 'Wszystkich Świętych' },
    { date: `${year}-11-11`, name: 'Narodowe Święto Niepodległości' },
    { date: `${year}-12-25`, name: 'Boże Narodzenie' },
    { date: `${year}-12-26`, name: 'Drugi Dzień Bożego Narodzenia' },
  ]

  // Dec 24 (Wigilia) is a public holiday starting from 2025
  if (year >= 2025) {
    holidays.push({ date: `${year}-12-24`, name: 'Wigilia' })
  }

  return holidays
}

/**
 * Returns holidays for a specific month (0-indexed, Jan=0)
 */
export function getHolidaysForMonth(year: number, month: number): Holiday[] {
  const allHolidays = getPolishHolidays(year)
  const monthStr = String(month + 1).padStart(2, '0')
  return allHolidays.filter(h => h.date.startsWith(`${year}-${monthStr}`))
}

/**
 * Check if a specific date (YYYY-MM-DD) is a Polish public holiday
 */
export function isPolishHoliday(date: string): boolean {
  const [yearStr] = date.split('-')
  const year = parseInt(yearStr, 10)
  const holidays = getPolishHolidays(year)
  return holidays.some(h => h.date === date)
}

/**
 * Get holiday name for a date, or null if not a holiday
 */
export function getHolidayName(date: string): string | null {
  const [yearStr] = date.split('-')
  const year = parseInt(yearStr, 10)
  const holidays = getPolishHolidays(year)
  const match = holidays.find(h => h.date === date)
  return match ? match.name : null
}

/**
 * Count working days (Mon-Fri) in a month, excluding Polish public holidays.
 * 
 * Holidays falling on Saturday or Sunday are NOT double-counted as reductions
 * (they're already excluded by the Mon-Fri filter).
 * 
 * @param year - Full year (e.g. 2026)
 * @param month - 0-indexed month (Jan=0, Dec=11)
 */
export function countWorkingDaysExcludingHolidays(year: number, month: number): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const holidays = getHolidaysForMonth(year, month)
  const holidayDates = new Set(holidays.map(h => h.date))
  
  let count = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const dow = date.getDay() // 0=Sun, 6=Sat
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    
    // Only count Mon-Fri that are NOT holidays
    if (dow !== 0 && dow !== 6 && !holidayDates.has(dateStr)) {
      count++
    }
  }
  
  return count
}
