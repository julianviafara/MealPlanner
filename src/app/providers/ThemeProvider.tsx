import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from './ThemeContext'

function getInitialTheme(): Theme {
  const saved = localStorage.getItem('mealplanner-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('mealplanner-theme', theme)
  }, [theme])
  const toggleTheme = useCallback(() => setTheme((current) => current === 'light' ? 'dark' : 'light'), [])
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
