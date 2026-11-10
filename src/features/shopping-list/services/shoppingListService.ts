import {
  collection, doc, getDoc, getDocs, runTransaction, serverTimestamp, writeBatch,
  type DocumentReference, type Firestore, type Transaction,
} from 'firebase/firestore'
import { getFirebaseFirestore } from '../../../services/firebase/config'
import { getWeekDays } from '../../planner/utils/dateUtils'
import type { GeneratedIngredient, ManualShoppingItem, ShoppingItem, ShoppingListData } from '../types/shoppingList.types'

async function requireDb(): Promise<Firestore> {
  const db = await getFirebaseFirestore()
  if (!db) throw new Error('Firebase is not configured. Add the Firebase values to .env.local.')
  return db
}

function listReference(db: Firestore, uid: string, weekId: string) {
  if (!uid) throw new Error('Sign in to manage your shopping list.')
  getWeekDays(weekId)
  return doc(db, 'users', uid, 'shoppingLists', weekId)
}

function itemsReference(listRef: DocumentReference) {
  return collection(listRef, 'items')
}

function listMetadata(
  weekId: string,
  snapshot: { exists: () => boolean; data: () => Record<string, unknown> | undefined },
  changes: Partial<Pick<ShoppingListData, 'sourceMealPlanUpdatedAt' | 'generatedAt'>> = {},
) {
  const previous = snapshot.exists() ? snapshot.data() ?? {} : {}
  return {
    weekStartDate: weekId,
    sourceMealPlanUpdatedAt: Object.hasOwn(changes, 'sourceMealPlanUpdatedAt') ? changes.sourceMealPlanUpdatedAt : previous.sourceMealPlanUpdatedAt ?? null,
    generatedAt: Object.hasOwn(changes, 'generatedAt') ? changes.generatedAt : previous.generatedAt ?? null,
    updatedAt: serverTimestamp(),
  }
}

function touchList(transaction: Transaction, listRef: DocumentReference, weekId: string, changes: Partial<Pick<ShoppingListData, 'sourceMealPlanUpdatedAt' | 'generatedAt'>> = {}) {
  return transaction.get(listRef).then((snapshot) => {
    transaction.set(listRef, listMetadata(weekId, snapshot, changes), { merge: true })
  })
}

export async function loadShoppingList(uid: string, weekId: string): Promise<ShoppingListData> {
  const db = await requireDb()
  const listRef = listReference(db, uid, weekId)
  const [listSnapshot, itemsSnapshot] = await Promise.all([getDoc(listRef), getDocs(itemsReference(listRef))])
  const metadata = listSnapshot.exists() ? listSnapshot.data() : {}
  return {
    weekStartDate: weekId,
    sourceMealPlanUpdatedAt: metadata.sourceMealPlanUpdatedAt ?? null,
    generatedAt: metadata.generatedAt ?? null,
    updatedAt: metadata.updatedAt,
    items: itemsSnapshot.docs.map((item) => item.data() as ShoppingItem),
  }
}

async function writeGeneratedItem(db: Firestore, uid: string, weekId: string, ingredient: GeneratedIngredient): Promise<void> {
  const listRef = listReference(db, uid, weekId)
  const itemRef = doc(itemsReference(listRef), ingredient.itemId)
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(itemRef)
    const data = existing.exists() ? existing.data() : {}
    transaction.set(itemRef, {
      ...ingredient,
      type: 'generated',
      isPurchased: data.isPurchased === true,
      createdAt: data.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })
}

async function deleteObsoleteGenerated(db: Firestore, refs: DocumentReference[]): Promise<void> {
  const chunkSize = 450
  for (let start = 0; start < refs.length; start += chunkSize) {
    const batch = writeBatch(db)
    for (const ref of refs.slice(start, start + chunkSize)) batch.delete(ref)
    await batch.commit()
  }
}

export async function reconcileGeneratedItems(
  uid: string,
  weekId: string,
  ingredients: GeneratedIngredient[],
  sourceMealPlanUpdatedAt: unknown | null,
): Promise<ShoppingListData> {
  const db = await requireDb()
  const listRef = listReference(db, uid, weekId)
  const itemCollection = itemsReference(listRef)
  const snapshot = await getDocs(itemCollection)
  const existingGenerated = new Map(snapshot.docs
    .filter((item) => item.data().type === 'generated')
    .map((item) => [item.id, item]))
  const incomingIds = new Set(ingredients.map((ingredient) => ingredient.itemId))

  for (let start = 0; start < ingredients.length; start += 10) {
    await Promise.all(ingredients.slice(start, start + 10).map((ingredient) => writeGeneratedItem(db, uid, weekId, ingredient)))
  }

  const obsoleteRefs = [...existingGenerated.entries()]
    .filter(([itemId]) => !incomingIds.has(itemId))
    .map(([, item]) => doc(itemCollection, item.id))
  await deleteObsoleteGenerated(db, obsoleteRefs)

  await runTransaction(db, async (transaction) => {
    await touchList(transaction, listRef, weekId, { sourceMealPlanUpdatedAt, generatedAt: serverTimestamp() })
  })
  return loadShoppingList(uid, weekId)
}

export async function addManualItem(uid: string, weekId: string, name: string, note = ''): Promise<ManualShoppingItem> {
  const cleanName = name.trim().replace(/\s+/g, ' ')
  if (!cleanName) throw new Error('Enter an item name.')
  const db = await requireDb()
  const listRef = listReference(db, uid, weekId)
  const itemRef = doc(itemsReference(listRef))
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(listRef)
    transaction.set(listRef, listMetadata(weekId, snapshot), { merge: true })
    transaction.set(itemRef, {
      itemId: itemRef.id, type: 'manual', name: cleanName, note: note.trim(),
      isPurchased: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    })
  })
  return { itemId: itemRef.id, type: 'manual', name: cleanName, note: note.trim(), isPurchased: false, createdAt: new Date() }
}

export async function updateManualItem(uid: string, weekId: string, itemId: string, name: string, note: string): Promise<ManualShoppingItem> {
  const cleanName = name.trim().replace(/\s+/g, ' ')
  if (!cleanName) throw new Error('Enter an item name.')
  const db = await requireDb()
  const listRef = listReference(db, uid, weekId)
  const itemRef = doc(itemsReference(listRef), itemId)
  await runTransaction(db, async (transaction) => {
    const [itemSnapshot, listSnapshot] = await Promise.all([transaction.get(itemRef), transaction.get(listRef)])
    if (!itemSnapshot.exists() || itemSnapshot.data().type !== 'manual') throw new Error('This manual item is no longer available.')
    transaction.update(itemRef, { name: cleanName, note: note.trim(), updatedAt: serverTimestamp() })
    transaction.set(listRef, listMetadata(weekId, listSnapshot), { merge: true })
  })
  const current = await getDoc(itemRef)
  return { ...(current.data() as ManualShoppingItem), itemId, type: 'manual' }
}

export async function setItemPurchased(uid: string, weekId: string, itemId: string, isPurchased: boolean): Promise<void> {
  const db = await requireDb()
  const listRef = listReference(db, uid, weekId)
  const itemRef = doc(itemsReference(listRef), itemId)
  await runTransaction(db, async (transaction) => {
    const [itemSnapshot, listSnapshot] = await Promise.all([transaction.get(itemRef), transaction.get(listRef)])
    if (!itemSnapshot.exists()) throw new Error('This shopping item is no longer available.')
    transaction.update(itemRef, { isPurchased, updatedAt: serverTimestamp() })
    transaction.set(listRef, listMetadata(weekId, listSnapshot), { merge: true })
  })
}

export async function removeShoppingItem(uid: string, weekId: string, itemId: string): Promise<void> {
  const db = await requireDb()
  const listRef = listReference(db, uid, weekId)
  const itemRef = doc(itemsReference(listRef), itemId)
  await runTransaction(db, async (transaction) => {
    const [itemSnapshot, listSnapshot] = await Promise.all([transaction.get(itemRef), transaction.get(listRef)])
    if (!itemSnapshot.exists()) throw new Error('This shopping item is no longer available.')
    transaction.delete(itemRef)
    transaction.set(listRef, listMetadata(weekId, listSnapshot), { merge: true })
  })
}
