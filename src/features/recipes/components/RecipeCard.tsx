import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { RecipeSummary } from '../types/recipe.types'
import { FavoriteButton } from './FavoriteButton'
import styles from './Recipe.module.css'

export function RecipeCard({ recipe, saved, onToggleFavorite, busy = false }: { recipe: RecipeSummary; saved: boolean; onToggleFavorite: () => void; busy?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false)
  return <article className={styles.recipeCard}>
    <Link to={`/recipes/${encodeURIComponent(recipe.id)}`} className={styles.cardLink} aria-label={`View ${recipe.name}`}>
      <div className={styles.imageWrap}>{!imageFailed ? <img src={recipe.thumbnail} alt={recipe.name} loading="lazy" onError={() => setImageFailed(true)} /> : <div className={styles.imageFallback}>Image unavailable</div>}</div>
      <div className={styles.cardBody}><div className={styles.meta}>{[recipe.category, recipe.area].filter(Boolean).join(' · ') || 'From TheMealDB'}</div><h3>{recipe.name}</h3></div>
    </Link>
    <div className={styles.cardAction}><FavoriteButton saved={saved} busy={busy} onToggle={onToggleFavorite} label={false} /></div>
  </article>
}
