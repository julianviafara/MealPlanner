import { Link } from 'react-router-dom'
import { Logo } from '../../../components/shared/Logo/Logo'
import styles from '../LandingPage.module.css'

const currentYear = new Date().getFullYear()

export function Footer() {
  return <footer className={styles.footer}><Logo /><p>A little more ease around the table.</p><div className={styles.footerLinks}><a href="#how-it-works">How it works</a><a href="#features">Features</a><Link to="/login">Log in</Link><Link to="/register">Create account</Link></div><small>© {currentYear} MealPlanner</small></footer>
}
