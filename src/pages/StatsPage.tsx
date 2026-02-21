import { motion } from 'framer-motion'
import { BarChart3, Calendar, TrendingUp, Award } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useProgressStore } from '../stores/useProgressStore'
import { categories } from '../data/words'
import ProgressRing from '../components/ProgressRing'

const totalWords = categories.reduce((sum, c) => sum + c.words.length, 0)

export default function StatsPage() {
  const { dailyStats, getMasteredCount, getTotalPracticedCount, wordProgress } = useProgressStore()

  const mastered = getMasteredCount()
  const practiced = getTotalPracticedCount()

  const recentStats = [...dailyStats]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map(s => ({
      ...s,
      date: s.date.slice(5),
      accuracy: s.totalCount > 0 ? Math.round((s.correctCount / s.totalCount) * 100) : 0,
    }))

  const streak = (() => {
    let count = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      if (dailyStats.some(s => s.date === dateStr)) {
        count++
      } else {
        break
      }
    }
    return count
  })()

  const categoryStats = categories.map(cat => {
    const catMastered = cat.words.filter(w => wordProgress[w.id]?.mastered).length
    return {
      name: cat.name,
      mastered: catMastered,
      total: cat.words.length,
      pct: cat.words.length > 0 ? Math.round((catMastered / cat.words.length) * 100) : 0,
    }
  }).sort((a, b) => b.pct - a.pct)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">学习统计</h1>
        <p className="text-sm text-text-secondary mt-1">追踪你的学习进度</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Award, label: '已掌握', value: mastered, color: 'primary' },
          { icon: BarChart3, label: '已练习', value: practiced, color: 'success' },
          { icon: Calendar, label: '连续天数', value: streak, color: 'warning' },
          { icon: TrendingUp, label: '掌握率', value: `${totalWords > 0 ? Math.round((mastered / totalWords) * 100) : 0}%`, color: 'primary' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-surface rounded-2xl p-4 border border-border"
          >
            <div className={`w-9 h-9 rounded-xl bg-${stat.color}/10 flex items-center justify-center mb-3`}>
              <stat.icon size={18} className={`text-${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-text">{stat.value}</div>
            <div className="text-xs text-text-tertiary mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Progress ring */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl p-6 border border-border flex flex-col items-center"
      >
        <ProgressRing
          progress={totalWords > 0 ? mastered / totalWords : 0}
          size={150}
          strokeWidth={10}
          label={`${mastered} / ${totalWords}`}
          sublabel="总掌握进度"
        />
      </motion.div>

      {/* Daily chart */}
      {recentStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl p-6 border border-border"
        >
          <h3 className="font-semibold text-text mb-4">每日学习词数</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={recentStats}>
              <defs>
                <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6C5CE7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6C5CE7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#636E72' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#636E72' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #E8E8EE', borderRadius: 12, fontSize: 13 }}
              />
              <Area type="monotone" dataKey="newWords" name="新学" stroke="#6C5CE7" fill="url(#colorWords)" strokeWidth={2} />
              <Area type="monotone" dataKey="reviewedWords" name="复习" stroke="#00B894" fill="none" strokeWidth={2} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Accuracy chart */}
      {recentStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl p-6 border border-border"
        >
          <h3 className="font-semibold text-text mb-4">正确率趋势</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={recentStats}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#636E72' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#636E72' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #E8E8EE', borderRadius: 12, fontSize: 13 }}
                formatter={(value) => `${value}%`}
              />
              <Line type="monotone" dataKey="accuracy" name="正确率" stroke="#FDCB6E" strokeWidth={2.5} dot={{ r: 3, fill: '#FDCB6E' }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Category breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl p-6 border border-border"
      >
        <h3 className="font-semibold text-text mb-4">分类掌握率</h3>
        <div className="space-y-3">
          {categoryStats.map(cat => (
            <div key={cat.name}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-text-secondary">{cat.name}</span>
                <span className="text-text-tertiary text-xs">{cat.mastered}/{cat.total} ({cat.pct}%)</span>
              </div>
              <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${cat.pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
