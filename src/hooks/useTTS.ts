import { useCallback, useRef } from 'react'
import { useSettingsStore } from '../stores/useSettingsStore'

function getAudioUrl(word: string, voice: 'en-GB' | 'en-US'): string {
  const type = voice === 'en-GB' ? 1 : 2
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${type}`
}

export function useTTS() {
  const { voiceType, speechRate, playCount } = useSettingsStore()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef(false)

  const speak = useCallback((text: string, onEnd?: () => void) => {
    abortRef.current = true
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    abortRef.current = false
    let count = 0

    const doPlay = () => {
      if (abortRef.current) return

      const audio = new Audio(getAudioUrl(text, voiceType))
      audio.playbackRate = speechRate
      audioRef.current = audio

      audio.onended = () => {
        count++
        if (count < playCount && !abortRef.current) {
          setTimeout(doPlay, 400)
        } else {
          onEnd?.()
        }
      }

      audio.onerror = () => {
        speakFallback(text, voiceType, speechRate, () => {
          count++
          if (count < playCount && !abortRef.current) {
            setTimeout(doPlay, 400)
          } else {
            onEnd?.()
          }
        })
      }

      audio.play().catch(() => {
        audio.onerror?.(new Event('error'))
      })
    }

    doPlay()
  }, [voiceType, speechRate, playCount])

  const stop = useCallback(() => {
    abortRef.current = true
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    window.speechSynthesis.cancel()
  }, [])

  return { speak, stop }
}

function speakFallback(text: string, lang: string, rate: number, onEnd?: () => void) {
  window.speechSynthesis.cancel()

  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = rate
    utterance.pitch = 1

    const voices = window.speechSynthesis.getVoices()
    const voice = voices.find(v => v.lang === lang)
      || voices.find(v => v.lang.startsWith(lang.split('-')[0]))
    if (voice) utterance.voice = voice

    utterance.onend = () => onEnd?.()
    utterance.onerror = () => onEnd?.()
    window.speechSynthesis.speak(utterance)
  }, 100)
}
