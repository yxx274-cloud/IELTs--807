import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { isSupabaseConfigured } from '../lib/supabase'

export default function AuthGuard() {
  const { user, loading, initialized } = useAuthStore()

  if (!isSupabaseConfigured) return <Outlet />

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-secondary">加载中...</span>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
