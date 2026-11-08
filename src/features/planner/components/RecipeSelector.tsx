import { useEffect, useRef, useState } from 'react'
import { Check, ImageOff, Search, X } from 'lucide-react'
import { Button } from '../../../components/ui/Button/Button'
import { Input } from '../../../components/ui/Input/Input'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner/LoadingSpinner'
import { searchRecipes } from '../../recipes/services/recipeApi'
import type { RecipeSummary } from '../../recipes/types/recipe.types'
import type { PlannedMeal } from '../types/mealPlan.types'
import { formatDayLabel } from '../utils/dateUtils'
import styles from './Planner.module.css'

export function RecipeSelector({ date, existingMeal, saving, error: saveError, onCancel, onConfirm }: {
  date: string; existingMeal: PlannedMeal | null; saving: boolean; error: string; onCancel: () => void; onConfirm: (recipe: RecipeSummary) => void
}) {
  const [query, setQuery] = useState('')
  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [selected, setSelected] = useState<RecipeSummary | null>(null)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelRef = useRef(onCancel)
  cancelRef.current = onCancel
  const label = formatDayLabel(date)

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    inputRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); cancelRef.current(); return }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => { document.removeEventListener('keydown', handleKeyDown); previousFocus?.focus() }
  }, [])

  useEffect(() => {
    const value = query.trim()
    if (!value) { setRecipes([]); setError(''); setLoading(false); return }
    const controller = new AbortController()
    setLoading(true); setError('')
    const timer = window.setTimeout(() => {
      void searchRecipes(value, controller.signal).then(setRecipes).catch((failure: unknown) => {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Could not search recipes.')
      }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    }, 300)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [query])

  return <div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}>
    <div ref={dialogRef} className={styles.recipeDialog} role="dialog" aria-modal="true" aria-labelledby="recipe-dialog-title" tabIndex={-1}>
      <header className={styles.dialogHeader}><div><span className={styles.eyebrow}>{existingMeal ? 'UPDATE YOUR PLAN' : 'ADD TO YOUR PLAN'}</span><h2 id="recipe-dialog-title">{existingMeal ? 'Choose a new recipe' : `Add a meal for ${label.weekday}`}</h2><p>{label.date}</p></div><button type="button" className={styles.closeDialog} aria-label="Close recipe selector" onClick={onCancel}><X size={20} aria-hidden="true" /></button></header>
      {existingMeal && <div className={styles.currentRecipe}>{!failedImages.has(existingMeal.recipeId) ? <img src={existingMeal.recipeThumbnail} alt="" onError={() => setFailedImages((current) => new Set(current).add(existingMeal.recipeId))} /> : <span className={styles.currentRecipePhotoFallback} aria-hidden="true"><ImageOff size={15} /></span>}<span>Currently planned<strong>{existingMeal.recipeName}</strong></span></div>}
      <div className={styles.selectorSearch}><Search size={17} aria-hidden="true" /><Input ref={inputRef} id="planner-recipe-search" label="Search recipes" placeholder="Try ‘tomato pasta’" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" /></div>
      {saveError && <p className={styles.selectorError} role="alert">{saveError}</p>}
      <div className={styles.recipeResults} aria-live="polite">
        {loading ? <div className={styles.selectorState}><LoadingSpinner label="Searching recipes" /></div> : error ? <p className={styles.selectorError} role="alert">{error}</p> : query.trim() && recipes.length === 0 ? <p className={styles.selectorState}>No recipes found. Try another search.</p> : !query.trim() ? <p className={styles.selectorState}>Search by recipe name to find something for this day.</p> : recipes.map((recipe) => <button type="button" key={recipe.id} className={`${styles.recipeOption} ${selected?.id === recipe.id ? styles.recipeSelected : ''}`} aria-pressed={selected?.id === recipe.id} onClick={() => setSelected(recipe)}>
          {!failedImages.has(recipe.id) ? <img src={recipe.thumbnail} alt="" loading="lazy" onError={() => setFailedImages((current) => new Set(current).add(recipe.id))} /> : <span className={styles.recipeImageFallback} aria-hidden="true"><ImageOff size={18} /></span>}<span><strong>{recipe.name}</strong><small>{[recipe.category, recipe.area].filter(Boolean).join(' · ') || 'Recipe'}</small></span>{selected?.id === recipe.id && <Check size={18} aria-label="Selected" />}
        </button>)}
      </div>
      <footer className={styles.dialogFooter}><span className={styles.selectorAttribution}>Recipe data provided by TheMealDB.</span><div><Button type="button" variant="quiet" onClick={onCancel}>Cancel</Button><Button type="button" disabled={!selected || saving} onClick={() => selected && onConfirm(selected)}>{saving ? 'Saving…' : existingMeal ? 'Save change' : 'Add meal'}</Button></div></footer>
    </div>
  </div>
}
