import { describe, expect, it } from 'vitest'
import { getAuthErrorMessage } from './authErrors'

describe('Firebase auth errors', () => {
  it('turns common authentication failures into actionable messages', () => {
    expect(getAuthErrorMessage(Object.assign(new Error('Firebase error'), { code: 'auth/email-already-in-use' })))
      .toBe('An account already uses this email address.')
    expect(getAuthErrorMessage(Object.assign(new Error('Firebase error'), { code: 'auth/unauthorized-domain' })))
      .toContain('not authorized in the Firebase Console')
  })

  it('retains a useful fallback message for unknown errors', () => {
    expect(getAuthErrorMessage(new Error('Connection failed'))).toBe('Connection failed')
    expect(getAuthErrorMessage('unknown')).toBe('Something went wrong. Please try again.')
  })
})
