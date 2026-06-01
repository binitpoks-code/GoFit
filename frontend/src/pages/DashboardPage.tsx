import axios from 'axios'
import { type JSX, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, Calculator, CheckCircle, Circle, Moon, Salad, Star, TrendingUp } from 'lucide-react'
import { ScoreRing } from '../components/ui/ScoreRing'
import { StatusBadge, readinessVariant } from '../components/ui/StatusBadge'
import { ProgressBar } from '../components/ui/ProgressBar'
import { GOALS_UPDATED_EVENT, goalService, selectPrimaryGoal } from '../services/goalService'
import { COACHING_KEY, PROFILE_UPDATED_EVENT, profileService } from '../services/profileService'
import { PROGRESS_UPDATED_EVENT, progressService } from '../services/progressService'
import type { CoachingResponse, ProgressEntry, UserProfile } from '../types/coaching'
import type { UserGoal } from '../types/goals'
import { buildDashboardSummary } from '../utils/coachingMetrics'
import { getErrorMessage } from '../utils/getErrorMessage'
import { calculateDailyTarget, calculateTDEE, getPhase } from '../utils/tdeeCalculator'
import type { Split } from '../utils/splitMatcher'

/* ─── Helpers ──────────────────────────────────────────────────── */
function readStoredCoaching(): CoachingResponse | null {
  const raw = localStorage.getItem(COACHING_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as CoachingResponse } catch { return null }
}

function readStoredSplit(): Split | null {
  const raw = localStorage.getItem('gofit.split')
  if (!raw) return null
  try { return JSON.parse(raw) as Split } catch { return null }
}

function getWeekNumber(): number {
  const d = new Date()
  const start = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function factorColor(pct: number): string {
  return pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
}

type DayType = { label: string; isRest: boolean }

function getTodayDayType(split: Split | null): DayType {
  if (!split) return { label: 'TRAINING', isRest: false }
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const todayDay = DAYS[new Date().getDay()]
  if (!split.schedule.includes(todayDay)) return { label: 'REST', isRest: true }
  const idx = split.schedule.indexOf(todayDay)
  const id = split.id
  if (id === 'ppl' || id === 'ppl-strength') {
    return { label: (['PUSH', 'PULL', 'LEGS'] as const)[idx % 3], isRest: false }
  }
  if (id === 'upper-lower-4x') {
    return { label: idx % 2 === 0 ? 'UPPER' : 'LOWER', isRest: false }
  }
  if (id === 'full-body-3x' || id === 'full-body-4x') {
    return { label: 'FULL BODY', isRest: false }
  }
  if (id === 'bro-split') {
    return { label: (['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS'] as const)[idx % 5], isRest: false }
  }
  if (id === '531') {
    return { label: (['SQUAT', 'BENCH', 'DEADLIFT', 'OHP'] as const)[idx % 4], isRest: false }
  }
  if (id === 'arnold-split') {
    return { label: (['CHEST+BACK', 'ARMS', 'LEGS'] as const)[idx % 3], isRest: false }
  }
  return { label: 'TRAINING', isRest: false }
}

/* ─── Skeleton ─────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-64 animate-pulse rounded-lg" style={{ background: '#141414' }} />
      <div className="grid gap-4 md:grid-cols-[5fr_3fr]">
        <div className="h-56 animate-pulse rounded-xl" style={{ background: '#141414' }} />
        <div className="h-56 animate-pulse rounded-xl" style={{ background: '#141414' }} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-44 animate-pulse rounded-xl" style={{ background: '#141414' }} />)}
      </div>
      <div className="grid gap-4 md:grid-cols-[3fr_5fr]">
        <div className="h-44 animate-pulse rounded-xl" style={{ background: '#141414' }} />
        <div className="h-44 animate-pulse rounded-xl" style={{ background: '#141414' }} />
      </div>
    </div>
  )
}

/* ─── Factor row ────────────────────────────────────────────────── */
function FactorRow({ label, value }: { label: string; value: number }) {
  const color = factorColor(value)
  return (
    <div className="flex items-center gap-2">
      <span className="min-w-[72px] text-[11px] text-[rgba(255,255,255,0.35)]">{label}</span>
      <div className="flex-1">
        <ProgressBar value={value} max={100} color={color} height={4} animate />
      </div>
      <span className="min-w-[28px] text-right text-[11px] font-medium" style={{ color }}>{value}</span>
    </div>
  )
}

/* ─── Recovery dot ─────────────────────────────────────────────── */
function RecoveryDotRow({ days7 }: { days7: { entry: ProgressEntry | null; isToday: boolean; label: string }[] }) {
  return (
    <div className="mt-4 flex items-center">
      {days7.map((d, i) => {
        const score = d.entry
          ? (d.entry.recoveryScore ?? Math.round(Math.min(100, d.entry.sleepHours * 12)))
          : null
        const bg = d.isToday && score !== null
          ? '#10b981'
          : score === null
            ? '#141414'
            : score >= 70
              ? 'rgba(16,185,129,0.2)'
              : score >= 50
                ? 'rgba(245,158,11,0.15)'
                : 'rgba(239,68,68,0.15)'
        const textColor = d.isToday && score !== null
          ? '#fff'
          : score === null
            ? '#64748b'
            : score >= 70
              ? '#10b981'
              : score >= 50
                ? '#f59e0b'
                : '#ef4444'
        const borderColor = d.isToday
          ? (score !== null ? '#10b981' : 'rgba(16,185,129,0.4)')
          : score !== null
            ? textColor
            : 'rgba(255,255,255,0.08)'
        const ring = d.isToday ? '0 0 0 3px rgba(16,185,129,0.25)' : 'none'

        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold transition-all"
              style={{
                background: bg,
                border: `1px solid ${borderColor}`,
                boxShadow: ring,
                color: textColor,
              }}
            >
              {score !== null ? score : '·'}
            </div>
            <span
              className="text-[10px] font-medium"
              style={{ color: d.isToday ? '#ffffff' : 'rgba(255,255,255,0.35)' }}
            >
              {d.label}
            </span>
            {i < days7.length - 1 && (
              <div className="absolute h-px" />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────────────── */
interface GuideCardData {
  Icon: (props: { size?: number; color?: string }) => JSX.Element
  title: string
  text: string | null
  checklist: string[] | null
}

function WelcomeExperience({ progressEntries }: { progressEntries: ProgressEntry[] }) {
  const navigate = useNavigate()
  const guideRef = useRef<HTMLDivElement>(null)

  const username = (() => {
    try {
      const raw = localStorage.getItem('gofit.user')
      if (raw) {
        const u = JSON.parse(raw) as { username?: string; name?: string }
        return u?.username || u?.name || ''
      }
    } catch {}
    return ''
  })()

  const hasSplit = !!localStorage.getItem('gofit.split')
  const hasTarget = !!localStorage.getItem('gofit.target')
  const hasCheckIn = progressEntries.length > 0

  useEffect(() => {
    const container = guideRef.current
    if (!container) return
    const cards = container.querySelectorAll('.guide-card')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          ;(e.target as HTMLElement).classList.add('visible')
          obs.unobserve(e.target)
        }
      }),
      { threshold: 0.1 },
    )
    cards.forEach(card => obs.observe(card))
    return () => obs.disconnect()
  }, [])

  const steps = [
    { title: 'Complete Your Profile', subtitle: 'Enter age, weight, height, goal, and activity level', done: false, to: '/profile' },
    { title: 'Choose Your Goal', subtitle: 'Tell GoFit what you want to achieve', done: hasTarget, to: '/target' },
    { title: 'Select Your Program', subtitle: 'Pick a training split that fits your schedule', done: hasSplit, to: '/splits' },
    { title: 'Log Your First Check-in', subtitle: 'Track sleep, energy, and training', done: hasCheckIn, to: '/progress' },
  ]

  const guideCards: GuideCardData[] = [
    {
      Icon: Calculator as GuideCardData['Icon'],
      title: 'Calorie Intelligence',
      text: 'GoFit uses your age, weight, height, and activity level to calculate your exact daily calorie needs. Better profile info = better recommendations.',
      checklist: null,
    },
    {
      Icon: Moon as GuideCardData['Icon'],
      title: 'Sleep & Recovery',
      text: 'Sleep affects performance, hunger, and recovery. GoFit connects your sleep data to training readiness so you always know how to approach your next session.',
      checklist: null,
    },
    {
      Icon: Activity as GuideCardData['Icon'],
      title: 'Recovery Intelligence',
      text: 'Training hard every day is not optimal. GoFit tracks your recovery across 7-day cycles and tells you when to push and when to rest.',
      checklist: null,
    },
    {
      Icon: TrendingUp as GuideCardData['Icon'],
      title: 'Strength Tracking',
      text: 'Track your lifts over time and see whether you are progressing, maintaining, or regressing. Charts replace guesswork with clarity.',
      checklist: null,
    },
    {
      Icon: Salad as GuideCardData['Icon'],
      title: 'Workout & Nutrition',
      text: 'GoFit connects training, sleep, calories, and recovery together. You get guidance not just data — so every number has a clear action behind it.',
      checklist: null,
    },
    {
      Icon: Star as GuideCardData['Icon'],
      title: 'How To Get Best Results',
      text: null,
      checklist: [
        'Complete your profile fully',
        'Log check-ins consistently',
        'Track sleep and recovery',
        'Update weight regularly',
        'Follow calorie targets',
        'Use charts to adjust training',
      ],
    },
  ]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', animation: 'fadeSlideUp 0.6s ease forwards' }}>
      {/* Welcome hero */}
      <div style={{ marginBottom: 48 }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: '#ffffff', margin: 0 }}>
          Welcome to GoFit{username ? `, ${username}` : ''}.
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginTop: 12, maxWidth: 500 }}>
          Your fitness data means more when you know how to use it.
        </p>
      </div>

      {/* Setup checklist */}
      <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
        GET STARTED
      </p>
      <div style={{ marginBottom: 40 }}>
        {steps.map((step, i) => (
          <div
            key={step.title}
            style={{
              background: '#0f0f0f',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 8,
              animation: `fadeSlideUp 0.6s ease ${i * 0.1}s both`,
            }}
          >
            <div style={{ flexShrink: 0 }}>
              {step.done
                ? <CheckCircle size={20} color="#10b981" />
                : <Circle size={20} color="rgba(255,255,255,0.2)" />
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: step.done ? 'rgba(255,255,255,0.3)' : '#ffffff', textDecoration: step.done ? 'line-through' : 'none' }}>
                {step.title}
              </p>
              {!step.done && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>{step.subtitle}</p>
              )}
            </div>
            {step.done ? (
              <span style={{ fontSize: 12, color: '#10b981', flexShrink: 0 }}>Done ✓</span>
            ) : (
              <button
                type="button"
                onClick={() => navigate(step.to)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0, padding: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
              >
                Start →
              </button>
            )}
          </div>
        ))}
      </div>

      {/* How GoFit works */}
      <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
        HOW TO USE GOFIT
      </p>
      <div ref={guideRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 40 }}>
        {guideCards.map((card, i) => (
          <div
            key={card.title}
            className="guide-card"
            style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, transitionDelay: `${i * 0.08}s` }}
          >
            <card.Icon size={20} color="#ffffff" />
            <p style={{ fontSize: 13, fontWeight: 500, color: '#ffffff', margin: '12px 0 0' }}>{card.title}</p>
            {card.text && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 8, lineHeight: 1.6 }}>{card.text}</p>
            )}
            {card.checklist && (
              <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
                {card.checklist.map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#ffffff', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          style={{ background: '#ffffff', color: '#000000', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 15, padding: '16px 32px', borderRadius: 10, transition: 'background 200ms' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.9)')}
          onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
        >
          Set Up Your Profile →
        </button>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>Takes about 2 minutes</p>
      </div>
    </div>
  )
}

function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([])
  const [, setActiveGoal] = useState<UserGoal | null>(null)
  const [coaching, setCoaching] = useState<CoachingResponse | null>(() => readStoredCoaching())
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadKey, setLoadKey] = useState(0)

  useEffect(() => {
    let mounted = true
    async function load(showLoading = true) {
      if (showLoading) setIsLoading(true)
      setError('')
      try {
        const [currentProfile, entries, goals] = await Promise.all([
          profileService.getLatestProfile(),
          progressService.getProgressEntries().catch(() => [] as ProgressEntry[]),
          goalService.getGoals().catch(() => []),
        ])
        if (!mounted) return
        setProfile(currentProfile ?? null)
        setProgressEntries(entries)
        setActiveGoal(selectPrimaryGoal(goals))
        setCoaching(readStoredCoaching())
      } catch (e) {
        if (mounted) {
          if (axios.isAxiosError(e)) {
            const status = e.response?.status
            if (status === 401 || status === 403) return
            setError('Unable to reach GoFit servers. Please try again.')
          } else {
            setError(getErrorMessage(e))
          }
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    const refresh = () => { setCoaching(readStoredCoaching()); load(false) }
    window.addEventListener(PROFILE_UPDATED_EVENT, refresh)
    window.addEventListener(PROGRESS_UPDATED_EVENT, refresh)
    window.addEventListener(GOALS_UPDATED_EVENT, refresh)
    return () => {
      mounted = false
      window.removeEventListener(PROFILE_UPDATED_EVENT, refresh)
      window.removeEventListener(PROGRESS_UPDATED_EVENT, refresh)
      window.removeEventListener(GOALS_UPDATED_EVENT, refresh)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey])

  if (isLoading) return <Skeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div
          className="rounded-xl p-6 max-w-sm w-full"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <p className="text-sm text-red-400">Unable to reach GoFit servers. Please try again.</p>
          <button
            type="button"
            onClick={() => setLoadKey((k) => k + 1)}
            className="mt-4 inline-flex h-11 items-center rounded-xl px-5 text-sm font-semibold transition-colors"
            style={{ background: '#ffffff', color: '#000000' }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return <WelcomeExperience progressEntries={progressEntries} />
  }

  /* ── Derived values ── */
  const summary = buildDashboardSummary(profile, progressEntries)
  const split = readStoredSplit()
  const todayEntry = progressEntries.find((e) => e.date === todayStr()) ?? null
  const recentEntries = [...progressEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const latestEntry = recentEntries[0] ?? null

  /* Recovery score */
  const recoveryScore = coaching?.recoveryScore ??
    (latestEntry ? Math.round(Math.min(100, latestEntry.sleepHours * 12)) : 0)

  /* Factor scores */
  const sleepPct = latestEntry ? Math.min(100, Math.round((latestEntry.sleepHours / 9) * 100)) : 60
  const energyPct = ({
    low: 85, moderate: 60, high: 35, severe: 15
  } as Record<string, number>)[(latestEntry?.fatigueLevel ?? 'moderate').toLowerCase()] ?? 60
  const trainingPct = ({
    excellent: 95, good: 75, moderate: 50, poor: 25
  } as Record<string, number>)[(latestEntry?.workoutPerformance ?? 'good').toLowerCase().replace(' session', '')] ?? 70
  const hasTdee = (profile.gender === 'Male' || profile.gender === 'Female') && !!profile.activityLevel
  const tdee = hasTdee
    ? calculateTDEE(profile.weight, profile.height, profile.age, profile.gender as 'Male' | 'Female', profile.activityLevel!)
    : (coaching?.recommendedCalories || 2200)
  const dailyTarget = hasTdee
    ? calculateDailyTarget(tdee, profile.weeklyWeightTarget ?? 0, 'kg')
    : (coaching?.recommendedCalories || 2200)
  const nutritionPct = todayEntry
    ? Math.min(100, Math.round((todayEntry.calories / dailyTarget) * 100))
    : 70

  /* Macros */
  const proteinG = Math.round(profile.weight * 2.2)
  const fatG = Math.round((dailyTarget * 0.25) / 9)
  const carbG = Math.round(Math.max(0, dailyTarget - proteinG * 4 - fatG * 9) / 4)
  const phase = getPhase(profile.weeklyWeightTarget ?? 0)

  /* Readiness */
  const readinessLevel = coaching?.trainingReadinessLevel || summary.trainingReadiness || 'Moderate'

  /* Coach insight text */
  const insightText = coaching?.additionalAdvice || coaching?.coachingMemory ||
    coaching?.splitReason || coaching?.recoveryFeedback || summary.coachingInsight

  /* 7-day timeline */
  const today = new Date()
  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    const dateStr = d.toISOString().slice(0, 10)
    const entry = progressEntries.find((e) => e.date === dateStr) ?? null
    return {
      dateStr,
      entry,
      isToday: i === 6,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3),
    }
  })

  /* Today's training */
  const dayType = getTodayDayType(split)
  const dayBadgeVariant = dayType.isRest ? 'muted' : 'success'

  /* Weekly bars */
  const weekBarDays = Array.from({ length: 7 }, (_, i) => {
    const dow = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((dow + 6) % 7))
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    const dateStr = day.toISOString().slice(0, 10)
    const entry = progressEntries.find((e) => e.date === dateStr) ?? null
    const isToday = dateStr === todayStr()
    const score = entry ? (entry.recoveryScore ?? Math.round(Math.min(100, entry.sleepHours * 12))) : 0
    const isTraining = split ? split.schedule.includes(
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]
    ) : true
    return { isToday, score, isTraining, label: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i], entry }
  })

  /* Week number */
  const weekNum = getWeekNumber()

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Greeting header */}
      <div className="mb-2">
        <h1 className="font-['DM_Serif_Display'] text-[22px] sm:text-[26px] text-white">
          {summary.overviewTitle || 'Welcome back'}{', '}
          <span className="italic text-white">{profile.name || 'Athlete'}</span>
          {'.'}
        </h1>
        <p className="mt-0.5 text-[13px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          {' · '}Week {weekNum}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Your daily performance briefing {'—'} updated based on your latest check-in and coaching data. Every card reflects your current training state.
        </p>
      </div>

      {/* ROW 1: Recovery & Readiness + Coach Insight */}
      <div className="grid gap-4 md:grid-cols-[5fr_3fr]">

        {/* Recovery & Readiness */}
        <div
          className="rounded-xl p-4 sm:p-6 transition-colors duration-200"
          style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Recovery &amp; Readiness
          </p>
          <p className="text-[11px] mt-0.5 mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Calculated from your sleep, energy, and training performance check-ins
          </p>

          {/* Ring + score + badge */}
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex items-center gap-4 sm:block">
              <ScoreRing score={recoveryScore} size={110} />
            </div>

            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-['DM_Serif_Display'] text-[38px] leading-none text-white">
                  {recoveryScore}
                </span>
                <span className="text-[16px]" style={{ color: 'rgba(255,255,255,0.35)' }}>/100</span>
                <StatusBadge
                  status={readinessLevel}
                  variant={readinessVariant(readinessLevel)}
                />
              </div>
              <p className="text-[13px] leading-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {coaching?.trainingReadinessFeedback || summary.recoverySubtitle}
              </p>
            </div>
          </div>

          {/* Factor bars */}
          <div className="mt-5 space-y-3">
            <FactorRow label="Sleep" value={sleepPct} />
            <FactorRow label="Energy" value={energyPct} />
            <FactorRow label="Training" value={trainingPct} />
            <FactorRow label="Nutrition" value={nutritionPct} />
          </div>
        </div>

        {/* Coach Insight */}
        <div
          className="rounded-xl p-4 sm:p-6 flex flex-col justify-between"
          style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Adaptive Coaching
              </p>
            </div>
            <p className="mt-1 mb-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Personalized guidance updated each time your profile or check-in data changes
            </p>
            <p
              className="mt-1 text-[14px] leading-[1.7] font-light"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              {insightText || 'Save your profile to receive personalized adaptive coaching insights.'}
            </p>
          </div>
          <Link
            to="/coaching"
            className="mt-4 self-start text-[13px] font-medium transition-colors duration-150 min-h-[44px] flex items-center"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
          >
            Ask coach →
          </Link>
        </div>
      </div>

      {/* ROW 2: Training + Nutrition + Weekly Load */}
      <div className="grid gap-4 md:grid-cols-3">

        {/* Today's Training */}
        <div
          className="rounded-xl p-4 sm:p-5 hover:border-white/15 transition-colors duration-200"
          style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Today's Training
          </p>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge
              status={dayType.label}
              variant={dayBadgeVariant}
            />
          </div>

          {!dayType.isRest ? (
            <>
              <div className="mt-3 space-y-1.5">
                <div
                  className="rounded-lg px-3 py-2 text-xs"
                  style={{ background: '#0a0a0a', color: 'rgba(255,255,255,0.55)' }}
                >
                  {split?.name || 'Training session'}
                </div>
                {split && (
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {split.daysPerWeek} days/week {' · '} {split.volumePerMuscle}
                  </p>
                )}
              </div>
              <StatusBadge
                status={`${readinessLevel} readiness`}
                variant={readinessVariant(readinessLevel)}
                className="mt-3"
              />
              <Link
                to="/training"
                className="mt-4 block text-sm font-medium min-h-[44px] flex items-center transition-colors"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                View session →
              </Link>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm font-medium" style={{ color: '#ffffff' }}>Active Recovery</p>
              <p className="mt-1 text-xs leading-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Sleep and nutrition are your training today.
              </p>
              <Link
                to="/training"
                className="mt-4 block text-sm font-medium min-h-[44px] flex items-center transition-colors"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                View program →
              </Link>
            </>
          )}
        </div>

        {/* Nutrition */}
        <div
          className="rounded-xl p-4 sm:p-5 hover:border-white/15 transition-colors duration-200"
          style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Nutrition
          </p>
          <p className="mt-2 font-['DM_Serif_Display'] text-[32px] leading-none text-[#ffffff]">
            {dailyTarget.toLocaleString()}
          </p>
          <p className="mt-1 text-[13px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            calories {' · '} {phase}
          </p>
          <StatusBadge status={phase} variant={phase === 'Cut' ? 'warning' : phase === 'Bulk' ? 'success' : 'muted'} className="mt-2" />

          {todayEntry && (
            <div className="mt-3">
              <ProgressBar
                value={todayEntry.calories}
                max={dailyTarget}
                color={nutritionPct >= 90 && nutritionPct <= 110 ? '#10b981' : nutritionPct < 90 ? '#f59e0b' : '#ef4444'}
                height={4}
                animate
              />
              <p className="mt-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {todayEntry.calories.toLocaleString()} / {dailyTarget.toLocaleString()} kcal today
              </p>
            </div>
          )}

          {/* Macro pills */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              { label: `P: ${proteinG}g` },
              { label: `C: ${carbG}g` },
              { label: `F: ${fatG}g` },
            ].map((m) => (
              <span
                key={m.label}
                className="rounded-full px-2.5 py-0.5 text-xs"
                style={{ background: '#141414', color: 'rgba(255,255,255,0.55)' }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <Link
            to="/nutrition"
            className="mt-3 block text-sm font-medium min-h-[44px] flex items-center transition-colors"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            View nutrition →
          </Link>
        </div>

        {/* Weekly Load */}
        <div
          className="rounded-xl p-4 sm:p-5 hover:border-white/15 transition-colors duration-200"
          style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Weekly Load
          </p>

          {/* 7 mini bars */}
          <div className="mt-3 flex items-end gap-1" style={{ height: 48 }}>
            {weekBarDays.map((d, i) => {
              const h = d.entry
                ? Math.max(8, Math.min(48, Math.round((d.score / 100) * 48)))
                : (d.isTraining ? 6 : 6)
              const bg = d.isToday ? '#ffffff' : d.entry ? 'rgba(255,255,255,0.5)' : '#141414'
              const shadow = d.isToday ? '0 0 8px rgba(255,255,255,0.2)' : 'none'
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm transition-all duration-300"
                    style={{ height: h, background: bg, boxShadow: shadow }}
                  />
                </div>
              )
            })}
          </div>
          {/* Day labels */}
          <div className="mt-1 flex gap-1">
            {weekBarDays.map((d, i) => (
              <span
                key={i}
                className="flex-1 text-center text-[10px]"
                style={{ color: d.isToday ? '#ffffff' : 'rgba(255,255,255,0.35)' }}
              >
                {d.label}
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {coaching?.estimatedWeeklySets ? `${coaching.estimatedWeeklySets} sets` : `${profile.trainingDaysAvailable}d`}
              {' · '}{profile.trainingDaysAvailable} days/week
            </p>
          </div>
          <StatusBadge
            status={coaching?.workloadStatus || summary.progressionState}
            variant={
              (coaching?.workloadStatus || '').toLowerCase().includes('optimal') ? 'success'
              : (coaching?.workloadStatus || '').toLowerCase().includes('high') ? 'warning'
              : 'muted'
            }
            className="mt-2"
          />
        </div>
      </div>

      {/* ROW 3: 7-day Recovery + Progression */}
      <div className="grid gap-4 md:grid-cols-[3fr_5fr]">

        {/* 7-day Recovery timeline */}
        <div
          className="rounded-xl p-4 sm:p-5 hover:border-white/15 transition-colors duration-200"
          style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
            7-Day Recovery
          </p>
          <RecoveryDotRow days7={days7} />
          <p
            className="mt-3 text-[13px] leading-[1.6] line-clamp-2"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            {coaching?.recoveryFeedback || summary.recoverySubtitle}
          </p>
        </div>

        {/* Progression */}
        <div
          className="rounded-xl p-4 sm:p-5 hover:border-white/15 transition-colors duration-200"
          style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Progression
          </p>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
            <ScoreRing
              score={coaching?.consistencyScore ?? summary.recoveryScore}
              size={80}
              label="Consistency"
            />

            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Progression State
              </p>
              <StatusBadge
                status={coaching?.progressionState || summary.progressionState}
                variant={
                  (coaching?.progressionState || summary.progressionState || '').toLowerCase().includes('progress')
                    ? 'success'
                    : (coaching?.progressionState || summary.progressionState || '').toLowerCase().includes('plateau')
                      ? 'warning'
                      : 'muted'
                }
                className="mt-1"
              />
              <p className="mt-2 text-[13px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {coaching?.progressionStrategy || summary.progressionSubtitle}
              </p>

              {coaching?.plateauDetection && coaching.plateauDetection.length > 3 && (
                <div
                  className="mt-3 rounded-r p-3"
                  style={{
                    background: 'rgba(245,158,11,0.1)',
                    borderLeft: '2px solid #f59e0b',
                  }}
                >
                  <p className="text-[13px]" style={{ color: '#f59e0b' }}>
                    {coaching.plateauDetection}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Link
            to="/analytics"
            className="mt-4 block text-sm font-medium min-h-[44px] flex items-center transition-colors"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            View analytics →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage



