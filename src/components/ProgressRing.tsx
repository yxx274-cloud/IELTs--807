import { motion } from 'framer-motion'
import { useId } from 'react'

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
  textClassName?: string
  trackClassName?: string
}

export default function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  label,
  sublabel,
  textClassName = 'text-text',
  trackClassName = 'text-border',
}: ProgressRingProps) {
  const id = useId()
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(progress, 1))

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={trackClassName}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6C5CE7" />
            <stop offset="100%" stopColor="#A29BFE" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${textClassName}`}>
          {Math.round(progress * 100)}%
        </span>
        {label && <span className={`text-xs mt-0.5 ${textClassName} opacity-80`}>{label}</span>}
        {sublabel && <span className={`text-[10px] ${textClassName} opacity-60`}>{sublabel}</span>}
      </div>
    </div>
  )
}
