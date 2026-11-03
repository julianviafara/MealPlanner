const errorMessages: Record<string, string> = {
  'auth/email-already-in-use': 'An account already uses this email address.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/invalid-credential': 'That email and password combination was not recognized.',
  'auth/user-disabled': 'This account has been disabled. Contact support for help.',
  'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
  'auth/network-request-failed': 'A network error occurred. Check your connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Wait a little while, then try again.',
  'auth/requires-recent-login': 'For your security, sign in again before changing your email.',
  'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow popups and try again.',
  'auth/popup-closed-by-user': 'The Google sign-in window was closed before it finished.',
  'auth/cancelled-popup-request': 'The Google sign-in request was cancelled.',
  'auth/account-exists-with-different-credential': 'An account already exists with this email using another sign-in method.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled in the Firebase Console.',
  'auth/unauthorized-domain': 'This domain is not authorized in the Firebase Console.',
  'permission-denied': 'Firebase denied access. Check the deployed Firestore rules for this account.',
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error && 'code' in error && typeof error.code === 'string') {
    return errorMessages[error.code] ?? error.message
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}
