import styles from '../LandingPage.module.css'

const meals = [['MON', 'Tomato & white bean stew', 'Dinner'], ['TUE', 'Lemony greens & grains', 'Dinner'], ['WED', 'A little room to decide', 'Open']]
const groceries = [['Cherry tomatoes', '4 cups'], ['White beans', '2 cans'], ['Baby spinach', '1 bunch']]

export function AppPreview() {
  return <section className={styles.previewSection} id="preview"><div className={styles.previewIntro}><span className={styles.eyebrow}>A peek at what’s ahead</span><h2>Your week,<br /><em>in good order.</em></h2><p>A considered little space for the recipes and ingredients that make a week yours.</p></div><div className={styles.previewMock}><div className={styles.mockTop}><div><span className={styles.mockKicker}>YOUR MEAL PLAN</span><strong>A week to look forward to</strong></div><span className={styles.mockWeek}>MON — SUN</span></div><div className={styles.mockDays}>{meals.map(([day, meal, kind]) => <div key={day}><small>{day}</small><strong>{meal}</strong><span>{kind}</span></div>)}</div><div className={styles.mockList}><div><span className={styles.mockKicker}>SHOPPING LIST</span><span>For the week ahead</span></div><ul>{groceries.map(([ingredient, amount]) => <li key={ingredient}>{ingredient}<span>{amount}</span></li>)}</ul><small className={styles.mockDisclaimer}>A preview of the planning experience</small></div></div></section>
}
