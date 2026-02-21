import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RotateCcw, Clock, AlertCircle, Play } from 'lucide-react'
import { useProgressStore } from '../stores/useProgressStore'
import { categories } from '../data/words'

export default function ReviewPage() {
  const { getDueReviewWords, getWrongWords } = useProgressStore()

  const dueWords = getDueReviewWords()
  const wrongWords = getWrongWords()
  const allWords = categories.flatMap(c => c.words)
  const wordMap = new Map(allWords.map(w => [w.id, w]))

  const reviewByPriority = [...dueWords].sort((a, b) => {
    const scoreA = a.wrongCount * 2 + (a.nextReview ? (Date.now() - a.nextReview) / 86400000 : 0)
    const scoreB = b.wrongCount * 2 + (b.nextReview ? (Date.now() - b.nextReview) / 86400000 : 0)
    return scoreB - scoreA
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">复习中心</h1>
        <p className="text-sm text-text-secondary mt-1">基于艾宾浩斯遗忘曲线智能安排</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl p-5 border border-border"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Clock size={20} className="text-warning" />
            </div>
            <div className="text-2xl font-bold text-text">{dueWords.length}</div>
          </div>
          <div className="text-sm text-text-secondary">今日待复习</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface rounded-2xl p-5 border border-border"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
              <AlertCircle size={20} className="text-error" />
            </div>
            <div className="text-2xl font-bold text-text">{wrongWords.length}</div>
          </div>
          <div className="text-sm text-text-secondary">总错词数</div>
        </motion.div>
      </div>

      {/* Review actions */}
      {dueWords.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-warning/10 to-warning/5 rounded-2xl p-6 border border-warning/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <RotateCcw size={24} className="text-warning" />
            <div>
              <h3 className="font-semibold text-text">有 {dueWords.length} 个词到期需要复习</h3>
              <p className="text-sm text-text-secondary mt-0.5">及时复习能有效防止遗忘</p>
            </div>
          </div>
          <Link
            to="/practice/review"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-warning text-white rounded-xl font-medium hover:bg-warning/90 transition-colors shadow-md shadow-warning/20"
          >
            <Play size={16} /> 开始复习
          </Link>
        </motion.div>
      ) : (
        <div className="bg-surface rounded-2xl p-8 border border-border text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="font-semibold text-text mb-1">暂无待复习词汇</h3>
          <p className="text-sm text-text-secondary">继续练习新词，系统会自动安排复习</p>
        </div>
      )}

      {/* Due word list */}
      {reviewByPriority.length > 0 && (
        <div>
          <h3 className="font-semibold text-text mb-3">待复习列表</h3>
          <div className="space-y-2">
            {reviewByPriority.slice(0, 20).map((wp, i) => {
              const word = wordMap.get(wp.wordId)
              if (!word) return null
              const overdueDays = wp.nextReview
                ? Math.max(0, Math.floor((Date.now() - wp.nextReview) / 86400000))
                : 0

              return (
                <motion.div
                  key={wp.wordId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-surface rounded-xl p-3 border border-border flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium text-text">{word.word}</span>
                    <span className="text-sm text-text-tertiary">{word.meaning}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {wp.wrongCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 bg-error/10 text-error rounded-md">
                        错{wp.wrongCount}次
                      </span>
                    )}
                    {overdueDays > 0 && (
                      <span className="text-[10px] px-2 py-0.5 bg-warning/10 text-warning rounded-md">
                        逾期{overdueDays}天
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
