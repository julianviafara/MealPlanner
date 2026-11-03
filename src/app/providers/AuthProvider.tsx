import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { firebaseConfigured, getFirebaseAuth } from '../../services/firebase/config'
import type { AuthStatus } from './AuthContext'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(firebaseConfigured ? 'loading' : 'unconfigured')
  const [, setProfileRevision] = useState(0)

  useEffect(() => {
    if (!firebaseConfigured) return
    let active = true
    let unsubscribe: () => void = () => {}
    void getFirebaseAuth().then(async (auth) => {
      if (!active) return
      if (!auth) { setStatus('unconfigured'); return }
      const { onAuthStateChanged } = await import('firebase/auth')
      if (!active) return
      unsubscribe = onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser)
        setStatus(nextUser ? 'authenticated' : 'unauthenticated')
      }, () => {
        setUser(null)
        setStatus('unauthenticated')
      })
    }).catch(() => { if (active) setStatus('unauthenticated') })
    return () => { active = false; unsubscribe() }
  }, [])

  const requireUser = useCallback(() => {
    if (!user) throw new Error('Sign in to update your profile.')
    return user
  }, [user])
  const register = useCallback(async (name: string, email: string, password: string) => { const service = await import('../../features/auth/services/auth'); await service.registerWithEmail(name, email, password) }, [])
  const login = useCallback(async (email: string, password: string) => { const service = await import('../../features/auth/services/auth'); await service.loginWithEmail(email, password) }, [])
  const loginGoogle = useCallback(async () => { const service = await import('../../features/auth/services/auth'); return Boolean(await service.loginWithGoogle()) }, [])
  const logoutUser = useCallback(async () => { const service = await import('../../features/auth/services/auth'); await service.logout() }, [])
  const resetPassword = useCallback(async (email: string) => { const service = await import('../../features/auth/services/auth'); await service.requestPasswordReset(email) }, [])
  const saveDisplayName = useCallback(async (name: string) => { const service = await import('../../features/auth/services/auth'); await service.updateDisplayName(requireUser(), name); setProfileRevision((value) => value + 1) }, [requireUser])
  const saveEmail = useCallback(async (email: string, password?: string) => {
    try { const service = await import('../../features/auth/services/auth'); await service.updateEmailAddress(requireUser(), email, password) }
    finally { setProfileRevision((value) => value + 1) }
  }, [requireUser])
  const value = useMemo(() => ({
    user, status, loading: status === 'loading', configured: firebaseConfigured,
    register, login, loginWithGoogle: loginGoogle, logout: logoutUser,
    resetPassword, saveDisplayName, saveEmail,
  }), [user, status, register, login, loginGoogle, logoutUser, resetPassword, saveDisplayName, saveEmail])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
