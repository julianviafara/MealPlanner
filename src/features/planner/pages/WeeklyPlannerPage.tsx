import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useAuth } from '../../../app/providers/useAuth'
import { Button } from '../../../components/ui/Button/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner/LoadingSpinner'
import type { PlannedMeal } from '../types/mealPlan.types'
import { useWeeklyPlan } from '../hooks/useWeeklyPlan'
import { RecipeSelector } from '../components/RecipeSelector'
import { WeekNavigation } from '../components/WeekNavigation'
import { WeeklyCalendar } from '../components/WeeklyCalendar'
import { getCurrentWeekStart, formatLocalDate, shiftWeek } from '../utils/dateUtils'
import styles from '../components/Planner.module.css'

type SelectorTarget = { date: string; meal: PlannedMeal | null }

export function WeeklyPlannerPage() {
  const { user } = useAuth()
  const [weekId, setWeekId] = useState(() => getCurrentWeekStart())
  const [selectorTarget, setSelectorTarget] = useState<SelectorTarget | null>(null)
  const [saving, setSaving] = useState(false)
  const [busyMealId, setBusyMealId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [feedback, setFeedback] = useState('')
  const { meals, loading, error, refresh, addMeal, changeRecipe, removeMeal } = useWeeklyPlan(user!.uid, weekId)
  const today = formatLocalDate(new Date())

  function openAdd(date: string) {
    setActionError(''); setFeedback(''); setSelectorTarget({ date, meal: null })
  }

  function openChange(meal: PlannedMeal) {
    setActionError(''); setFeedback(''); setSelectorTarget({ date: meal.date, meal })
  }

  async function confirmRecipe(recipe: { id: string; name: string; thumbnail: string }) {
    if (!selectorTarget) return
    setSaving(true); setActionError('')
    try {
      const plannedRecipe = { id: recipe.id, name: recipe.name, thumbnail: recipe.thumbnail }
      if (selectorTarget.meal) {
        await changeRecipe(selectorTarget.meal, plannedRecipe)
        setFeedback(`${recipe.name} is now planned for ${selectorTarget.date}.`)
      } else {
        await addMeal(selectorTarget.date, plannedRecipe)
        setFeedback(`${recipe.name} added to your plan.`)
      }
      setSelectorTarget(null)
    } catch (failure) {
      setActionError(failure instanceof Error ? failure.message : 'Could not save this planned meal.')
    } finally { setSaving(false) }
  }

  async function confirmRemove(meal: PlannedMeal) {
    setBusyMealId(meal.mealId); setActionError(''); setFeedback('')
    try {
      await removeMeal(meal.mealId)
      setFeedback(`${meal.recipeName} removed from your plan.`)
    } catch (failure) {
      setActionError(failure instanceof Error ? failure.message : 'Could not remove this planned meal.')
    } finally { setBusyMealId(null) }
  }

  return <div className={styles.page}>
    <header className={styles.pageHeading}><div><span className={styles.eyebrow}>MAKE ROOM FOR GOOD FOOD</span><h1>Your weekly planner.</h1><p>Pick recipes for the days ahead. Add as many meals as you need.</p></div></header>
    <WeekNavigation weekId={weekId} onPrevious={() => setWeekId((current) => shiftWeek(current, -1))} onNext={() => setWeekId((current) => shiftWeek(current, 1))} onToday={() => setWeekId(getCurrentWeekStart())} />
    {actionError && !selectorTarget && <p className={styles.error} role="alert">{actionError}</p>}
    {feedback && <p className={styles.success} role="status">{feedback}</p>}
    {error && <div className={styles.loadError} role="alert"><p>{error}</p><Button variant="secondary" onClick={() => void refresh()}>Try again</Button></div>}
    {loading ? <div className={styles.loading}><LoadingSpinner label="Loading your week" /></div> : !error && <>
      <div className={styles.weekSummary}><span>{meals.length} {meals.length === 1 ? 'meal' : 'meals'} planned</span><span>Monday to Sunday</span></div>
      {meals.length === 0 && <div className={styles.weekEmpty}><span><CalendarDays size={20} aria-hidden="true" /></span><div><h2>A fresh week is waiting.</h2><p>Start anywhere. Choose a day and add a recipe to your plan.</p></div><Button variant="secondary" onClick={() => openAdd(weekId)}>Add your first meal to Monday</Button></div>}
      <WeeklyCalendar weekId={weekId} meals={meals} today={today} busyMealId={busyMealId} onAdd={openAdd} onChange={openChange} onRemove={(meal) => void confirmRemove(meal)} />
    </>}
    <p className={styles.recipeAttribution}>Recipe information and images are provided by TheMealDB.</p>
    {selectorTarget && <RecipeSelector date={selectorTarget.date} existingMeal={selectorTarget.meal} saving={saving} error={actionError} onCancel={() => { if (!saving) setSelectorTarget(null) }} onConfirm={(recipe) => void confirmRecipe(recipe)} />}
  </div>
}
