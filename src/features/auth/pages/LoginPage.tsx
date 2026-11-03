import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Globe2 } from 'lucide-react'
import { useAuth } from '../../../app/providers/useAuth'
import { getAuthErrorMessage } from '../services/authErrors'
import { Button } from '../../../components/ui/Button/Button'
import { Input } from '../../../components/ui/Input/Input'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner/LoadingSpinner'
import { AuthFrame } from '../components/AuthFrame'
import { PasswordField } from '../components/PasswordField'
import { isValidEmail } from '../utils'
import styles from './AuthForms.module.css'

type LoginLocationState = { from?: { pathname?: string } }

export function LoginPage() {
  const { login, loginWithGoogle, configured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as LoginLocationState | null)?.from?.pathname ?? '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!isValidEmail(email)) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Enter your password.'
    setErrors(next); setMessage('')
    if (Object.keys(next).length) return
    setLoading(true)
    try { await login(email.trim(), password); navigate(from, { replace: true }) }
    catch (error) { setMessage(getAuthErrorMessage(error)) }
    finally { setLoading(false) }
  }

  async function google() {
    setLoading(true); setMessage('')
    try { if (await loginWithGoogle()) navigate(from, { replace: true }) }
    catch (error) { setMessage(getAuthErrorMessage(error)) }
    finally { setLoading(false) }
  }

  return <AuthFrame title="Welcome back." subtitle="Pick up where your week left off." footer={<>New to MealPlanner? <Link className={styles.buttonText} to="/register">Create an account</Link></>}>
    {!configured && <p className={styles.configNotice}><strong>Firebase setup needed</strong>Add the four VITE_FIREBASE values from your Firebase project to <code>.env.local</code>, then restart Vite.</p>}
    <form className={styles.form} onSubmit={submit} noValidate>
      <Input label="Email address" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} required />
      <PasswordField label="Password" name="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} required />
      <Link className={styles.topLink} to="/forgot-password">Forgot password?</Link>
      {message && <p className={styles.message} role="alert">{message}</p>}
      <Button fullWidth type="submit" disabled={loading}>{loading ? <LoadingSpinner label="Signing in" /> : 'Log in'}</Button>
      <div className={styles.divider}>or</div>
      <button className={styles.google} type="button" onClick={google} disabled={loading}><Globe2 size={16} className={styles.googleIcon} aria-hidden="true" />Continue with Google</button>
    </form>
  </AuthFrame>
}
