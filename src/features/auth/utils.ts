export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function validatePassword(value: string): string | undefined {
  if (value.length < 8) return 'Use at least 8 characters.'
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) return 'Include an uppercase letter, a lowercase letter, and a number.'
  return undefined
}
