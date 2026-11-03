import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './providers/AuthProvider'
import { ThemeProvider } from './providers/ThemeProvider'
import { AppRouter } from './router/AppRouter'

export default function App() {
  return <ThemeProvider><AuthProvider><BrowserRouter><AppRouter /></BrowserRouter></AuthProvider></ThemeProvider>
}
