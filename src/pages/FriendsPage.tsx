import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, UserPlus, UserCheck, Users, User, X } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuthStore } from '../stores/useAuthStore'

interface FriendProfile {
  id: string
  nickname: string
  avatar_url: string | null
  total_mastered: number
  streak_days: number
}

interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: string
  profile: FriendProfile
}

export default function FriendsPage() {
  const { user } = useAuthStore()
  const [friends, setFriends] = useState<Friendship[]>([])
  const [pending, setPending] = useState<Friendship[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured || !user) { setLoading(false); return }
    loadFriends()
  }, [user])

  const loadFriends = async () => {
    if (!user) return
    setLoading(true)

    const { data: sent } = await supabase
      .from('friendships')
      .select('*, profile:profiles!friendships_friend_id_fkey(*)')
      .eq('user_id', user.id)
      .eq('status', 'accepted')

    const { data: received } = await supabase
      .from('friendships')
      .select('*, profile:profiles!friendships_user_id_fkey(*)')
      .eq('friend_id', user.id)
      .eq('status', 'accepted')

    const all = [...(sent || []), ...(received || [])].map(f => ({
      ...f,
      profile: f.profile as FriendProfile,
    }))
    setFriends(all)

    const { data: pendingData } = await supabase
      .from('friendships')
      .select('*, profile:profiles!friendships_user_id_fkey(*)')
      .eq('friend_id', user.id)
      .eq('status', 'pending')

    setPending((pendingData || []).map(f => ({ ...f, profile: f.profile as FriendProfile })))
    setLoading(false)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return
    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url, total_mastered, streak_days')
      .ilike('nickname', `%${searchQuery}%`)
      .neq('id', user.id)
      .limit(10)

    setSearchResults((data || []) as FriendProfile[])
    setSearching(false)
  }

  const sendRequest = async (friendId: string) => {
    if (!user) return
    await supabase.from('friendships').insert({ user_id: user.id, friend_id: friendId, status: 'pending' })
    setSearchResults(prev => prev.filter(p => p.id !== friendId))
  }

  const acceptRequest = async (friendshipId: string) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
    loadFriends()
  }

  const rejectRequest = async (friendshipId: string) => {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    loadFriends()
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Users size={48} className="text-text-tertiary mb-4" />
        <h2 className="text-xl font-bold text-text mb-2">好友</h2>
        <p className="text-text-secondary text-sm">配置 Supabase 后可使用好友功能</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">好友</h1>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="搜索用户昵称..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl text-text text-sm outline-none border border-border focus:border-primary transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          搜索
        </button>
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-secondary">搜索结果</h3>
          {searchResults.map(p => (
            <div key={p.id} className="bg-surface rounded-2xl p-4 border border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden shrink-0">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><User size={20} className="text-primary" /></div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-text">{p.nickname}</div>
                <div className="text-xs text-text-tertiary">已掌握 {p.total_mastered} 词</div>
              </div>
              <button
                onClick={() => sendRequest(p.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/15 transition-colors"
              >
                <UserPlus size={14} /> 添加
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pending requests */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-secondary">好友请求</h3>
          {pending.map(f => (
            <div key={f.id} className="bg-surface rounded-2xl p-4 border border-warning/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden shrink-0">
                {f.profile.avatar_url ? (
                  <img src={f.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><User size={20} className="text-primary" /></div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-text">{f.profile.nickname}</div>
                <div className="text-xs text-text-tertiary">想加你为好友</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => acceptRequest(f.id)} className="p-2 bg-success/10 text-success rounded-lg hover:bg-success/15">
                  <UserCheck size={16} />
                </button>
                <button onClick={() => rejectRequest(f.id)} className="p-2 bg-error/10 text-error rounded-lg hover:bg-error/15">
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friend list */}
      <div>
        <h3 className="text-sm font-semibold text-text-secondary mb-3">
          我的好友 ({friends.length})
        </h3>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : friends.length === 0 ? (
          <div className="bg-surface rounded-2xl p-8 border border-border text-center">
            <Users size={32} className="text-text-tertiary mx-auto mb-2" />
            <p className="text-text-secondary text-sm">还没有好友，搜索添加吧</p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-surface rounded-2xl p-4 border border-border flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden shrink-0">
                  {f.profile.avatar_url ? (
                    <img src={f.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><User size={20} className="text-primary" /></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-text">{f.profile.nickname}</div>
                  <div className="text-xs text-text-tertiary">
                    掌握 {f.profile.total_mastered} 词 · 连续 {f.profile.streak_days} 天
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
