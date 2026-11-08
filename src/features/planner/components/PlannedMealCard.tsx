import { useState } from 'react'
import { ArrowUpRight, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PlannedMeal } from '../types/mealPlan.types'
import styles from './Planner.module.css'

export function PlannedMealCard({ meal, busy, onChange, onRemove }: { meal: PlannedMeal; busy: boolean; onChange: () => void; onRemove: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  return <article className={styles.mealCard}>
    <Link className={styles.mealRecipe} to={`/recipes/${encodeURIComponent(meal.recipeId)}`} aria-label={`Open recipe: ${meal.recipeName}`}>
      {!imageFailed ? <img src={meal.recipeThumbnail} alt="" loading="lazy" onError={() => setImageFailed(true)} /> : <span className={styles.mealImageFallback} aria-hidden="true" />}
      <span className={styles.mealName}>{meal.recipeName}</span><ArrowUpRight size={14} aria-hidden="true" className={styles.openIcon} />
    </Link>
    {!confirming ? <div className={styles.mealActions}>
      <button type="button" disabled={busy} onClick={onChange} aria-label={`Change recipe for ${meal.recipeName}`}><Pencil size={14} aria-hidden="true" /><span>Change</span></button>
      <button type="button" disabled={busy} onClick={() => setConfirming(true)} aria-label={`Remove ${meal.recipeName} from the plan`}><Trash2 size={14} aria-hidden="true" /><span>Remove</span></button>
    </div> : <div className={styles.removeConfirmation}><span>Remove this meal?</span><button type="button" disabled={busy} onClick={onRemove}>{busy ? 'Removing…' : 'Remove'}</button><button type="button" disabled={busy} onClick={() => setConfirming(false)}>Keep</button></div>}
  </article>
}
