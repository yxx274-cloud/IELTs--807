import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import AuthGuard from './components/AuthGuard'
import HomePage from './pages/HomePage'
import CategoryPage from './pages/CategoryPage'
import ModeSelectPage from './pages/ModeSelectPage'
import PracticePage from './pages/PracticePage'
import WrongBookPage from './pages/WrongBookPage'
import ReviewPage from './pages/ReviewPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import LeaderboardPage from './pages/LeaderboardPage'
import FriendsPage from './pages/FriendsPage'
import { useSettingsStore } from './stores/useSettingsStore'
import { useAuthStore } from './stores/useAuthStore'
import { isSupabaseConfigured } from './lib/supabase'

function DarkModeManager() {
  const darkMode = useSettingsStore(s => s.darkMode)

  useEffect(() => {
    const root = document.documentElement
    if (darkMode === 'dark') {
      root.classList.add('dark')
    } else if (darkMode === 'light') {
      root.classList.remove('dark')
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        root.classList.toggle('dark', e.matches)
      }
      root.classList.toggle('dark', mq.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [darkMode])

  return null
}

function AuthInitializer() {
  const initialize = useAuthStore(s => s.initialize)

  useEffect(() => {
    if (isSupabaseConfigured) {
      initialize()
    }
  }, [initialize])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <DarkModeManager />
      <AuthInitializer />
      <Routes>
        {/* Login page - always accessible */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route element={<AuthGuard />}>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="categories" element={<CategoryPage />} />
            <Route path="practice/:categoryId" element={<ModeSelectPage />} />
            <Route path="practice/:categoryId/go" element={<PracticePage />} />
            <Route path="wrong-book" element={<WrongBookPage />} />
            <Route path="review" element={<ReviewPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="friends" element={<FriendsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
