import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface Profile {
  id: string
  nickname: string | null
  avatar_url: string | null
  streak_days: number
  last_check_in: string | null
  total_mastered: number
  is_public: boolean
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  initialized: boolean

  initialize: () => Promise<void>
  signUp: (email: string, password: string, nickname: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    if (!isSupabaseConfigured) {
      set({ loading: false, initialized: true })
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null })

    if (session?.user) {
      await get().fetchProfile()
    }

    set({ loading: false, initialized: true })

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, user: session?.user ?? null })
      if (session?.user) {
        await get().fetchProfile()
      } else {
        set({ profile: null })
      }
    })
  },

  signUp: async (email, password, nickname) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    })
    if (error) return { error: error.message }
    return { error: null }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, profile: null })
  },

  fetchProfile: async () => {
    const user = get().user
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) set({ profile: data as Profile })
  },

  updateProfile: async (updates) => {
    const user = get().user
    if (!user) return { error: '未登录' }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) return { error: error.message }
    await get().fetchProfile()
    return { error: null }
  },
}))
