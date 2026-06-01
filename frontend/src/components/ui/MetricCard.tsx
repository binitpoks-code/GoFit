type Trend = 'up' | 'down' | 'flat' | null

type Props = {
  label: string
  value: string | number
  unit?: string
  trend?: Trend
  sub?: string
  elevated?: boolean
}

export function MetricCard({ label, value, unit, trend, sub, elevated }: Props) {
  const trendColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#64748b'
  const trendChar = trend === 'up' ? '↑' : trend === 'down' ? '↓' : trend === 'flat' ? '→' : null

  return (
    <div
      className="rounded-xl p-5 transition-colors duration-200 hover:border-white/12"
      style={{
        background: elevated ? '#1e2231' : '#1a1d27',
        border: elevated ? 'none' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#64748b]">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-['DM_Serif_Display'] text-3xl text-[#f1f5f9]">{value}</span>
        {unit && <span className="text-sm text-[#64748b]">{unit}</span>}
        {trendChar && (
          <span className="text-sm font-medium" style={{ color: trendColor }}>{trendChar}</span>
        )}
      </div>
      {sub && <p className="mt-1 text-xs text-[#64748b]">{sub}</p>}
    </div>
  )
}
