import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { ThemeProvider } from '../providers/ThemeProvider'
import { useAuth } from '../providers/useAuth'
import { AppRouter } from './AppRouter'

vi.mock('../providers/useAuth', () => ({ useAuth: vi.fn() }))

const mockUseAuth = vi.mocked(useAuth)
const authValue = (status: 'loading' | 'authenticated' | 'unauthenticated' | 'unconfigured', user: User | null) => ({
  status, user, loading: status === 'loading', configured: status !== 'unconfigured',
  register: vi.fn(async () => undefined), login: vi.fn(async () => undefined),
  loginWithGoogle: vi.fn(async () => false), logout: vi.fn(async () => undefined),
  resetPassword: vi.fn(async () => undefined), saveDisplayName: vi.fn(async () => undefined),
  saveEmail: vi.fn(async () => undefined),
}) as ReturnType<typeof useAuth>

function renderPath(path: string) {
  return render(<ThemeProvider><MemoryRouter initialEntries={[path]}><AppRouter /></MemoryRouter></ThemeProvider>)
}

afterEach(() => { cleanup(); vi.clearAllMocks(); localStorage.clear() })

describe('application route guards', () => {
  it('sends unauthenticated visitors from a private page to login', async () => {
    mockUseAuth.mockReturnValue(authValue('unauthenticated', null))
    renderPath('/profile')
    expect(await screen.findByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument()
  })

  it('protects the weekly planner route with the existing auth redirect', async () => {
    mockUseAuth.mockReturnValue(authValue('unauthenticated', null))
    renderPath('/planner')
    expect(await screen.findByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument()
  })

  it('sends authenticated visitors away from the login page to the dashboard', async () => {
    const user = { uid: 'user-1', displayName: 'Julian', email: 'julian@example.com' } as User
    mockUseAuth.mockReturnValue(authValue('authenticated', user))
    renderPath('/login')
    expect(await screen.findByRole('heading', { name: 'Welcome, Julian.' })).toBeInTheDocument()
  })

  it('waits for the auth listener before resolving a private route', async () => {
    mockUseAuth.mockReturnValue(authValue('loading', null))
    renderPath('/dashboard')
    expect(await screen.findByRole('status')).toHaveTextContent('Getting your space ready')
    expect(screen.queryByRole('heading', { name: 'Welcome back.' })).not.toBeInTheDocument()
  })

  it('shows registration validation and the missing Firebase setup notice', async () => {
    mockUseAuth.mockReturnValue(authValue('unconfigured', null))
    renderPath('/register')
    expect(await screen.findByText('Firebase setup needed')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Create account$/ }))
    expect(await screen.findByText('Enter your name (at least 2 characters).')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
  })

  it('validates login inputs before calling Firebase', async () => {
    const context = authValue('unconfigured', null)
    mockUseAuth.mockReturnValue(context)
    renderPath('/login')
    fireEvent.click(await screen.findByRole('button', { name: /^Log in$/ }))
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()
    expect(context.login).not.toHaveBeenCalled()
  })
})
