import styles from './Logo.module.css'
import { Link } from 'react-router-dom'
export function Logo({ light = false }: { light?: boolean }) {
  return <Link className={`${styles.brand} ${light ? styles.light : ''}`} to="/" aria-label="MealPlanner home"><span className={styles.mark}>M</span><span>meal<span>planner</span></span></Link>
}
