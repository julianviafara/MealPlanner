import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../../app/providers/useAuth'
import { getAuthErrorMessage } from '../../auth/services/authErrors'
import { Button } from '../../../components/ui/Button/Button'
import { Card } from '../../../components/ui/Card/Card'
import { Input } from '../../../components/ui/Input/Input'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner/LoadingSpinner'
import { PasswordField } from '../../auth/components/PasswordField'
import { isValidEmail } from '../../auth/utils'
import { getUserProfile, createProfileIfMissing, type UserProfile } from '../../../services/firebase/firestore'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  const { user, saveDisplayName, saveEmail } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState(user?.displayName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const requiresPassword = user?.providerData.some(({ providerId }) => providerId === 'password') ?? false

  useEffect(() => {
    let active = true
    if (!user) return () => { active = false }
    void (async () => {
      try {
        await createProfileIfMissing(user)
        const result = await getUserProfile(user.uid)
        if (!active) return
        setProfile(result)
        setName(result?.displayName || user.displayName || '')
        setEmail(user.email || result?.email || '')
      } catch (failure) {
        if (active) setError(getAuthErrorMessage(failure))
      } finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [user])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess('')
    if (!user) return
    if (name.trim().length < 2) { setError('Enter a display name with at least 2 characters.'); return }
    const emailChanged = email.trim() !== (user.email ?? '')
    if (emailChanged && !isValidEmail(email)) { setError('Enter a valid email address.'); return }
    if (emailChanged && requiresPassword && !password) { setError('Enter your current password to change your email.'); return }
    setSaving(true)
    try {
      if (name.trim() !== (user.displayName ?? '')) await saveDisplayName(name.trim())
      if (email.trim() !== (profile?.email ?? user.email ?? '')) await saveEmail(email.trim(), password || undefined)
      setProfile((current) => current ? { ...current, displayName: name.trim(), email: email.trim() } : current)
      setPassword('')
      setSuccess(emailChanged ? 'Your account email was updated.' : 'Your profile was saved.')
    } catch (failure) { setError(getAuthErrorMessage(failure)) }
    finally { setSaving(false) }
  }

  if (loading) return <div className={styles.loading}><LoadingSpinner label="Loading your profile" /></div>
  const provider = profile?.provider ?? user?.providerData[0]?.providerId ?? 'password'
  return <div className={styles.page}><div className={styles.heading}><span>ACCOUNT</span><h1>Your profile</h1><p>Manage the details connected to your MealPlanner account.</p></div><Card className={styles.card}><div className={styles.identity}><span className={styles.avatar}>{(user?.displayName?.[0] ?? user?.email?.[0] ?? 'M').toUpperCase()}</span><div><strong>{user?.displayName || 'MealPlanner member'}</strong><span>{user?.email}</span></div><small>{provider === 'password' ? 'Email and password' : 'Google account'}</small></div><form className={styles.form} onSubmit={submit} noValidate><Input label="Display name" name="displayName" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /><Input label="Email address" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />{requiresPassword && email.trim() !== (user?.email ?? '') && <PasswordField label="Current password" name="currentPassword" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} hint="Used to securely reauthenticate before changing your email." />}{!requiresPassword && email.trim() !== (user?.email ?? '') && <p className={styles.reauthNote}>Google will ask you to confirm your account before this change.</p>}{error && <p className={styles.error} role="alert">{error}</p>}{success && <p className={styles.success} role="status">{success}</p>}<Button type="submit" disabled={saving}>{saving ? <LoadingSpinner label="Saving profile" /> : 'Save changes'}</Button></form></Card></div>
}
