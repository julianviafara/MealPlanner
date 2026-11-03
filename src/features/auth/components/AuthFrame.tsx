import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../../../components/shared/Logo/Logo'
import { ThemeToggle } from '../../../components/shared/ThemeToggle/ThemeToggle'
import styles from './AuthFrame.module.css'

export function AuthFrame({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return <main className={styles.page}><header className={styles.header}><Logo /><ThemeToggle /></header><section className={styles.content}><div className={styles.intro}><span>MEALPLANNER</span><h1>{title}</h1><p>{subtitle}</p></div><div className={styles.formCard}>{children}{footer && <div className={styles.footer}>{footer}</div>}</div><Link className={styles.homeLink} to="/">Return to MealPlanner</Link></section></main>
}
