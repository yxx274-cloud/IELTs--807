import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarCheck, Share2, X, Download } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuthStore } from '../stores/useAuthStore'
import { useProgressStore } from '../stores/useProgressStore'
import { pushProgressToCloud } from '../hooks/useCloudSync'

const ENCOURAGEMENTS = [
  '坚持就是胜利！💪',
  '每天进步一点点！📈',
  '今天也很努力呢！⭐',
  '厉害了，继续加油！🔥',
  '词汇量又增加了！📚',
  '你的坚持终会有回报！🏆',
]

export default function CheckInCard() {
  const { user, profile, updateProfile, fetchProfile } = useAuthStore()
  const { getTodayStats } = useProgressStore()
  const [showCard, setShowCard] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const todayStats = getTodayStats()
  const canCheckIn = todayStats.totalCount >= 10
  const today = new Date().toISOString().slice(0, 10)
  const alreadyCheckedIn = profile?.last_check_in === today

  const accuracy = todayStats.totalCount > 0
    ? Math.round((todayStats.correctCount / todayStats.totalCount) * 100)
    : 0

  const handleCheckIn = async () => {
    if (!user || !isSupabaseConfigured) return
    setChecking(true)

    await pushProgressToCloud(user.id)

    const isConsecutive = profile?.last_check_in
      ? (new Date(today).getTime() - new Date(profile.last_check_in).getTime()) <= 86400000 * 1.5
      : false
    const newStreak = isConsecutive ? (profile?.streak_days || 0) + 1 : 1

    await supabase.from('check_ins').upsert({
      user_id: user.id,
      date: today,
      words_learned: todayStats.totalCount,
      accuracy,
    }, { onConflict: 'user_id,date' })

    await updateProfile({ last_check_in: today, streak_days: newStreak })
    await fetchProfile()

    setChecking(false)
    setCheckedIn(true)
    setShowCard(true)
  }

  const encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]

  if (alreadyCheckedIn && !showCard) {
    return (
      <button
        onClick={() => setShowCard(true)}
        className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-xl text-sm font-medium"
      >
        <CalendarCheck size={16} /> 今日已打卡
      </button>
    )
  }

  if (!alreadyCheckedIn && !checkedIn) {
    return (
      <button
        onClick={handleCheckIn}
        disabled={!canCheckIn || checking || !isSupabaseConfigured}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
          canCheckIn && isSupabaseConfigured
            ? 'bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary-dark'
            : 'bg-surface-alt text-text-tertiary cursor-not-allowed'
        }`}
        title={!canCheckIn ? '完成至少10词练习后可打卡' : ''}
      >
        <CalendarCheck size={16} />
        {checking ? '打卡中...' : canCheckIn ? '打卡' : `还需练习 ${10 - todayStats.totalCount} 词`}
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowCard(true)}
        className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-xl text-sm font-medium"
      >
        <CalendarCheck size={16} /> 查看打卡
      </button>

      <AnimatePresence>
        {showCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setShowCard(false)}
          >
            <motion.div
              ref={cardRef}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-gradient-to-br from-primary to-primary-light rounded-3xl p-6 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

              <button onClick={() => setShowCard(false)} className="absolute top-4 right-4 text-white/60 hover:text-white">
                <X size={20} />
              </button>

              <div className="relative">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">🎯</div>
                  <h3 className="text-xl font-bold">打卡成功</h3>
                  <p className="text-white/70 text-sm mt-1">{today}</p>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-white/15 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold">{todayStats.totalCount}</div>
                    <div className="text-[11px] text-white/70 mt-0.5">学习词数</div>
                  </div>
                  <div className="bg-white/15 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold">{accuracy}%</div>
                    <div className="text-[11px] text-white/70 mt-0.5">正确率</div>
                  </div>
                  <div className="bg-white/15 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold">{profile?.streak_days || 1}</div>
                    <div className="text-[11px] text-white/70 mt-0.5">连续天数</div>
                  </div>
                </div>

                <p className="text-center text-white/80 text-sm mb-6">{encouragement}</p>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setShowCard(false)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white/20 rounded-xl text-sm font-medium hover:bg-white/30 transition-colors"
                  >
                    <Download size={14} /> 关闭
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: '807听力词汇打卡',
                          text: `我今天学了${todayStats.totalCount}个听力词汇，正确率${accuracy}%，已连续打卡${profile?.streak_days || 1}天！`,
                        }).catch(() => {})
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white text-primary rounded-xl text-sm font-medium hover:bg-white/90 transition-colors"
                  >
                    <Share2 size={14} /> 分享
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
