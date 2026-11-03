import { Link } from 'react-router-dom'
import styles from '../LandingPage.module.css'

export function CallToAction() {
  return <section className={styles.ctaSection}><div className={styles.ctaInner}><span className={styles.eyebrow}>The table is waiting</span><h2>Make your next week<br /><em>a little more delicious.</em></h2><p>Start with a recipe. See where the week takes you.</p><Link className={styles.buttonLight} to="/register">Get started for free</Link></div></section>
}
