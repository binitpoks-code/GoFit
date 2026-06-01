type Props = { score: number; size?: number; label?: string; sublabel?: string }

function scoreColor(s: number) {
  return s >= 70 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'
}

export function ScoreRing({ score, size = 120, label, sublabel }: Props) {
  const r = (size / 2) - 8
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = scoreColor(score)
  const cx = size / 2
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx={cx} cy={cx} r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
        />
        <text x={cx} y={cx - 4} textAnchor="middle" fontSize={size * 0.26} fontFamily="DM Serif Display, Georgia, serif" fill="#f1f5f9">
          {score}
        </text>
        <text x={cx} y={cx + size * 0.12} textAnchor="middle" fontSize={size * 0.09} fontFamily="Inter, sans-serif" fill="#64748b">
          / 100
        </text>
      </svg>
      {label && <p className="text-[11px] font-semibold uppercase tracking-widest text-[#64748b]">{label}</p>}
      {sublabel && <p className="text-xs text-[#94a3b8]">{sublabel}</p>}
    </div>
  )
}
