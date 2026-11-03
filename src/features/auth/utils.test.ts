import { describe, expect, it } from 'vitest'
import { isValidEmail, validatePassword } from './utils'

describe('authentication form validation', () => {
  it('accepts ordinary email addresses and rejects malformed values', () => {
    expect(isValidEmail('cook@example.com')).toBe(true)
    expect(isValidEmail(' cook@example.co ')).toBe(true)
    expect(isValidEmail('cook@')).toBe(false)
    expect(isValidEmail('not an email')).toBe(false)
  })

  it('requires a long mixed-case password containing a number', () => {
    expect(validatePassword('short1A')).toContain('8 characters')
    expect(validatePassword('lowercase123')).toContain('uppercase')
    expect(validatePassword('StrongPass1')).toBeUndefined()
  })
})
