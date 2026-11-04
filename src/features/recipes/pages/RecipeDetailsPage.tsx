import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner/LoadingSpinner'
import { FavoriteButton } from '../components/FavoriteButton'
import { getRecipeById } from '../services/recipeApi'
import { getFavorites, removeFavorite, saveFavorite } from '../services/favoritesService'
import type { Recipe } from '../types/recipe.types'
import styles from '../components/Recipe.module.css'

export function RecipeDetailsPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [photoFailed, setPhotoFailed] = useState(false)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError(''); setPhotoFailed(false)
    void getRecipeById(id, controller.signal).then((result) => {
      if (controller.signal.aborted) return
      setRecipe(result)
    }).catch((failure: unknown) => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Could not load this recipe.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    void getFavorites(user!.uid).then((favorites) => { if (!controller.signal.aborted) setSaved(favorites.some((favorite) => favorite.id === id)) })
      .catch((failure: unknown) => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Could not load your favourites.') })
    return () => controller.abort()
  }, [id, user])

  async function toggleFavorite() {
    if (!user || !recipe) return
    setBusy(true); setError('')
    try { if (saved) await removeFavorite(user.uid, recipe.id); else await saveFavorite(user.uid, recipe); setSaved(!saved) }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not update your favourites.') }
    finally { setBusy(false) }
  }

  if (loading) return <div className={styles.loading}><LoadingSpinner label="Loading recipe" /></div>
  if (error && !recipe) return <div className={styles.statePage}><p role="alert">{error}</p><Link to="/recipes"><ArrowLeft size={16} /> Back to recipes</Link></div>
  if (!recipe) return <div className={styles.statePage}><span className={styles.eyebrow}>RECIPE NOT FOUND</span><h1>We couldn’t find that recipe.</h1><p>The recipe may have been removed or the address may be incorrect.</p><Link to="/recipes"><ArrowLeft size={16} /> Back to recipes</Link></div>

  return <article className={styles.detailsPage}>
    <Link className={styles.backLink} to="/recipes"><ArrowLeft size={16} aria-hidden="true" /> Back to recipes</Link>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.detailHero}>{!photoFailed ? <img src={recipe.thumbnail} alt={recipe.name} onError={() => setPhotoFailed(true)} /> : <div className={`${styles.imageFallback} ${styles.detailPhotoFallback}`} role="img" aria-label={`${recipe.name} image unavailable`}>Image unavailable</div>}<div className={styles.detailIntro}><span className={styles.eyebrow}>{[recipe.category, recipe.area].filter(Boolean).join(' · ') || 'FROM THE RECIPE COLLECTION'}</span><h1>{recipe.name}</h1>{recipe.tags.length > 0 && <div className={styles.tags}>{recipe.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}<FavoriteButton saved={saved} busy={busy} onToggle={() => void toggleFavorite()} /></div></div>
    <div className={styles.detailColumns}><section className={styles.ingredients}><span className={styles.eyebrow}>WHAT YOU’LL NEED</span><h2>Ingredients</h2>{recipe.ingredients.length ? <ul>{recipe.ingredients.map((ingredient, index) => <li key={`${ingredient.name}-${index}`}><span>{ingredient.name}</span><span>{ingredient.measure || '—'}</span></li>)}</ul> : <p>No ingredient list was provided.</p>}</section><section className={styles.instructions}><span className={styles.eyebrow}>LET’S GET COOKING</span><h2>Instructions</h2><div>{recipe.instructions ? recipe.instructions.split(/\r?\n+/).map((step, index) => step.trim() && <p key={index}>{step.trim()}</p>) : <p>No preparation instructions were provided.</p>}</div>{(recipe.sourceUrl || recipe.youtubeUrl) && <div className={styles.sourceLinks}>{recipe.sourceUrl && <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">Original recipe source <ExternalLink size={14} aria-hidden="true" /></a>}{recipe.youtubeUrl && <a href={recipe.youtubeUrl} target="_blank" rel="noreferrer">Watch preparation video <ExternalLink size={14} aria-hidden="true" /></a>}</div>}{recipe.creativeCommonsConfirmed && <p className={styles.license}>Licensing metadata: {recipe.creativeCommonsConfirmed}</p>}</section></div>
    <p className={styles.attribution}>Recipe data and imagery provided by TheMealDB.</p>
  </article>
}
