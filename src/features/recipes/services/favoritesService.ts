import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { getFirebaseFirestore } from '../../../services/firebase/config'
import type { FavoriteRecipe, RecipeSummary } from '../types/recipe.types'

async function favoritesCollection(uid: string) {
  if (!uid) throw new Error('Sign in to manage your favourite recipes.')
  const db = await getFirebaseFirestore()
  if (!db) throw new Error('Firebase is not configured. Add the Firebase values to .env.local.')
  return collection(db, 'users', uid, 'favorites')
}

export async function getFavorites(uid: string): Promise<FavoriteRecipe[]> {
  const snapshot = await getDocs(await favoritesCollection(uid))
  return snapshot.docs.map((item) => item.data() as FavoriteRecipe).sort((a, b) => {
    const time = (value: unknown): number => {
      if (typeof value !== 'object' || value === null || !('toMillis' in value)) return 0
      const timestamp = value as { toMillis?: () => number }
      return typeof timestamp.toMillis === 'function' ? timestamp.toMillis() : 0
    }
    return time(b.savedAt) - time(a.savedAt)
  })
}

export async function saveFavorite(uid: string, recipe: RecipeSummary): Promise<void> {
  const collectionRef = await favoritesCollection(uid)
  await setDoc(doc(collectionRef, recipe.id), {
    id: recipe.id, name: recipe.name, thumbnail: recipe.thumbnail,
    category: recipe.category, area: recipe.area, savedAt: serverTimestamp(),
  })
}

export async function removeFavorite(uid: string, id: string): Promise<void> {
  const collectionRef = await favoritesCollection(uid)
  await deleteDoc(doc(collectionRef, id))
}
