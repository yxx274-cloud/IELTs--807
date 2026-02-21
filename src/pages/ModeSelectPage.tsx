import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PenLine, ListChecks, ChevronLeft } from 'lucide-react'
import { categories } from '../data/words'

export default function ModeSelectPage() {
  const { categoryId } = useParams()
  const navigate = useNavigate()

  const categoryName = categoryId === 'random' ? '随机练习'
    : categoryId === 'wrong-book' ? '错词复习'
    : categoryId === 'review' ? '到期复习'
    : categories.find(c => c.id === categoryId)?.name || ''

  const wordCount = categoryId === 'random' ? 30
    : categories.find(c => c.id === categoryId)?.words.length || 0

  return (
    <div className="max-w-lg mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors mb-6"
      >
        <ChevronLeft size={20} />
        <span className="text-sm">返回</span>
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-text mb-2">{categoryName}</h1>
        <p className="text-sm text-text-secondary">共 {wordCount} 词 · 选择练习模式</p>
      </div>

      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link to={`/practice/${categoryId}/go?mode=dictation`}>
            <div className="bg-surface rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <PenLine size={28} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-text mb-1">听写模式</h3>
                  <p className="text-sm text-text-secondary">听发音，拼写单词，获得即时反馈</p>
                </div>
                <ChevronLeft size={20} className="text-text-tertiary rotate-180" />
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link to={`/practice/${categoryId}/go?mode=choice`}>
            <div className="bg-surface rounded-2xl p-6 border border-border hover:border-success/30 hover:shadow-lg hover:shadow-success/5 transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center group-hover:bg-success/15 transition-colors">
                  <ListChecks size={28} className="text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-text mb-1">选择模式</h3>
                  <p className="text-sm text-text-secondary">听发音，从四个选项中选择正确答案</p>
                </div>
                <ChevronLeft size={20} className="text-text-tertiary rotate-180" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
