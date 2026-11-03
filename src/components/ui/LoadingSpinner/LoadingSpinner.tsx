import styles from './LoadingSpinner.module.css'
export function LoadingSpinner({ label = 'Loading' }: { label?: string }) {
  return <span className={styles.spinnerWrap} role="status"><span className={styles.spinner} aria-hidden="true" /><span>{label}</span></span>
}
