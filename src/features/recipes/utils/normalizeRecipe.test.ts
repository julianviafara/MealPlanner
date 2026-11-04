import { describe, expect, it } from 'vitest'
import { normalizeRecipe, normalizeRecipeSummary } from './normalizeRecipe'

describe('normalizeRecipe', () => {
  it('pairs trimmed ingredient and measure slots in source order and preserves empty measures', () => {
    const recipe = normalizeRecipe({
      idMeal: '42', strMeal: ' Soup ', strMealThumb: ' https://img.test/soup.jpg ', strCategory: '', strArea: 'Thai',
      strIngredient1: ' Rice ', strMeasure1: ' 2 cups ', strIngredient2: ' ', strMeasure2: 'ignored',
      strIngredient3: 'Lime', strMeasure3: ' ', strIngredient20: 'Salt', strMeasure20: 'to taste',
      strInstructions: ' Keep as provided.\nStir.', strTags: 'Comfort, Weeknight', strSource: '', strYoutube: null,
    })
    expect(recipe).toMatchObject({ id: '42', name: 'Soup', category: null, area: 'Thai', instructions: ' Keep as provided.\nStir.' })
    expect(recipe?.ingredients).toEqual([{ name: 'Rice', measure: '2 cups' }, { name: 'Lime', measure: '' }, { name: 'Salt', measure: 'to taste' }])
    expect(recipe?.tags).toEqual(['Comfort', 'Weeknight'])
    expect(recipe?.sourceUrl).toBeNull()
  })

  it('omits invalid summaries and safely handles missing optional fields', () => {
    expect(normalizeRecipeSummary({ idMeal: '1', strMeal: 'Name' })).toBeNull()
    expect(normalizeRecipe({ idMeal: '1', strMeal: 'Name', strMealThumb: 'image' })).toMatchObject({
      instructions: '', ingredients: [], tags: [], youtubeUrl: null, sourceUrl: null, creativeCommonsConfirmed: null,
    })
  })
})
