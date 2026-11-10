import { useCallback, useEffect, useRef, useState } from 'react'
import { loadWeekPlanSnapshot } from '../../planner/services/mealPlanService'
import type { PlannedMeal } from '../../planner/types/mealPlan.types'
import { generateIngredientsFromPlan } from '../services/ingredientAggregationService'
import { addManualItem, loadShoppingList, reconcileGeneratedItems, removeShoppingItem, setItemPurchased, updateManualItem } from '../services/shoppingListService'
import type { ShoppingItem, ShoppingListData } from '../types/shoppingList.types'

function emptyList(weekId: string): ShoppingListData {
  return { weekStartDate: weekId, sourceMealPlanUpdatedAt: null, generatedAt: null, items: [] }
}

export function useShoppingList(uid: string, weekId: string) {
  const [list, setList] = useState<ShoppingListData>(() => emptyList(weekId))
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([])
  const [planUpdatedAt, setPlanUpdatedAt] = useState<unknown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const currentKey = useRef('')
  const requestId = useRef(0)
  currentKey.current = `${uid}:${weekId}`

  const refresh = useCallback(async () => {
    const key = `${uid}:${weekId}`
    const id = ++requestId.current
    setLoading(true); setError('')
    try {
      const [nextList, plan] = await Promise.all([loadShoppingList(uid, weekId), loadWeekPlanSnapshot(uid, weekId)])
      if (requestId.current === id && currentKey.current === key) {
        setList(nextList); setPlannedMeals(plan.meals); setPlanUpdatedAt(plan.updatedAt)
      }
    } catch (failure) {
      if (requestId.current === id && currentKey.current === key) setError(failure instanceof Error ? failure.message : 'Could not load this shopping list.')
    } finally {
      if (requestId.current === id && currentKey.current === key) setLoading(false)
    }
  }, [uid, weekId])

  useEffect(() => {
    void refresh()
    return () => { requestId.current += 1 }
  }, [refresh])

  const regenerate = useCallback(async () => {
    const key = `${uid}:${weekId}`
    const latestPlan = await loadWeekPlanSnapshot(uid, weekId)
    const generated = await generateIngredientsFromPlan(latestPlan.meals)
    const updatedList = await reconcileGeneratedItems(uid, weekId, generated, latestPlan.updatedAt)
    if (currentKey.current === key) {
      setList(updatedList); setPlannedMeals(latestPlan.meals); setPlanUpdatedAt(latestPlan.updatedAt)
    }
  }, [uid, weekId])

  const addItem = useCallback(async (name: string, note: string): Promise<void> => {
    const key = `${uid}:${weekId}`
    const item = await addManualItem(uid, weekId, name, note)
    if (currentKey.current === key) setList((current) => ({ ...current, items: [...current.items, item] }))
  }, [uid, weekId])

  const editItem = useCallback(async (itemId: string, name: string, note: string): Promise<void> => {
    const key = `${uid}:${weekId}`
    const item = await updateManualItem(uid, weekId, itemId, name, note)
    if (currentKey.current === key) setList((current) => ({ ...current, items: current.items.map((existing) => existing.itemId === itemId ? item : existing) }))
  }, [uid, weekId])

  const removeItem = useCallback(async (itemId: string): Promise<void> => {
    const key = `${uid}:${weekId}`
    await removeShoppingItem(uid, weekId, itemId)
    if (currentKey.current === key) setList((current) => ({ ...current, items: current.items.filter((item) => item.itemId !== itemId) }))
  }, [uid, weekId])

  const setPurchased = useCallback(async (item: ShoppingItem, isPurchased: boolean): Promise<void> => {
    const key = `${uid}:${weekId}`
    await setItemPurchased(uid, weekId, item.itemId, isPurchased)
    if (currentKey.current === key) setList((current) => ({
      ...current,
      items: current.items.map((existing) => existing.itemId === item.itemId ? { ...existing, isPurchased, updatedAt: new Date() } : existing),
    }))
  }, [uid, weekId])

  return { list, plannedMeals, planUpdatedAt, loading, error, refresh, regenerate, addItem, editItem, removeItem, setPurchased }
}

