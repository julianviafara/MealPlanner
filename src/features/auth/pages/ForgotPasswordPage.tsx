import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { getAuthErrorMessage } from '../services/authErrors'
import { Button } from '../../../components/ui/Button/Button'
import { Input } from '../../../components/ui/Input/Input'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner/LoadingSpinner'
import { AuthFrame } from '../components/AuthFrame'
import { isValidEmail } from '../utils'
import styles from './AuthForms.module.css'

export function ForgotPasswordPage() {
  const { resetPassword, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('')
    if (!isValidEmail(email)) { setError('Enter a valid email address.'); return }
    setLoading(true)
    try { await resetPassword(email.trim()); setMessage('If an account uses that address, a password reset email is on its way.') }
    catch (failure) { setError(getAuthErrorMessage(failure)) }
    finally { setLoading(false) }
  }
  return <AuthFrame title="A fresh start." subtitle="We’ll send a reset link if an account matches your email." footer={<>Remembered it? <Link className={styles.buttonText} to="/login">Back to log in</Link></>}>
    {!configured && <p className={styles.configNotice}><strong>Firebase setup needed</strong>Add your Firebase project values to <code>.env.local</code> before sending reset emails.</p>}
    <form className={styles.form} onSubmit={submit} noValidate><Input label="Email address" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} error={error && !message ? error : undefined} required />{message && <p className={`${styles.message} ${styles.success}`} role="status">{message}</p>}<Button fullWidth type="submit" disabled={loading}>{loading ? <LoadingSpinner label="Sending link" /> : 'Send reset link'}</Button></form>
  </AuthFrame>
}
