import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Flame, TrendingUp, User } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuthStore } from '../stores/useAuthStore'

type SortBy = 'mastered' | 'streak' | 'weekly'

interface LeaderEntry {
  id: string
  nickname: string
  avatar_url: string | null
  total_mastered: number
  streak_days: number
  week_total: number
}

export default function LeaderboardPage() {
  const [sortBy, setSortBy] = useState<SortBy>('mastered')
  const [entries, setEntries] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return }

    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('leaderboard').select('*')
      if (data) setEntries(data as LeaderEntry[])
      setLoading(false)
    }
    load()
  }, [])

  const sorted = [...entries].sort((a, b) => {
    if (sortBy === 'mastered') return b.total_mastered - a.total_mastered
    if (sortBy === 'streak') return b.streak_days - a.streak_days
    return b.week_total - a.week_total
  })

  const tabs: { value: SortBy; label: string; icon: typeof Trophy }[] = [
    { value: 'mastered', label: '掌握词数', icon: Trophy },
    { value: 'streak', label: '连续打卡', icon: Flame },
    { value: 'weekly', label: '本周学习', icon: TrendingUp },
  ]

  if (!isSupabaseConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Trophy size={48} className="text-text-tertiary mb-4" />
        <h2 className="text-xl font-bold text-text mb-2">排行榜</h2>
        <p className="text-text-secondary text-sm">配置 Supabase 后可查看排行榜</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">排行榜</h1>

      <div className="flex gap-2">
        {tabs.map(t => (
          <button
            key={t.value}
            onClick={() => setSortBy(t.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              sortBy === t.value
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-surface text-text-secondary border border-border hover:border-primary/30'
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-10 text-text-secondary">暂无数据</div>
      ) : (
        <div className="space-y-2">
          {sorted.map((entry, i) => {
            const isMe = entry.id === user?.id
            const value = sortBy === 'mastered' ? entry.total_mastered
              : sortBy === 'streak' ? entry.streak_days
              : entry.week_total

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`bg-surface rounded-2xl p-4 border flex items-center gap-4 transition-all ${
                  isMe ? 'border-primary/40 bg-primary/5' : 'border-border'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  i === 0 ? 'bg-warning/20 text-warning'
                  : i === 1 ? 'bg-text-tertiary/20 text-text-secondary'
                  : i === 2 ? 'bg-warning/10 text-warning/70'
                  : 'bg-surface-alt text-text-tertiary'
                }`}>
                  {i + 1}
                </div>

                <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden shrink-0">
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={20} className="text-primary" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text truncate">{entry.nickname || '用户'}</span>
                    {isMe && <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-md">我</span>}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-primary">{value}</div>
                  <div className="text-[10px] text-text-tertiary">
                    {sortBy === 'mastered' ? '词' : sortBy === 'streak' ? '天' : '词'}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
