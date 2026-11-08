import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addPlannedMeal, changePlannedRecipe, loadWeekMeals, removePlannedMeal } from './mealPlanService'

type TestRef = { path: string; id?: string }
type TestSnapshot = { exists: () => boolean; data: () => Record<string, unknown> }

const harness = vi.hoisted(() => ({
  documents: new Map<string, Record<string, unknown>>(),
  nextId: 0,
  failTransactions: false,
  missingDb: false,
}))

vi.mock('../../../services/firebase/config', () => ({
  getFirebaseFirestore: async () => harness.missingDb ? null : { testDb: true },
}))

vi.mock('firebase/firestore', () => ({
  collection: (...segments: unknown[]): TestRef => {
    if (segments.length === 2 && typeof segments[0] === 'object' && segments[0] !== null && 'path' in segments[0]) {
      return { path: `${(segments[0] as TestRef).path}/${String(segments[1])}` }
    }
    return { path: segments.slice(1).map(String).join('/') }
  },
  doc: (...segments: unknown[]): TestRef => {
    const collectionRef = segments[0] as TestRef
    if (segments.length === 2 && typeof collectionRef === 'object' && collectionRef !== null && 'path' in collectionRef) {
      const id = String(segments[1])
      return { path: `${collectionRef.path}/${id}`, id }
    }
    if (segments.length === 1) {
      harness.nextId += 1
      const id = `meal-${harness.nextId}`
      return { path: `${collectionRef.path}/${id}`, id }
    }
    const path = segments.slice(1).map(String).join('/')
    return { path, id: String(segments.at(-1)) }
  },
  getDocs: async (ref: TestRef) => {
    const prefix = `${ref.path}/`
    const docs = [...harness.documents.entries()].filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
    return { docs: docs.map(([path, data]) => ({ id: path.split('/').at(-1) ?? '', data: () => data })) }
  },
  runTransaction: async (_db: unknown, callback: (transaction: {
    get: (ref: TestRef) => Promise<TestSnapshot>
    set: (ref: TestRef, data: Record<string, unknown>, options?: { merge?: boolean }) => void
    update: (ref: TestRef, data: Record<string, unknown>) => void
    delete: (ref: TestRef) => void
  }) => Promise<void>) => {
    if (harness.failTransactions) throw new Error('transaction failed')
    const writes: Array<() => void> = []
    const transaction = {
      get: async (ref: TestRef): Promise<TestSnapshot> => ({
        exists: () => harness.documents.has(ref.path),
        data: () => harness.documents.get(ref.path) ?? {},
      }),
      set: (ref: TestRef, data: Record<string, unknown>, options?: { merge?: boolean }) => writes.push(() => {
        harness.documents.set(ref.path, options?.merge ? { ...harness.documents.get(ref.path), ...data } : data)
      }),
      update: (ref: TestRef, data: Record<string, unknown>) => writes.push(() => {
        const previous = harness.documents.get(ref.path)
        if (!previous) throw new Error('document does not exist')
        harness.documents.set(ref.path, { ...previous, ...data })
      }),
      delete: (ref: TestRef) => writes.push(() => { harness.documents.delete(ref.path) }),
    }
    await callback(transaction)
    writes.forEach((write) => write())
  },
  serverTimestamp: () => 'server-timestamp',
}))

const uid = 'user-a'
const weekId = '2026-11-09'
const recipe = { id: '52772', name: 'Teriyaki Chicken', thumbnail: 'https://img.test/teriyaki.jpg' }
const weekPath = `users/${uid}/mealPlans/${weekId}`

beforeEach(() => {
  harness.documents.clear()
  harness.nextId = 0
  harness.failTransactions = false
  harness.missingDb = false
})

describe('mealPlanService', () => {
  it('loads an empty week and an existing week from the authenticated user path', async () => {
    expect(await loadWeekMeals(uid, weekId)).toEqual([])
    harness.documents.set(`${weekPath}/meals/meal-old`, {
      mealId: 'meal-old', date: weekId, recipeId: recipe.id, recipeName: recipe.name, recipeThumbnail: recipe.thumbnail,
    })
    expect(await loadWeekMeals(uid, weekId)).toMatchObject([{ mealId: 'meal-old', recipeId: '52772' }])
    expect(await loadWeekMeals('another-user', weekId)).toEqual([])
  })

  it('appends multiple meals, including the same recipe, with unique documents and a compact snapshot', async () => {
    const first = await addPlannedMeal(uid, weekId, weekId, recipe)
    const second = await addPlannedMeal(uid, weekId, weekId, recipe)
    expect(first.mealId).not.toBe(second.mealId)
    expect(harness.documents.size).toBe(3)
    expect(harness.documents.get(weekPath)).toMatchObject({ weekStartDate: weekId, createdAt: 'server-timestamp', updatedAt: 'server-timestamp' })
    expect(harness.documents.get(`${weekPath}/meals/${first.mealId}`)).toEqual({
      mealId: first.mealId, date: weekId, recipeId: recipe.id, recipeName: recipe.name,
      recipeThumbnail: recipe.thumbnail, createdAt: 'server-timestamp', updatedAt: 'server-timestamp',
    })
  })

  it('changes one planned meal in place and removes only the requested meal', async () => {
    const first = await addPlannedMeal(uid, weekId, weekId, recipe)
    const second = await addPlannedMeal(uid, weekId, weekId, recipe)
    const replacement = { id: '52977', name: 'Corba', thumbnail: 'https://img.test/corba.jpg' }
    const changed = await changePlannedRecipe(uid, weekId, first, replacement)
    expect(changed).toMatchObject({ mealId: first.mealId, recipeId: replacement.id, date: weekId })
    expect(harness.documents.get(`${weekPath}/meals/${first.mealId}`)).toMatchObject({ recipeId: replacement.id, recipeName: replacement.name })
    await removePlannedMeal(uid, weekId, first.mealId)
    expect(harness.documents.has(`${weekPath}/meals/${first.mealId}`)).toBe(false)
    expect(harness.documents.has(`${weekPath}/meals/${second.mealId}`)).toBe(true)
  })

  it('surfaces Firestore configuration and operation errors', async () => {
    await expect(addPlannedMeal(uid, weekId, '2026-11-16', recipe)).rejects.toThrow('within the selected week')
    harness.missingDb = true
    await expect(loadWeekMeals(uid, weekId)).rejects.toThrow('Firebase is not configured')
    harness.missingDb = false
    harness.failTransactions = true
    await expect(addPlannedMeal(uid, weekId, weekId, recipe)).rejects.toThrow('transaction failed')
    expect(harness.documents.size).toBe(0)
  })
})
