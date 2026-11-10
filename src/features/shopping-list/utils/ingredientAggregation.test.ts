import { describe, expect, it } from 'vitest'
import type { Recipe } from '../../recipes/types/recipe.types'
import type { PlannedMeal } from '../../planner/types/mealPlan.types'
import { aggregatePlannedIngredients, normalizeIngredientName } from './ingredientAggregation'

const recipe = (id: string, name: string, ingredients: Recipe['ingredients']): Recipe => ({
  id, name, thumbnail: '', category: null, area: null, instructions: '', ingredients,
  tags: [], youtubeUrl: null, sourceUrl: null, creativeCommonsConfirmed: null,
})
const meal = (mealId: string, recipeId: string, recipeName: string): PlannedMeal => ({
  mealId, date: '2026-11-09', recipeId, recipeName, recipeThumbnail: '',
})

describe('ingredient aggregation', () => {
  it('normalizes whitespace and case without fuzzy-merging different ingredient names', () => {
    expect(normalizeIngredientName('  Chicken   Breast ')).toBe('chicken breast')
    const result = aggregatePlannedIngredients([
      meal('1', 'a', 'Dinner'), meal('2', 'b', 'Lunch'),
    ], new Map([
      ['a', recipe('a', 'Dinner', [{ name: 'Chicken Breast', measure: '1 cup' }])],
      ['b', recipe('b', 'Lunch', [{ name: ' chicken breast ', measure: '2 cups' }, { name: 'Chicken thigh', measure: '1 cup' }])],
    ]))
    expect(result).toHaveLength(2)
    expect(result.find((item) => item.normalizedName === 'chicken breast')).toMatchObject({ quantity: 3, unit: 'cup', name: 'Chicken Breast' })
    expect(result.find((item) => item.normalizedName === 'chicken thigh')?.quantity).toBe(1)
  })

  it('keeps incompatible units and unstructured or missing measures separate', () => {
    const result = aggregatePlannedIngredients([meal('1', 'a', 'Meal A'), meal('2', 'b', 'Meal B')], new Map([
      ['a', recipe('a', 'Meal A', [
        { name: 'Milk', measure: '1 cup' }, { name: 'Milk', measure: 'To taste' }, { name: 'Salt', measure: '' },
      ])],
      ['b', recipe('b', 'Meal B', [
        { name: 'Milk', measure: '200 ml' }, { name: 'Milk', measure: ' to   taste ' }, { name: 'Salt', measure: '' },
      ])],
    ]))
    expect(result.filter((item) => item.normalizedName === 'milk')).toHaveLength(3)
    expect(new Set(result.filter((item) => item.normalizedName === 'milk').map((item) => item.quantity === null ? 'no-number' : String(item.quantity))))
      .toEqual(new Set(['200', 'no-number', '1']))
    expect(result.filter((item) => item.normalizedName === 'salt')).toHaveLength(1)
    expect(result.find((item) => item.normalizedName === 'salt')).toMatchObject({ quantity: null, originalMeasures: ['', ''] })
  })

  it('counts repeated planned recipe occurrences and keeps unique provenance', () => {
    const result = aggregatePlannedIngredients([
      meal('first', 'pancake', 'Pancakes'), meal('second', 'pancake', 'Pancakes'),
    ], new Map([['pancake', recipe('pancake', 'Pancakes', [{ name: 'Milk', measure: '1 cup' }])]]))
    expect(result[0]).toMatchObject({ quantity: 2, unit: 'cup', sourceRecipeIds: ['pancake'], sourceRecipeNames: ['Pancakes'] })
  })

  it('preserves empty ingredient handling and produces stable IDs and order', () => {
    const planned = [meal('1', 'a', 'Recipe A')]
    const ingredients = [
      { name: '  ', measure: '1 cup' }, { name: 'Water', measure: '2 cups' }, { name: 'oil', measure: 'A pinch' },
    ]
    const recipes = new Map([['a', recipe('a', 'Recipe A', ingredients)]])
    const first = aggregatePlannedIngredients(planned, recipes)
    const second = aggregatePlannedIngredients(planned, recipes)
    expect(first).toEqual(second)
    expect(first).toHaveLength(2)
    expect(first.map((item) => item.normalizedName)).toEqual(['oil', 'water'])
    expect(first.every((item) => item.itemId.startsWith('generated_'))).toBe(true)
  })
})
