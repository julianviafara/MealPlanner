import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../../../components/shared/Logo/Logo'
import { ThemeToggle } from '../../../components/shared/ThemeToggle/ThemeToggle'
import styles from '../LandingPage.module.css'

export function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)
  return <header className={styles.header}><Logo /><button className={styles.menuButton} type="button" aria-expanded={menuOpen} aria-controls="landing-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Close' : 'Menu'}</button><nav id="landing-navigation" className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ''}`} aria-label="Main navigation"><a href="#how-it-works" onClick={closeMenu}>How it works</a><a href="#features" onClick={closeMenu}>Features</a><a href="#preview" onClick={closeMenu}>Preview</a><div className={styles.navActions}><ThemeToggle className={styles.themeButton} /><Link className={styles.loginLink} to="/login">Log in</Link><Link className={styles.buttonSmall} to="/register">Get started</Link></div></nav></header>
}
