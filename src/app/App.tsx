import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './providers/AuthProvider'
import { ThemeProvider } from './providers/ThemeProvider'
import { AppRouter } from './router/AppRouter'
import { AppErrorBoundary } from '../components/shared/AppErrorBoundary/AppErrorBoundary'

export default function App() {
  return <AppErrorBoundary><ThemeProvider><AuthProvider><BrowserRouter><AppRouter /></BrowserRouter></AuthProvider></ThemeProvider></AppErrorBoundary>
}
