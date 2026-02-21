import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WordProgress, DailyStats } from '../types'

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

function getReviewIntervals() {
  return [1, 2, 4, 7, 15].map(d => d * 86400000)
}

interface ProgressState {
  wordProgress: Record<string, WordProgress>
  dailyStats: DailyStats[]

  markCorrect: (wordId: string) => void
  markWrong: (wordId: string) => void
  removeFromWrongBook: (wordId: string) => void
  getProgress: (wordId: string) => WordProgress | undefined
  getWrongWords: () => WordProgress[]
  getDueReviewWords: () => WordProgress[]
  getTodayStats: () => DailyStats
  getMasteredCount: () => number
  getTotalPracticedCount: () => number
}

const defaultProgress = (wordId: string): WordProgress => ({
  wordId,
  mastered: false,
  wrongCount: 0,
  correctCount: 0,
  lastPracticed: null,
  nextReview: null,
})

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      wordProgress: {},
      dailyStats: [],

      markCorrect: (wordId: string) => {
        const now = Date.now()
        const today = getTodayStr()
        set(state => {
          const prev = state.wordProgress[wordId] || defaultProgress(wordId)
          const correctCount = prev.correctCount + 1
          const mastered = correctCount >= 3 && prev.wrongCount === 0
            ? true
            : correctCount >= 5
          const intervals = getReviewIntervals()
          const reviewStep = Math.min(correctCount - 1, intervals.length - 1)
          const nextReview = mastered ? null : now + intervals[Math.max(0, reviewStep)]

          const isNew = !state.wordProgress[wordId]
          const stats = [...state.dailyStats]
          const todayIdx = stats.findIndex(s => s.date === today)
          if (todayIdx >= 0) {
            stats[todayIdx] = {
              ...stats[todayIdx],
              newWords: stats[todayIdx].newWords + (isNew ? 1 : 0),
              reviewedWords: stats[todayIdx].reviewedWords + (isNew ? 0 : 1),
              correctCount: stats[todayIdx].correctCount + 1,
              totalCount: stats[todayIdx].totalCount + 1,
            }
          } else {
            stats.push({
              date: today,
              newWords: isNew ? 1 : 0,
              reviewedWords: isNew ? 0 : 1,
              correctCount: 1,
              totalCount: 1,
            })
          }

          return {
            wordProgress: {
              ...state.wordProgress,
              [wordId]: { ...prev, correctCount, mastered, lastPracticed: now, nextReview },
            },
            dailyStats: stats,
          }
        })
      },

      markWrong: (wordId: string) => {
        const now = Date.now()
        const today = getTodayStr()
        set(state => {
          const prev = state.wordProgress[wordId] || defaultProgress(wordId)
          const nextReview = now + getReviewIntervals()[0]

          const isNew = !state.wordProgress[wordId]
          const stats = [...state.dailyStats]
          const todayIdx = stats.findIndex(s => s.date === today)
          if (todayIdx >= 0) {
            stats[todayIdx] = {
              ...stats[todayIdx],
              newWords: stats[todayIdx].newWords + (isNew ? 1 : 0),
              reviewedWords: stats[todayIdx].reviewedWords + (isNew ? 0 : 1),
              totalCount: stats[todayIdx].totalCount + 1,
            }
          } else {
            stats.push({
              date: today,
              newWords: isNew ? 1 : 0,
              reviewedWords: isNew ? 0 : 1,
              correctCount: 0,
              totalCount: 1,
            })
          }

          return {
            wordProgress: {
              ...state.wordProgress,
              [wordId]: {
                ...prev,
                wrongCount: prev.wrongCount + 1,
                mastered: false,
                lastPracticed: now,
                nextReview,
              },
            },
            dailyStats: stats,
          }
        })
      },

      removeFromWrongBook: (wordId: string) => {
        set(state => {
          const prev = state.wordProgress[wordId]
          if (!prev) return state
          return {
            wordProgress: {
              ...state.wordProgress,
              [wordId]: { ...prev, wrongCount: 0, mastered: true, nextReview: null },
            },
          }
        })
      },

      getProgress: (wordId: string) => get().wordProgress[wordId],

      getWrongWords: () =>
        Object.values(get().wordProgress).filter(p => p.wrongCount > 0),

      getDueReviewWords: () => {
        const now = Date.now()
        return Object.values(get().wordProgress).filter(
          p => p.nextReview !== null && p.nextReview <= now && !p.mastered
        )
      },

      getTodayStats: () => {
        const today = getTodayStr()
        const found = get().dailyStats.find(s => s.date === today)
        return found || { date: today, newWords: 0, reviewedWords: 0, correctCount: 0, totalCount: 0 }
      },

      getMasteredCount: () =>
        Object.values(get().wordProgress).filter(p => p.mastered).length,

      getTotalPracticedCount: () =>
        Object.keys(get().wordProgress).length,
    }),
    { name: 'ielts-807-progress' }
  )
)
