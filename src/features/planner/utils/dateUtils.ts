const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseLocalDate(value: string): Date {
  const match = DATE_PATTERN.exec(value)
  if (!match) throw new RangeError(`Invalid calendar date: ${value}`)
  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12)
  if (formatLocalDate(date) !== value) throw new RangeError(`Invalid calendar date: ${value}`)
  return date
}

export function addDays(value: string, days: number): string {
  if (!Number.isInteger(days)) throw new RangeError('The number of days must be an integer.')
  const date = parseLocalDate(value)
  date.setDate(date.getDate() + days)
  return formatLocalDate(date)
}

export function getMonday(value: string | Date): string {
  const date = typeof value === 'string' ? parseLocalDate(value) : new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return formatLocalDate(date)
}

export function getCurrentWeekStart(now: Date = new Date()): string {
  return getMonday(now)
}

export function getWeekDays(weekStartDate: string): string[] {
  const monday = getMonday(weekStartDate)
  if (monday !== weekStartDate) throw new RangeError('The week start date must be a Monday.')
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}

export function shiftWeek(weekStartDate: string, direction: -1 | 1): string {
  return addDays(weekStartDate, direction * 7)
}

function localDateAtNoon(value: string): Date {
  return parseLocalDate(value)
}

export function formatWeekRange(weekStartDate: string, locale = 'en-US'): string {
  const [start, ...days] = getWeekDays(weekStartDate)
  const end = days[days.length - 1]
  const [startYear, startMonth, startDay] = start.split('-').map(Number)
  const [endYear, endMonth, endDay] = end.split('-').map(Number)
  const startDate = localDateAtNoon(start)
  const endDate = localDateAtNoon(end)
  const monthName = (date: Date) => new Intl.DateTimeFormat(locale, { month: 'long' }).format(date)
  const shortMonth = (date: Date) => new Intl.DateTimeFormat(locale, { month: 'short' }).format(date)
  if (startYear === endYear && startMonth === endMonth) return `${monthName(startDate)} ${startDay} - ${monthName(endDate)} ${endDay}, ${startYear}`
  if (startYear === endYear) return `${shortMonth(startDate)} ${startDay} - ${shortMonth(endDate)} ${endDay}, ${startYear}`
  return `${shortMonth(startDate)} ${startDay}, ${startYear} - ${shortMonth(endDate)} ${endDay}, ${endYear}`
}

export function formatDayLabel(dateValue: string, locale = 'en-US'): { weekday: string; date: string } {
  const date = localDateAtNoon(dateValue)
  return {
    weekday: new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date),
    date: new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date),
  }
}
