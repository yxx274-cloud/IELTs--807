import { motion } from 'framer-motion'
import { Volume2, Globe, Gauge, Repeat, Moon, Play } from 'lucide-react'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useTTS } from '../hooks/useTTS'

export default function SettingsPage() {
  const {
    voiceType, speechRate, playCount, darkMode,
    setVoiceType, setSpeechRate, setPlayCount, setDarkMode,
  } = useSettingsStore()
  const { speak } = useTTS()

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-text">设置</h1>
        <p className="text-sm text-text-secondary mt-1">自定义你的练习体验</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl border border-border divide-y divide-border"
      >
        {/* Voice type */}
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <Globe size={18} className="text-primary" />
            <span className="font-medium text-text">发音口音</span>
          </div>
          <div className="flex gap-2">
            {([
              { value: 'en-GB' as const, label: '英式英语' },
              { value: 'en-US' as const, label: '美式英语' },
            ]).map(v => (
              <button
                key={v.value}
                onClick={() => setVoiceType(v.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  voiceType === v.value
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-surface-alt text-text-secondary hover:text-text'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Speech rate */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Gauge size={18} className="text-primary" />
              <span className="font-medium text-text">语速</span>
            </div>
            <span className="text-sm text-primary font-medium">{speechRate.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.1}
            value={speechRate}
            onChange={e => setSpeechRate(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-text-tertiary mt-1">
            <span>慢 0.5x</span>
            <span>正常 1.0x</span>
            <span>快 1.5x</span>
          </div>
        </div>

        {/* Play count */}
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <Repeat size={18} className="text-primary" />
            <span className="font-medium text-text">自动播放次数</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(c => (
              <button
                key={c}
                onClick={() => setPlayCount(c)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  playCount === c
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-surface-alt text-text-secondary hover:text-text'
                }`}
              >
                {c} 次
              </button>
            ))}
          </div>
        </div>

        {/* Dark mode */}
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <Moon size={18} className="text-primary" />
            <span className="font-medium text-text">深色模式</span>
          </div>
          <div className="flex gap-2">
            {([
              { value: 'system' as const, label: '跟随系统' },
              { value: 'light' as const, label: '浅色' },
              { value: 'dark' as const, label: '深色' },
            ]).map(m => (
              <button
                key={m.value}
                onClick={() => setDarkMode(m.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  darkMode === m.value
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-surface-alt text-text-secondary hover:text-text'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Test voice */}
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <Volume2 size={18} className="text-primary" />
            <span className="font-medium text-text">测试发音</span>
          </div>
          <button
            onClick={() => speak('vocabulary')}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/15 transition-colors"
          >
            <Play size={16} /> 播放 "vocabulary"
          </button>
        </div>
      </motion.div>
    </div>
  )
}
