import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '../../../components/ui/Input/Input'
import styles from '../pages/AuthForms.module.css'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string; error?: string; hint?: string }
export function PasswordField(props: Props) {
  const [visible, setVisible] = useState(false)
  return <div className={styles.passwordWrap}><div><Input {...props} type={visible ? 'text' : 'password'} /></div><button className={styles.reveal} type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Hide password' : 'Show password'}><span>{visible ? 'Hide' : 'Show'}</span>{visible ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}</button></div>
}
