import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Card.module.css'
export function Card({ children, className = '', ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return <section className={`${styles.card} ${className}`} {...props}>{children}</section>
}
