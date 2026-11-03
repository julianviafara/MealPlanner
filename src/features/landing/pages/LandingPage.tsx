import { AppPreview } from '../components/AppPreview'
import { CallToAction } from '../components/CallToAction'
import { FeaturesSection } from '../components/FeaturesSection'
import { Footer } from '../components/Footer'
import { HeroSection } from '../components/HeroSection'
import { HowItWorks } from '../components/HowItWorks'
import { LandingNavbar } from '../components/LandingNavbar'
import styles from '../LandingPage.module.css'

export function LandingPage() {
  return <div className={styles.site}><LandingNavbar /><main id="top"><HeroSection /><HowItWorks /><FeaturesSection /><AppPreview /><CallToAction /></main><Footer /></div>
}
