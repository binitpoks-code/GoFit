import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ChevronDown, ChevronUp, Moon, Star } from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { COACHING_KEY, PROFILE_UPDATED_EVENT } from '../services/profileService'
import { PROGRESS_UPDATED_EVENT, progressService } from '../services/progressService'
import type { CoachingResponse, ProgressEntry } from '../types/coaching'
import { getErrorMessage } from '../utils/getErrorMessage'

/* ─── Helpers ─────────────────────────────────────────────────────── */

function entryDailyScore(entry: ProgressEntry): number {
  if (entry.recoveryScore && entry.recoveryScore > 0) return entry.recoveryScore
  return Math.round(Math.min(100, entry.sleepHours * 12))
}

function cycleAvgScore(cycleEntries: ProgressEntry[]): number {
  if (cycleEntries.length === 0) return 0
  const scores = cycleEntries.map(entryDailyScore)
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

function scoreColor(score: number): string {
  if (score >= 70) return '#10b981'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

function readinessLabel(score: number): string {
  if (score >= 80) return 'Peak Readiness'
  if (score >= 70) return 'High Readiness'
  if (score >= 50) return 'Moderate Readiness'
  return 'Low Readiness'
}

function readStoredCoaching(): CoachingResponse | null {
  const raw = localStorage.getItem(COACHING_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as CoachingResponse } catch { return null }
}

function formatDateRange(entries: ProgressEntry[]): string {
  if (entries.length === 0) return ''
  const first = new Date(entries[0].date + 'T00:00:00')
  const last = new Date(entries[entries.length - 1].date + 'T00:00:00')
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(first)} — ${fmt(last)}`
}

function entryEmoji(entry: ProgressEntry): string {
  const f = entry.fatigueLevel.toLowerCase()
  return f === 'low' ? '🔥' : f === 'moderate' ? '😐' : '😴'
}

/* ─── Count-up animation ──────────────────────────────────────────── */

function useCountUp(target: number, duration = 1500): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) { setCount(0); return }
    let frame = 0
    const start = Date.now()
    function tick() {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return count
}

/* ─── Progress ring (N / 7 for current cycle) ───────────────────── */

function ProgressRing({ count }: { count: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const fill = (count / 7) * circ
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
      <circle cx="70" cy="70" r={r} fill="none"
        stroke="#ffffff" strokeWidth="12"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="65" textAnchor="middle" fontSize="40"
        fontFamily="DM Serif Display, Georgia, serif" fill="#ffffff">{count}</text>
      <text x="70" y="82" textAnchor="middle" fontSize="13"
        fontFamily="Inter, sans-serif" fill="rgba(255,255,255,0.35)">of 7</text>
      <text x="70" y="97" textAnchor="middle" fontSize="11"
        fontFamily="Inter, sans-serif" fill="rgba(255,255,255,0.2)">days</text>
    </svg>
  )
}

/* ─── Small score ring (history cards) ───────────────────────────── */

function SmallScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = size * 0.37
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = scoreColor(score)
  const cx = size / 2
  const cy = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size * 0.09} />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={size * 0.09}
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy + size * 0.13} textAnchor="middle"
        fontSize={size * 0.26} fontWeight="600" fontFamily="Inter, sans-serif" fill={color}>
        {score}
      </text>
    </svg>
  )
}

/* ─── Unlocked score card ─────────────────────────────────────────── */

function UnlockedScoreCard({ cycle, cycleIndex, coaching }: {
  cycle: ProgressEntry[]
  cycleIndex: number
  coaching: CoachingResponse | null
}) {
  const score = cycleAvgScore(cycle)
  const animated = useCountUp(score)
  const color = scoreColor(animated)

  return (
    <div className="rounded-2xl p-6" style={{
      background: 'rgba(16,185,129,0.05)',
      border: '1px solid rgba(16,185,129,0.2)',
    }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-4">
        Cycle {cycleIndex} Recovery Score
      </p>
      <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
        <div className="flex flex-col items-center shrink-0">
          <span className="font-['DM_Serif_Display']" style={{ fontSize: 64, lineHeight: 1, color }}>
            {animated}
          </span>
          <span className="text-xl text-[rgba(255,255,255,0.35)] mt-1">/100</span>
          <span className="mt-3 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: `${color}20`, color }}>
            {readinessLabel(score)}
          </span>
        </div>
        <div className="flex-1 space-y-3 min-w-0">
          {coaching?.trainingReadinessFeedback && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Training Readiness</p>
              <p className="text-sm leading-6 text-[rgba(255,255,255,0.55)]">{coaching.trainingReadinessFeedback}</p>
            </div>
          )}
          {coaching?.recoveryFeedback && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Recovery Feedback</p>
              <p className="text-sm leading-6 text-[rgba(255,255,255,0.55)]">{coaching.recoveryFeedback}</p>
            </div>
          )}
          {coaching?.deloadRecommendation && (
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3">
              <p className="text-xs font-semibold text-amber-400 mb-1">Deload Recommendation</p>
              <p className="text-sm text-amber-300">{coaching.deloadRecommendation}</p>
            </div>
          )}
          {coaching?.workloadStatus && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Workload Status</p>
              <p className="text-sm leading-6 text-[rgba(255,255,255,0.55)]">{coaching.workloadStatus}</p>
            </div>
          )}
          {!coaching?.trainingReadinessFeedback && !coaching?.recoveryFeedback && !coaching?.workloadStatus && (
            <p className="text-sm text-[rgba(255,255,255,0.35)]">
              Complete your coaching profile to unlock personalized feedback.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Cycle history card (collapsible) ───────────────────────────── */

function CycleHistoryCard({ cycle, cycleNumber, prevScore, isBest }: {
  cycle: ProgressEntry[]
  cycleNumber: number
  prevScore: number | null
  isBest: boolean
}) {
  const [open, setOpen] = useState(false)
  const score = cycleAvgScore(cycle)
  const trend = prevScore !== null ? score - prevScore : null
  const trendColor = trend === null ? '#64748b' : trend > 5 ? '#10b981' : trend < -5 ? '#ef4444' : '#64748b'
  const trendArrow = trend !== null && trend > 5 ? '↑' : trend !== null && trend < -5 ? '↓' : '→'

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 p-4 text-left transition-colors hover:bg-white/2"
        style={{ background: '#0f0f0f' }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-white">Cycle {cycleNumber}</span>
            {isBest && (
              <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-amber-400"
                style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <Star size={9} />Best
              </span>
            )}
          </div>
          <p className="text-xs text-[rgba(255,255,255,0.35)]">{formatDateRange(cycle)}</p>
        </div>
        <SmallScoreRing score={score} />
        {trend !== null && (
          <span className="text-sm font-bold min-w-9 text-right" style={{ color: trendColor }}>
            {trendArrow}{Math.abs(trend)}
          </span>
        )}
        <div className="text-[rgba(255,255,255,0.35)]">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open && (
        <div className="p-4 space-y-4" style={{ background: '#0f0f0f', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* 7-day mini grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {cycle.map((entry, i) => {
              const d = new Date(entry.date + 'T00:00:00')
              const s = entryDailyScore(entry)
              return (
                <div key={i} className="flex flex-col items-center gap-0.5 rounded-lg p-2 text-center"
                  style={{ background: '#141414' }}>
                  <span className="text-[9px] font-semibold text-[rgba(255,255,255,0.35)]">
                    {d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3).toUpperCase()}
                  </span>
                  <span className="text-[10px] text-[rgba(255,255,255,0.2)]">{d.getDate()}</span>
                  <span style={{ fontSize: 12 }}>{entryEmoji(entry)}</span>
                  <span className="text-[10px] font-bold" style={{ color: scoreColor(s) }}>{s}</span>
                </div>
              )
            })}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg p-3" style={{ background: '#141414' }}>
              <p className="text-[10px] text-[rgba(255,255,255,0.35)] mb-0.5">Avg Sleep</p>
              <p className="text-sm font-semibold text-white">
                {(cycle.reduce((a, e) => a + e.sleepHours, 0) / cycle.length).toFixed(1)}h
              </p>
            </div>
            <div className="rounded-lg p-3" style={{ background: '#141414' }}>
              <p className="text-[10px] text-[rgba(255,255,255,0.35)] mb-0.5">Best Day</p>
              <p className="text-sm font-semibold" style={{ color: '#10b981' }}>
                {Math.max(...cycle.map(entryDailyScore))}
              </p>
            </div>
            <div className="rounded-lg p-3" style={{ background: '#141414' }}>
              <p className="text-[10px] text-[rgba(255,255,255,0.35)] mb-0.5">Worst Day</p>
              <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                {Math.min(...cycle.map(entryDailyScore))}
              </p>
            </div>
          </div>

          {trend !== null && (
            <p className="text-xs text-center" style={{ color: trendColor }}>
              vs previous cycle: {trend > 0 ? '+' : ''}{trend} points {trendArrow}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Empty state ─────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Moon size={28} color="#ffffff" />
      </div>
      <h2 className="font-['DM_Serif_Display'] text-2xl text-white mb-3">Start Your Recovery Journey</h2>
      <p className="text-sm leading-relaxed text-[rgba(255,255,255,0.55)] max-w-xs mb-6">
        Log your first check-in to begin tracking your recovery cycles.
        Each cycle gives you deeper insight into how your body is adapting to training.
      </p>
      <Link
        to="/progress"
        className="inline-flex h-10 items-center rounded-xl px-5 text-sm font-semibold text-white transition-colors"
        style={{ background: '#10b981' }}
      >
        Log first check-in {'→'}
      </Link>
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────────────── */

function RecoveryPage() {
  const [coaching, setCoaching] = useState<CoachingResponse | null>(() => readStoredCoaching())
  const [entries, setEntries] = useState<ProgressEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load(showLoading = true) {
      if (showLoading) setIsLoading(true)
      try {
        const rawEntries = await progressService.getProgressEntries().catch(() => [] as ProgressEntry[])
        if (mounted) {
          setCoaching(readStoredCoaching())
          setEntries([...rawEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
        }
      } catch (e) {
        if (mounted) setError(getErrorMessage(e))
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    const refresh = () => { setCoaching(readStoredCoaching()); load(false) }
    window.addEventListener(PROFILE_UPDATED_EVENT, refresh)
    window.addEventListener(PROGRESS_UPDATED_EVENT, refresh)
    return () => {
      mounted = false
      window.removeEventListener(PROFILE_UPDATED_EVENT, refresh)
      window.removeEventListener(PROGRESS_UPDATED_EVENT, refresh)
    }
  }, [])

  /* ── Cycle calculations ── */
  const completedCyclesCount = Math.floor(entries.length / 7)
  const currentCycleCount = entries.length % 7
  const isCycleComplete = currentCycleCount === 0 && entries.length >= 7

  const allCycles: ProgressEntry[][] = []
  for (let i = 0; i < entries.length; i += 7) {
    allCycles.push(entries.slice(i, i + 7))
  }
  const completedCycles = allCycles.filter((c) => c.length === 7)
  const lastCycleEntries = allCycles[allCycles.length - 1] ?? []

  const bestScore = completedCycles.length > 0
    ? Math.max(...completedCycles.map(cycleAvgScore))
    : 0

  const trendData = completedCycles.map((c, i) => ({
    name: `Cycle ${i + 1}`,
    score: cycleAvgScore(c),
  }))

  const now = new Date()
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const todayLogged = entries.some((e) => e.date === todayIso)

  if (isLoading) {
    return (
      <div className="space-y-5">
        {[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-[#0f0f0f]" />)}
      </div>
    )
  }

  if (error) {
    return <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400">{error}</div>
  }

  if (entries.length === 0) return <EmptyState />

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Activity size={20} color="#ffffff" />
          </div>
          <h1 className="font-['DM_Serif_Display'] text-[28px] text-white">Recovery Intelligence</h1>
        </div>
        {completedCyclesCount > 0 && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-[#10b981]"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              🔥 {completedCyclesCount} cycle{completedCyclesCount !== 1 ? 's' : ''} completed
            </span>
          </div>
        )}
        <p className="text-[14px] leading-[1.7] text-[rgba(255,255,255,0.55)] max-w-xl">
          GoFit tracks your recovery in 7-day cycles. Each check-in you log contributes to your
          weekly recovery score — a comprehensive measure of how well your body is adapting to training.
          Complete 7 check-ins to unlock your full weekly analysis, then start fresh for the next cycle.
        </p>
      </div>

      {/* ── How It Works ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {([
          { num: '01', emoji: '📝', title: 'Log Daily', desc: 'Check in each day with your energy, training, and sleep quality' },
          { num: '02', emoji: '🔓', title: 'Unlock Weekly Score', desc: 'After 7 check-ins your full recovery analysis is revealed' },
          { num: '03', emoji: '📈', title: 'Track Progress', desc: 'Compare week over week to see how your recovery is improving' },
        ] as const).map((step) => (
          <div key={step.num} className="rounded-xl p-4" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-[#10b981]"
                style={{ background: 'rgba(16,185,129,0.1)' }}>
                {step.num}
              </span>
              <span style={{ fontSize: 18 }}>{step.emoji}</span>
            </div>
            <p className="text-[13px] font-medium text-white mb-1">{step.title}</p>
            <p className="text-[12px] leading-relaxed text-[rgba(255,255,255,0.35)]">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Current Cycle ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-3">Current Cycle</p>

        {isCycleComplete ? (
          <UnlockedScoreCard
            cycle={lastCycleEntries}
            cycleIndex={completedCyclesCount}
            coaching={coaching}
          />
        ) : (
          <div className="rounded-xl p-6" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-5">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-[#10b981]"
                style={{ background: 'rgba(16,185,129,0.1)' }}>
                Cycle {completedCyclesCount + 1}
              </span>
              <span className="text-sm text-[rgba(255,255,255,0.55)]">Day {currentCycleCount} of 7</span>
            </div>

            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <div className="shrink-0">
                <ProgressRing count={currentCycleCount} />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-xs text-[rgba(255,255,255,0.35)] mb-2">Progress</p>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 7 }, (_, i) => {
                      const logged = i < currentCycleCount
                      const next = i === currentCycleCount
                      return (
                        <div key={i} className="rounded-full"
                          style={{
                            width: 10, height: 10,
                            background: logged ? '#ffffff' : 'transparent',
                            border: logged ? 'none' : next ? '2px solid rgba(255,255,255,0.5)' : '2px solid rgba(255,255,255,0.1)',
                          }}
                        />
                      )
                    })}
                  </div>
                </div>
                <p className="text-sm text-[rgba(255,255,255,0.55)]">
                  {7 - currentCycleCount} more check-in{7 - currentCycleCount !== 1 ? 's' : ''} to unlock your recovery score
                </p>
                {!todayLogged && (
                  <Link to="/progress"
                    className="inline-flex h-10 items-center rounded-xl px-5 text-sm font-semibold text-white transition-colors"
                    style={{ background: '#ffffff', color: '#000000' }}>
                    Log today's check-in {'→'}
                  </Link>
                )}
                {todayLogged && (
                  <p className="text-xs font-medium text-white">✓ Today's check-in logged</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Weekly History ── */}
      {completedCycles.length > 0 && (
        <div>
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">Weekly History</p>
            <p className="text-[12px] text-[rgba(255,255,255,0.35)] mt-1">
              Every completed 7-day cycle with your recovery score and key metrics
            </p>
          </div>
          <div className="space-y-2">
            {[...completedCycles].reverse().map((cycle, i) => {
              const cycleNumber = completedCycles.length - i
              const prevCycleIndex = completedCycles.length - i - 2
              const prevScore = prevCycleIndex >= 0 ? cycleAvgScore(completedCycles[prevCycleIndex]) : null
              const isBest = cycleAvgScore(cycle) === bestScore && completedCycles.length > 1
              return (
                <CycleHistoryCard
                  key={cycleNumber}
                  cycle={cycle}
                  cycleNumber={cycleNumber}
                  prevScore={prevScore}
                  isBest={isBest}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* ── Recovery Trends ── */}
      {trendData.length >= 2 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Recovery Trends</p>
          <p className="text-[12px] text-[rgba(255,255,255,0.35)] mb-4">Your weekly recovery score across all completed cycles</p>
          <div className="rounded-xl p-5" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="recoveryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.4} />
                <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.4} />
                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5}
                  fill="url(#recoveryGrad)"
                  dot={{ fill: '#10b981', stroke: '#10b981', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#10b981' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {trendData.length === 1 && (
        <div className="rounded-xl p-5 text-center" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm text-[rgba(255,255,255,0.35)]">Complete another 7-day cycle to see your recovery trend.</p>
        </div>
      )}

      {/* ── Next cycle preview ── */}
      {isCycleComplete && (
        <div className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <div>
            <p className="text-sm text-[rgba(255,255,255,0.55)]">
              Cycle {completedCyclesCount + 1} starts when you log your next check-in
            </p>
            <Link to="/progress" className="text-xs font-medium text-white hover:text-[#34d399] transition-colors">
              Start next cycle {'→'}
            </Link>
          </div>
        </div>
      )}

    </div>
  )
}

export default RecoveryPage

