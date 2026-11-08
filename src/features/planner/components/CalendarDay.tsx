import { Plus } from 'lucide-react'
import type { PlannedMeal } from '../types/mealPlan.types'
import { formatDayLabel } from '../utils/dateUtils'
import { PlannedMealCard } from './PlannedMealCard'
import styles from './Planner.module.css'

export function CalendarDay({ date, today, meals, busyMealId, onAdd, onChange, onRemove }: {
  date: string; today: boolean; meals: PlannedMeal[]; busyMealId: string | null
  onAdd: (date: string) => void; onChange: (meal: PlannedMeal) => void; onRemove: (meal: PlannedMeal) => void
}) {
  const label = formatDayLabel(date)
  return <section className={`${styles.day} ${today ? styles.today : ''}`} aria-label={`${label.weekday}, ${label.date}`}>
    <header className={styles.dayHeading}><div><h2>{label.weekday}</h2><time dateTime={date}>{label.date}</time></div>{today && <span className={styles.todayBadge}>Today</span>}</header>
    <div className={styles.dayMeals}>
      {meals.map((meal) => <PlannedMealCard key={meal.mealId} meal={meal} busy={busyMealId === meal.mealId} onChange={() => onChange(meal)} onRemove={() => onRemove(meal)} />)}
      {meals.length === 0 && <p className={styles.dayEmpty}>Nothing planned</p>}
    </div>
    <button className={styles.addMealButton} type="button" onClick={() => onAdd(date)}><Plus size={15} aria-hidden="true" />Add a meal</button>
  </section>
}
