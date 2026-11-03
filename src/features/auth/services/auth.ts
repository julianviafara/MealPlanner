import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateEmail,
  updateProfile,
  type User,
} from 'firebase/auth'
import { createProfileIfMissing, ensureProfileForNewAccount, updateUserProfile } from '../../../services/firebase/firestore'
import { getFirebaseAuth } from '../../../services/firebase/config'

async function requireAuth() {
  const auth = await getFirebaseAuth()
  if (!auth) throw new Error('Firebase is not configured. Add the Firebase values to .env.local.')
  return auth
}

export async function registerWithEmail(displayName: string, email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(await requireAuth(), email, password)
  await updateProfile(credential.user, { displayName })
  await ensureProfileForNewAccount(credential.user)
  return credential.user
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(await requireAuth(), email, password)
  return result.user
}

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(await requireAuth(), new GoogleAuthProvider())
    await createProfileIfMissing(result.user)
    return result.user
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'auth/popup-closed-by-user') return null
    throw error
  }
}

export async function logout(): Promise<void> {
  await signOut(await requireAuth())
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(await requireAuth(), email)
}

export async function updateDisplayName(user: User, displayName: string): Promise<void> {
  await updateProfile(user, { displayName })
  await updateUserProfile(user, { displayName })
}

export async function updateEmailAddress(user: User, email: string, password?: string): Promise<void> {
  await requireAuth()
  if (user.email === email) {
    await updateUserProfile(user, { email })
    return
  }
  const providerIds = user.providerData.map(({ providerId }) => providerId)
  if (providerIds.includes('password')) {
    if (!user.email || !password) throw new Error('Enter your current password to change your email address.')
    const credential = EmailAuthProvider.credential(user.email, password)
    await reauthenticateWithCredential(user, credential)
  } else if (providerIds.includes('google.com')) {
    await reauthenticateWithPopup(user, new GoogleAuthProvider())
  } else {
    throw new Error('This sign-in provider does not support email changes here. Contact support for help.')
  }
  await updateEmail(user, email)
  await user.getIdToken(true)
  try {
    await updateUserProfile(user, { email })
  } catch {
    throw new Error('Firebase Authentication updated your email, but your Firestore profile could not be synchronized. Save again to retry the profile sync.')
  }
}

