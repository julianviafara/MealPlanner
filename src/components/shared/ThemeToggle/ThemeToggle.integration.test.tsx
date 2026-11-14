import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ThemeProvider } from '../../../app/providers/ThemeProvider'
import { ThemeToggle } from './ThemeToggle'

afterEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

describe('theme preference interaction', () => {
  it('persists a selected theme and restores it on the next provider mount', async () => {
    localStorage.setItem('mealplanner-theme', 'light')
    const first = render(<ThemeProvider><ThemeToggle /></ThemeProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }))
    await waitFor(() => expect(localStorage.getItem('mealplanner-theme')).toBe('dark'))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    first.unmount()

    render(<ThemeProvider><ThemeToggle /></ThemeProvider>)
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument()
  })
})
