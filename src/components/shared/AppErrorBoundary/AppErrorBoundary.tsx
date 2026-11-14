import { Component, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import styles from './AppErrorBoundary.module.css'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <main className={styles.page}><section className={styles.card} aria-labelledby="app-error-title" role="alert">
        <span className={styles.eyebrow}>A SMALL PAUSE</span>
        <h1 id="app-error-title">Something didn’t load as expected.</h1>
        <p>Your saved information hasn’t been changed. Reload MealPlanner to try again.</p>
        <button type="button" onClick={() => window.location.reload()}><RotateCcw size={16} aria-hidden="true" />Reload MealPlanner</button>
      </section></main>
    }
    return this.props.children
  }
}
