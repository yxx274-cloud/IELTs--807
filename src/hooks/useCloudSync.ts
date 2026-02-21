import { useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuthStore } from '../stores/useAuthStore'
import { useProgressStore } from '../stores/useProgressStore'

export function useCloudSync() {
  const user = useAuthStore(s => s.user)
  const synced = useRef(false)

  useEffect(() => {
    if (!isSupabaseConfigured || !user || synced.current) return
    synced.current = true

    syncToCloud(user.id)
  }, [user])
}

async function syncToCloud(userId: string) {
  const state = useProgressStore.getState()
  const localProgress = state.wordProgress
  const localStats = state.dailyStats

  if (Object.keys(localProgress).length === 0) {
    await pullFromCloud(userId)
    return
  }

  const { data: existing } = await supabase
    .from('word_progress')
    .select('word_id')
    .eq('user_id', userId)

  if (existing && existing.length > 0) {
    await pullFromCloud(userId)
    return
  }

  const rows = Object.entries(localProgress).map(([wordId, p]) => ({
    user_id: userId,
    word_id: wordId,
    mastered: p.mastered,
    wrong_count: p.wrongCount,
    correct_count: p.correctCount,
    last_practiced: p.lastPracticed ? new Date(p.lastPracticed).toISOString() : null,
    next_review: p.nextReview ? new Date(p.nextReview).toISOString() : null,
  }))

  if (rows.length > 0) {
    await supabase.from('word_progress').upsert(rows, { onConflict: 'user_id,word_id' })
  }

  const statRows = localStats.map(s => ({
    user_id: userId,
    date: s.date,
    new_words: s.newWords,
    reviewed_words: s.reviewedWords,
    correct_count: s.correctCount,
    total_count: s.totalCount,
  }))

  if (statRows.length > 0) {
    await supabase.from('daily_stats').upsert(statRows, { onConflict: 'user_id,date' })
  }

  const mastered = Object.values(localProgress).filter(p => p.mastered).length
  await supabase.from('profiles').update({ total_mastered: mastered }).eq('id', userId)
}

async function pullFromCloud(userId: string) {
  const { data: progress } = await supabase
    .from('word_progress')
    .select('*')
    .eq('user_id', userId)

  if (progress && progress.length > 0) {
    const wp: Record<string, any> = {}
    for (const p of progress) {
      wp[p.word_id] = {
        wordId: p.word_id,
        mastered: p.mastered,
        wrongCount: p.wrong_count,
        correctCount: p.correct_count,
        lastPracticed: p.last_practiced ? new Date(p.last_practiced).getTime() : null,
        nextReview: p.next_review ? new Date(p.next_review).getTime() : null,
      }
    }
    useProgressStore.setState({ wordProgress: wp })
  }

  const { data: stats } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('user_id', userId)

  if (stats && stats.length > 0) {
    const ds = stats.map(s => ({
      date: s.date,
      newWords: s.new_words,
      reviewedWords: s.reviewed_words,
      correctCount: s.correct_count,
      totalCount: s.total_count,
    }))
    useProgressStore.setState({ dailyStats: ds })
  }
}

export async function pushProgressToCloud(userId: string) {
  if (!isSupabaseConfigured) return

  const state = useProgressStore.getState()

  const rows = Object.entries(state.wordProgress).map(([wordId, p]) => ({
    user_id: userId,
    word_id: wordId,
    mastered: p.mastered,
    wrong_count: p.wrongCount,
    correct_count: p.correctCount,
    last_practiced: p.lastPracticed ? new Date(p.lastPracticed).toISOString() : null,
    next_review: p.nextReview ? new Date(p.nextReview).toISOString() : null,
  }))

  if (rows.length > 0) {
    await supabase.from('word_progress').upsert(rows, { onConflict: 'user_id,word_id' })
  }

  const today = new Date().toISOString().slice(0, 10)
  const todayStat = state.dailyStats.find(s => s.date === today)
  if (todayStat) {
    await supabase.from('daily_stats').upsert({
      user_id: userId,
      date: todayStat.date,
      new_words: todayStat.newWords,
      reviewed_words: todayStat.reviewedWords,
      correct_count: todayStat.correctCount,
      total_count: todayStat.totalCount,
    }, { onConflict: 'user_id,date' })
  }

  const mastered = Object.values(state.wordProgress).filter(p => p.mastered).length
  await supabase.from('profiles').update({ total_mastered: mastered }).eq('id', userId)
}
