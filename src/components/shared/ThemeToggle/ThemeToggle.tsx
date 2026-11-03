import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../../app/providers/useTheme'
import styles from './ThemeToggle.module.css'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const next = theme === 'light' ? 'dark' : 'light'
  const Icon = theme === 'light' ? Moon : Sun
  return <button className={`${styles.toggle} ${className}`} type="button" onClick={toggleTheme} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}><Icon size={16} strokeWidth={1.8} aria-hidden="true" /><span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span></button>
}
