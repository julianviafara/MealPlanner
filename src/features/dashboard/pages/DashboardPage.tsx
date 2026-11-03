import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, ShoppingBasket, UserRound } from 'lucide-react'
import { useAuth } from '../../../app/providers/useAuth'
import { Card } from '../../../components/ui/Card/Card'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const { user } = useAuth()
  const name = user?.displayName?.trim().split(/\s+/)[0] || 'there'
  return <div className={styles.page}><div className={styles.heading}><span className={styles.eyebrow}>YOUR MEALPLANNER</span><h1>Welcome, {name}.</h1><p>A little more ease around the table starts here.</p></div><div className={styles.grid}><Card className={styles.panel}><div className={styles.panelHeading}><span className={styles.icon}><CalendarDays size={19} aria-hidden="true" /></span><span className={styles.tag}>COMING SOON</span></div><h2>Your week, at a glance</h2><p>Your weekly meal planner will give recipes and everyday plans a place to land.</p><div className={styles.weekPreview}><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div><div className={styles.emptyNotice}>Your week is ready when you are.</div></Card><Card className={styles.panel}><div className={styles.panelHeading}><span className={styles.icon}><ShoppingBasket size={19} aria-hidden="true" /></span><span className={styles.tag}>COMING SOON</span></div><h2>Shopping list</h2><p>Ingredients from your planned meals will come together here.</p><div className={styles.listPreview}><span /><span /><span /></div><div className={styles.emptyNotice}>Your list will follow your meal plan.</div></Card></div><Card className={styles.profileCard}><span className={styles.icon}><UserRound size={18} aria-hidden="true" /></span><div><h2>Make yourself at home</h2><p>Keep your account details up to date.</p></div><Link to="/profile">Your profile <ArrowRight size={15} aria-hidden="true" /></Link></Card><p className={styles.phaseNote}>Your dashboard is an early preview. Meal planning and shopping list features are planned for a future phase.</p></div>
}
