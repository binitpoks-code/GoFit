import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { COACHING_KEY, PROFILE_UPDATED_EVENT, profileService } from '../services/profileService'
import { PROGRESS_UPDATED_EVENT, progressService } from '../services/progressService'
import type { CoachingResponse, ProgressEntry, UserProfile } from '../types/coaching'
import { getErrorMessage } from '../utils/getErrorMessage'
import { calculateDailyTarget, calculateTDEE, getPhase } from '../utils/tdeeCalculator'
import { getStoredWeightUnit } from '../utils/weightUnits'

function readStoredCoaching(): CoachingResponse | null {
  const raw = localStorage.getItem(COACHING_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as CoachingResponse } catch { return null }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function scoreColor(pct: number) {
  if (pct >= 90 && pct <= 110) return '#10b981'
  if (pct < 90) return '#f59e0b'
  return '#ef4444'
}

function NutritionPage() {
  const [coaching, setCoaching] = useState<CoachingResponse | null>(() => readStoredCoaching())
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    async function load(showLoading = true) {
      if (showLoading) setIsLoading(true)
      setError('')
      try {
        const [currentProfile, entries] = await Promise.all([
          profileService.getLatestProfile().catch(() => null),
          progressService.getProgressEntries().catch(() => [] as ProgressEntry[]),
        ])
        if (isMounted) {
          setCoaching(readStoredCoaching())
          setProfile(currentProfile)
          setProgressEntries(entries)
        }
      } catch (caughtError) {
        if (isMounted) setError(getErrorMessage(caughtError))
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    load()
    const refresh = () => { setCoaching(readStoredCoaching()); load(false) }
    window.addEventListener(PROFILE_UPDATED_EVENT, refresh)
    window.addEventListener(PROGRESS_UPDATED_EVENT, refresh)
    return () => {
      isMounted = false
      window.removeEventListener(PROFILE_UPDATED_EVENT, refresh)
      window.removeEventListener(PROGRESS_UPDATED_EVENT, refresh)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-36 animate-pulse rounded-xl bg-[#0f0f0f]" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-[#0f0f0f]" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400">{error}</div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-8 max-w-sm w-full">
          <h2 className="font-['DM_Serif_Display'] text-2xl text-white">Set up your profile</h2>
          <p className="mt-2 text-sm text-[rgba(255,255,255,0.35)]">GoFit needs your body metrics to generate nutrition targets.</p>
          <Link
            to="/profile"
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-white px-6 text-sm font-semibold text-black hover:bg-white/90 transition-colors"
          >
            Set up profile
          </Link>
        </div>
      </div>
    )
  }

  /* TDEE calculations */
  const hasTdee = (profile.gender === 'Male' || profile.gender === 'Female') && !!profile.activityLevel
  const tdee = hasTdee
    ? calculateTDEE(profile.weight, profile.height, profile.age, profile.gender as 'Male' | 'Female', profile.activityLevel!)
    : (coaching?.estimatedMaintenanceCalories || 0)
  const weeklyTarget = profile.weeklyWeightTarget ?? 0
  const dailyTarget = hasTdee
    ? calculateDailyTarget(tdee, weeklyTarget, 'kg')
    : (coaching?.recommendedCalories || 2200)
  const phase = hasTdee ? getPhase(weeklyTarget) : (coaching?.calorieStrategy?.split(' ')[0] || 'Maintenance')
  const unit = getStoredWeightUnit()

  /* Macros */
  const proteinG = Math.round(profile.weight * 2.2)
  const fatG = Math.round((dailyTarget * 0.25) / 9)
  const carbG = Math.round(Math.max(0, dailyTarget - proteinG * 4 - fatG * 9) / 4)
  const proteinKcal = proteinG * 4
  const carbKcal = carbG * 4
  const fatKcal = fatG * 9

  /* Today's intake */
  const todayEntry = progressEntries.find((e) => e.date === todayStr()) ?? null
  const todayLogged = todayEntry?.calories ?? 0
  const todayPct = dailyTarget > 0 ? Math.round((todayLogged / dailyTarget) * 100) : 0
  const barColor = scoreColor(todayPct)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="font-['DM_Serif_Display'] text-2xl text-white">Nutrition</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[rgba(255,255,255,0.35)]">
          Your nutrition targets are calculated using the Mifflin-St Jeor formula based on your body metrics, activity level, and weekly weight goal. Targets update automatically when you update your profile.
        </p>
      </div>

      {/* Header card — dark emerald tint */}
      <div className="rounded-xl p-6" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="rounded-full px-3 py-0.5 text-xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff' }}
              >
                {phase}
              </span>
            </div>
            <p className="font-['DM_Serif_Display'] text-4xl sm:text-5xl leading-none text-white">
              {dailyTarget.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-[rgba(255,255,255,0.55)]">calories per day</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-xs text-[rgba(255,255,255,0.4)]">Maintenance: {tdee > 0 ? tdee.toLocaleString() : '—'} kcal</p>
            {weeklyTarget !== 0 && (
              <p className="text-xs text-[rgba(255,255,255,0.4)]">
                {weeklyTarget > 0 ? `+${weeklyTarget}` : weeklyTarget} {unit}/week target
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl p-5" style={{ background: '#141414' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">Maintenance TDEE</p>
          <p className="mt-2 font-['DM_Serif_Display'] text-3xl text-white">{tdee > 0 ? tdee.toLocaleString() : '—'}</p>
          <p className="mt-1 text-xs text-[rgba(255,255,255,0.35)]">kcal {'·'} {profile.activityLevel || 'Set activity level'}</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: '#141414' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">Daily Target</p>
          <p className="mt-2 font-['DM_Serif_Display'] text-3xl text-white">{dailyTarget.toLocaleString()}</p>
          <p className="mt-1 text-xs text-[rgba(255,255,255,0.35)]">kcal {'·'} {phase} phase</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: '#141414' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">Weekly Expected</p>
          <p className="mt-2 font-['DM_Serif_Display'] text-3xl text-white">
            {weeklyTarget === 0 ? '±0' : `${weeklyTarget > 0 ? '+' : ''}${weeklyTarget}`}
          </p>
          <p className="mt-1 text-xs text-[rgba(255,255,255,0.35)]">{unit} / week</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: '#141414' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">
            {weeklyTarget < 0 ? 'Deficit' : weeklyTarget > 0 ? 'Surplus' : 'Balance'}
          </p>
          <p className="mt-2 font-['DM_Serif_Display'] text-3xl text-white">
            {Math.abs(dailyTarget - tdee) > 0 ? `${Math.abs(dailyTarget - tdee)}` : '0'}
          </p>
          <p className="mt-1 text-xs text-[rgba(255,255,255,0.35)]">kcal / day</p>
        </div>
      </div>

      {/* Macro section */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-3">Daily Macros</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Protein — emerald */}
          <div className="rounded-xl border p-5" style={{ background: '#0f0f0f', border: '1px solid rgba(16,185,129,0.2)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#10b981' }}>Protein</p>
            <p className="mt-2 font-['DM_Serif_Display'] text-4xl" style={{ color: '#10b981' }}>{proteinG}g</p>
            <p className="mt-1 text-xs text-[rgba(255,255,255,0.35)]">{proteinKcal} kcal {'·'} 2.2g/kg bodyweight</p>
          </div>
          {/* Carbs — amber */}
          <div className="rounded-xl border p-5" style={{ background: '#0f0f0f', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#f59e0b' }}>Carbs</p>
            <p className="mt-2 font-['DM_Serif_Display'] text-4xl" style={{ color: '#f59e0b' }}>{carbG}g</p>
            <p className="mt-1 text-xs text-[rgba(255,255,255,0.35)]">{carbKcal} kcal {'·'} remaining after P &amp; F</p>
          </div>
          {/* Fat — purple */}
          <div className="rounded-xl border p-5" style={{ background: '#0f0f0f', border: '1px solid rgba(129,140,248,0.2)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#818cf8' }}>Fat</p>
            <p className="mt-2 font-['DM_Serif_Display'] text-4xl" style={{ color: '#818cf8' }}>{fatG}g</p>
            <p className="mt-1 text-xs text-[rgba(255,255,255,0.35)]">{fatKcal} kcal {'·'} 25% of daily target</p>
          </div>
        </div>
      </div>

      {/* Strategy section */}
      {(coaching?.calorieStrategy || coaching?.deficitSeverity || coaching?.surplusSustainability) && (
        <div className="rounded-xl p-5" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-3">Nutrition Strategy</p>
          {coaching?.calorieStrategy && (
            <p className="text-sm leading-6 text-white">{coaching.calorieStrategy}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-3">
            {coaching?.deficitSeverity && (
              <div className="rounded-lg bg-[#141414] px-3 py-2">
                <p className="text-[10px] text-[rgba(255,255,255,0.35)]">Deficit severity</p>
                <p className="text-sm font-medium text-[rgba(255,255,255,0.55)]">{coaching.deficitSeverity}</p>
              </div>
            )}
            {coaching?.surplusSustainability && (
              <div className="rounded-lg bg-[#141414] px-3 py-2">
                <p className="text-[10px] text-[rgba(255,255,255,0.35)]">Surplus sustainability</p>
                <p className="text-sm font-medium text-[rgba(255,255,255,0.55)]">{coaching.surplusSustainability}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Today's intake progress */}
      <div className="rounded-xl p-5" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-3">Today's Intake</p>
        <div className="flex items-end gap-3 mb-3">
          <span className="font-['DM_Serif_Display'] text-3xl text-white">
            {todayLogged.toLocaleString()}
          </span>
          <span className="mb-1 text-sm text-[rgba(255,255,255,0.35)]">/ {dailyTarget.toLocaleString()} kcal</span>
          <span className="mb-1 text-sm font-medium ml-auto" style={{ color: barColor }}>{todayPct}%</span>
        </div>
        <div className="h-2 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, todayPct)}%`, background: barColor }}
          />
        </div>
        <p className="mt-2 text-xs text-[rgba(255,255,255,0.35)]">
          {todayLogged === 0
            ? 'No check-in logged today. Log via the Progress page.'
            : todayPct >= 90 && todayPct <= 110
              ? 'On target — great work.'
              : todayPct < 90
                ? `${dailyTarget - todayLogged} kcal remaining.`
                : `${todayLogged - dailyTarget} kcal over target.`}
        </p>
      </div>

      {/* Coaching calorie ranges */}
      {coaching && (coaching.recommendedCalories > 0 || coaching.cuttingCalories > 0) && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-3">Coaching Calorie Ranges</p>
          <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
            {coaching.recommendedCalories > 0 && (
              <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-4">
                <p className="text-[11px] text-[rgba(255,255,255,0.35)]">Recommended</p>
                <p className="mt-1 font-['DM_Serif_Display'] text-2xl text-white">{coaching.recommendedCalories.toLocaleString()}</p>
              </div>
            )}
            {coaching.cuttingCalories > 0 && (
              <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-4">
                <p className="text-[11px] text-[rgba(255,255,255,0.35)]">Cutting</p>
                <p className="mt-1 font-['DM_Serif_Display'] text-2xl text-white">{coaching.cuttingCalories.toLocaleString()}</p>
              </div>
            )}
            {coaching.maintenanceCaloriesLow > 0 && (
              <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-4">
                <p className="text-[11px] text-[rgba(255,255,255,0.35)]">Maintenance low</p>
                <p className="mt-1 font-['DM_Serif_Display'] text-2xl text-white">{coaching.maintenanceCaloriesLow.toLocaleString()}</p>
              </div>
            )}
            {coaching.bulkingCalories > 0 && (
              <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-4">
                <p className="text-[11px] text-[rgba(255,255,255,0.35)]">Bulking</p>
                <p className="mt-1 font-['DM_Serif_Display'] text-2xl text-white">{coaching.bulkingCalories.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NutritionPage

