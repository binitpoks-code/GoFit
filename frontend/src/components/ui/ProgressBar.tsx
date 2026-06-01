import { useEffect, useRef, useState } from 'react'

type Props = {
  value: number
  max?: number
  color?: string
  height?: number
  label?: string
  showPct?: boolean
  animate?: boolean
}

export function ProgressBar({
  value,
  max = 100,
  color = '#10b981',
  height = 6,
  label,
  showPct,
  animate = true,
}: Props) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const [displayed, setDisplayed] = useState(animate ? 0 : pct)
  const mounted = useRef(false)

  useEffect(() => {
    if (!animate) { setDisplayed(pct); return }
    if (!mounted.current) {
      mounted.current = true
      const timer = setTimeout(() => setDisplayed(pct), 50)
      return () => clearTimeout(timer)
    }
    setDisplayed(pct)
  }, [pct, animate])

  return (
    <div className="w-full">
      {(label || showPct) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-xs text-[#64748b]">{label}</span>}
          {showPct && <span className="text-xs font-medium text-[#94a3b8]">{pct}%</span>}
        </div>
      )}
      <div
        className="w-full rounded-full"
        style={{ height, background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${displayed}%`, background: color }}
        />
      </div>
    </div>
  )
}
