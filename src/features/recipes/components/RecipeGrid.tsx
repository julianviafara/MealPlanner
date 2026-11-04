import type { RecipeSummary } from '../types/recipe.types'
import { RecipeCard } from './RecipeCard'
import styles from './Recipe.module.css'

export function RecipeGrid({ recipes, favorites, pending, onToggleFavorite }: { recipes: RecipeSummary[]; favorites: Set<string>; pending: Set<string>; onToggleFavorite: (recipe: RecipeSummary) => void }) {
  if (!recipes.length) return null
  return <div className={styles.grid}>{recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} saved={favorites.has(recipe.id)} busy={pending.has(recipe.id)} onToggleFavorite={() => onToggleFavorite(recipe)} />)}</div>
}
