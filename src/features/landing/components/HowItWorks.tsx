import styles from '../LandingPage.module.css'

const steps = [
  { number: '01', image: 'photo-1490645935967-10de6ba17061', alt: 'A table of vibrant ingredients and prepared dishes', title: 'Find something lovely', text: 'Explore a thoughtful collection of recipes and save the ones you want to make.' },
  { number: '02', image: 'photo-1512621776951-a57141f2eefd', alt: 'A colorful prepared meal ready for the week', title: 'Shape your week', text: 'Drop recipes into the days ahead. Leave space for leftovers, plans, and life.' },
  { number: '03', image: 'photo-1543168256-418811576931', alt: 'Fresh produce ready to take home from the market', title: 'Shop with a list', text: 'See the ingredients you’ll need in one tidy list, ready for your next shop.' },
]

export function HowItWorks() {
  return <><section className={styles.introBand}><p>LESS THINKING ABOUT WHAT'S FOR DINNER.<br /><span>MORE TIME ENJOYING IT.</span></p><div className={styles.introRule} /><p>Simple plans for the everyday table.</p></section><section className={styles.stepsSection} id="how-it-works"><div className={styles.sectionHeading}><span className={styles.eyebrow}>A good week starts here</span><h2>Three small steps.<br /><em>A much lighter week.</em></h2></div><div className={styles.stepsGrid}>{steps.map((step) => <article className={styles.stepCard} key={step.number}><span className={styles.stepNumber}>{step.number}</span><div className={styles.stepImage}><img src={`https://images.unsplash.com/${step.image}?auto=format&fit=crop&w=700&q=80`} alt={step.alt} /></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></section></>
}
