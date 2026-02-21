import type { Word } from '../types'

export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function generateOptions(
  correctWord: Word,
  allWords: Word[],
  count = 4
): Word[] {
  const sameCategory = allWords.filter(
    w => w.category === correctWord.category && w.id !== correctWord.id
  )
  const otherWords = allWords.filter(
    w => w.category !== correctWord.category && w.id !== correctWord.id
  )

  const pool = sameCategory.length >= count - 1
    ? sameCategory
    : [...sameCategory, ...otherWords]

  const distractors = shuffleArray(pool).slice(0, count - 1)
  return shuffleArray([correctWord, ...distractors])
}
