import { forwardRef, type InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }
export const Input = forwardRef<HTMLInputElement, Props>(function Input({ id, label, error, hint, className = '', ...props }, ref) {
  const inputId = id ?? props.name
  const messageId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
  return <div className={styles.field}><label className={styles.label} htmlFor={inputId}>{label}</label><input ref={ref} id={inputId} className={`${styles.input} ${error ? styles.invalid : ''} ${className}`} aria-invalid={Boolean(error)} aria-describedby={messageId} {...props} />{error && <span className={styles.error} id={messageId}>{error}</span>}{!error && hint && <span className={styles.hint} id={messageId}>{hint}</span>}</div>
})
