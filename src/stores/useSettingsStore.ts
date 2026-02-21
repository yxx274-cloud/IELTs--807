import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings } from '../types'

interface SettingsState extends Settings {
  setVoiceType: (v: Settings['voiceType']) => void
  setSpeechRate: (r: number) => void
  setAutoPlay: (a: boolean) => void
  setDarkMode: (m: Settings['darkMode']) => void
  setPlayCount: (c: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      voiceType: 'en-GB',
      speechRate: 1.0,
      autoPlay: true,
      darkMode: 'system',
      playCount: 1,

      setVoiceType: (voiceType) => set({ voiceType }),
      setSpeechRate: (speechRate) => set({ speechRate }),
      setAutoPlay: (autoPlay) => set({ autoPlay }),
      setDarkMode: (darkMode) => set({ darkMode }),
      setPlayCount: (playCount) => set({ playCount }),
    }),
    { name: 'ielts-807-settings' }
  )
)
