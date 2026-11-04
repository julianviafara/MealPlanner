import type { Recipe, RecipeSummary } from '../types/recipe.types'

export type MealDbRecord = Record<string, unknown> & {
  idMeal?: unknown; strMeal?: unknown; strMealThumb?: unknown; strCategory?: unknown; strArea?: unknown
}

const clean = (value: unknown): string => typeof value === 'string' ? value.trim() : ''
const nullable = (value: unknown): string | null => clean(value) || null

export function normalizeRecipeSummary(meal: MealDbRecord): RecipeSummary | null {
  const id = clean(meal.idMeal)
  const name = clean(meal.strMeal)
  const thumbnail = clean(meal.strMealThumb)
  if (!id || !name || !thumbnail) return null
  return { id, name, thumbnail, category: nullable(meal.strCategory), area: nullable(meal.strArea) }
}

export function normalizeRecipe(meal: MealDbRecord): Recipe | null {
  const summary = normalizeRecipeSummary(meal)
  if (!summary) return null
  const ingredients = []
  for (let index = 1; index <= 20; index += 1) {
    const name = clean(meal[`strIngredient${index}`])
    if (name) ingredients.push({ name, measure: clean(meal[`strMeasure${index}`]) })
  }
  const tags = clean(meal.strTags).split(',').map((tag) => tag.trim()).filter(Boolean)
  return {
    ...summary,
    instructions: typeof meal.strInstructions === 'string' ? meal.strInstructions : '',
    ingredients,
    tags,
    youtubeUrl: nullable(meal.strYoutube),
    sourceUrl: nullable(meal.strSource),
    creativeCommonsConfirmed: nullable(meal.strCreativeCommonsConfirmed),
  }
}
