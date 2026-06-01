import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import AppLayout from './layouts/AppLayout'
import DashboardLayout from './layouts/DashboardLayout'
import AnalyticsPage from './pages/AnalyticsPage'
import CoachingPage from './pages/CoachingPage'
import DashboardPage from './pages/DashboardPage'
import GoalsPage from './pages/GoalsPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import NutritionPage from './pages/NutritionPage'
import ProfilePage from './pages/ProfilePage'
import ProgressPage from './pages/ProgressPage'
import RecoveryPage from './pages/RecoveryPage'
import RegisterPage from './pages/RegisterPage'
import SettingsPage from './pages/SettingsPage'
import SplitSelectionPage from './pages/SplitSelectionPage'
import TargetPage from './pages/TargetPage'
import TrainingPage from './pages/TrainingPage'
import ProtectedRoute from './routes/ProtectedRoute'
import { ToastProvider } from './components/Toast'

function HomeRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
}

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route index element={<HomeRoute />} />

        <Route element={<AppLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="nutrition" element={<NutritionPage />} />
            <Route path="training" element={<TrainingPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="recovery" element={<RecoveryPage />} />
            <Route path="coaching" element={<CoachingPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="target" element={<TargetPage />} />
            <Route path="splits" element={<SplitSelectionPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ToastProvider>
  )
}

export default App
