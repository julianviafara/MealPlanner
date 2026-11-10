import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PlannedMeal } from '../../planner/types/mealPlan.types'
import { generateIngredientsFromPlan, RecipeDetailsUnavailableError } from './ingredientAggregationService'
import { getRecipeById } from '../../recipes/services/recipeApi'

vi.mock('../../recipes/services/recipeApi', () => ({ getRecipeById: vi.fn() }))
const getRecipeMock = vi.mocked(getRecipeById)
const planned = (mealId: string, recipeId: string): PlannedMeal => ({
  mealId, date: '2026-11-09', recipeId, recipeName: `Recipe ${recipeId}`, recipeThumbnail: '',
})

afterEach(() => vi.clearAllMocks())

describe('generateIngredientsFromPlan', () => {
  it('fetches duplicate recipe IDs once while counting each planned occurrence', async () => {
    getRecipeMock.mockResolvedValue({
      id: 'a', name: 'Recipe A', thumbnail: '', category: null, area: null, instructions: '',
      ingredients: [{ name: 'Flour', measure: '1 cup' }], tags: [], youtubeUrl: null, sourceUrl: null, creativeCommonsConfirmed: null,
    })
    const result = await generateIngredientsFromPlan([planned('meal1', 'a'), planned('meal2', 'a')])
    expect(getRecipeMock).toHaveBeenCalledTimes(1)
    expect(result[0].quantity).toBe(2)
  })

  it('does not return a partial list when one recipe detail is missing', async () => {
    getRecipeMock.mockImplementation(async (id) => id === 'missing' ? null : {
      id, name: `Recipe ${id}`, thumbnail: '', category: null, area: null, instructions: '',
      ingredients: [{ name: 'Sugar', measure: '1 cup' }], tags: [], youtubeUrl: null, sourceUrl: null, creativeCommonsConfirmed: null,
    })
    await expect(generateIngredientsFromPlan([planned('meal1', 'ok'), planned('meal2', 'missing')]))
      .rejects.toBeInstanceOf(RecipeDetailsUnavailableError)
  })
})
