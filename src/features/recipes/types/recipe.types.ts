export interface Ingredient { name: string; measure: string }
export interface RecipeSummary {
  id: string
  name: string
  thumbnail: string
  category: string | null
  area: string | null
}
export interface Recipe extends RecipeSummary {
  instructions: string
  ingredients: Ingredient[]
  tags: string[]
  youtubeUrl: string | null
  sourceUrl: string | null
  creativeCommonsConfirmed: string | null
}
export interface RecipeFilterItem { id: string; name: string; thumbnail?: string }
export interface FavoriteRecipe extends RecipeSummary { savedAt: unknown }
