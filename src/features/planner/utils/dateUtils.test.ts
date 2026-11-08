import { describe, expect, it } from 'vitest'
import { addDays, formatDayLabel, formatLocalDate, formatWeekRange, getCurrentWeekStart, getMonday, getWeekDays, parseLocalDate, shiftWeek } from './dateUtils'

describe('planner date utilities', () => {
  it('calculates Monday through Sunday for any date in the week', () => {
    expect(getMonday('2026-11-11')).toBe('2026-11-09')
    expect(getWeekDays('2026-11-09')).toEqual([
      '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15',
    ])
    expect(() => getWeekDays('2026-11-10')).toThrow('Monday')
  })

  it('navigates across month, year, and leap-day boundaries', () => {
    expect(shiftWeek('2026-11-09', -1)).toBe('2026-11-02')
    expect(shiftWeek('2026-11-30', 1)).toBe('2026-12-07')
    expect(shiftWeek('2026-12-28', 1)).toBe('2027-01-04')
    expect(shiftWeek('2027-01-04', -1)).toBe('2026-12-28')
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01')
    expect(addDays('2025-02-28', 1)).toBe('2025-03-01')
  })

  it('uses local calendar fields without parsing an ISO date as UTC', () => {
    const localDate = new Date(2026, 10, 9, 0, 15)
    expect(formatLocalDate(localDate)).toBe('2026-11-09')
    expect(formatLocalDate(parseLocalDate('2026-11-09'))).toBe('2026-11-09')
    expect(formatDayLabel('2026-11-09')).toEqual({ weekday: 'Monday', date: 'Nov 9' })
  })

  it('formats week ranges and current-week selection', () => {
    expect(formatWeekRange('2026-11-09')).toBe('November 9 - November 15, 2026')
    expect(formatWeekRange('2026-11-30')).toBe('Nov 30 - Dec 6, 2026')
    expect(formatWeekRange('2026-12-28')).toBe('Dec 28, 2026 - Jan 3, 2027')
    expect(getCurrentWeekStart(new Date(2026, 10, 15, 23))).toBe('2026-11-09')
  })

  it('rejects invalid calendar dates instead of normalizing them silently', () => {
    expect(() => parseLocalDate('2026-02-29')).toThrow('Invalid calendar date')
    expect(() => addDays('2026-11-09', 0.5)).toThrow('integer')
  })
})
