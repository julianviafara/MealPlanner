import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BookOpen, CalendarDays, Heart, LogOut, Menu, ShoppingBasket, UserRound, X } from 'lucide-react'
import { useAuth } from '../../app/providers/useAuth'
import { getAuthErrorMessage } from '../../features/auth/services/authErrors'
import { Logo } from '../../components/shared/Logo/Logo'
import { ThemeToggle } from '../../components/shared/ThemeToggle/ThemeToggle'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [error, setError] = useState('')
  async function signOut() {
    setError('')
    try { await logout(); navigate('/', { replace: true }) }
    catch (failure) { setError(getAuthErrorMessage(failure)) }
  }
  const closeMenu = () => setMenuOpen(false)
  return <div className={`${styles.shell} ${menuOpen ? styles.menuOpen : ''}`}>
    <aside className={styles.sidebar}><Logo /><span className={styles.sidebarLabel}>YOUR SPACE</span><nav aria-label="Application navigation"><NavLink to="/dashboard" onClick={closeMenu} className={({ isActive }) => isActive ? styles.active : ''}><CalendarDays size={17} aria-hidden="true" />Dashboard</NavLink><NavLink to="/planner" onClick={closeMenu} className={({ isActive }) => isActive ? styles.active : ''}><CalendarDays size={17} aria-hidden="true" />Planner</NavLink><NavLink to="/recipes" onClick={closeMenu} className={({ isActive }) => isActive ? styles.active : ''}><BookOpen size={17} aria-hidden="true" />Recipes</NavLink><NavLink to="/favorites" onClick={closeMenu} className={({ isActive }) => isActive ? styles.active : ''}><Heart size={17} aria-hidden="true" />Favourites</NavLink><span className={styles.futureNav} aria-disabled="true"><ShoppingBasket size={17} aria-hidden="true" />Shopping list<small>SOON</small></span><NavLink to="/profile" onClick={closeMenu} className={({ isActive }) => isActive ? styles.active : ''}><UserRound size={17} aria-hidden="true" />Your profile</NavLink></nav><div className={styles.sidebarBottom}><ThemeToggle /><button className={styles.logout} type="button" onClick={signOut}><LogOut size={16} aria-hidden="true" />Log out</button></div></aside>
    <div className={styles.mainColumn}><header className={styles.topbar}><div className={styles.mobileBrand}><Logo /><button type="button" className={styles.mobileMenuButton} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button></div><div className={styles.userTools}><ThemeToggle /><NavLink to="/profile" className={styles.userChip}><span>{user?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'M'}</span>{user?.displayName || user?.email}</NavLink><button className={styles.logoutMobile} type="button" onClick={signOut} aria-label="Log out"><LogOut size={17} /></button></div></header>{error && <p className={styles.error} role="alert">{error}</p>}<main className={styles.content}><Outlet /></main></div>
    {menuOpen && <button className={styles.backdrop} aria-label="Close navigation" onClick={closeMenu} />}
  </div>
}
