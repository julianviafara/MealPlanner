import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Globe2 } from 'lucide-react'
import { useAuth } from '../../../app/providers/useAuth'
import { getAuthErrorMessage } from '../services/authErrors'
import { Button } from '../../../components/ui/Button/Button'
import { Input } from '../../../components/ui/Input/Input'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner/LoadingSpinner'
import { AuthFrame } from '../components/AuthFrame'
import { PasswordField } from '../components/PasswordField'
import { isValidEmail, validatePassword } from '../utils'
import styles from './AuthForms.module.css'

export function RegisterPage() {
  const { register, loginWithGoogle, configured } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (name.trim().length < 2) next.name = 'Enter your name (at least 2 characters).'
    if (!isValidEmail(email)) next.email = 'Enter a valid email address.'
    const passwordError = validatePassword(password)
    if (passwordError) next.password = passwordError
    if (confirm !== password) next.confirm = 'Your passwords do not match.'
    setErrors(next)
    setMessage('')
    if (Object.keys(next).length) return
    setLoading(true)
    try { await register(name.trim(), email.trim(), password); navigate('/dashboard', { replace: true }) }
    catch (error) { setMessage(getAuthErrorMessage(error)) }
    finally { setLoading(false) }
  }

  async function google() {
    setLoading(true); setMessage('')
    try { if (await loginWithGoogle()) navigate('/dashboard', { replace: true }) }
    catch (error) { setMessage(getAuthErrorMessage(error)) }
    finally { setLoading(false) }
  }

  return <AuthFrame title="Join us at the table." subtitle="A little more ease starts with an account." footer={<>Already have an account? <Link className={styles.buttonText} to="/login">Log in</Link></>}>
    {!configured && <p className={styles.configNotice}><strong>Firebase setup needed</strong>Add the four VITE_FIREBASE values from your Firebase project to a local <code>.env.local</code> file, then restart Vite.</p>}
    <form className={styles.form} onSubmit={submit} noValidate>
      <Input label="Display name" name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} error={errors.name} required />
      <Input label="Email address" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} required />
      <PasswordField label="Password" name="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} required />
      <span className={styles.passwordNote}>At least 8 characters with a number and mixed case.</span>
      <PasswordField label="Confirm password" name="confirm" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} error={errors.confirm} required />
      {message && <p className={styles.message} role="alert">{message}</p>}
      <Button fullWidth type="submit" disabled={loading}>{loading ? <LoadingSpinner label="Creating account" /> : 'Create account'}</Button>
      <div className={styles.divider}>or</div>
      <button className={styles.google} type="button" onClick={google} disabled={loading}><Globe2 size={16} className={styles.googleIcon} aria-hidden="true" />Continue with Google</button>
    </form>
  </AuthFrame>
}
