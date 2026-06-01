import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScoreRing } from '../components/ui/ScoreRing'
import { StatusBadge, readinessVariant } from '../components/ui/StatusBadge'
import { COACHING_KEY, PROFILE_UPDATED_EVENT } from '../services/profileService'
import type { CoachingResponse } from '../types/coaching'

function readStoredCoaching(): CoachingResponse | null {
  const raw = localStorage.getItem(COACHING_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as CoachingResponse } catch { return null }
}

/* ─── Reusable card ──────────────────────────────────────────────── */
function InfoCard({ label, subtitle, children }: { label: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 hover:border-white/12 transition-colors duration-200"
      style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <p className={`text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] ${subtitle ? '' : 'mb-3'}`}>{label}</p>
      {subtitle && <p className="text-[11px] text-[rgba(255,255,255,0.35)] mt-0.5 mb-3">{subtitle}</p>}
      {children}
    </div>
  )
}

function AdaptiveCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ background: '#080808', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.55)] mb-3">{label}</p>
      {children}
    </div>
  )
}

function TextBlock({ text, muted }: { text: string; muted?: boolean }) {
  return (
    <p className={`text-sm leading-6 font-light ${muted ? 'text-[rgba(255,255,255,0.35)]' : 'text-[rgba(255,255,255,0.55)]'}`}>{text}</p>
  )
}

function CoachingPage() {
  const [coaching, setCoaching] = useState<CoachingResponse | null>(() => readStoredCoaching())

  useEffect(() => {
    const handler = () => setCoaching(readStoredCoaching())
    window.addEventListener(PROFILE_UPDATED_EVENT, handler)
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, handler)
  }, [])

  if (!coaching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div
          className="rounded-xl p-8 max-w-sm w-full flex flex-col items-center"
          style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl mb-5"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h2 className="font-['DM_Serif_Display'] text-2xl text-white">No coaching data yet</h2>
          <p className="mt-2 text-sm text-[rgba(255,255,255,0.35)]">Set up your training profile to receive personalized adaptive coaching.</p>
          <Link
            to="/profile"
            className="mt-6 inline-flex h-11 min-h-11 items-center rounded-xl px-6 text-sm font-semibold text-white transition-colors"
            style={{ background: '#ffffff', color: '#000000' }}
          >
            Set up my profile
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-['DM_Serif_Display'] text-2xl text-white">Adaptive Coaching</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[rgba(255,255,255,0.35)] mb-6">
          Your complete adaptive coaching breakdown. GoFit's coaching engine analyzes your profile, goal, split choice, and check-in history to generate these personalized recommendations.
        </p>
      </div>

      {/* ROW 1 — Score rings */}
      <div className="grid gap-5 sm:grid-cols-2">
        <InfoCard label="Readiness Score" subtitle="How prepared your body is for training today">
          <div className="flex items-center gap-6">
            <ScoreRing score={coaching.recoveryScore} size={100} />
            <div className="space-y-2">
              <StatusBadge
                status={coaching.trainingReadinessLevel || 'Unknown'}
                variant={readinessVariant(coaching.trainingReadinessLevel || '')}
              />
              <TextBlock text={coaching.trainingReadinessFeedback || coaching.recoveryScoreFeedback || ''} />
            </div>
          </div>
        </InfoCard>

        <InfoCard label="Consistency Score" subtitle="How consistent your training and recovery habits have been">
          <div className="flex items-center gap-6">
            <ScoreRing score={coaching.consistencyScore} size={100} />
            <div className="space-y-2">
              <StatusBadge
                status={coaching.consistencyScore >= 70 ? 'High' : coaching.consistencyScore >= 50 ? 'Moderate' : 'Low'}
                variant={coaching.consistencyScore >= 70 ? 'success' : coaching.consistencyScore >= 50 ? 'warning' : 'danger'}
              />
              <TextBlock text={coaching.consistencyFeedback || ''} />
            </div>
          </div>
        </InfoCard>
      </div>

      {/* ROW 2 — Training Structure (full width) */}
      <div
        className="rounded-xl p-6"
        style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-2">Training Structure</p>
            <p className="font-['DM_Serif_Display'] text-2xl text-white">{coaching.splitRecommendation}</p>
            {coaching.splitReason && (
              <p className="mt-2 text-sm leading-6 text-[rgba(255,255,255,0.55)]">{coaching.splitReason}</p>
            )}
            {coaching.weeklyTrainingVolume && (
              <p className="mt-2 text-xs text-[rgba(255,255,255,0.35)]">
                Volume: {coaching.weeklyTrainingVolume}
                {coaching.estimatedWeeklySets > 0 && ` · ~${coaching.estimatedWeeklySets} sets/week`}
              </p>
            )}
          </div>
          <div className="shrink-0">
            <StatusBadge
              status={coaching.workloadStatus || ''}
              variant={
                coaching.workloadStatus?.toLowerCase().includes('optimal') ? 'success'
                  : coaching.workloadStatus?.toLowerCase().includes('high') ? 'warning'
                    : 'muted'
              }
            />
          </div>
        </div>
        {coaching.fatigueFeedback && (
          <div className="mt-4 pt-4 border-t border-white/6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Fatigue Assessment</p>
            <TextBlock text={coaching.fatigueFeedback} />
          </div>
        )}
      </div>

      {/* ROW 3 — Recovery + Nutrition */}
      <div className="grid gap-5 md:grid-cols-2">
        <InfoCard label="Recovery &amp; Readiness">
          <div className="space-y-3">
            {coaching.trainingReadinessFeedback && <TextBlock text={coaching.trainingReadinessFeedback} />}
            {coaching.recoveryFeedback && (
              <div className="pt-3 border-t border-white/6">
                <p className="text-xs text-[rgba(255,255,255,0.35)] mb-1">Recovery feedback</p>
                <TextBlock text={coaching.recoveryFeedback} />
              </div>
            )}
            {coaching.deloadRecommendation && (
              <div
                className="mt-3 rounded-lg p-3"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <p className="text-xs font-semibold text-amber-400 mb-1">Deload Recommendation</p>
                <p className="text-sm text-amber-300">{coaching.deloadRecommendation}</p>
              </div>
            )}
          </div>
        </InfoCard>

        <InfoCard label="Nutrition">
          <div className="space-y-3">
            {coaching.recommendedCalories > 0 && (
              <div>
                <p className="text-xs text-[rgba(255,255,255,0.35)] mb-0.5">Recommended</p>
                <p className="font-['DM_Serif_Display'] text-2xl text-white">
                  {coaching.recommendedCalories.toLocaleString()} kcal
                </p>
              </div>
            )}
            {coaching.cuttingCalories > 0 && coaching.bulkingCalories > 0 && (
              <div className="flex gap-3 text-xs text-[rgba(255,255,255,0.35)]">
                <span>Cut: {coaching.cuttingCalories.toLocaleString()} kcal</span>
                <span>{'·'}</span>
                <span>Bulk: {coaching.bulkingCalories.toLocaleString()} kcal</span>
              </div>
            )}
            {coaching.maintenanceCaloriesLow > 0 && (
              <p className="text-xs text-[rgba(255,255,255,0.35)]">
                Maintenance: {coaching.maintenanceCaloriesLow.toLocaleString()}–{coaching.maintenanceCaloriesHigh.toLocaleString()} kcal
              </p>
            )}
            {coaching.calorieStrategy && (
              <div className="pt-3 border-t border-white/6">
                <TextBlock text={coaching.calorieStrategy} />
              </div>
            )}
            {coaching.calorieFeedback && <TextBlock text={coaching.calorieFeedback} muted />}
          </div>
        </InfoCard>
      </div>

      {/* ROW 4 — Progression + Adaptive Guidance */}
      <div className="grid gap-5 md:grid-cols-2">
        <InfoCard label="Progression">
          <div className="space-y-3">
            {coaching.progressionState && (
              <div className="flex items-center gap-3">
                <StatusBadge
                  status={coaching.progressionState}
                  variant={
                    coaching.progressionState.toLowerCase().includes('progress') ? 'success'
                      : coaching.progressionState.toLowerCase().includes('plateau') ? 'warning'
                        : 'muted'
                  }
                />
              </div>
            )}
            {coaching.progressionStrategy && <TextBlock text={coaching.progressionStrategy} />}
            {coaching.progressAnalysis && (
              <div className="pt-3 border-t border-white/6">
                <TextBlock text={coaching.progressAnalysis} muted />
              </div>
            )}
            {coaching.plateauDetection && (
              <div className="pt-3 border-t border-white/6">
                <p className="text-xs text-[rgba(255,255,255,0.35)] mb-1">Plateau detection</p>
                <TextBlock text={coaching.plateauDetection} muted />
              </div>
            )}
          </div>
        </InfoCard>

        <AdaptiveCard label="Adaptive Guidance">
          <div className="space-y-3">
            {coaching.adaptiveAdjustment && <TextBlock text={coaching.adaptiveAdjustment} />}
            {coaching.additionalAdvice && (
              <div className="pt-3 border-t border-[#10b981]/15">
                <TextBlock text={coaching.additionalAdvice} />
              </div>
            )}
            {coaching.coachingMemory && (
              <div className="pt-3 border-t border-[#10b981]/15">
                <p className="text-xs text-[rgba(255,255,255,0.55)] mb-1">Memory context</p>
                <TextBlock text={coaching.coachingMemory} muted />
              </div>
            )}
          </div>
        </AdaptiveCard>
      </div>
    </div>
  )
}

export default CoachingPage

