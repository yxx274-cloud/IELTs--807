import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, SkipForward, ChevronLeft, Check, X } from 'lucide-react'
import confetti from 'canvas-confetti'
import { categories } from '../data/words'
import { useTTS } from '../hooks/useTTS'
import { useProgressStore } from '../stores/useProgressStore'
import { diffSpelling, isCorrect } from '../utils/spelling'
import { shuffleArray, generateOptions } from '../utils/shuffle'
import type { Word, PracticeMode } from '../types'

type AnswerState = 'idle' | 'correct' | 'wrong'

export default function PracticePage() {
  const { categoryId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { speak } = useTTS()
  const { markCorrect, markWrong } = useProgressStore()

  const mode: PracticeMode = (searchParams.get('mode') as PracticeMode) || 'dictation'

  const words = useMemo(() => {
    if (categoryId === 'random') {
      const all = categories.flatMap(c => c.words)
      return shuffleArray(all).slice(0, 30)
    }
    if (categoryId === 'wrong-book') {
      const wrongIds = useProgressStore.getState().getWrongWords().map(w => w.wordId)
      const all = categories.flatMap(c => c.words)
      return shuffleArray(all.filter(w => wrongIds.includes(w.id)))
    }
    if (categoryId === 'review') {
      const dueIds = useProgressStore.getState().getDueReviewWords().map(w => w.wordId)
      const all = categories.flatMap(c => c.words)
      return shuffleArray(all.filter(w => dueIds.includes(w.id)))
    }
    const cat = categories.find(c => c.id === categoryId)
    return cat ? shuffleArray([...cat.words]) : []
  }, [categoryId])

  const allWords = useMemo(() => categories.flatMap(c => c.words), [])

  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})

  // Choice mode state
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [options, setOptions] = useState<Word[]>([])
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongList, setWrongList] = useState<Word[]>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const inputRefCallback = useCallback((el: HTMLInputElement | null) => {
    inputRef.current = el
    if (el && mode === 'dictation') el.focus()
  }, [mode])
  const resultsProcessedRef = useRef(false)

  const currentWord = words[index]
  const isFinished = index >= words.length && words.length > 0
  const categoryName = categoryId === 'random' ? '随机练习'
    : categoryId === 'wrong-book' ? '错词复习'
    : categoryId === 'review' ? '到期复习'
    : categories.find(c => c.id === categoryId)?.name || ''

  // Choice mode: generate options
  useEffect(() => {
    if (currentWord && mode === 'choice') {
      setOptions(generateOptions(currentWord, allWords))
    }
  }, [currentWord, mode, allWords])

  // Auto-play word on arrival
  useEffect(() => {
    if (currentWord && (mode === 'choice' || answerState === 'idle')) {
      const timer = setTimeout(() => speak(currentWord.word), 300)
      return () => clearTimeout(timer)
    }
  }, [currentWord, mode, answerState, speak])

  // Focus is now handled by inputRefCallback (ref callback pattern)

  // Process results once when dictation finishes
  useEffect(() => {
    if (mode === 'dictation' && isFinished && !resultsProcessedRef.current) {
      resultsProcessedRef.current = true
      let correct = 0
      const wrong: Word[] = []
      for (const word of words) {
        const userAnswer = answers[word.id] ?? ''
        if (isCorrect(userAnswer, word.word)) {
          markCorrect(word.id)
          correct++
        } else {
          markWrong(word.id)
          wrong.push(word)
        }
      }
      setCorrectCount(correct)
      setWrongList(wrong)
    }
  }, [isFinished, mode, words, answers, markCorrect, markWrong])

  // Dictation: record answer and go next immediately
  const handleDictationSubmit = useCallback(() => {
    if (!currentWord) return
    setAnswers(prev => ({ ...prev, [currentWord.id]: input.trim() }))
    setIndex(i => i + 1)
    setInput('')
  }, [input, currentWord])

  // Choice mode handlers (unchanged)
  const handleChoice = useCallback((word: Word) => {
    if (!currentWord || answerState !== 'idle') return
    setSelectedOption(word.id)

    if (word.id === currentWord.id) {
      setAnswerState('correct')
      markCorrect(currentWord.id)
      setCorrectCount(c => c + 1)
      confetti({ particleCount: 40, spread: 40, origin: { y: 0.7 }, colors: ['#6C5CE7', '#00B894'] })
      setTimeout(goNextChoice, 1000)
    } else {
      setAnswerState('wrong')
      markWrong(currentWord.id)
      setWrongList(prev => [...prev, currentWord])
    }
  }, [currentWord, answerState, markCorrect, markWrong])

  const goNextChoice = useCallback(() => {
    setIndex(i => i + 1)
    setAnswerState('idle')
    setSelectedOption(null)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (mode === 'dictation') {
        handleDictationSubmit()
      } else if (answerState === 'wrong') {
        goNextChoice()
      }
    }
  }, [mode, handleDictationSubmit, answerState, goNextChoice])

  // --- Empty state ---
  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-text mb-2">暂无词汇</h2>
        <p className="text-text-secondary text-sm mb-6">该分类没有需要练习的词汇</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors">
          返回
        </button>
      </div>
    )
  }

  // --- Dictation results page ---
  if (mode === 'dictation' && isFinished) {
    const accuracy = words.length > 0 ? Math.round((correctCount / words.length) * 100) : 0
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{accuracy >= 80 ? '🏆' : accuracy >= 60 ? '💪' : '📚'}</div>
          <h2 className="text-2xl font-bold text-text mb-2">听写完成</h2>
          <p className="text-text-secondary text-sm">
            {categoryName} · 共 {words.length} 词
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-success">{correctCount}</div>
            <div className="text-xs text-text-tertiary mt-1">正确</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-error">{wrongList.length}</div>
            <div className="text-xs text-text-tertiary mt-1">错误</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{accuracy}%</div>
            <div className="text-xs text-text-tertiary mt-1">正确率</div>
          </div>
        </div>

        {wrongList.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-text text-sm mb-3">错词纠正</h3>
            <div className="space-y-2">
              {wrongList.map((w, i) => {
                const userAnswer = answers[w.id] ?? ''
                const diff = diffSpelling(userAnswer, w.word)
                return (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-surface rounded-2xl p-4 border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-text-tertiary w-6">{i + 1}</span>
                        <span className="font-mono font-semibold text-text">{w.word}</span>
                        <span className="text-text-tertiary text-sm">{w.meaning}</span>
                      </div>
                      <button onClick={() => speak(w.word)} className="p-1.5 rounded-lg hover:bg-primary/10 text-text-tertiary hover:text-primary transition-colors">
                        <Volume2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 ml-8">
                      <span className="text-xs text-text-tertiary shrink-0">你写的:</span>
                      {userAnswer ? (
                        <div className="flex items-center gap-0.5 font-mono text-sm">
                          {diff.map((d, j) => (
                            <span
                              key={j}
                              className={
                                d.type === 'correct' ? 'text-success'
                                : d.type === 'missing' ? 'text-success bg-success/10 px-0.5 rounded'
                                : d.type === 'extra' ? 'text-error line-through opacity-50'
                                : 'text-error bg-error/10 px-0.5 rounded'
                              }
                            >
                              {d.char}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-error italic">未作答</span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {wrongList.length === 0 && (
          <div className="text-center mb-8 py-6">
            <p className="text-success font-medium">全部正确，太厉害了！</p>
          </div>
        )}

        <div className="flex justify-center gap-3">
          <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-surface border border-border text-text rounded-xl font-medium hover:bg-surface-alt transition-colors">
            返回
          </button>
          <button
            onClick={() => {
              setIndex(0)
              setInput('')
              setAnswers({})
              setCorrectCount(0)
              setWrongList([])
              resultsProcessedRef.current = false
            }}
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            再练一次
          </button>
        </div>
      </motion.div>
    )
  }

  // --- Choice mode results page ---
  if (mode === 'choice' && isFinished) {
    const accuracy = words.length > 0 ? Math.round((correctCount / words.length) * 100) : 0
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <div className="text-6xl mb-4">{accuracy >= 80 ? '🏆' : accuracy >= 60 ? '💪' : '📚'}</div>
        <h2 className="text-2xl font-bold text-text mb-2">练习完成</h2>
        <p className="text-text-secondary text-sm mb-6">{categoryName} · 共 {words.length} 词</p>
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div>
            <div className="text-3xl font-bold text-success">{correctCount}</div>
            <div className="text-xs text-text-tertiary mt-1">正确</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-error">{wrongList.length}</div>
            <div className="text-xs text-text-tertiary mt-1">错误</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">{accuracy}%</div>
            <div className="text-xs text-text-tertiary mt-1">正确率</div>
          </div>
        </div>
        {wrongList.length > 0 && (
          <div className="w-full max-w-md mb-8">
            <h3 className="font-semibold text-text text-sm mb-3 text-left">错误单词</h3>
            <div className="space-y-2">
              {wrongList.map(w => (
                <div key={w.id} className="flex items-center justify-between bg-surface rounded-xl p-3 border border-border">
                  <div>
                    <span className="font-mono font-semibold text-text">{w.word}</span>
                    <span className="text-text-tertiary text-sm ml-2">{w.meaning}</span>
                  </div>
                  <button onClick={() => speak(w.word)} className="text-primary hover:text-primary-dark">
                    <Volume2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-surface border border-border text-text rounded-xl font-medium hover:bg-surface-alt transition-colors">
            返回
          </button>
          <button
            onClick={() => {
              setIndex(0)
              setCorrectCount(0)
              setWrongList([])
              setAnswerState('idle')
            }}
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            再练一次
          </button>
        </div>
      </motion.div>
    )
  }

  // --- Active practice UI ---
  return (
    <div className="max-w-2xl mx-auto" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors">
          <ChevronLeft size={20} />
          <span className="text-sm">{categoryName}</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-tertiary">
            {mode === 'dictation' ? '听写模式' : '选择模式'}
          </span>
          <span className="text-sm font-medium text-text">
            {index + 1} / {words.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden mb-10">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
          animate={{ width: `${((index + 1) / words.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Dictation mode — minimal: just input */}
      {mode === 'dictation' && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`dictation-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-center mb-2">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse-soft" />
            </div>

            <input
              ref={inputRefCallback}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="输入听到的单词，按 Enter 提交..."
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full text-center text-2xl font-mono py-4 bg-transparent border-b-3 border-border focus:border-primary outline-none transition-colors text-text"
            />

            <div className="flex justify-center">
              <button
                onClick={handleDictationSubmit}
                className="px-8 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-md shadow-primary/20"
              >
                下一个
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Choice mode — with play button */}
      {mode === 'choice' && (
        <>
          <div className="flex justify-center mb-10">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => speak(currentWord.word)}
              className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-light text-white shadow-xl shadow-primary/25 flex items-center justify-center hover:shadow-2xl hover:shadow-primary/30 transition-shadow"
            >
              <Volume2 size={36} />
              <span className="absolute inset-0 rounded-full border-2 border-primary-light/30 animate-ping" style={{ animationDuration: '2s' }} />
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`choice-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {options.map((opt, i) => {
                const isSelected = selectedOption === opt.id
                const isAnswer = opt.id === currentWord.id
                let borderClass = 'border-border hover:border-primary/30'
                let bgClass = 'bg-surface'

                if (answerState !== 'idle') {
                  if (isAnswer) {
                    borderClass = 'border-success'
                    bgClass = 'bg-success/5'
                  } else if (isSelected) {
                    borderClass = 'border-error'
                    bgClass = 'bg-error/5'
                  }
                }

                return (
                  <motion.button
                    key={opt.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => handleChoice(opt)}
                    disabled={answerState !== 'idle'}
                    className={`w-full text-left p-4 rounded-2xl border ${borderClass} ${bgClass} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:hover:translate-y-0 disabled:hover:shadow-none`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-semibold text-lg text-text">{opt.word}</span>
                        <span className="text-text-tertiary text-sm ml-3">{opt.meaning}</span>
                      </div>
                      {answerState !== 'idle' && isAnswer && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </motion.div>
                      )}
                      {answerState !== 'idle' && isSelected && !isAnswer && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 bg-error rounded-full flex items-center justify-center">
                          <X size={14} className="text-white" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                )
              })}

              {answerState === 'wrong' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center pt-4">
                  <button onClick={goNextChoice} className="flex items-center gap-1.5 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors">
                    下一个 <SkipForward size={16} />
                  </button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {/* Keyboard hint */}
      <div className="mt-10 flex justify-center text-[11px] text-text-tertiary">
        <span><kbd className="px-1.5 py-0.5 bg-surface-alt rounded text-[10px]">Enter</kbd> {mode === 'dictation' ? '提交并下一个' : '确认'}</span>
      </div>
    </div>
  )
}
