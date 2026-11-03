import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/useAuth'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner/LoadingSpinner'
import { PublicLayout } from '../../layouts/PublicLayout/PublicLayout'
import { AppLayout } from '../../layouts/AppLayout/AppLayout'
import { LandingPage } from '../../features/landing/pages/LandingPage'
import styles from './AppRouter.module.css'

const LoginPage = lazy(() => import('../../features/auth/pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('../../features/auth/pages/RegisterPage').then((module) => ({ default: module.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('../../features/auth/pages/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })))
const DashboardPage = lazy(() => import('../../features/dashboard/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const ProfilePage = lazy(() => import('../../features/profile/pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))

function RouteLoading() {
  return <div className={styles.loading}><LoadingSpinner label="Getting your space ready" /></div>
}

function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <RouteLoading />
  if (status !== 'authenticated') return <Navigate to="/login" replace state={{ from: { pathname: location.pathname } }} />
  return <Outlet />
}

function GuestOnly() {
  const { status } = useAuth()
  if (status === 'loading') return <RouteLoading />
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export function AppRouter() {
  return <Suspense fallback={<RouteLoading />}><Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<LandingPage />} />
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    </Route>
    <Route element={<RequireAuth />}><Route element={<AppLayout />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>
}
