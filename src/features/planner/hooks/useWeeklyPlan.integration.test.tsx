import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PlannedMeal } from '../types/mealPlan.types'
import { addPlannedMeal, changePlannedRecipe, loadWeekMeals, removePlannedMeal } from '../services/mealPlanService'
import { useWeeklyPlan } from './useWeeklyPlan'

vi.mock('../services/mealPlanService', () => ({
  addPlannedMeal: vi.fn(), changePlannedRecipe: vi.fn(), loadWeekMeals: vi.fn(), removePlannedMeal: vi.fn(),
}))

const meal: PlannedMeal = { mealId: 'meal-1', date: '2026-11-09', recipeId: 'recipe-1', recipeName: 'Pasta', recipeThumbnail: 'pasta.jpg' }
const nextRecipe = { id: 'recipe-2', name: 'Soup', thumbnail: 'soup.jpg' }

afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('weekly plan hook interactions', () => {
  it('loads, adds, changes, and removes meals through the plan service', async () => {
    vi.mocked(loadWeekMeals).mockResolvedValue([meal])
    vi.mocked(addPlannedMeal).mockResolvedValue({ ...meal, mealId: 'meal-2', recipeId: nextRecipe.id, recipeName: nextRecipe.name })
    vi.mocked(changePlannedRecipe).mockResolvedValue({ ...meal, recipeId: nextRecipe.id, recipeName: nextRecipe.name })
    vi.mocked(removePlannedMeal).mockResolvedValue(undefined)
    const { result } = renderHook(() => useWeeklyPlan('test-user', '2026-11-09'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.meals).toHaveLength(1)

    await act(async () => { await result.current.addMeal('2026-11-09', nextRecipe) })
    expect(result.current.meals).toHaveLength(2)
    await act(async () => { await result.current.changeRecipe(meal, nextRecipe) })
    expect(result.current.meals.find((item) => item.mealId === meal.mealId)?.recipeName).toBe('Soup')
    await act(async () => { await result.current.removeMeal('meal-2') })
    expect(result.current.meals.map((item) => item.mealId)).toEqual(['meal-1'])
  })
})
