import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addManualItem, loadShoppingList, reconcileGeneratedItems, removeShoppingItem, setItemPurchased, updateManualItem } from './shoppingListService'
import type { GeneratedIngredient } from '../types/shoppingList.types'

type TestRef = { path: string; id?: string }
type TestSnapshot = { exists: () => boolean; data: () => Record<string, unknown> | undefined }

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
    const parent = segments[0] as TestRef
    if (segments.length === 1) {
      harness.nextId += 1
      const id = `manual-${harness.nextId}`
      return { path: `${parent.path}/${id}`, id }
    }
    if (typeof parent === 'object' && parent !== null && 'path' in parent) {
      const id = String(segments[1])
      return { path: `${parent.path}/${id}`, id }
    }
    const path = segments.slice(1).map(String).join('/')
    return { path, id: String(segments.at(-1)) }
  },
  getDoc: async (ref: TestRef) => ({
    exists: () => harness.documents.has(ref.path),
    data: () => harness.documents.get(ref.path),
  }),
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
        data: () => harness.documents.get(ref.path),
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
  writeBatch: (_db: unknown) => {
    const writes: Array<() => void> = []
    return {
      delete: (ref: TestRef) => { writes.push(() => { harness.documents.delete(ref.path) }); return undefined },
      commit: async () => { if (harness.failTransactions) throw new Error('batch failed'); writes.forEach((write) => write()) },
    }
  },
  serverTimestamp: () => 'server-timestamp',
}))

const uid = 'shopper-1'
const weekId = '2026-11-09'
const listPath = `users/${uid}/shoppingLists/${weekId}`
const itemPath = `${listPath}/items`
const generated = (itemId: string, name: string, quantity: number): GeneratedIngredient => ({
  itemId, name, normalizedName: name.toLowerCase(), quantity, unit: 'cup', originalMeasures: ['1 cup'],
  sourceRecipeIds: ['recipe-1'], sourceRecipeNames: ['Soup'],
})

beforeEach(() => {
  harness.documents.clear()
  harness.nextId = 0
  harness.failTransactions = false
  harness.missingDb = false
})

describe('shoppingListService', () => {
  it('creates, edits, checks, unchecks, and removes manual items under the signed-in user path', async () => {
    const item = await addManualItem(uid, weekId, '  Paper   towels ', ' 2 rolls ')
    expect(item).toMatchObject({ itemId: 'manual-1', type: 'manual', name: 'Paper towels', note: '2 rolls', isPurchased: false })
    expect(harness.documents.get(`${itemPath}/${item.itemId}`)).toMatchObject({ type: 'manual', name: 'Paper towels', note: '2 rolls' })
    expect(harness.documents.get(listPath)).toMatchObject({ weekStartDate: weekId, sourceMealPlanUpdatedAt: null, generatedAt: null })

    await updateManualItem(uid, weekId, item.itemId, 'Coffee', '1 bag')
    await setItemPurchased(uid, weekId, item.itemId, true)
    expect(await loadShoppingList(uid, weekId)).toMatchObject({ items: [{ name: 'Coffee', note: '1 bag', isPurchased: true }] })
    await setItemPurchased(uid, weekId, item.itemId, false)
    await removeShoppingItem(uid, weekId, item.itemId)
    expect(await loadShoppingList(uid, weekId)).toMatchObject({ items: [] })
  })

  it('reconciles generated items without deleting manual items and preserves matching purchase status', async () => {
    harness.documents.set(listPath, { weekStartDate: weekId, sourceMealPlanUpdatedAt: 'old-plan', generatedAt: 'generated-before' })
    harness.documents.set(`${itemPath}/milk-key`, { itemId: 'milk-key', type: 'generated', name: 'Milk', isPurchased: true, createdAt: 'original-created' })
    harness.documents.set(`${itemPath}/obsolete-key`, { itemId: 'obsolete-key', type: 'generated', name: 'Old item', isPurchased: false })
    harness.documents.set(`${itemPath}/manual-keep`, { itemId: 'manual-keep', type: 'manual', name: 'Bread', note: '', isPurchased: false })

    const list = await reconcileGeneratedItems(uid, weekId, [generated('milk-key', 'Milk', 3), generated('flour-key', 'Flour', 2)], 'new-plan')
    expect(list.items).toHaveLength(3)
    expect(list.items.find((item) => item.itemId === 'milk-key')).toMatchObject({ isPurchased: true, quantity: 3, createdAt: 'original-created' })
    expect(list.items.find((item) => item.itemId === 'flour-key')).toMatchObject({ isPurchased: false, type: 'generated' })
    expect(list.items.find((item) => item.itemId === 'manual-keep')).toMatchObject({ type: 'manual', name: 'Bread' })
    expect(harness.documents.has(`${itemPath}/obsolete-key`)).toBe(false)
    expect(list.sourceMealPlanUpdatedAt).toBe('new-plan')
  })

  it('rejects blank manual names and surfaces Firebase and write failures', async () => {
    await expect(addManualItem(uid, weekId, '   ')).rejects.toThrow('item name')
    harness.missingDb = true
    await expect(loadShoppingList(uid, weekId)).rejects.toThrow('Firebase is not configured')
    harness.missingDb = false
    harness.failTransactions = true
    await expect(addManualItem(uid, weekId, 'Bread')).rejects.toThrow('transaction failed')
    expect(harness.documents.size).toBe(0)
  })
})
