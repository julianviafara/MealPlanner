import { useCallback, useEffect, useRef, useState } from 'react'
import { addPlannedMeal, changePlannedRecipe, loadWeekMeals, removePlannedMeal } from '../services/mealPlanService'
import type { PlannedMeal, PlannedRecipe } from '../types/mealPlan.types'

function createdAtValue(value: unknown): number {
  if (value instanceof Date) return value.getTime()
  if (typeof value !== 'object' || value === null || !('toMillis' in value)) return 0
  const timestamp = value as { toMillis?: () => number }
  return typeof timestamp.toMillis === 'function' ? timestamp.toMillis() : 0
}

function sortMeals(meals: PlannedMeal[]): PlannedMeal[] {
  return [...meals].sort((a, b) => a.date.localeCompare(b.date)
    || createdAtValue(a.createdAt) - createdAtValue(b.createdAt)
    || a.mealId.localeCompare(b.mealId))
}

export function useWeeklyPlan(uid: string, weekId: string) {
  const [meals, setMeals] = useState<PlannedMeal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const currentKey = useRef('')
  const requestId = useRef(0)
  currentKey.current = `${uid}:${weekId}`

  const refresh = useCallback(async () => {
    const key = `${uid}:${weekId}`
    const id = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const result = await loadWeekMeals(uid, weekId)
      if (requestId.current === id && currentKey.current === key) setMeals(sortMeals(result))
    } catch (failure) {
      if (requestId.current === id && currentKey.current === key) setError(failure instanceof Error ? failure.message : 'Could not load this week.')
    } finally {
      if (requestId.current === id && currentKey.current === key) setLoading(false)
    }
  }, [uid, weekId])

  useEffect(() => {
    void refresh()
    return () => { requestId.current += 1 }
  }, [refresh])

  const addMeal = useCallback(async (date: string, recipe: PlannedRecipe) => {
    const key = `${uid}:${weekId}`
    const meal = await addPlannedMeal(uid, weekId, date, recipe)
    if (currentKey.current === key) setMeals((current) => sortMeals([...current, meal]))
  }, [uid, weekId])

  const changeRecipe = useCallback(async (meal: PlannedMeal, recipe: PlannedRecipe) => {
    const key = `${uid}:${weekId}`
    const updated = await changePlannedRecipe(uid, weekId, meal, recipe)
    if (currentKey.current === key) setMeals((current) => current.map((item) => item.mealId === meal.mealId ? updated : item))
  }, [uid, weekId])

  const removeMeal = useCallback(async (mealId: string) => {
    const key = `${uid}:${weekId}`
    await removePlannedMeal(uid, weekId, mealId)
    if (currentKey.current === key) setMeals((current) => current.filter((meal) => meal.mealId !== mealId))
  }, [uid, weekId])

  return { meals, loading, error, refresh, addMeal, changeRecipe, removeMeal }
}
