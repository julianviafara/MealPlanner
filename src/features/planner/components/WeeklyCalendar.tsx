import type { PlannedMeal } from '../types/mealPlan.types'
import { getWeekDays } from '../utils/dateUtils'
import { CalendarDay } from './CalendarDay'
import styles from './Planner.module.css'

export function WeeklyCalendar({ weekId, meals, today, busyMealId, onAdd, onChange, onRemove }: {
  weekId: string; meals: PlannedMeal[]; today: string; busyMealId: string | null
  onAdd: (date: string) => void; onChange: (meal: PlannedMeal) => void; onRemove: (meal: PlannedMeal) => void
}) {
  const dates = getWeekDays(weekId)
  return <div className={styles.calendar} aria-label="Weekly meal calendar">
    {dates.map((date) => <CalendarDay key={date} date={date} today={date === today} meals={meals.filter((meal) => meal.date === date)} busyMealId={busyMealId} onAdd={onAdd} onChange={onChange} onRemove={onRemove} />)}
  </div>
}
