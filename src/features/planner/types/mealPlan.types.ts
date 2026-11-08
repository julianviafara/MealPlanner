import type { RecipeSummary } from '../../recipes/types/recipe.types'

export interface PlannedMeal {
  mealId: string
  date: string
  recipeId: string
  recipeName: string
  recipeThumbnail: string
  createdAt?: unknown
  updatedAt?: unknown
}

export interface WeeklyPlan {
  weekStartDate: string
  meals: PlannedMeal[]
}

export type PlannedRecipe = Pick<RecipeSummary, 'id' | 'name' | 'thumbnail'>
