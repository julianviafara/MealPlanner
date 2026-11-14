import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Search, Shuffle, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { Button } from '../../../components/ui/Button/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner/LoadingSpinner'
import { FavoriteButton } from '../components/FavoriteButton'
import { RecipeGrid } from '../components/RecipeGrid'
import { filterRecipesByArea, filterRecipesByCategory, filterRecipesByIngredient, getAreas, getCategories, getIngredients, getRandomRecipe, searchRecipes } from '../services/recipeApi'
import { getFavorites, removeFavorite, saveFavorite } from '../services/favoritesService'
import type { Recipe, RecipeFilterItem, RecipeSummary } from '../types/recipe.types'
import styles from '../components/Recipe.module.css'

type FilterKind = 'category' | 'area' | 'ingredient'

export function RecipeCatalogPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [featured, setFeatured] = useState<Recipe | null>(null)
  const [featuredImageFailed, setFeaturedImageFailed] = useState(false)
  const [filters, setFilters] = useState<Record<FilterKind, RecipeFilterItem[]>>({ category: [], area: [], ingredient: [] })
  const [active, setActive] = useState<{ kind: FilterKind; value: string } | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [randomLoading, setRandomLoading] = useState(false)
  const [error, setError] = useState('')
  const [favoriteError, setFavoriteError] = useState('')
  const [filtersError, setFiltersError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let activeRequest = true
    void Promise.allSettled([getCategories(), getAreas(), getIngredients(), getFavorites(user!.uid)]).then((results) => {
      if (!activeRequest) return
      const [category, area, ingredient, favorites] = results
      setFilters({
        category: category.status === 'fulfilled' ? category.value : [],
        area: area.status === 'fulfilled' ? area.value : [],
        ingredient: ingredient.status === 'fulfilled' ? ingredient.value : [],
      })
      if ([category, area, ingredient].some((result) => result.status === 'rejected')) setFiltersError('Some filters could not be loaded. Recipe search is still available.')
      if (favorites.status === 'fulfilled') setFavoriteIds(new Set(favorites.value.map((favorite) => favorite.id)))
      else setFavoriteError(favorites.reason instanceof Error ? favorites.reason.message : 'Could not load your favourites.')
    })
    return () => { activeRequest = false }
  }, [user])

  const loadRecipes = useCallback(async (search: string, selected: typeof active) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    if (!search.trim() && !selected) { setRecipes([]); setError(''); setLoading(false); return }
    setLoading(true); setError('')
    try {
      const result = selected
        ? selected.kind === 'category' ? await filterRecipesByCategory(selected.value, controller.signal)
          : selected.kind === 'area' ? await filterRecipesByArea(selected.value, controller.signal)
            : await filterRecipesByIngredient(selected.value, controller.signal)
        : await searchRecipes(search, controller.signal)
      if (!controller.signal.aborted) setRecipes(result.map((recipe) => ({
        ...recipe,
        category: selected?.kind === 'category' ? selected.value : recipe.category,
        area: selected?.kind === 'area' ? selected.value : recipe.area,
      })))
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Could not load recipes.')
    } finally { if (!controller.signal.aborted) setLoading(false) }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadRecipes(query, active) }, query.trim() || active ? 350 : 0)
    return () => { window.clearTimeout(timer); abortRef.current?.abort() }
  }, [query, active, loadRecipes])

  async function discoverRandom() {
    setRandomLoading(true); setError('')
    try { setFeatured(await getRandomRecipe()); setFeaturedImageFailed(false) }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not find a random recipe.') }
    finally { setRandomLoading(false) }
  }

  async function toggleFavorite(recipe: RecipeSummary) {
    if (!user || pending.has(recipe.id)) return
    setFavoriteError(''); setPending((current) => new Set(current).add(recipe.id))
    try {
      if (favoriteIds.has(recipe.id)) { await removeFavorite(user.uid, recipe.id); setFavoriteIds((current) => { const next = new Set(current); next.delete(recipe.id); return next }) }
      else { await saveFavorite(user.uid, recipe); setFavoriteIds((current) => new Set(current).add(recipe.id)) }
    } catch (failure) { setFavoriteError(failure instanceof Error ? failure.message : 'Could not update your favourites.') }
    finally { setPending((current) => { const next = new Set(current); next.delete(recipe.id); return next }) }
  }

  function selectFilter(kind: FilterKind, value: string) {
    setActive((current) => current?.kind === kind && current.value === value ? null : { kind, value })
    setQuery('')
  }

  return <div className={styles.page}>
    <header className={styles.pageHeading}><div><span className={styles.eyebrow}>THE RECIPE COLLECTION</span><h1>Find something lovely.</h1><p>Explore recipes for whatever sounds good today.</p></div><Button variant="secondary" onClick={discoverRandom} disabled={randomLoading}><Shuffle size={16} aria-hidden="true" />{randomLoading ? 'Finding…' : 'Surprise me'}</Button></header>
    {featured && <section className={styles.featured} aria-label="Featured random recipe">{!featuredImageFailed ? <img className={styles.featuredPhoto} src={featured.thumbnail} alt={featured.name} onError={() => setFeaturedImageFailed(true)} /> : <div className={`${styles.imageFallback} ${styles.featuredPhoto}`} role="img" aria-label={`${featured.name} image unavailable`}>Image unavailable</div>}<div className={styles.featuredText}><span className={styles.eyebrow}>A LITTLE INSPIRATION</span><h2>{featured.name}</h2><p>{[featured.area, featured.category].filter(Boolean).join(' · ') || 'A recipe from TheMealDB'}</p><Link to={`/recipes/${featured.id}`} className={styles.textLink}>See the recipe <ArrowRight size={16} aria-hidden="true" /></Link></div><FavoriteButton saved={favoriteIds.has(featured.id)} busy={pending.has(featured.id)} onToggle={() => void toggleFavorite(featured)} /></section>}
    <section className={styles.searchPanel} aria-label="Search and filter recipes">
      <label className={styles.searchBox}><Search size={19} aria-hidden="true" /><span className={styles.visuallyHidden}>Search recipes by name</span><input value={query} onChange={(event) => { const value = event.target.value; setQuery(value); setActive(null); setLoading(Boolean(value.trim())) }} placeholder="Search recipes by name…" />{query && <button type="button" aria-label="Clear search" onClick={() => { setQuery(''); setLoading(false) }}><X size={17} /></button>}</label>
      <div className={styles.filterRow}>
        {(['category', 'area', 'ingredient'] as const).map((kind) => <label key={kind} className={styles.filterLabel}><span>{kind === 'area' ? 'Cuisine' : kind === 'category' ? 'Category' : 'Ingredient'}</span><select value={active?.kind === kind ? active.value : ''} onChange={(event) => event.target.value ? selectFilter(kind, event.target.value) : setActive(null)}><option value="">All {kind === 'area' ? 'cuisines' : `${kind}s`}</option>{filters[kind].map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>)}
      </div>
      {(active || query) && <div className={styles.activeFilter}>Showing {active ? `${active.kind === 'area' ? 'cuisine' : active.kind}: ${active.value}` : `results for “${query.trim()}”`}<button type="button" onClick={() => { setActive(null); setQuery('') }}>Clear filters <X size={14} aria-hidden="true" /></button></div>}
      {active && query.trim() && <p className={styles.note}>Search and filters are applied one at a time, as supported by TheMealDB.</p>}
    </section>
    {filtersError && <p className={styles.error} role="status">{filtersError}</p>}{error && <p className={styles.error} role="alert">{error}</p>}{favoriteError && <p className={styles.error} role="alert">{favoriteError}</p>}
    {loading ? <div className={styles.loading}><LoadingSpinner label="Finding recipes" /></div> : recipes.length ? <><h2 className={styles.sectionTitle}>Recipes to explore <span>{recipes.length}</span></h2><RecipeGrid recipes={recipes} favorites={favoriteIds} pending={pending} onToggleFavorite={(recipe) => void toggleFavorite(recipe)} /></> : !error && <div className={styles.emptyState}><Search size={24} aria-hidden="true" /><h2>{query || active ? 'No recipes found' : 'Start with a search or browse'}</h2><p>{query || active ? 'Try another name or clear your filter to explore more recipes.' : 'Search by name, or choose a category, cuisine or ingredient above.'}</p></div>}
    <p className={styles.attribution}>Recipe data and imagery provided by TheMealDB.</p>
  </div>
}
