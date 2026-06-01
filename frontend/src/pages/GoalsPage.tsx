import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { goalService } from '../services/goalService'
import { profileService, COACHING_KEY } from '../services/profileService'
import { getErrorMessage } from '../utils/getErrorMessage'
import type { UserGoal } from '../types/goals'
import type { CoachingResponse, UserProfile } from '../types/coaching'

function readStoredCoaching(): CoachingResponse | null {
  const raw = localStorage.getItem(COACHING_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as CoachingResponse } catch { return null }
}

/* Map goal type → coaching alignment label/value */
function coachingAlignment(goalType: string, coaching: CoachingResponse | null): { label: string; value: string } | null {
  if (!coaching) return null
  const gt = goalType.toLowerCase()
  if (gt === 'cut' || gt === 'fat loss') {
    return { label: 'Cutting calories', value: coaching.cuttingCalories > 0 ? `${coaching.cuttingCalories.toLocaleString()} kcal` : coaching.calorieStrategy }
  }
  if (gt === 'hypertrophy' || gt === 'muscle gain') {
    const sets = coaching.estimatedWeeklySets > 0 ? `${coaching.estimatedWeeklySets} sets/wk` : ''
    return { label: 'Split', value: [coaching.splitRecommendation, sets].filter(Boolean).join(' · ') }
  }
  if (gt === 'bulk') {
    return { label: 'Bulking calories', value: coaching.bulkingCalories > 0 ? `${coaching.bulkingCalories.toLocaleString()} kcal` : coaching.calorieStrategy }
  }
  if (gt === 'maintenance') {
    const range = coaching.maintenanceCaloriesLow > 0
      ? `${coaching.maintenanceCaloriesLow.toLocaleString()}–${coaching.maintenanceCaloriesHigh.toLocaleString()} kcal`
      : ''
    return { label: 'Maintenance range', value: range || coaching.trainingReadinessLevel }
  }
  if (gt === 'strength') {
    return { label: 'Split', value: coaching.splitRecommendation }
  }
  if (gt === 'recomposition') {
    return { label: 'Readiness', value: coaching.trainingReadinessLevel }
  }
  return null
}

function GoalsPage() {
  const [goals, setGoals] = useState<UserGoal[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [goalsData, currentProfile] = await Promise.all([
          goalService.getGoals(),
          profileService.getLatestProfile().catch(() => null),
        ])
        if (!mounted) return
        setGoals(goalsData)
        setProfile(currentProfile)
      } catch (e) {
        if (mounted) setError(getErrorMessage(e))
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const coaching = readStoredCoaching()
  const activeGoal = goals.find((g) => g.active)
  const inactiveGoals = goals.filter((g) => !g.active)
  const alignment = activeGoal ? coachingAlignment(activeGoal.goalType, coaching) : null

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-[#0f0f0f]" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-['DM_Serif_Display'] text-2xl text-white">Goals</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[rgba(255,255,255,0.35)] mb-6">
          Your active target drives everything in GoFit — your split recommendation, calorie targets, training volume, and coaching guidance all align to support your current goal.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Active goal banner */}
      {activeGoal ? (
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex">
            <div className="w-1 shrink-0 rounded-l-xl" style={{ background: '#ffffff' }} />
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Active Goal
                  </p>
                  <p className="mt-1 font-['DM_Serif_Display'] text-2xl text-white">{activeGoal.goalType}</p>
                  {activeGoal.focus && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {activeGoal.focus.split(',').map((f) => (
                        <span
                          key={f}
                          className="rounded-full px-2.5 py-0.5 text-xs"
                          style={{ background: 'rgba(16,185,129,0.1)', color: 'rgba(255,255,255,0.7)' }}
                        >
                          {f.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  {activeGoal.createdAt && (
                    <p className="mt-2 text-xs text-[rgba(255,255,255,0.35)]">
                      Active since{' '}
                      {new Date(activeGoal.createdAt).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  {alignment && (
                    <div
                      className="rounded-xl px-4 py-3 text-right"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {alignment.label}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{alignment.value}</p>
                    </div>
                  )}
                  <Link
                    to="/target"
                    onClick={() => localStorage.removeItem('gofit.split')}
                    className="inline-flex h-9 items-center rounded-xl border px-4 text-sm font-medium text-[rgba(255,255,255,0.55)] hover:bg-white/4 transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    Change Goal {'→'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-xl p-12 text-center"
          style={{ background: '#0f0f0f', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <p className="font-['DM_Serif_Display'] text-xl text-white">No goal set yet</p>
          <p className="mt-2 text-sm text-[rgba(255,255,255,0.35)]">Set a training target to align your coaching and nutrition.</p>
          <Link
            to="/target"
            onClick={() => localStorage.removeItem('gofit.split')}
            className="mt-5 inline-flex h-10 items-center rounded-xl px-5 text-sm font-semibold transition-colors"
            style={{ background: '#ffffff', color: '#000000' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.9)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
          >
            Set my goal {'→'}
          </Link>
        </div>
      )}

      {/* Goal history timeline */}
      {inactiveGoals.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-3">Previous Goals</p>
          <div className="relative">
            {/* Vertical timeline line */}
            <div
              className="absolute left-4 top-2 bottom-2 w-px"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
            <div className="space-y-3 pl-10">
              {inactiveGoals.map((goal) => (
                <div
                  key={goal.id ?? `${goal.goalType}-${goal.createdAt}`}
                  className="relative rounded-xl px-5 py-4"
                  style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {/* Timeline dot */}
                  <div
                    className="absolute -left-6 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full"
                    style={{ background: '#141414', border: '2px solid rgba(255,255,255,0.15)' }}
                  />
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium line-through text-[rgba(255,255,255,0.35)]">{goal.goalType}</p>
                      {goal.focus && (
                        <p className="text-xs text-[rgba(255,255,255,0.35)] mt-0.5">{goal.focus}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {goal.createdAt && (
                        <p className="text-xs text-[rgba(255,255,255,0.35)]">
                          {new Date(goal.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      )}
                      <span
                        className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] text-[rgba(255,255,255,0.35)]"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        Inactive
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Profile state note */}
      {!profile && goals.length > 0 && (
        <p className="text-xs text-[rgba(255,255,255,0.35)] text-center">
          <Link to="/profile" className="text-[rgba(255,255,255,0.55)] hover:text-white">Set up your profile</Link>
          {' '}to align coaching with your goal.
        </p>
      )}
    </div>
  )
}

export default GoalsPage

