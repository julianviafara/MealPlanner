import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { getFirebaseFirestore } from './config'

export type UserProfile = {
  uid: string
  displayName: string
  email: string
  provider: string
  createdAt?: unknown
  updatedAt?: unknown
}

async function requireDb() {
  const db = await getFirebaseFirestore()
  if (!db) throw new Error('Firebase is not configured. Add the Firebase values to .env.local.')
  return db
}

function profileFromUser(user: User): UserProfile {
  return {
    uid: user.uid,
    displayName: user.displayName ?? '',
    email: user.email ?? '',
    provider: user.providerData[0]?.providerId ?? 'password',
  }
}

export async function createProfileIfMissing(user: User): Promise<void> {
  const firestore = await requireDb()
  const ref = doc(firestore, 'users', user.uid)
  const existing = await getDoc(ref)
  if (existing.exists()) return
  await setDoc(ref, { ...profileFromUser(user), createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(await requireDb(), 'users', uid))
  return snapshot.exists() ? snapshot.data() as UserProfile : null
}

export async function updateUserProfile(user: User, fields: Partial<Pick<UserProfile, 'displayName' | 'email'>>): Promise<void> {
  const ref = doc(await requireDb(), 'users', user.uid)
  await setDoc(ref, { ...profileFromUser(user), ...fields, updatedAt: serverTimestamp() }, { merge: true })
}

export async function ensureProfileForNewAccount(user: User): Promise<void> {
  const firestore = await requireDb()
  await setDoc(doc(firestore, 'users', user.uid), {
    ...profileFromUser(user), createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
}

