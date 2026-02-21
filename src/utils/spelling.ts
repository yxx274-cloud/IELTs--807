export interface DiffResult {
  char: string
  type: 'correct' | 'wrong' | 'missing' | 'extra'
}

export function diffSpelling(input: string, answer: string): DiffResult[] {
  const a = input.toLowerCase().trim()
  const b = answer.toLowerCase().trim()

  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  const result: DiffResult[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ char: b[j - 1], type: 'correct' })
      i--; j--
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      result.unshift({ char: b[j - 1], type: 'wrong' })
      i--; j--
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      result.unshift({ char: b[j - 1], type: 'missing' })
      j--
    } else {
      result.unshift({ char: a[i - 1], type: 'extra' })
      i--
    }
  }

  return result
}

export function isCorrect(input: string, answer: string): boolean {
  return input.toLowerCase().trim() === answer.toLowerCase().trim()
}
