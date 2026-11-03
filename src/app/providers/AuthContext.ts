import { createContext } from 'react'
import type { User } from 'firebase/auth'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'unconfigured'
export type AuthContextValue = {
  user: User | null
  status: AuthStatus
  loading: boolean
  configured: boolean
  register: (name: string, email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<boolean>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  saveDisplayName: (name: string) => Promise<void>
  saveEmail: (email: string, password?: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
