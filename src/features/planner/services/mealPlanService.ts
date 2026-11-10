import { collection, doc, getDoc, getDocs, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore'
import { getFirebaseFirestore } from '../../../services/firebase/config'
import type { PlannedMeal, PlannedRecipe } from '../types/mealPlan.types'
import { getWeekDays } from '../utils/dateUtils'

async function requireDb(): Promise<Firestore> {
  const db = await getFirebaseFirestore()
  if (!db) throw new Error('Firebase is not configured. Add the Firebase values to .env.local.')
  return db
}

function planReference(db: Firestore, uid: string, weekId: string) {
  if (!uid) throw new Error('Sign in to manage your weekly plan.')
  getWeekDays(weekId)
  return doc(db, 'users', uid, 'mealPlans', weekId)
}

function byDateThenCreated(a: PlannedMeal, b: PlannedMeal): number {
  if (a.date !== b.date) return a.date.localeCompare(b.date)
  const timestamp = (value: unknown): number => {
    if (value instanceof Date) return value.getTime()
    if (typeof value !== 'object' || value === null || !('toMillis' in value)) return 0
    const candidate = value as { toMillis?: () => number }
    return typeof candidate.toMillis === 'function' ? candidate.toMillis() : 0
  }
  return timestamp(a.createdAt) - timestamp(b.createdAt) || a.mealId.localeCompare(b.mealId)
}

export async function loadWeekMeals(uid: string, weekId: string): Promise<PlannedMeal[]> {
  const db = await requireDb()
  const mealsRef = collection(planReference(db, uid, weekId), 'meals')
  const snapshot = await getDocs(mealsRef)
  return snapshot.docs.map((meal) => meal.data() as PlannedMeal).sort(byDateThenCreated)
}

export async function getWeekPlanUpdatedAt(uid: string, weekId: string): Promise<unknown | null> {
  const db = await requireDb()
  const snapshot = await getDoc(planReference(db, uid, weekId))
  return snapshot.exists() ? snapshot.data().updatedAt ?? null : null
}

export async function loadWeekPlanSnapshot(uid: string, weekId: string): Promise<{ meals: PlannedMeal[]; updatedAt: unknown | null }> {
  const version = (value: unknown): string | null => {
    if (value === null || value === undefined) return null
    if (value instanceof Date) return `date:${value.getTime()}`
    if (typeof value === 'number') return `number:${value}`
    if (typeof value !== 'object') return String(value)
    if ('seconds' in value && 'nanoseconds' in value) return `timestamp:${String(value.seconds)}:${String(value.nanoseconds)}`
    const timestamp = value as { toMillis?: () => number }
    return typeof timestamp.toMillis === 'function' ? `millis:${timestamp.toMillis()}` : null
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const before = await getWeekPlanUpdatedAt(uid, weekId)
    const meals = await loadWeekMeals(uid, weekId)
    const after = await getWeekPlanUpdatedAt(uid, weekId)
    if (version(before) === version(after)) return { meals, updatedAt: after }
  }
  throw new Error('Your weekly plan changed while it was being read. Please try again.')
}

export async function addPlannedMeal(uid: string, weekId: string, date: string, recipe: PlannedRecipe): Promise<PlannedMeal> {
  const db = await requireDb()
  if (!getWeekDays(weekId).includes(date)) throw new Error('Choose a date within the selected week.')
  const weekRef = planReference(db, uid, weekId)
  const mealRef = doc(collection(weekRef, 'meals'))
  await runTransaction(db, async (transaction) => {
    const week = await transaction.get(weekRef)
    transaction.set(weekRef, {
      weekStartDate: weekId,
      ...(week.exists() ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    }, { merge: true })
    transaction.set(mealRef, {
      mealId: mealRef.id,
      date,
      recipeId: recipe.id,
      recipeName: recipe.name,
      recipeThumbnail: recipe.thumbnail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })
  return {
    mealId: mealRef.id, date, recipeId: recipe.id, recipeName: recipe.name,
    recipeThumbnail: recipe.thumbnail, createdAt: new Date(),
  }
}

export async function changePlannedRecipe(uid: string, weekId: string, meal: PlannedMeal, recipe: PlannedRecipe): Promise<PlannedMeal> {
  const db = await requireDb()
  const weekRef = planReference(db, uid, weekId)
  const mealRef = doc(collection(weekRef, 'meals'), meal.mealId)
  await runTransaction(db, async (transaction) => {
    const week = await transaction.get(weekRef)
    const current = await transaction.get(mealRef)
    if (!current.exists()) throw new Error('This planned meal no longer exists. Refresh the week and try again.')
    transaction.update(mealRef, {
      recipeId: recipe.id,
      recipeName: recipe.name,
      recipeThumbnail: recipe.thumbnail,
      updatedAt: serverTimestamp(),
    })
    transaction.set(weekRef, {
      weekStartDate: weekId,
      ...(week.exists() ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    }, { merge: true })
  })
  return { ...meal, recipeId: recipe.id, recipeName: recipe.name, recipeThumbnail: recipe.thumbnail, updatedAt: new Date() }
}

export async function removePlannedMeal(uid: string, weekId: string, mealId: string): Promise<void> {
  const db = await requireDb()
  const weekRef = planReference(db, uid, weekId)
  const mealRef = doc(collection(weekRef, 'meals'), mealId)
  await runTransaction(db, async (transaction) => {
    const week = await transaction.get(weekRef)
    transaction.delete(mealRef)
    transaction.set(weekRef, {
      weekStartDate: weekId,
      ...(week.exists() ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    }, { merge: true })
  })
}
