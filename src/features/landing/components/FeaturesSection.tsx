import { Link } from 'react-router-dom'
import styles from '../LandingPage.module.css'

const features = [
  ['Your week, your way', 'Add as many meals as you need. Keep the open days open.'],
  ['Recipes worth repeating', 'Find inspiration and keep your favorites close.'],
  ['A list that comes together', 'Bring your planned ingredients into one useful view.'],
]

export function FeaturesSection() {
  return <section className={styles.featureSection} id="features"><div className={styles.featureImage}><img src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=85" alt="Fresh ingredients arranged on a kitchen table" /></div><div className={styles.featureCopy}><span className={styles.eyebrow}>A little less to carry</span><h2>Planning that<br /><em>feels like you.</em></h2><p>Some weeks are full. Some are slow. MealPlanner gives your ideas a place to land, without asking every day to look the same.</p><ul>{features.map(([title, text]) => <li key={title}><span className={styles.check} aria-hidden="true" /><span><strong>{title}</strong><small>{text}</small></span></li>)}</ul><Link className={styles.textLink} to="/register">Make a plan of your own</Link></div></section>
}
