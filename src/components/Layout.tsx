import { NavLink, Outlet } from 'react-router-dom'
import { Home, FolderOpen, BookX, RotateCcw, BarChart3, Settings, Trophy, Users, User } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../stores/useAuthStore'
import { isSupabaseConfigured } from '../lib/supabase'
import { useCloudSync } from '../hooks/useCloudSync'

const baseNav = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/categories', icon: FolderOpen, label: '分类练习' },
  { to: '/wrong-book', icon: BookX, label: '错词本' },
  { to: '/review', icon: RotateCcw, label: '复习' },
  { to: '/stats', icon: BarChart3, label: '统计' },
]

const socialNav = [
  { to: '/leaderboard', icon: Trophy, label: '排行榜' },
  { to: '/friends', icon: Users, label: '好友' },
]

const settingsNav = [
  { to: '/settings', icon: Settings, label: '设置' },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const { profile } = useAuthStore()

  useCloudSync()

  const navItems = [
    ...baseNav,
    ...(isSupabaseConfigured ? socialNav : []),
    ...settingsNav,
  ]

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-0 h-full bg-surface border-r border-border z-30 transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-[240px]'
        }`}
      >
        <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">807</span>
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-text whitespace-nowrap">听力词汇</span>
          )}
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-text-secondary hover:bg-surface-alt hover:text-text'
                }`
              }
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span className="text-[15px]">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Profile at bottom */}
        {isSupabaseConfigured && (
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `mx-3 mb-3 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface-alt'
              }`
            }
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><User size={16} className="text-primary" /></div>
              )}
            </div>
            {!collapsed && (
              <span className="text-sm truncate">{profile?.nickname || '个人资料'}</span>
            )}
          </NavLink>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-3 mb-4 py-2 rounded-xl text-text-tertiary hover:bg-surface-alt hover:text-text-secondary transition-colors text-sm"
        >
          {collapsed ? '→' : '← 收起'}
        </button>
      </aside>

      {/* Main content */}
      <main
        className={`flex-1 transition-all duration-300 pb-20 md:pb-0 ${
          collapsed ? 'md:ml-[72px]' : 'md:ml-[240px]'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-30 flex justify-around py-1 safe-bottom">
        {[...baseNav.slice(0, 4), ...(isSupabaseConfigured ? [{ to: '/profile', icon: User, label: '我的' }] : [baseNav[4]])].map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-text-tertiary'
              }`
            }
          >
            <Icon size={20} />
            <span className="text-[10px]">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
