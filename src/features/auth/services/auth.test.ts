import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from 'firebase/auth'

const mocks = vi.hoisted(() => ({
  createUser: vi.fn(), updateProfile: vi.fn(), signInEmail: vi.fn(), signInPopup: vi.fn(), signOut: vi.fn(),
  resetPassword: vi.fn(), updateEmail: vi.fn(), reauthCredential: vi.fn(), reauthPopup: vi.fn(),
  credential: vi.fn(), getAuth: vi.fn(async () => ({ currentUser: null })),
  createProfileIfMissing: vi.fn(), ensureProfileForNewAccount: vi.fn(), updateUserProfile: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: mocks.createUser,
  updateProfile: mocks.updateProfile,
  signInWithEmailAndPassword: mocks.signInEmail,
  signInWithPopup: mocks.signInPopup,
  signOut: mocks.signOut,
  sendPasswordResetEmail: mocks.resetPassword,
  updateEmail: mocks.updateEmail,
  reauthenticateWithCredential: mocks.reauthCredential,
  reauthenticateWithPopup: mocks.reauthPopup,
  EmailAuthProvider: { credential: mocks.credential },
  GoogleAuthProvider: class GoogleAuthProvider {},
}))
vi.mock('../../../services/firebase/config', () => ({ getFirebaseAuth: mocks.getAuth }))
vi.mock('../../../services/firebase/firestore', () => ({
  createProfileIfMissing: mocks.createProfileIfMissing,
  ensureProfileForNewAccount: mocks.ensureProfileForNewAccount,
  updateUserProfile: mocks.updateUserProfile,
}))

import { loginWithEmail, loginWithGoogle, logout, registerWithEmail, requestPasswordReset, updateEmailAddress } from './auth'

const passwordUser = {
  uid: 'user-1', email: 'cook@example.com', displayName: 'Cook',
  providerData: [{ providerId: 'password' }], getIdToken: vi.fn(async () => 'token'),
} as unknown as User

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getAuth.mockResolvedValue({ currentUser: null })
  mocks.credential.mockReturnValue({ providerId: 'password' })
})

describe('Firebase auth service', () => {
  it('creates an email account, sets its display name, and writes a profile', async () => {
    mocks.createUser.mockResolvedValue({ user: passwordUser })
    await registerWithEmail('Cook', 'cook@example.com', 'StrongPass1')
    expect(mocks.createUser).toHaveBeenCalledWith(expect.any(Object), 'cook@example.com', 'StrongPass1')
    expect(mocks.updateProfile).toHaveBeenCalledWith(passwordUser, { displayName: 'Cook' })
    expect(mocks.ensureProfileForNewAccount).toHaveBeenCalledWith(passwordUser)
  })

  it('uses the email login method and requests password-reset mail', async () => {
    mocks.signInEmail.mockResolvedValue({ user: passwordUser })
    await expect(loginWithEmail('cook@example.com', 'StrongPass1')).resolves.toBe(passwordUser)
    await requestPasswordReset('cook@example.com')
    expect(mocks.resetPassword).toHaveBeenCalledWith(expect.any(Object), 'cook@example.com')
  })

  it('creates a profile only when Google sign-in finds a first-time user', async () => {
    mocks.signInPopup.mockResolvedValue({ user: passwordUser })
    await expect(loginWithGoogle()).resolves.toBe(passwordUser)
    expect(mocks.createProfileIfMissing).toHaveBeenCalledWith(passwordUser)
  })

  it('reauthenticates with the current password before changing email and syncing Firestore', async () => {
    await updateEmailAddress(passwordUser, 'new@example.com', 'StrongPass1')
    expect(mocks.credential).toHaveBeenCalledWith('cook@example.com', 'StrongPass1')
    expect(mocks.reauthCredential).toHaveBeenCalledWith(passwordUser, expect.any(Object))
    expect(mocks.updateEmail).toHaveBeenCalledWith(passwordUser, 'new@example.com')
    expect(passwordUser.getIdToken).toHaveBeenCalledWith(true)
    expect(mocks.updateUserProfile).toHaveBeenCalledWith(passwordUser, { email: 'new@example.com' })
  })

  it('supports logout through Firebase Auth', async () => {
    await logout()
    expect(mocks.signOut).toHaveBeenCalledWith(expect.any(Object))
  })
})
