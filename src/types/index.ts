export interface Word {
  id: string
  word: string
  meaning: string
  category: string
}

export interface Category {
  id: string
  name: string
  icon: string
  words: Word[]
}

export interface WordProgress {
  wordId: string
  mastered: boolean
  wrongCount: number
  correctCount: number
  lastPracticed: number | null
  nextReview: number | null
}

export interface DailyStats {
  date: string
  newWords: number
  reviewedWords: number
  correctCount: number
  totalCount: number
}

export type PracticeMode = 'dictation' | 'choice'

export type VoiceType = 'en-US' | 'en-GB'

export interface Settings {
  voiceType: VoiceType
  speechRate: number
  autoPlay: boolean
  darkMode: 'system' | 'light' | 'dark'
  playCount: number
}
