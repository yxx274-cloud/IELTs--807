import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import * as Icons from 'lucide-react'
import { categories } from '../data/words'
import { useProgressStore } from '../stores/useProgressStore'

type Filter = 'all' | 'not-started' | 'in-progress' | 'completed'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

function getIcon(name: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComp = (Icons as any)[name]
  return IconComp || Icons.BookOpen
}

export default function CategoryPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const { wordProgress } = useProgressStore()

  const getCategoryStats = (catId: string) => {
    const cat = categories.find(c => c.id === catId)!
    const mastered = cat.words.filter(w => wordProgress[w.id]?.mastered).length
    const practiced = cat.words.filter(w => wordProgress[w.id]).length
    return { total: cat.words.length, mastered, practiced }
  }

  const filtered = categories.filter(cat => {
    const stats = getCategoryStats(cat.id)
    if (filter === 'not-started') return stats.practiced === 0
    if (filter === 'in-progress') return stats.practiced > 0 && stats.mastered < stats.total
    if (filter === 'completed') return stats.mastered === stats.total
    return true
  })

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'not-started', label: '未开始' },
    { value: 'in-progress', label: '进行中' },
    { value: 'completed', label: '已完成' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">分类练习</h1>
        <p className="text-sm text-text-secondary mt-1">选择一个分类开始听写练习</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === f.value
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-surface text-text-secondary border border-border hover:border-primary/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Category grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filtered.map(cat => {
          const stats = getCategoryStats(cat.id)
          const pct = stats.total > 0 ? stats.mastered / stats.total : 0
          const Icon = getIcon(cat.icon)

          return (
            <motion.div key={cat.id} variants={item}>
              <Link to={`/practice/${cat.id}`}>
                <div className="bg-surface rounded-2xl p-5 border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                      <Icon size={24} className="text-primary" />
                    </div>
                    <span className="text-xs font-medium text-text-tertiary bg-surface-alt px-2.5 py-1 rounded-lg">
                      {stats.total} 词
                    </span>
                  </div>

                  <h3 className="font-semibold text-text mb-1">{cat.name}</h3>
                  <p className="text-xs text-text-tertiary mb-4">
                    已掌握 {stats.mastered} · 已练习 {stats.practiced}
                  </p>

                  <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="text-right mt-1.5">
                    <span className="text-xs text-text-tertiary">{Math.round(pct * 100)}%</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
