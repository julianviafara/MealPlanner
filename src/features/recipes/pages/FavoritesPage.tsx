import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner/LoadingSpinner'
import { RecipeGrid } from '../components/RecipeGrid'
import { getFavorites, removeFavorite } from '../services/favoritesService'
import type { FavoriteRecipe } from '../types/recipe.types'
import styles from '../components/Recipe.module.css'

export function FavoritesPage() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const refresh = useCallback(async () => { setLoading(true); setError(''); try { setFavorites(await getFavorites(user!.uid)) } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not load your favourites.') } finally { setLoading(false) } }, [user])
  useEffect(() => { void refresh() }, [refresh])
  async function remove(id: string) {
    setPending((current) => new Set(current).add(id))
    try { await removeFavorite(user!.uid, id); setFavorites((current) => current.filter((favorite) => favorite.id !== id)) }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not remove this favourite.') }
    finally { setPending((current) => { const next = new Set(current); next.delete(id); return next }) }
  }
  return <div className={styles.page}>
    <header className={styles.pageHeading}><div><span className={styles.eyebrow}>SAVED FOR LATER</span><h1>Your favourites.</h1><p>A little collection of recipes you love.</p></div></header>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {loading ? <div className={styles.loading}><LoadingSpinner label="Loading your favourites" /></div> : favorites.length ? <RecipeGrid recipes={favorites} favorites={new Set(favorites.map((favorite) => favorite.id))} pending={pending} onToggleFavorite={(recipe) => void remove(recipe.id)} /> : <div className={styles.emptyState}><Heart size={24} aria-hidden="true" /><h2>No favourites yet</h2><p>Save recipes while exploring and they’ll be gathered here.</p><Link className={styles.textLink} to="/recipes">Explore recipes <ArrowRight size={16} aria-hidden="true" /></Link></div>}
    <p className={styles.attribution}>Recipe data and imagery provided by TheMealDB.</p>
  </div>
}
