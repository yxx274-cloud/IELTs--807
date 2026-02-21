import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Volume2, Trash2, Play, BookX } from 'lucide-react'
import { useState } from 'react'
import { useProgressStore } from '../stores/useProgressStore'
import { categories } from '../data/words'
import { useTTS } from '../hooks/useTTS'

type SortBy = 'time' | 'count' | 'category'

export default function WrongBookPage() {
  const { getWrongWords, removeFromWrongBook } = useProgressStore()
  const { speak } = useTTS()
  const [sortBy, setSortBy] = useState<SortBy>('count')

  const wrongWords = getWrongWords()
  const allWords = categories.flatMap(c => c.words)
  const wordMap = new Map(allWords.map(w => [w.id, w]))

  const sortedWords = [...wrongWords].sort((a, b) => {
    if (sortBy === 'count') return b.wrongCount - a.wrongCount
    if (sortBy === 'time') return (b.lastPracticed || 0) - (a.lastPracticed || 0)
    const wa = wordMap.get(a.wordId)
    const wb = wordMap.get(b.wordId)
    return (wa?.category || '').localeCompare(wb?.category || '')
  })

  if (wrongWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <BookX size={36} className="text-success" />
        </div>
        <h2 className="text-xl font-bold text-text mb-2">太棒了！</h2>
        <p className="text-text-secondary text-sm mb-6">暂无错词，继续保持</p>
        <Link to="/categories" className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors">
          去练习
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">错词本</h1>
          <p className="text-sm text-text-secondary mt-1">共 {wrongWords.length} 个错词</p>
        </div>
        <Link
          to="/practice/wrong-book"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-md shadow-primary/20"
        >
          <Play size={16} /> 开始复习
        </Link>
      </div>

      {/* Sort */}
      <div className="flex gap-2">
        {([
          { value: 'count' as SortBy, label: '错误次数' },
          { value: 'time' as SortBy, label: '最近练习' },
          { value: 'category' as SortBy, label: '按分类' },
        ]).map(s => (
          <button
            key={s.value}
            onClick={() => setSortBy(s.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sortBy === s.value
                ? 'bg-primary text-white'
                : 'bg-surface-alt text-text-secondary hover:text-text'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Word list */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-2"
      >
        {sortedWords.map((wp, i) => {
          const word = wordMap.get(wp.wordId)
          if (!word) return null
          const cat = categories.find(c => c.id === word.category)

          return (
            <motion.div
              key={wp.wordId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-surface rounded-2xl p-4 border border-border hover:border-primary/20 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-error/10 text-error text-xs font-bold shrink-0">
                  {wp.wrongCount}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-text">{word.word}</span>
                    <span className="text-text-tertiary text-sm truncate">{word.meaning}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {cat && (
                      <span className="text-[10px] px-2 py-0.5 bg-primary/8 text-primary rounded-md">
                        {cat.name}
                      </span>
                    )}
                    {wp.lastPracticed && (
                      <span className="text-[10px] text-text-tertiary">
                        {new Date(wp.lastPracticed).toLocaleDateString('zh-CN')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => speak(word.word)}
                    className="p-2 rounded-lg hover:bg-primary/10 text-text-tertiary hover:text-primary transition-colors"
                  >
                    <Volume2 size={16} />
                  </button>
                  <button
                    onClick={() => removeFromWrongBook(wp.wordId)}
                    className="p-2 rounded-lg hover:bg-error/10 text-text-tertiary hover:text-error transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
