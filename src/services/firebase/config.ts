import { getApp, getApps, initializeApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean)
export const firebaseApp = firebaseConfigured
  ? getApps().length ? getApp() : initializeApp(firebaseConfig)
  : null

let authInstance: Auth | undefined
let firestoreInstance: Firestore | undefined

export async function getFirebaseAuth(): Promise<Auth | null> {
  if (!firebaseApp) return null
  if (!authInstance) {
    const { getAuth } = await import('firebase/auth')
    authInstance = getAuth(firebaseApp)
  }
  return authInstance
}

export async function getFirebaseFirestore(): Promise<Firestore | null> {
  if (!firebaseApp) return null
  if (!firestoreInstance) {
    const { getFirestore } = await import('firebase/firestore')
    firestoreInstance = getFirestore(firebaseApp)
  }
  return firestoreInstance
}
