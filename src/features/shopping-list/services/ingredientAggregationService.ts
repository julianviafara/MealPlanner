import { getRecipeById } from '../../recipes/services/recipeApi'
import type { Recipe } from '../../recipes/types/recipe.types'
import type { PlannedMeal } from '../../planner/types/mealPlan.types'
import type { GeneratedIngredient } from '../types/shoppingList.types'
import { aggregatePlannedIngredients } from '../utils/ingredientAggregation'

export class RecipeDetailsUnavailableError extends Error {
  readonly recipeNames: string[]

  constructor(recipeNames: string[]) {
    super(`Recipe details could not be loaded for: ${recipeNames.join(', ')}. The saved list was not changed.`)
    this.name = 'RecipeDetailsUnavailableError'
    this.recipeNames = recipeNames
  }
}

export async function generateIngredientsFromPlan(plannedMeals: PlannedMeal[]): Promise<GeneratedIngredient[]> {
  const uniqueMeals = new Map<string, PlannedMeal>()
  for (const meal of plannedMeals) if (!uniqueMeals.has(meal.recipeId)) uniqueMeals.set(meal.recipeId, meal)

  const results = await Promise.all([...uniqueMeals.entries()].map(async ([recipeId, meal]) => {
    try { return { recipeId, recipe: await getRecipeById(recipeId), name: meal.recipeName } }
    catch { return { recipeId, recipe: null, name: meal.recipeName } }
  }))
  const missingNames = results.filter((result) => result.recipe === null).map((result) => result.name)
  if (missingNames.length) throw new RecipeDetailsUnavailableError([...new Set(missingNames)])
  const recipes = new Map<string, Recipe>(results.flatMap((result) => result.recipe ? [[result.recipeId, result.recipe] as const] : []))
  return aggregatePlannedIngredients(plannedMeals, recipes)
}
