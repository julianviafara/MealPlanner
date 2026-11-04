import { mealDbUrl } from '../../../services/themealdb/config'
import { normalizeRecipe, normalizeRecipeSummary, type MealDbRecord } from '../utils/normalizeRecipe'
import type { Recipe, RecipeFilterItem, RecipeSummary } from '../types/recipe.types'

type MealResponse = { meals?: unknown }

async function request(endpoint: string, params: Record<string, string> = {}, signal?: AbortSignal): Promise<MealDbRecord[]> {
  let response: Response
  try { response = await fetch(mealDbUrl(endpoint, params), { signal }) }
  catch (error) { if (error instanceof Error && error.name === 'AbortError') throw error; throw new Error('Could not connect to TheMealDB. Check your connection and try again.') }
  if (!response.ok) throw new Error(`The recipe service returned an error (${response.status}).`)
  let payload: unknown
  try { payload = await response.json() }
  catch { throw new Error('The recipe service returned an invalid response.') }
  if (typeof payload !== 'object' || payload === null || !('meals' in payload)) throw new Error('The recipe service returned an invalid response.')
  const meals = (payload as MealResponse).meals
  if (meals === null) return []
  if (!Array.isArray(meals)) throw new Error('The recipe service returned an invalid response.')
  return meals.filter((meal): meal is MealDbRecord => typeof meal === 'object' && meal !== null)
}

const summaries = (meals: MealDbRecord[]): RecipeSummary[] => meals.map(normalizeRecipeSummary).filter((meal): meal is RecipeSummary => meal !== null)
export async function searchRecipes(query: string, signal?: AbortSignal): Promise<RecipeSummary[]> {
  const value = query.trim()
  if (!value) return []
  return summaries(await request('search.php', { s: value }, signal))
}
export async function searchRecipesByLetter(letter: string, signal?: AbortSignal): Promise<RecipeSummary[]> {
  const value = letter.trim()
  if (!/^[a-z]$/i.test(value)) throw new Error('Enter a single letter to browse recipes.')
  return summaries(await request('search.php', { f: value }, signal))
}
export async function getRecipeById(id: string, signal?: AbortSignal): Promise<Recipe | null> {
  const meals = await request('lookup.php', { i: id }, signal)
  return meals[0] ? normalizeRecipe(meals[0]) : null
}
export async function getRandomRecipe(signal?: AbortSignal): Promise<Recipe | null> {
  const meals = await request('random.php', {}, signal)
  return meals[0] ? normalizeRecipe(meals[0]) : null
}
async function getList(kind: 'c' | 'a' | 'i', signal?: AbortSignal): Promise<RecipeFilterItem[]> {
  const key = kind === 'c' ? 'strCategory' : kind === 'a' ? 'strArea' : 'strIngredient'
  return (await request('list.php', { [kind]: 'list' }, signal)).map((item) => {
    const name = typeof item[key] === 'string' ? item[key].trim() : ''
    return name ? { id: name, name } : null
  }).filter((item): item is RecipeFilterItem => item !== null)
}
export const getCategories = (signal?: AbortSignal) => getList('c', signal)
export const getAreas = (signal?: AbortSignal) => getList('a', signal)
export const getIngredients = (signal?: AbortSignal) => getList('i', signal)
async function filterRecipes(param: 'c' | 'a' | 'i', value: string, signal?: AbortSignal): Promise<RecipeSummary[]> {
  if (!value.trim()) return []
  return summaries(await request('filter.php', { [param]: value }, signal))
}
export const filterRecipesByCategory = (category: string, signal?: AbortSignal) => filterRecipes('c', category, signal)
export const filterRecipesByArea = (area: string, signal?: AbortSignal) => filterRecipes('a', area, signal)
export const filterRecipesByIngredient = (ingredient: string, signal?: AbortSignal) => filterRecipes('i', ingredient, signal)
