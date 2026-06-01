import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { progressService, PROGRESS_UPDATED_EVENT } from '../services/progressService'
import { goalService } from '../services/goalService'
import { COACHING_KEY } from '../services/profileService'
import type { ProgressEntry, CoachingResponse } from '../types/coaching'
import type { UserGoal } from '../types/goals'
import { fromKilograms, getStoredWeightUnit } from '../utils/weightUnits'
import { getErrorMessage } from '../utils/getErrorMessage'
import { useAuth } from '../auth/useAuth'

/* ─── Types ─────────────────────────────────────────────────────── */
type TimeRange = '1W' | '1M' | '3M' | 'ALL'
type OverloadEntry = { date: string; exercise: string; weight: number; reps: number; unit: string }
type LinePoint = { label: string; value: number }
type BarPoint = { label: string; value: number; color: string }
type EnergySegment = { name: string; emoji: string; color: string; value: number }
type BannerStatus = 'ON_TRACK' | 'NEEDS_ATTENTION' | 'OFF_TRACK'

/* ─── Helpers ───────────────────────────────────────────────────── */
function filterByRange(entries: ProgressEntry[], range: TimeRange): ProgressEntry[] {
  if (range === 'ALL') return entries
  const days = range === '1W' ? 7 : range === '1M' ? 30 : 90
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return entries.filter((e) => e.date >= cutoffStr)
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function entryScore(e: ProgressEntry): number {
  if (e.recoveryScore && e.recoveryScore > 0) return e.recoveryScore
  const sleepScore = Math.min(Math.round(e.sleepHours * 12), 100)
  return Math.round((sleepScore + 70) / 2)
}

function perfScore(e: ProgressEntry): number {
  const p = e.workoutPerformance.toLowerCase()
  if (p.includes('excellent') || p.includes('crushed')) return 4
  if (p.includes('good') || p.includes('decent')) return 3
  if (p.includes('moderate') || p.includes('average')) return 2
  if (p.includes('poor') || p.includes('struggled')) return 1
  if (p.includes('rest')) return 0.5
  return 1
}

function perfLabel(score: number): string {
  if (score === 4) return 'Excellent'
  if (score === 3) return 'Good'
  if (score === 2) return 'Average'
  if (score === 1) return 'Poor'
  return 'Rest'
}

function perfColor(score: number): string {
  if (score >= 3.5) return '#10b981'
  if (score >= 2.5) return '#3b82f6'
  if (score >= 1.5) return '#f59e0b'
  if (score > 0) return '#ef4444'
  return '#64748b'
}

function scoreColor(score: number): string {
  return score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
}

function calc1RM(weight: number, reps: number): number {
  if (reps <= 0 || reps >= 37) return weight
  return Math.round(((weight * (1 + reps / 30)) + (weight * (36 / (37 - reps)))) / 2)
}

function calcBestStreak(entries: ProgressEntry[]): number {
  if (!entries.length) return 0
  const dates = [...new Set(entries.map((e) => e.date))].sort()
  let max = 1, cur = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + 'T00:00:00')
    const curr = new Date(dates[i] + 'T00:00:00')
    if (Math.round((curr.getTime() - prev.getTime()) / 86400000) === 1) {
      cur++; max = Math.max(max, cur)
    } else { cur = 1 }
  }
  return max
}

function avgNum(vals: number[]): number {
  return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0
}

/* ─── Smooth bezier path ────────────────────────────────────────── */
function smoothPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1], curr = pts[i]
    const cpx = (prev.x + curr.x) / 2
    d += ` C ${cpx.toFixed(1)},${prev.y.toFixed(1)} ${cpx.toFixed(1)},${curr.y.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`
  }
  return d
}

/* ─── Tooltip note ──────────────────────────────────────────────── */
function tooltipNote(chartId: string, value: number, unit: string, prevValue?: number): string {
  if (chartId === 'weight') {
    if (prevValue !== undefined) {
      const diff = value - prevValue
      if (Math.abs(diff) > 2) return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}${unit} (water?)`
      if (Math.abs(diff) >= 0.1) return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}${unit}`
    }
    return `${value.toFixed(1)} ${unit}`
  }
  if (chartId === 'recovery') {
    return value >= 70 ? `${value} — Good` : value >= 50 ? `${value} — Mod` : `${value} — Low`
  }
  if (chartId === 'strength') return `${Math.round(value)} ${unit} est.1RM`
  return `${value}`
}

/* ─── SVG constants ─────────────────────────────────────────────── */
const PW = 300, PH = 160
const PPL = 32, PPR = 12, PPT = 8, PPB = 22
const PCH = PH - PPT - PPB

/* ─── Inline highlight span ─────────────────────────────────────── */
function Hl({ children, color = '#10b981' }: { children: ReactNode; color?: string }) {
  return <span style={{ color, fontWeight: 600 }}>{children}</span>
}

/* ─── PremiumLineChart ──────────────────────────────────────────── */
function PremiumLineChart({
  data, color = '#10b981', unit = '', showGradient = true,
  idealPaceLine, outlierIndices, isRecovery = false, chartId = 'line', padRight = PPR,
}: {
  data: LinePoint[]
  color?: string
  unit?: string
  showGradient?: boolean
  idealPaceLine?: { startValue: number; endValue: number; label: string }
  outlierIndices?: Set<number>
  isRecovery?: boolean
  chartId?: string
  padRight?: number
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  if (data.length < 2) return null

  const cW = PW - PPL - padRight
  const vals = data.map(d => d.value)
  const rawMin = Math.min(...vals), rawMax = Math.max(...vals)
  const spread = Math.max(rawMax - rawMin, 1)
  const minV = isRecovery ? 0 : rawMin - spread * 0.1
  const maxV = isRecovery ? 100 : rawMax + spread * 0.1
  const vRange = maxV - minV

  const xOf = (i: number) => PPL + (i / (data.length - 1)) * cW
  const yOf = (v: number) => PPT + PCH - ((v - minV) / vRange) * PCH

  const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.value) }))
  const linePath = smoothPath(pts)
  const baseline = PPT + PCH
  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${baseline} L${pts[0].x.toFixed(1)},${baseline} Z`

  const n = data.length
  const xIdx = n <= 5 ? Array.from({ length: n }, (_, i) => i) : [0, Math.round(n * 0.33), Math.round(n * 0.66), n - 1]
  const yTicks = isRecovery ? [0, 50, 100] : [rawMin, (rawMin + rawMax) / 2, rawMax]
  const gradId = `plc_${chartId}`

  const hData = hoverIdx !== null ? data[hoverIdx] : null
  const tipText = hData
    ? `${hData.label} · ${tooltipNote(chartId, hData.value, unit, hoverIdx! > 0 ? data[hoverIdx! - 1].value : undefined)}`
    : ''
  const tipW = hData ? Math.min(150, Math.max(64, tipText.length * 4.8 + 14)) : 64
  const hx = hoverIdx !== null ? xOf(hoverIdx) : PPL
  const hy = hoverIdx !== null ? yOf(data[hoverIdx].value) : PPT
  const tipX = Math.min(Math.max(PPL, hx - tipW / 2), PW - padRight - tipW)
  const tipY = Math.max(PPT + 2, hy - 30)

  return (
    <svg viewBox={`0 0 ${PW} ${PH}`} width="100%" height="160"
      preserveAspectRatio="xMidYMid meet" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.16" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {isRecovery && (
        <>
          <rect x={PPL} y={yOf(100)} width={cW} height={yOf(70) - yOf(100)} fill="rgba(16,185,129,0.06)" />
          <rect x={PPL} y={yOf(70)} width={cW} height={yOf(50) - yOf(70)} fill="rgba(245,158,11,0.05)" />
          <rect x={PPL} y={yOf(50)} width={cW} height={yOf(0) - yOf(50)} fill="rgba(239,68,68,0.05)" />
          <line x1={PPL} x2={PW - padRight} y1={yOf(70)} y2={yOf(70)}
            stroke="#10b981" strokeWidth="0.75" strokeDasharray="4 3" opacity="0.45" />
          <text x={PW - padRight + 2} y={yOf(70) + 3} fontSize="7.5" fill="#10b981" fontFamily="Inter, sans-serif">Good</text>
          <line x1={PPL} x2={PW - padRight} y1={yOf(50)} y2={yOf(50)}
            stroke="#f59e0b" strokeWidth="0.75" strokeDasharray="4 3" opacity="0.45" />
          <text x={PW - padRight + 2} y={yOf(50) + 3} fontSize="7.5" fill="#f59e0b" fontFamily="Inter, sans-serif">Mod</text>
        </>
      )}

      {yTicks.map((v, i) => (
        <line key={i} x1={PPL} x2={PW - padRight} y1={yOf(v)} y2={yOf(v)}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}

      {showGradient && <path d={areaPath} fill={`url(#${gradId})`} />}

      {idealPaceLine && (
        <>
          <line x1={xOf(0)} y1={yOf(idealPaceLine.startValue)} x2={xOf(n - 1)} y2={yOf(idealPaceLine.endValue)}
            stroke="#64748b" strokeWidth="1" strokeDasharray="5 3" opacity="0.55" />
          <text x={xOf(n - 1) + 3} y={yOf(idealPaceLine.endValue) + 3}
            fontSize="8" fill="rgba(255,255,255,0.35)" fontFamily="Inter, sans-serif">{idealPaceLine.label}</text>
        </>
      )}

      <path d={linePath} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />

      {data.map((d, i) => {
        const dc = isRecovery
          ? (d.value >= 70 ? '#10b981' : d.value >= 50 ? '#f59e0b' : '#ef4444')
          : (outlierIndices?.has(i) ? '#f59e0b' : color)
        const isHov = hoverIdx === i
        return (
          <g key={i}>
            {isHov && <circle cx={xOf(i)} cy={yOf(d.value)} r={7} fill={dc} opacity={0.12} />}
            <circle cx={xOf(i)} cy={yOf(d.value)} r={isHov ? 4 : 2.5}
              fill={isHov ? dc : '#0f0f0f'} stroke={dc} strokeWidth="1.5" />
            <circle cx={xOf(i)} cy={yOf(d.value)} r={10} fill="transparent"
              onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}
              style={{ cursor: 'crosshair' }} />
          </g>
        )
      })}

      {hData && (
        <g style={{ pointerEvents: 'none' }}>
          <rect x={tipX} y={tipY} width={tipW} height={18} rx={5}
            fill="#080808" stroke="rgba(255,255,255,0.14)" strokeWidth="0.75" />
          <text x={tipX + tipW / 2} y={tipY + 12.5}
            textAnchor="middle" fontSize={9} fill="#ffffff"
            fontFamily="Inter, sans-serif" fontWeight="500">{tipText}</text>
        </g>
      )}

      {yTicks.map((v, i) => (
        <text key={i} x={PPL - 4} y={yOf(v) + 3} textAnchor="end" fontSize={8.5} fill="rgba(255,255,255,0.35)" fontFamily="Inter, sans-serif">
          {isRecovery ? v : (Math.round(v * 10) / 10)}{isRecovery ? '' : unit}
        </text>
      ))}

      {xIdx.map(i => (
        <text key={i} x={xOf(i)} y={PH - 4} textAnchor="middle" fontSize={8.5} fill="rgba(255,255,255,0.35)" fontFamily="Inter, sans-serif">
          {data[i].label}
        </text>
      ))}
    </svg>
  )
}

/* ─── PremiumBarChart ───────────────────────────────────────────── */
function PremiumBarChart({
  data, maxValue = 10, refLine, rightLabels, avgLine, trendArrow, chartId = 'bar',
}: {
  data: BarPoint[]
  maxValue?: number
  refLine?: { value: number; label: string; color: string }
  rightLabels?: Array<{ value: number; label: string; color: string }>
  avgLine?: { value: number; label: string }
  trendArrow?: 'up' | 'down' | 'flat'
  chartId?: string
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  if (data.length === 0) return null

  const hasRight = !!(refLine || rightLabels || avgLine)
  const padR = hasRight ? 36 : PPR
  const cW = PW - PPL - padR
  const n = data.length
  const gap = Math.max(1.5, Math.min(4, cW * 0.015))
  const barW = Math.max(4, (cW - gap * (n - 1)) / n)

  const xOf = (i: number) => PPL + i * (barW + gap)
  const yOf = (v: number) => PPT + PCH - (Math.min(v, maxValue) / maxValue) * PCH
  const barH = (v: number) => Math.max(2, (Math.min(v, maxValue) / maxValue) * PCH)

  const labelIdx = n <= 6 ? Array.from({ length: n }, (_, i) => i)
    : [0, Math.round(n * 0.25), Math.round(n * 0.5), Math.round(n * 0.75), n - 1]

  const hData = hoverIdx !== null ? data[hoverIdx] : null
  const tipText = hData
    ? (chartId === 'sleep' ? `${hData.value.toFixed(1)}h` : `${hData.value} / ${maxValue}`)
    : ''
  const tipW = hData ? Math.max(44, tipText.length * 6 + 14) : 44
  const hx = hoverIdx !== null ? xOf(hoverIdx) + barW / 2 : PPL
  const hy = hoverIdx !== null ? yOf(data[hoverIdx].value) : PPT
  const tipX = Math.min(Math.max(PPL, hx - tipW / 2), PW - padR - tipW)
  const tipY = Math.max(PPT + 2, hy - 26)

  return (
    <svg viewBox={`0 0 ${PW} ${PH}`} width="100%" height="160"
      preserveAspectRatio="xMidYMid meet" style={{ display: 'block', overflow: 'visible' }}>

      {[0.25, 0.5, 0.75, 1].map((pct, i) => (
        <line key={i} x1={PPL} x2={PW - padR}
          y1={PPT + PCH - pct * PCH} y2={PPT + PCH - pct * PCH}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}

      {refLine && (
        <>
          <line x1={PPL} x2={PW - padR} y1={yOf(refLine.value)} y2={yOf(refLine.value)}
            stroke={refLine.color} strokeWidth="0.75" strokeDasharray="4 3" opacity="0.55" />
          <text x={PW - padR + 3} y={yOf(refLine.value) + 3}
            fontSize="8" fill={refLine.color} fontFamily="Inter, sans-serif">{refLine.label}</text>
        </>
      )}

      {rightLabels && rightLabels.map((rl, i) => (
        <text key={i} x={PW - padR + 3} y={yOf(rl.value) + 3}
          fontSize="7.5" fill={rl.color} fontFamily="Inter, sans-serif">{rl.label}</text>
      ))}

      {[0, maxValue / 2, maxValue].map((v, i) => (
        <text key={i} x={PPL - 4} y={yOf(v) + 3}
          textAnchor="end" fontSize={8.5} fill="rgba(255,255,255,0.35)" fontFamily="Inter, sans-serif">{v}</text>
      ))}

      {data.map((d, i) => {
        const isHov = hoverIdx === i
        return (
          <g key={i}>
            <rect x={xOf(i)} y={yOf(d.value)} width={barW} height={barH(d.value)}
              fill={d.color} rx="3" ry="3" opacity={hoverIdx === null || isHov ? 1 : 0.65} />
            <rect x={xOf(i)} y={PPT} width={barW} height={PCH} fill="transparent"
              onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}
              style={{ cursor: 'crosshair' }} />
          </g>
        )
      })}

      {avgLine && (
        <>
          <line x1={PPL} x2={PW - padR} y1={yOf(avgLine.value)} y2={yOf(avgLine.value)}
            stroke="rgba(255,255,255,0.22)" strokeWidth="1" strokeDasharray="5 3" />
          <text x={PW - padR + 3} y={yOf(avgLine.value) + 3}
            fontSize="7.5" fill="rgba(255,255,255,0.3)" fontFamily="Inter, sans-serif">{avgLine.label}</text>
        </>
      )}

      {trendArrow && (
        <text x={PW - padR - 16} y={PPT + 10} fontSize="11" fontWeight="700"
          fill={trendArrow === 'up' ? '#10b981' : trendArrow === 'down' ? '#ef4444' : '#64748b'}
          fontFamily="Inter, sans-serif">
          {trendArrow === 'up' ? '↑' : trendArrow === 'down' ? '↓' : '→'}
        </text>
      )}

      {labelIdx.map(i => (
        <text key={i} x={xOf(i) + barW / 2} y={PH - 4}
          textAnchor="middle" fontSize={8.5} fill="rgba(255,255,255,0.35)" fontFamily="Inter, sans-serif">
          {data[i].label}
        </text>
      ))}

      {hData && (
        <g style={{ pointerEvents: 'none' }}>
          <rect x={tipX} y={tipY} width={tipW} height={17} rx={4}
            fill="#080808" stroke="rgba(255,255,255,0.14)" strokeWidth="0.75" />
          <text x={tipX + tipW / 2} y={tipY + 11.5}
            textAnchor="middle" fontSize={9} fill="#ffffff"
            fontFamily="Inter, sans-serif" fontWeight="500">{tipText}</text>
        </g>
      )}
    </svg>
  )
}

/* ─── SVGDonutChart ─────────────────────────────────────────────── */
function polarToCart(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg - 90) * Math.PI / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

function donutArc(cx: number, cy: number, ir: number, or: number, sa: number, ea: number): string {
  const [x1o, y1o] = polarToCart(cx, cy, or, sa)
  const [x2o, y2o] = polarToCart(cx, cy, or, ea)
  const [x1i, y1i] = polarToCart(cx, cy, ir, sa)
  const [x2i, y2i] = polarToCart(cx, cy, ir, ea)
  const large = ea - sa > 180 ? 1 : 0
  return `M ${x1o.toFixed(2)} ${y1o.toFixed(2)} A ${or} ${or} 0 ${large} 1 ${x2o.toFixed(2)} ${y2o.toFixed(2)} L ${x2i.toFixed(2)} ${y2i.toFixed(2)} A ${ir} ${ir} 0 ${large} 0 ${x1i.toFixed(2)} ${y1i.toFixed(2)} Z`
}

function SVGDonutChart({ segments }: { segments: EnergySegment[] }) {
  const filled = segments.filter(s => s.value > 0)
  const total = filled.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null

  const cx = 68, cy = 68, outerR = 54, innerR = 35
  let angle = 0
  const arcs = filled.map(seg => {
    const span = (seg.value / total) * 360
    const start = angle
    angle += span
    return { ...seg, sa: start, ea: angle - 0.5 }
  })
  const dominant = [...filled].sort((a, b) => b.value - a.value)[0]

  return (
    <svg viewBox="0 0 136 136" width="136" height="136" style={{ display: 'block', flexShrink: 0 }}>
      {filled.length === 1 ? (
        <>
          <circle cx={cx} cy={cy} r={outerR} fill={filled[0].color} />
          <circle cx={cx} cy={cy} r={innerR} fill="#0f0f0f" />
        </>
      ) : (
        arcs.map((seg, i) => (
          <path key={i} d={donutArc(cx, cy, innerR, outerR, seg.sa, seg.ea)} fill={seg.color} />
        ))
      )}
      {dominant && (
        <>
          <text x={cx} y={cy - 3} textAnchor="middle" fontSize="18"
            fontFamily="Inter, sans-serif" fill={dominant.color}>{dominant.emoji}</text>
          <text x={cx} y={cx + 13} textAnchor="middle" fontSize="9" fontWeight="600"
            fontFamily="Inter, sans-serif" fill={dominant.color}>{dominant.name}</text>
        </>
      )}
    </svg>
  )
}

/* ─── SVGDayHeatmap ─────────────────────────────────────────────── */
function SVGDayHeatmap({ data }: { data: Array<{ day: string; value: number; count: number }> }) {
  const DVW = 260, DVH = 160
  const pl = 30, pr = 26, pt = 4
  const rowH = (DVH - pt) / 7
  const bW = DVW - pl - pr
  const best = [...data].filter(d => d.count > 0).sort((a, b) => b.value - a.value)[0]

  const barColor = (v: number, c: number) => c === 0 ? '#141414' : v >= 80 ? '#10b981' : v >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <svg viewBox={`0 0 ${DVW} ${DVH}`} width="100%"
      preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      {data.map((d, i) => {
        const y = pt + i * rowH
        const fillW = d.count > 0 ? Math.max(2, (d.value / 100) * bW) : 4
        const isBest = best?.day === d.day
        return (
          <g key={d.day}>
            <text x={pl - 4} y={y + rowH * 0.66}
              textAnchor="end" fontSize="9" fontFamily="Inter, sans-serif"
              fill={isBest ? '#f1f5f9' : '#64748b'}
              fontWeight={isBest ? '600' : '400'}>
              {d.day}
            </text>
            <rect x={pl} y={y + rowH * 0.2} width={bW} height={rowH * 0.58}
              fill="rgba(255,255,255,0.03)" rx="3" />
            <rect x={pl} y={y + rowH * 0.2} width={fillW.toFixed(1)} height={rowH * 0.58}
              fill={barColor(d.value, d.count)} rx="3" opacity={isBest ? '1' : '0.8'} />
            {d.count > 0 && (
              <text x={pl + fillW + 4} y={y + rowH * 0.66}
                fontSize="9" fill="rgba(255,255,255,0.35)" fontFamily="Inter, sans-serif">{d.value}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

/* ─── ChartReading ──────────────────────────────────────────────── */
function ChartReading({ dot, text }: { dot: string; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2 mt-2" style={{ background: '#080808' }}>
      <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: dot }} />
      <p className="text-[11px] text-[rgba(255,255,255,0.55)] leading-snug">{text}</p>
    </div>
  )
}

/* ─── AnimatedCounter ───────────────────────────────────────────── */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (target === 0) { setV(0); return }
    const steps = 24, dur = 700
    let cur = 0
    const tick = setInterval(() => {
      cur = Math.min(cur + target / steps, target)
      setV(Math.round(cur))
      if (cur >= target) clearInterval(tick)
    }, dur / steps)
    return () => clearInterval(tick)
  }, [target])
  return <>{v}{suffix}</>
}

/* ─── MetricCard ────────────────────────────────────────────────── */
function MetricCard({ label, value, sub, unit = '', trendText, trendColor }: {
  label: string; value: number; sub?: string; unit?: string; trendText?: string; trendColor?: string
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#141414' }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">{label}</p>
      <p className="mt-1.5 font-['DM_Serif_Display'] text-2xl text-white">
        <AnimatedCounter target={value} />{unit}
      </p>
      {sub && <p className="mt-0.5 text-xs text-[rgba(255,255,255,0.35)]">{sub}</p>}
      {trendText && <p className="mt-0.5 text-xs" style={{ color: trendColor ?? '#64748b' }}>{trendText}</p>}
    </div>
  )
}

/* ─── ProgressBanner ────────────────────────────────────────────── */
function ProgressBanner({ status, mainText, subText }: {
  status: BannerStatus
  mainText: string
  subText: string
}) {
  const cfg = {
    ON_TRACK:        { bg: 'rgba(16,185,129,0.08)',  border: '#10b981', label: 'On Track',        color: '#10b981' },
    NEEDS_ATTENTION: { bg: 'rgba(245,158,11,0.08)',  border: '#f59e0b', label: 'Needs Attention', color: '#f59e0b' },
    OFF_TRACK:       { bg: 'rgba(239,68,68,0.08)',   border: '#ef4444', label: 'Off Track',       color: '#ef4444' },
  }[status]
  return (
    <div className="rounded-r-xl px-4 py-3" style={{ background: cfg.bg, borderLeft: `3px solid ${cfg.border}` }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: cfg.color }}>
        {cfg.label}
      </p>
      <p className="text-sm font-medium text-white">{mainText}</p>
      <p className="mt-0.5 text-xs text-[rgba(255,255,255,0.55)]">{subText}</p>
    </div>
  )
}

/* ─── CoachingMessage ───────────────────────────────────────────── */
function CoachingMessage({
  username, weightData, avgRecovery, avgSleep, checkInCount,
  isWeightGainGoal, isWeightLossGoal, unit, weightChange,
}: {
  username: string
  weightData: LinePoint[]
  avgRecovery: number
  avgSleep: number
  checkInCount: number
  isWeightGainGoal: boolean
  isWeightLossGoal: boolean
  unit: string
  weightChange: number | null
}) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const name = username ? username.charAt(0).toUpperCase() + username.slice(1) : 'there'

  let bodyText: ReactNode

  if (checkInCount === 0) {
    bodyText = <>Start logging check-ins to see your personalized summary here.</>
  } else {
    const recovColor = avgRecovery >= 70 ? '#10b981' : avgRecovery >= 50 ? '#f59e0b' : '#ef4444'
    const recovStatus = avgRecovery >= 70 ? 'excellent' : avgRecovery >= 50 ? 'moderate' : 'low'
    const sleepColor = avgSleep >= 7.5 ? '#10b981' : avgSleep >= 6 ? '#f59e0b' : '#ef4444'
    const sleepStatus = avgSleep >= 7.5 ? 'solid' : avgSleep >= 6 ? 'adequate' : 'short'

    let weightNode: ReactNode = null
    if (weightData.length >= 2 && weightChange !== null) {
      const abs = Math.abs(weightChange).toFixed(1)
      if (isWeightLossGoal && weightChange < 0)
        weightNode = <> Down <Hl>{abs}{unit}</Hl> — on pace for your fat loss goal.</>
      else if (isWeightGainGoal && weightChange > 0)
        weightNode = <> Up <Hl>{abs}{unit}</Hl> — building in the right direction.</>
      else if (Math.abs(weightChange) < 0.5)
        weightNode = <> Weight holding steady.</>
      else
        weightNode = <> Weight {weightChange > 0 ? 'up' : 'down'} <Hl color="#94a3b8">{abs}{unit}</Hl>.</>
    }

    bodyText = (
      <>
        <Hl>{checkInCount}</Hl> check-in{checkInCount !== 1 ? 's' : ''} logged.{' '}
        Recovery avg <Hl color={recovColor}>{avgRecovery}/100</Hl> ({recovStatus})
        {avgSleep > 0 && <>, sleep avg <Hl color={sleepColor}>{avgSleep.toFixed(1)}h</Hl> ({sleepStatus})</>}.
        {weightNode}
      </>
    )
  }

  return (
    <div className="rounded-xl px-5 py-4"
      style={{ background: 'linear-gradient(135deg, #0f1620 0%, #0f0f0f 100%)', border: '1px solid rgba(16,185,129,0.15)' }}>
      <p className="font-['DM_Serif_Display'] text-[18px] text-white mb-1.5">{greeting}, {name}.</p>
      <p className="text-sm leading-6 text-[rgba(255,255,255,0.55)]">{bodyText}</p>
    </div>
  )
}

/* ─── Main ──────────────────────────────────────────────────────── */
function AnalyticsPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<ProgressEntry[]>([])
  const [goals, setGoals] = useState<UserGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [range, setRange] = useState<TimeRange>('1M')
  const [activeExercise, setActiveExercise] = useState('')
  const unit = getStoredWeightUnit()

  const [coaching] = useState<CoachingResponse | null>(() => {
    try { return JSON.parse(localStorage.getItem(COACHING_KEY) ?? '') as CoachingResponse } catch { return null }
  })
  const [overloadEntries] = useState<OverloadEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('gofit.overload') ?? '[]') as OverloadEntry[] } catch { return [] }
  })

  const storedTarget = useMemo(() => {
    try {
      const raw = localStorage.getItem('gofit.target')
      return raw ? JSON.parse(raw) as { goal: string; weakAreas: string[] } : null
    } catch { return null }
  }, [])

  useEffect(() => {
    let mounted = true
    async function load(showLoading = true) {
      if (showLoading) setIsLoading(true)
      try {
        const [progressData, goalsData] = await Promise.all([
          progressService.getProgressEntries().catch(() => [] as ProgressEntry[]),
          goalService.getGoals().catch(() => [] as UserGoal[]),
        ])
        if (!mounted) return
        setEntries([...progressData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
        setGoals(goalsData)
      } catch (e) {
        if (mounted) setError(getErrorMessage(e))
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    const refresh = () => load(false)
    window.addEventListener(PROGRESS_UPDATED_EVENT, refresh)
    return () => { mounted = false; window.removeEventListener(PROGRESS_UPDATED_EVENT, refresh) }
  }, [])

  const filtered = useMemo(() => filterByRange(entries, range), [entries, range])
  const chartEntries = useMemo(
    () => [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [filtered],
  )
  const activeGoal = goals.find((g) => g.active) ?? null

  const checkInCount = filtered.length
  const avgRecovery = avgNum(filtered.map(entryScore))
  const weightEntries = chartEntries.filter((e) => e.bodyWeight > 0 && e.bodyWeight <= 200)
  const weightChange = weightEntries.length >= 2
    ? fromKilograms(weightEntries[weightEntries.length - 1].bodyWeight, unit)
      - fromKilograms(weightEntries[0].bodyWeight, unit)
    : null
  const bestStreak = calcBestStreak(filtered)

  const goalType = activeGoal?.goalType?.toLowerCase() ?? ''
  const isWeightGainGoal = goalType.includes('muscle') || goalType.includes('bulk')
  const isWeightLossGoal = goalType.includes('fat') || goalType.includes('cut')
  const weightOnTrack = weightChange !== null && (
    (isWeightGainGoal && weightChange > 0) || (isWeightLossGoal && weightChange < 0)
  )

  const weightData = useMemo<LinePoint[]>(() => {
    const byDate: Record<string, number[]> = {}
    for (const e of weightEntries) {
      if (!byDate[e.date]) byDate[e.date] = []
      byDate[e.date].push(e.bodyWeight)
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, ws]) => ({
        label: fmtDate(date),
        value: parseFloat(fromKilograms(ws.reduce((s, v) => s + v, 0) / ws.length, unit).toFixed(1)),
      }))
  }, [weightEntries, unit])

  const recoveryData = useMemo<LinePoint[]>(
    () => chartEntries.map(e => ({ label: fmtDate(e.date), value: entryScore(e) })),
    [chartEntries],
  )

  const sleepData = useMemo<BarPoint[]>(
    () => chartEntries.filter(e => e.sleepHours > 0).map(e => ({
      label: fmtDate(e.date),
      value: parseFloat(e.sleepHours.toFixed(1)),
      color: e.sleepHours >= 7.5 ? '#10b981' : e.sleepHours >= 6 ? '#f59e0b' : '#ef4444',
    })),
    [chartEntries],
  )

  const trainingData = useMemo<BarPoint[]>(
    () => chartEntries.map(e => {
      const v = perfScore(e)
      return { label: fmtDate(e.date), value: v, color: perfColor(v) }
    }),
    [chartEntries],
  )

  const weightOutlierIndices = useMemo(() => {
    const s = new Set<number>()
    for (let i = 1; i < weightData.length; i++) {
      if (Math.abs(weightData[i].value - weightData[i - 1].value) > 2) s.add(i)
    }
    return s
  }, [weightData])

  const idealPaceLineData = useMemo((): { startValue: number; endValue: number; label: string } | null => {
    if (weightData.length < 2 || weightEntries.length < 2) return null
    const goalStr = (storedTarget?.goal ?? activeGoal?.goalType ?? '').toLowerCase()
    const isFatLoss = goalStr.includes('fat') || goalStr.includes('cut')
    const isMuscleGain = goalStr.includes('muscle') || goalStr.includes('bulk')
    if (!isFatLoss && !isMuscleGain) return null
    const startVal = weightData[0].value
    const weeks = Math.max(0.5,
      (new Date(weightEntries[weightEntries.length - 1].date).getTime()
        - new Date(weightEntries[0].date).getTime()) / (7 * 86400000)
    )
    const ratePerWeek = isFatLoss ? -0.75 : 0.5
    return { startValue: startVal, endValue: startVal + ratePerWeek * weeks, label: 'Ideal pace' }
  }, [weightData, weightEntries, storedTarget, activeGoal])

  const avgSleepLine = useMemo(() => {
    if (sleepData.length < 2) return undefined
    const avg = sleepData.reduce((s, d) => s + d.value, 0) / sleepData.length
    return { value: parseFloat(avg.toFixed(1)), label: `avg ${avg.toFixed(1)}h` }
  }, [sleepData])

  const perfTrendArrow = useMemo((): 'up' | 'down' | 'flat' | undefined => {
    if (trainingData.length < 4) return undefined
    const first3 = trainingData.slice(0, 3).reduce((s, d) => s + d.value, 0) / 3
    const last3 = trainingData.slice(-3).reduce((s, d) => s + d.value, 0) / 3
    if (last3 > first3 + 0.25) return 'up'
    if (last3 < first3 - 0.25) return 'down'
    return 'flat'
  }, [trainingData])

  const weightTrendColor = useMemo(() => {
    if (weightData.length < 2) return '#64748b'
    const lastDelta = weightData[weightData.length - 1].value - weightData[weightData.length - 2].value
    if (Math.abs(lastDelta) > 2) return '#f59e0b'
    const diff = weightData[weightData.length - 1].value - weightData[0].value
    if (isWeightGainGoal) return diff > 0 ? '#10b981' : '#f59e0b'
    if (isWeightLossGoal) return diff < 0 ? '#10b981' : '#f59e0b'
    return '#94a3b8'
  }, [weightData, isWeightGainGoal, isWeightLossGoal])

  const weightTrendText = useMemo(() => {
    if (weightData.length < 2) return ''
    const lastDelta = weightData[weightData.length - 1].value - weightData[weightData.length - 2].value
    if (lastDelta < -2) {
      return `A ${Math.abs(lastDelta).toFixed(1)}${unit} drop overnight is almost certainly water weight, not fat loss. True fat loss is 0.5–1${unit}/week max.`
    }
    if (lastDelta > 2) {
      return `Gaining ${lastDelta.toFixed(1)}${unit} quickly points to water retention from carbs or sodium. True fat gain takes consistent surplus over many days.`
    }
    const diff = weightData[weightData.length - 1].value - weightData[0].value
    const dir = diff > 0 ? 'up' : 'down'
    const abs = Math.abs(diff).toFixed(1)
    const base = `Trending ${dir} ${abs}${unit} total`
    if (isWeightGainGoal) return diff > 0 ? `${base} — On track ✅` : `${base} — Below target ⚠️`
    if (isWeightLossGoal) return diff < 0 ? `${base} — On track ✅` : `${base} — Above target ⚠️`
    return base
  }, [weightData, unit, isWeightGainGoal, isWeightLossGoal])

  const avgRecoveryScore = avgNum(recoveryData.map(d => d.value))
  const recoveryReadingText = avgRecoveryScore >= 80
    ? `Avg ${avgRecoveryScore}/100 — Excellent ✅`
    : avgRecoveryScore >= 60 ? `Avg ${avgRecoveryScore}/100 — Good 👍`
    : avgRecoveryScore >= 40 ? `Avg ${avgRecoveryScore}/100 — Moderate 🟡`
    : `Avg ${avgRecoveryScore}/100 — Poor ⚠️`

  const avgSleep = filtered.length
    ? Math.round((filtered.reduce((s, e) => s + e.sleepHours, 0) / filtered.length) * 10) / 10
    : 0
  const sleepReadingText = sleepData.length >= 2
    ? avgSleep >= 7.5 ? `Avg ${avgSleep.toFixed(1)}h — Great sleep ✅`
    : avgSleep >= 6 ? `Avg ${avgSleep.toFixed(1)}h — Average sleep 👍`
    : `Avg ${avgSleep.toFixed(1)}h — Poor sleep ⚠️`
    : ''
  const sleepReadingColor = avgSleep >= 7.5 ? '#10b981' : avgSleep >= 6 ? '#f59e0b' : '#ef4444'

  const avgPerf = trainingData.length > 0
    ? trainingData.reduce((s, d) => s + d.value, 0) / trainingData.length : 0
  const perfReadingText = avgPerf >= 3.5 ? 'Consistently strong sessions ✅'
    : avgPerf >= 2.5 ? 'Good training consistency 👍'
    : avgPerf >= 1.5 ? 'Mixed performance 🟡'
    : 'Struggling — check your recovery ⚠️'
  const perfReadingColor = perfColor(avgPerf)

  const progressBannerData = useMemo((): { status: BannerStatus; mainText: string; subText: string } | null => {
    if (weightEntries.length < 3) return null
    const goalStr = (storedTarget?.goal ?? activeGoal?.goalType ?? '').toLowerCase()
    const isFatLoss = goalStr.includes('fat') || goalStr.includes('cut')
    const isMuscleGain = goalStr.includes('muscle') || goalStr.includes('bulk')
    const isMaintenance = goalStr.includes('maintain')
    const weeks = Math.max(0.5,
      (new Date(weightEntries[weightEntries.length - 1].date).getTime()
        - new Date(weightEntries[0].date).getTime()) / (7 * 86400000)
    )
    const wDelta = fromKilograms(weightEntries[weightEntries.length - 1].bodyWeight, unit)
      - fromKilograms(weightEntries[0].bodyWeight, unit)
    const weeklyRate = wDelta / weeks
    const avgRec = avgNum(recoveryData.map(d => d.value))

    if (isFatLoss) {
      if (weeklyRate <= -0.5 && weeklyRate >= -2 && avgRec >= 60)
        return { status: 'ON_TRACK', mainText: `You're on track toward your Fat Loss goal.`, subText: `Weight trending down at ${Math.abs(weeklyRate).toFixed(2)}${unit}/week. Keep your current approach consistent.` }
      if (weeklyRate < -2)
        return { status: 'NEEDS_ATTENTION', mainText: `Losing weight faster than ideal.`, subText: `Losing ${Math.abs(weeklyRate).toFixed(2)}${unit}/week. Add ~200 kcal to protect muscle. Safe fat loss is 0.5–2${unit}/week.` }
      if (Math.abs(weeklyRate) < 0.1 && weightEntries.length >= 5)
        return { status: 'NEEDS_ATTENTION', mainText: `Progress has stalled.`, subText: `Weight stable for ${weightEntries.length} entries. Try cutting 200 kcal or adding 20-min cardio.` }
      if (weeklyRate > 0.1)
        return { status: 'OFF_TRACK', mainText: `Progress is off track.`, subText: `Weight increasing on a Fat Loss goal (+${weeklyRate.toFixed(2)}${unit}/week). Review calorie intake.` }
    }
    if (isMuscleGain) {
      if (weeklyRate >= 0.25 && weeklyRate <= 1 && avgRec >= 60)
        return { status: 'ON_TRACK', mainText: `You're on track toward your Muscle Gain goal.`, subText: `Weight trending up at +${weeklyRate.toFixed(2)}${unit}/week. Keep your current approach consistent.` }
      if (weeklyRate > 1.5)
        return { status: 'NEEDS_ATTENTION', mainText: `Gaining faster than optimal.`, subText: `+${weeklyRate.toFixed(2)}${unit}/week is higher than ideal. Reduce calories by ~200 kcal.` }
      if (weeklyRate < 0)
        return { status: 'OFF_TRACK', mainText: `Progress is off track.`, subText: `Weight decreasing on a Muscle Gain goal. Increase intake by 200–300 kcal.` }
    }
    if (isMaintenance && Math.abs(wDelta) <= 1)
      return { status: 'ON_TRACK', mainText: `You're maintaining your weight well.`, subText: `Weight within ±1${unit}. Excellent stability.` }
    if (avgRec < 40)
      return { status: 'OFF_TRACK', mainText: `Recovery critically low (${avgRec}/100).`, subText: `Prioritize 7–9 hours of sleep and reduce training stress temporarily.` }
    if (avgRec < 60)
      return { status: 'NEEDS_ATTENTION', mainText: `Recovery needs improvement (${avgRec}/100).`, subText: `Improve sleep quality and monitor fatigue levels daily.` }
    return null
  }, [weightEntries, recoveryData, storedTarget, activeGoal, unit])

  const orm1Data = useMemo(() => {
    const grouped: Record<string, Array<{ date: string; orm: number }>> = {}
    for (const entry of overloadEntries) {
      const orm = calc1RM(entry.weight, entry.reps)
      if (!grouped[entry.exercise]) grouped[entry.exercise] = []
      grouped[entry.exercise].push({ date: entry.date, orm })
    }
    for (const k of Object.keys(grouped)) {
      grouped[k].sort((a, b) => a.date.localeCompare(b.date))
    }
    return grouped
  }, [overloadEntries])

  const exerciseList = Object.keys(orm1Data)
  const selectedExercise = activeExercise || exerciseList[0] || ''
  const strengthChartData: LinePoint[] = selectedExercise
    ? orm1Data[selectedExercise].map(d => ({ label: fmtDate(d.date), value: d.orm }))
    : []
  const strengthImprovement = selectedExercise && orm1Data[selectedExercise]?.length >= 2
    ? orm1Data[selectedExercise][orm1Data[selectedExercise].length - 1].orm - orm1Data[selectedExercise][0].orm
    : null

  const energyDist = useMemo<EnergySegment[]>(() => {
    const cats: EnergySegment[] = [
      { name: 'Great', emoji: '🔥', color: '#10b981', value: 0 },
      { name: 'Good', emoji: '💪', color: '#3b82f6', value: 0 },
      { name: 'Okay', emoji: '😐', color: '#f59e0b', value: 0 },
      { name: 'Tired', emoji: '😴', color: '#ef4444', value: 0 },
    ]
    for (const e of filtered) {
      const fl = (e.fatigueLevel ?? '').toLowerCase()
      const el = e.energyLevel ?? -1
      if (el >= 4 || (el < 0 && fl === 'low')) cats[0].value++
      else if (el === 3) cats[1].value++
      else if (el === 2 || (el < 0 && fl === 'moderate')) cats[2].value++
      else cats[3].value++
    }
    return cats.filter(c => c.value > 0)
  }, [filtered])

  const dayHeatmap = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const buckets: Record<string, number[]> = Object.fromEntries(days.map(d => [d, []]))
    for (const e of filtered) {
      const dow = new Date(e.date + 'T00:00:00').getDay()
      buckets[days[(dow + 6) % 7]].push(entryScore(e))
    }
    return days.map(day => ({ day, value: avgNum(buckets[day]), count: buckets[day].length }))
  }, [filtered])

  const bestDay = [...dayHeatmap].sort((a, b) => b.value - a.value).find(d => d.count > 0)

  const recoveryWeeks = useMemo(() => {
    const weekMap: Record<string, number[]> = {}
    for (const e of filtered) {
      const d = new Date(e.date + 'T00:00:00')
      const wk = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`
      if (!weekMap[wk]) weekMap[wk] = []
      weekMap[wk].push(entryScore(e))
    }
    const avgs = Object.values(weekMap).map(avgNum)
    return {
      good: avgs.filter(s => s >= 70).length,
      moderate: avgs.filter(s => s >= 50 && s < 70).length,
      poor: avgs.filter(s => s < 50).length,
    }
  }, [filtered])

  const totalSpan = chartEntries.length >= 2
    ? Math.round((new Date(chartEntries[chartEntries.length - 1].date).getTime() - new Date(chartEntries[0].date).getTime()) / 86400000) + 1
    : filtered.length
  const consistencyPct = totalSpan > 0 ? Math.round((filtered.length / totalSpan) * 100) : 0

  const insights = useMemo(() => {
    const list: { text: string; color: string }[] = []
    if (filtered.length < 2) return list

    if (weightEntries.length >= 2) {
      const weeks = Math.max(1, Math.round((new Date(weightEntries[weightEntries.length - 1].date).getTime() - new Date(weightEntries[0].date).getTime()) / (7 * 86400000)))
      const delta = fromKilograms(weightEntries[weightEntries.length - 1].bodyWeight, unit) - fromKilograms(weightEntries[0].bodyWeight, unit)
      const rate = parseFloat((delta / weeks).toFixed(2))
      if (Math.abs(rate) > 0.05) {
        const onTrack = (isWeightGainGoal && rate > 0) || (isWeightLossGoal && rate < 0)
        list.push({
          text: onTrack
            ? `Weight trending ${rate > 0 ? 'up' : 'down'} ${Math.abs(rate).toFixed(2)}${unit}/week — on track for your ${activeGoal?.goalType ?? 'goal'} target.`
            : `Weight ${rate > 0 ? 'increasing' : 'decreasing'} at ${Math.abs(rate).toFixed(2)}${unit}/week. ${Math.abs(delta) < 0.3 ? 'Weight is relatively stable.' : 'Consider adjusting calorie intake.'}`,
          color: onTrack ? '#10b981' : '#f59e0b',
        })
      }
    }

    if (avgRecovery > 0) {
      list.push({
        text: `Average recovery ${avgRecovery}/100 — ${avgRecovery >= 70 ? 'excellent readiness for progressive overload.' : avgRecovery >= 50 ? 'moderate readiness; focus on sleep and stress management.' : 'low readiness — consider reducing training volume temporarily.'}`,
        color: scoreColor(avgRecovery),
      })
    }

    if (bestDay && bestDay.value > 0) {
      list.push({
        text: `Recovery scores are highest on ${bestDay.day} (avg ${bestDay.value}). Consider scheduling your hardest sessions after this day.`,
        color: '#10b981',
      })
    }

    if (consistencyPct > 0) {
      list.push({
        text: `${filtered.length} check-in${filtered.length !== 1 ? 's' : ''} logged — ${consistencyPct}% consistency. ${consistencyPct >= 80 ? 'Excellent habit building ✅' : consistencyPct >= 60 ? 'Good consistency 👍' : 'More consistent logging improves coaching accuracy.'}`,
        color: consistencyPct >= 80 ? '#10b981' : consistencyPct >= 60 ? '#6ee7b7' : '#f59e0b',
      })
    }

    return list.slice(0, 4)
  }, [filtered, weightEntries, avgRecovery, bestDay, consistencyPct, isWeightGainGoal, isWeightLossGoal, activeGoal, unit])

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-[#0f0f0f]" />)}
        </div>
        {[1, 2, 3].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-[#0f0f0f]" />)}
      </div>
    )
  }

  if (error) {
    return <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
  }

  if (!entries.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 28 }}>📊</span>
        </div>
        <h2 className="font-['DM_Serif_Display'] text-2xl text-white">Your analytics start here</h2>
        <p className="mt-2 max-w-sm text-sm text-[rgba(255,255,255,0.35)]">Log your first check-in to begin tracking your fitness journey with charts and trend insights.</p>
        <Link
          to="/progress"
          className="mt-5 inline-flex items-center transition-colors"
          style={{ background: '#ffffff', color: '#000000', fontWeight: 600, padding: '12px 24px', borderRadius: 8 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#ffffff' }}
        >
          Log first check-in
        </Link>
      </div>
    )
  }

  /* ── Render ── */
  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header + range filter */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-['DM_Serif_Display'] text-2xl text-white">Performance Analytics</h1>
          <p className="mt-0.5 text-xs text-[rgba(255,255,255,0.35)]">Your progress visualized. Charts update with each check-in.</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)' }}>
          {(['1W', '1M', '3M', 'ALL'] as TimeRange[]).map(r => (
            <button key={r} type="button" onClick={() => setRange(r)}
              className="rounded px-2.5 py-1 text-xs font-semibold transition-all duration-150"
              style={{ background: range === r ? '#ffffff' : 'transparent', color: range === r ? '#000000' : 'rgba(255,255,255,0.35)' }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Check-ins" value={checkInCount} sub="In selected range" />
        <MetricCard label="Avg Recovery" value={avgRecovery} unit="/100" sub="Score out of 100"
          trendText={avgRecovery >= 70 ? 'Excellent' : avgRecovery >= 50 ? 'Moderate' : 'Low'}
          trendColor={scoreColor(avgRecovery)} />
        <div className="rounded-xl p-4" style={{ background: '#141414' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">Weight Change</p>
          <p className="mt-1.5 font-['DM_Serif_Display'] text-2xl text-white">
            {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}${unit}` : '—'}
          </p>
          <p className="mt-0.5 text-xs text-[rgba(255,255,255,0.35)]">First vs latest</p>
          {weightChange !== null && weightChange !== 0 && (
            <p className="mt-0.5 text-xs" style={{ color: weightOnTrack ? '#10b981' : '#f59e0b' }}>
              {weightOnTrack ? '↑ On track' : '↔ Check nutrition'}
            </p>
          )}
        </div>
        <MetricCard label="Best Streak" value={bestStreak} unit=" days" sub="Consecutive check-ins"
          trendText={bestStreak >= 7 ? '🔥 Week+ streak!' : bestStreak >= 3 ? '👍 Building habit' : undefined}
          trendColor="#10b981" />
      </div>

      {/* Progress Status Banner */}
      {progressBannerData && (
        <ProgressBanner status={progressBannerData.status} mainText={progressBannerData.mainText} subText={progressBannerData.subText} />
      )}

      {/* ── ROW 1: Body Weight + Recovery Score (side by side) ── */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* Body Weight */}
        <div className="rounded-xl p-4" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">Body Weight</p>
            {weightData.length >= 2 && (
              <span className="text-xs text-[rgba(255,255,255,0.35)]">
                {weightData[0].value}{unit} {'→'} <span className="text-white font-semibold">{weightData[weightData.length - 1].value}{unit}</span>
                {weightChange !== null && (
                  <span className="ml-1.5" style={{ color: weightOnTrack ? '#10b981' : '#f59e0b' }}>
                    ({weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}{unit})
                  </span>
                )}
              </span>
            )}
          </div>
          {weightData.length < 2 ? (
            <p className="mt-4 mb-1 text-center text-sm text-[rgba(255,255,255,0.35)] italic">
              {weightData.length === 0 ? 'Log check-ins with body weight to see this chart.' : 'Log one more check-in to see your weight trend.'}
            </p>
          ) : (
            <>
              <div style={{ width: '100%', overflow: 'hidden' }}>
                <PremiumLineChart
                  data={weightData} color="#10b981" unit={unit} showGradient
                  idealPaceLine={idealPaceLineData ?? undefined}
                  outlierIndices={weightOutlierIndices}
                  chartId="weight"
                />
              </div>
              <ChartReading dot={weightTrendColor} text={weightTrendText} />
              {weightOutlierIndices.size > 0 && (
                <p className="mt-1 text-[11px] text-[rgba(255,255,255,0.35)]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#f59e0b] mr-1 align-middle" />
                  Amber dots = likely water-weight fluctuations
                </p>
              )}
            </>
          )}
        </div>

        {/* Recovery Score */}
        <div className="rounded-xl p-4" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">Recovery Score</p>
            {(recoveryWeeks.good + recoveryWeeks.moderate + recoveryWeeks.poor) > 0 && (
              <span className="text-[11px]">
                {recoveryWeeks.good > 0 && <span className="text-[#10b981]">{recoveryWeeks.good}G</span>}
                {recoveryWeeks.good > 0 && recoveryWeeks.moderate > 0 && <span className="text-[rgba(255,255,255,0.2)]">{' · '}</span>}
                {recoveryWeeks.moderate > 0 && <span className="text-[#f59e0b]">{recoveryWeeks.moderate}M</span>}
                {(recoveryWeeks.good + recoveryWeeks.moderate) > 0 && recoveryWeeks.poor > 0 && <span className="text-[rgba(255,255,255,0.2)]">{' · '}</span>}
                {recoveryWeeks.poor > 0 && <span className="text-[#ef4444]">{recoveryWeeks.poor}P</span>}
                <span className="text-[rgba(255,255,255,0.35)] ml-1">weeks</span>
              </span>
            )}
          </div>
          {recoveryData.length < 2 ? (
            <p className="mt-4 mb-1 text-center text-sm text-[rgba(255,255,255,0.35)] italic">Log more check-ins to see this chart.</p>
          ) : (
            <>
              <div style={{ width: '100%', overflow: 'hidden' }}>
                <PremiumLineChart data={recoveryData} isRecovery chartId="recovery" padRight={24} />
              </div>
              <ChartReading dot={scoreColor(avgRecoveryScore)} text={recoveryReadingText} />
            </>
          )}
        </div>
      </div>

      {/* ── Coaching Message ── */}
      <CoachingMessage
        username={user?.username ?? ''}
        weightData={weightData}
        avgRecovery={avgRecovery}
        avgSleep={avgSleep}
        checkInCount={checkInCount}
        isWeightGainGoal={isWeightGainGoal}
        isWeightLossGoal={isWeightLossGoal}
        unit={unit}
        weightChange={weightChange}
      />

      {/* ── ROW 2: Sleep + Training Performance (side by side) ── */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* Sleep Quality */}
        <div className="rounded-xl p-4" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">
            Sleep Quality{avgSleep > 0 && <span className="normal-case font-normal ml-1 text-[rgba(255,255,255,0.2)]">avg {avgSleep}h</span>}
          </p>
          {sleepData.length < 2 ? (
            <p className="mt-4 mb-1 text-center text-sm text-[rgba(255,255,255,0.35)] italic">Log more check-ins.</p>
          ) : (
            <>
              <div style={{ width: '100%', overflow: 'hidden' }}>
                <PremiumBarChart
                  data={sleepData} maxValue={10}
                  refLine={{ value: 7.5, label: '7.5h', color: '#10b981' }}
                  avgLine={avgSleepLine}
                  chartId="sleep"
                />
              </div>
              <ChartReading dot={sleepReadingColor} text={sleepReadingText} />
            </>
          )}
        </div>

        {/* Training Performance */}
        <div className="rounded-xl p-4" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Training Performance</p>
          {trainingData.length < 2 ? (
            <p className="mt-4 mb-1 text-center text-sm text-[rgba(255,255,255,0.35)] italic">Log more check-ins.</p>
          ) : (
            <>
              <div style={{ width: '100%', overflow: 'hidden' }}>
                <PremiumBarChart
                  data={trainingData} maxValue={4}
                  rightLabels={[
                    { value: 1, label: 'Poor', color: '#ef4444' },
                    { value: 2, label: 'Avg', color: '#f59e0b' },
                    { value: 3, label: 'Good', color: '#3b82f6' },
                    { value: 4, label: 'Best', color: '#10b981' },
                  ]}
                  trendArrow={perfTrendArrow}
                  chartId="training"
                />
              </div>
              <ChartReading dot={perfReadingColor} text={perfReadingText} />
              <div className="mt-2 flex flex-wrap gap-2.5">
                {([4, 3, 2, 1, 0.5] as number[]).map(s => (
                  <div key={s} className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: perfColor(s) }} />
                    <span className="text-[10px] text-[rgba(255,255,255,0.35)]">{perfLabel(s)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Strength Progress ── */}
      <div className="rounded-xl p-4" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-0.5">Strength Progress</p>
        <p className="text-[11px] text-[rgba(255,255,255,0.35)] mb-3">Estimated 1RM {'·'} Epley + Brzycki formulas</p>
        {exerciseList.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <svg width="64" height="28" viewBox="0 0 80 36" style={{ display: 'block', margin: '0 auto 12px' }}>
              <rect x="14" y="16" width="52" height="4" rx="2" fill="#334155" />
              <rect x="4" y="8" width="12" height="20" rx="3" fill="#475569" />
              <rect x="64" y="8" width="12" height="20" rx="3" fill="#475569" />
              <rect x="0" y="12" width="6" height="12" rx="2" fill="#334155" />
              <rect x="74" y="12" width="6" height="12" rx="2" fill="#334155" />
            </svg>
            <p className="text-sm text-[rgba(255,255,255,0.35)] mb-3">Log weights in Training to track strength progress</p>
            <Link to="/training" className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-semibold transition-colors"
              style={{ background: '#ffffff', color: '#000000' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ffffff' }}>
              Go to Training {'→'}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {exerciseList.map(ex => (
                <button key={ex} type="button" onClick={() => setActiveExercise(ex)}
                  className="rounded px-2.5 py-1 text-xs font-semibold transition-all"
                  style={{
                    background: selectedExercise === ex ? '#ffffff' : '#141414',
                    color: selectedExercise === ex ? '#000000' : 'rgba(255,255,255,0.55)',
                    border: `1px solid ${selectedExercise === ex ? '#10b981' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                  {ex}
                </button>
              ))}
            </div>
            {strengthChartData.length >= 2 ? (
              <>
                <div style={{ width: '100%', overflow: 'hidden' }}>
                  <PremiumLineChart data={strengthChartData} color="#10b981" unit={unit} showGradient chartId="strength" />
                </div>
                {strengthImprovement !== null && (
                  <p className="mt-2 text-xs" style={{ color: strengthImprovement >= 0 ? '#10b981' : '#f59e0b' }}>
                    {selectedExercise}: {strengthImprovement >= 0 ? '+' : ''}{strengthImprovement}{unit} est. 1RM
                    over {orm1Data[selectedExercise].length} sessions {strengthImprovement >= 0 ? '↑' : '↓'}
                  </p>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center py-5 text-center">
                <p className="text-sm text-[rgba(255,255,255,0.35)] mb-1">Log 2+ sessions to see your strength curve</p>
                <p className="text-xs text-[rgba(255,255,255,0.35)] mb-3">for {selectedExercise}</p>
                <Link to="/training" className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-semibold transition-colors"
                  style={{ background: '#ffffff', color: '#000000' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#ffffff' }}>
                  Go to Training {'→'}
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Exercise Performance ── */}
      {exerciseList.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-0.5">Exercise Performance</p>
          <p className="text-[12px] text-[rgba(255,255,255,0.55)] mb-4">How each exercise is trending based on your logged sessions</p>
          <div className="space-y-3">
            {exerciseList.map(ex => {
              const sorted = overloadEntries.filter(e => e.exercise === ex).sort((a, b) => a.date.localeCompare(b.date))
              const last5 = sorted.slice(-5)
              const vols = last5.map(e => e.weight * e.reps)
              const maxVol = Math.max(...vols, 1)
              const status = (() => {
                if (sorted.length < 2) return null
                const lv = sorted[sorted.length - 1].weight * sorted[sorted.length - 1].reps
                const pv = sorted[sorted.length - 2].weight * sorted[sorted.length - 2].reps
                if (pv === 0) return null
                const ch = (lv - pv) / pv * 100
                if (ch > 2.5) return 'High' as const
                if (ch < -2.5) return 'Low' as const
                return 'Moderate' as const
              })()
              const volChange = sorted.length >= 2
                ? Math.round(((sorted[sorted.length - 1].weight * sorted[sorted.length - 1].reps) - (sorted[0].weight * sorted[0].reps)) / Math.max(1, sorted[0].weight * sorted[0].reps) * 100)
                : 0
              const dot = status === 'High' ? '#10b981' : status === 'Low' ? '#ef4444' : status === 'Moderate' ? '#3b82f6' : '#64748b'
              const badge = status === 'High'
                ? { bg: 'rgba(16,185,129,0.1)', border: '#10b981', color: '#10b981', label: '↑ High' }
                : status === 'Low'
                ? { bg: 'rgba(239,68,68,0.1)', border: '#ef4444', color: '#ef4444', label: '↓ Low' }
                : status === 'Moderate'
                ? { bg: 'rgba(59,130,246,0.1)', border: '#3b82f6', color: '#3b82f6', label: '→ Moderate' }
                : { bg: '#141414', border: '#334155', color: 'rgba(255,255,255,0.35)', label: 'New' }
              const trendText = status === 'High'
                ? `Trending upward. You've increased volume by ${Math.abs(volChange)}% over ${sorted.length} sessions.`
                : status === 'Low'
                ? 'Performance declined slightly. Review recovery, sleep, or fatigue levels before next session.'
                : status === 'Moderate'
                ? 'Performance stable. Continue working toward top of rep range before increasing weight.'
                : 'Log more sessions to see your trend.'
              return (
                <div key={ex} className="rounded-lg bg-[#0a0a0a] p-3">
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <p className="text-sm font-medium text-white">{ex}</p>
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-[12px] mb-2 leading-4" style={{ color: dot }}>{trendText}</p>
                  {vols.length >= 2 && (
                    <svg viewBox="0 0 130 40" width="130" height="40" style={{ display: 'block' }}>
                      {vols.map((v, vi) => {
                        const bH = Math.max(2, (v / maxVol) * 32)
                        return (
                          <rect key={vi} x={vi * 28 + 2} y={40 - bH - 4} width={22} height={bH} rx="2"
                            fill={dot} opacity={vi === vols.length - 1 ? 1 : 0.4} />
                        )
                      })}
                    </svg>
                  )}
                  <p className="text-[10px] text-[rgba(255,255,255,0.35)] mt-0.5">{sorted.length} session{sorted.length !== 1 ? 's' : ''} logged</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Energy + Best Days ── */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* Energy Distribution */}
        <div className="rounded-xl p-4" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Energy Distribution</p>
          <p className="text-[11px] text-[rgba(255,255,255,0.35)] mb-3">How you've felt this period</p>
          {energyDist.length === 0 ? (
            <p className="text-sm text-[rgba(255,255,255,0.35)] italic py-6 text-center">No data yet.</p>
          ) : (
            <div className="flex items-center gap-3">
              <SVGDonutChart segments={energyDist} />
              <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-1.5">
                {energyDist.map(d => {
                  const total = energyDist.reduce((s, x) => s + x.value, 0)
                  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
                  return (
                    <div key={d.name} className="flex items-center gap-1.5 min-w-0">
                      <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-[rgba(255,255,255,0.55)] truncate">{d.emoji} {d.name}</span>
                      <span className="text-xs font-semibold ml-auto shrink-0" style={{ color: d.color }}>{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Best Days Heatmap */}
        <div className="rounded-xl p-4" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Best Days to Train</p>
          <p className="text-[11px] text-[rgba(255,255,255,0.35)] mb-3">Avg recovery score by day of week</p>
          {dayHeatmap.every(d => d.count === 0) ? (
            <p className="text-sm text-[rgba(255,255,255,0.35)] italic py-6 text-center">Not enough data yet.</p>
          ) : (
            <>
              <SVGDayHeatmap data={dayHeatmap} />
              {bestDay && bestDay.value > 0 && (
                <p className="mt-2 text-xs text-[rgba(255,255,255,0.55)]">
                  ⭐ Best day: <span className="text-white font-semibold">{bestDay.day}</span> — schedule key sessions here.
                </p>
              )}
              {filtered.length < 7 && (
                <p className="mt-1 text-[11px] text-[rgba(255,255,255,0.2)]">More check-ins reveal the full pattern</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* GoFit Insights */}
      {insights.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: '#080808', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#10b981] mb-3">GoFit Insights</p>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className="flex gap-2.5">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: insight.color }} />
                <p className="text-xs leading-5 text-[rgba(255,255,255,0.55)]">{insight.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal Progress */}
      {activeGoal && (
        <div className="rounded-xl p-4" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-3">Goal Progress</p>
          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.07)', color: '#ffffff' }}>
                  {activeGoal.goalType}
                </span>
                {activeGoal.createdAt && (
                  <span className="text-xs text-[rgba(255,255,255,0.35)]">
                    Since {new Date(activeGoal.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
              {activeGoal.focus && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {activeGoal.focus.split(',').map(f => (
                    <span key={f} className="rounded-full px-2 py-0.5 text-[11px]"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
                      {f.trim()}
                    </span>
                  ))}
                </div>
              )}
              {weightEntries.length >= 2 && (isWeightGainGoal || isWeightLossGoal) && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1 text-xs text-[rgba(255,255,255,0.35)]">
                    <span>Start: {fromKilograms(weightEntries[0].bodyWeight, unit).toFixed(1)}{unit}</span>
                    <span>Now: {fromKilograms(weightEntries[weightEntries.length - 1].bodyWeight, unit).toFixed(1)}{unit}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: '#141414' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.abs(weightChange ?? 0) * 10)}%`,
                        background: weightOnTrack ? '#10b981' : '#f59e0b',
                      }} />
                  </div>
                  {weightChange !== null && (
                    <p className="mt-1 text-xs" style={{ color: weightOnTrack ? '#10b981' : '#f59e0b' }}>
                      {isWeightLossGoal
                        ? `Lost ${Math.abs(weightChange).toFixed(1)}${unit} toward fat loss goal`
                        : `Gained ${Math.abs(weightChange).toFixed(1)}${unit} toward muscle gain goal`}
                    </p>
                  )}
                </div>
              )}
              {coaching && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {coaching.progressionState && (
                    <p className="text-xs text-[rgba(255,255,255,0.35)]">State: <span className="text-[rgba(255,255,255,0.55)]">{coaching.progressionState}</span></p>
                  )}
                  {coaching.consistencyScore > 0 && (
                    <p className="text-xs text-[rgba(255,255,255,0.35)]">Consistency: <span className="text-[#10b981] font-semibold">{coaching.consistencyScore}/100</span></p>
                  )}
                </div>
              )}
            </div>
            <Link to="/goals"
              className="shrink-0 inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium text-[rgba(255,255,255,0.55)] hover:bg-white/4 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              View Goals {'→'}
            </Link>
          </div>
        </div>
      )}

    </div>
  )
}

export default AnalyticsPage


