import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, RotateCcw, Shuffle, Flame, Target, TrendingUp } from 'lucide-react'
import ProgressRing from '../components/ProgressRing'
import CheckInCard from '../components/CheckInCard'
import { useProgressStore } from '../stores/useProgressStore'
import { isSupabaseConfigured } from '../lib/supabase'
import { categories } from '../data/words'

const totalWords = categories.reduce((sum, c) => sum + c.words.length, 0)

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function HomePage() {
  const { getMasteredCount, getTotalPracticedCount, getTodayStats, getWrongWords, getDueReviewWords } = useProgressStore()

  const mastered = getMasteredCount()
  const practiced = getTotalPracticedCount()
  const todayStats = getTodayStats()
  const wrongCount = getWrongWords().length
  const dueCount = getDueReviewWords().length
  const todayAccuracy = todayStats.totalCount > 0
    ? Math.round((todayStats.correctCount / todayStats.totalCount) * 100)
    : 0

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Hero section */}
      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-light p-6 sm:p-8 text-white"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <ProgressRing
            progress={totalWords > 0 ? mastered / totalWords : 0}
            size={110}
            strokeWidth={8}
            textClassName="text-white"
            trackClassName="text-white/20"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">王陆807听力词汇</h1>
            <p className="text-white/80 text-sm mb-4">第二版 · 共 {totalWords} 词</p>
            <div className="flex flex-wrap gap-4 text-sm mb-3">
              <div className="flex items-center gap-1.5">
                <Target size={16} />
                <span>已掌握 <strong>{mastered}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen size={16} />
                <span>已练习 <strong>{practiced}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp size={16} />
                <span>今日 <strong>{todayStats.totalCount}</strong> 词</span>
              </div>
            </div>
            {isSupabaseConfigured && <CheckInCard />}
          </div>
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/categories" className="group">
          <div className="bg-surface rounded-2xl p-4 border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <BookOpen size={20} className="text-primary" />
            </div>
            <div className="font-semibold text-sm text-text">开始练习</div>
            <div className="text-xs text-text-tertiary mt-0.5">选择分类开始</div>
          </div>
        </Link>

        <Link to="/wrong-book" className="group">
          <div className="bg-surface rounded-2xl p-4 border border-border hover:border-error/30 hover:shadow-lg hover:shadow-error/5 transition-all duration-300 hover:-translate-y-0.5">
            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center mb-3 relative">
              <Flame size={20} className="text-error" />
              {wrongCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wrongCount > 99 ? '99+' : wrongCount}
                </span>
              )}
            </div>
            <div className="font-semibold text-sm text-text">错词本</div>
            <div className="text-xs text-text-tertiary mt-0.5">{wrongCount} 个错词</div>
          </div>
        </Link>

        <Link to="/review" className="group">
          <div className="bg-surface rounded-2xl p-4 border border-border hover:border-warning/30 hover:shadow-lg hover:shadow-warning/5 transition-all duration-300 hover:-translate-y-0.5">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center mb-3 relative">
              <RotateCcw size={20} className="text-warning" />
              {dueCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-warning text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-soft">
                  {dueCount}
                </span>
              )}
            </div>
            <div className="font-semibold text-sm text-text">待复习</div>
            <div className="text-xs text-text-tertiary mt-0.5">{dueCount} 词到期</div>
          </div>
        </Link>

        <Link to="/practice/random" className="group">
          <div className="bg-surface rounded-2xl p-4 border border-border hover:border-success/30 hover:shadow-lg hover:shadow-success/5 transition-all duration-300 hover:-translate-y-0.5">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mb-3">
              <Shuffle size={20} className="text-success" />
            </div>
            <div className="font-semibold text-sm text-text">随机练习</div>
            <div className="text-xs text-text-tertiary mt-0.5">打乱所有词</div>
          </div>
        </Link>
      </motion.div>

      {/* Today stats */}
      {todayStats.totalCount > 0 && (
        <motion.div variants={item} className="bg-surface rounded-2xl p-5 border border-border">
          <h2 className="font-semibold text-text mb-4">今日学习</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{todayStats.newWords}</div>
              <div className="text-xs text-text-tertiary mt-1">新学单词</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{todayStats.reviewedWords}</div>
              <div className="text-xs text-text-tertiary mt-1">复习单词</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{todayAccuracy}%</div>
              <div className="text-xs text-text-tertiary mt-1">正确率</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Category overview */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text">分类概览</h2>
          <Link to="/categories" className="text-sm text-primary hover:text-primary-dark transition-colors">
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.slice(0, 6).map(cat => {
            const catMastered = cat.words.filter(
              w => useProgressStore.getState().wordProgress[w.id]?.mastered
            ).length
            const pct = cat.words.length > 0 ? catMastered / cat.words.length : 0

            return (
              <Link key={cat.id} to={`/practice/${cat.id}`}>
                <div className="bg-surface rounded-2xl p-4 border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-text">{cat.name}</span>
                    <span className="text-xs text-text-tertiary">{catMastered}/{cat.words.length}</span>
                  </div>
                  <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
