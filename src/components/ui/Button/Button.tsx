import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: 'primary' | 'secondary' | 'quiet'; fullWidth?: boolean }
export function Button({ children, variant = 'primary', fullWidth, className = '', ...props }: Props) {
  return <button className={`${styles.button} ${styles[variant]} ${fullWidth ? styles.fullWidth : ''} ${className}`} {...props}>{children}</button>
}
