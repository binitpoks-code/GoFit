import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/apiClient'
import { COACHING_KEY, profileService } from '../services/profileService'
import type { CoachingResponse, UserProfile } from '../types/coaching'
import { getErrorMessage } from '../utils/getErrorMessage'
import { getRecommendedSplits, type Split } from '../utils/splitMatcher'

function readStoredCoaching(): CoachingResponse | null {
  const raw = localStorage.getItem(COACHING_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as CoachingResponse } catch { return null }
}

function readStoredTarget(): { goal: string; weakAreas: string[] } | null {
  const raw = localStorage.getItem('gofit.target')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

/* Map coaching goal → splitMatcher goal */
function mapGoal(goal: string): string {
  const map: Record<string, string> = {
    'Muscle Gain': 'Muscle Gain',
    'Fat Loss': 'Fat Loss',
    'Strength': 'Strength',
    'Recomposition': 'Recomposition',
    'Maintenance': 'Maintenance',
    'Performance': 'Strength',
  }
  return map[goal] ?? goal
}

function SplitCard({
  split,
  isSelected,
  isRecommended,
  onSelect,
}: {
  split: Split
  isSelected: boolean
  isRecommended: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex flex-col gap-3 rounded-xl border p-5 text-left transition-all duration-150"
      style={{
        background: isSelected ? 'rgba(16,185,129,0.05)' : '#1a1d27',
        border: isSelected ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Title row */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#f1f5f9]">{split.name}</span>
            {isRecommended && (
              <span className="rounded-full bg-[#10b981]/15 px-2 py-0.5 text-[10px] font-semibold text-[#34d399]">
                Recommended
              </span>
            )}
            {isSelected && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#10b981] text-white" style={{ fontSize: 11 }}>
                ✓
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-[#64748b]">{split.description}</p>
        </div>
      </div>

      {/* Meta pills */}
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full bg-[#13161f] px-2.5 py-0.5 text-[11px] text-[#94a3b8]">
          {split.daysPerWeek}d / week
        </span>
        <span className="rounded-full bg-[#13161f] px-2.5 py-0.5 text-[11px] text-[#94a3b8]">
          {split.volumePerMuscle}
        </span>
        {split.level.map((l) => (
          <span key={l} className="rounded-full bg-[#13161f] px-2.5 py-0.5 text-[11px] text-[#94a3b8]">
            {l}
          </span>
        ))}
      </div>

      {/* Schedule */}
      <div className="flex gap-1.5 flex-wrap">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => {
          const isTraining = split.schedule.includes(d)
          return (
            <span
              key={d}
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
              style={{
                background: isTraining ? (isSelected ? '#10b981' : '#1e2231') : '#13161f',
                color: isTraining ? (isSelected ? '#fff' : '#6ee7b7') : '#334155',
              }}
            >
              {d}
            </span>
          )
        })}
      </div>

      {/* Why + Recovery */}
      <div className="grid gap-1.5 sm:grid-cols-2">
        <div className="rounded-lg bg-[#13161f] p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b] mb-1">Why it works</p>
          <p className="text-xs text-[#94a3b8] leading-4">{split.whyItWorks}</p>
        </div>
        <div className="rounded-lg bg-[#13161f] p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b] mb-1">Recovery</p>
          <p className="text-xs text-[#94a3b8] leading-4">{split.recoveryNote}</p>
        </div>
      </div>
    </button>
  )
}

function generateRecommendationReason(goal: string, weakAreas: string[], splitName: string): string {
  let base: string
  if (goal === 'Muscle Gain') {
    base = `GoFit recommends ${splitName}. Science shows hitting a lagging muscle group 2–3× per week maximises MPS and allows higher effective weekly volume without systemic fatigue.`
  } else if (goal === 'Fat Loss' || goal === 'Strength') {
    base = `GoFit recommends ${splitName}. When in a caloric deficit, maintaining high mechanical tension 3×/week signals the body to preserve lean muscle while optimising neurological strength adaptations.`
  } else {
    base = `GoFit recommends ${splitName} based on your goal, available training days, and experience level. Each split is a complete training structure — not just a schedule.`
  }
  if (weakAreas.length > 0) {
    const areasList = weakAreas.join(' and ')
    base += ` By placing your ${areasList} exercises at the beginning of the workout when CNS fatigue is lowest, you maximise motor unit recruitment and drive faster development in priority areas.`
  }
  return base
}

function SplitSelectionPage() {
  const navigate = useNavigate()
  const [selectedSplitId, setSelectedSplitId] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    profileService.getLatestProfile().then(setProfile).catch(() => null)
  }, [])

  const target = readStoredTarget()
  const coaching = readStoredCoaching()

  const goal = mapGoal(target?.goal ?? profile?.goal ?? 'Muscle Gain')
  const trainingDays = coaching?.trainingFrequency ?? profile?.trainingDaysAvailable ?? 4
  const experience = profile?.experienceLevel ?? 'Intermediate'

  const { recommended, all } = getRecommendedSplits(goal, trainingDays, experience)
  const displayedSplits = showAll ? all : recommended

  const recommendedIds = new Set(recommended.map((s) => s.id))

  async function handleChoose() {
    if (!selectedSplitId) return
    setIsSaving(true)
    setError('')
    const split = all.find((s) => s.id === selectedSplitId)
    if (!split) return
    try {
      await apiClient.post('/workouts', {
        workoutName: split.name,
        muscleGroup: 'Full Body',
        trainingDays: split.daysPerWeek,
      }).catch(() => null)

      localStorage.setItem('gofit.split', JSON.stringify(split))
      navigate('/dashboard')
    } catch (e) {
      setError(getErrorMessage(e))
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (recommended.length > 0 && !selectedSplitId) {
      setSelectedSplitId(recommended[0].id)
    }
  }, [])

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-['DM_Serif_Display'] text-3xl text-white">GoFit recommends this split because…</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[#64748b]">
          {generateRecommendationReason(goal, target?.weakAreas ?? [], recommended[0]?.name ?? 'this split')}
        </p>
      </div>

      {/* Context pills */}
      <div className="flex flex-wrap gap-2">
        {target?.goal && (
          <span className="rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-1 text-xs font-medium text-[#34d399]">
            Goal: {target.goal}
          </span>
        )}
        <span className="rounded-full border border-white/8 bg-[#1a1d27] px-3 py-1 text-xs text-[#94a3b8]">
          {trainingDays} days/week
        </span>
        <span className="rounded-full border border-white/8 bg-[#1a1d27] px-3 py-1 text-xs text-[#94a3b8]">
          {experience}
        </span>
        {target?.weakAreas && target.weakAreas.length > 0 && target.weakAreas.map((a) => (
          <span key={a} className="rounded-full border border-white/8 bg-[#1a1d27] px-3 py-1 text-xs text-[#94a3b8]">
            Focus: {a}
          </span>
        ))}
      </div>

      {/* Split list */}
      <div className="space-y-3">
        {displayedSplits.map((split) => (
          <SplitCard
            key={split.id}
            split={split}
            isSelected={selectedSplitId === split.id}
            isRecommended={recommendedIds.has(split.id)}
            onSelect={() => setSelectedSplitId(split.id)}
          />
        ))}
      </div>

      {/* Show all toggle */}
      {!showAll && all.length > recommended.length && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full rounded-xl border border-white/8 py-3 text-sm font-medium text-[#94a3b8] hover:bg-white/4 transition-colors"
        >
          View all {all.length} programs
        </button>
      )}
      {showAll && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="w-full rounded-xl border border-white/8 py-3 text-sm font-medium text-[#94a3b8] hover:bg-white/4 transition-colors"
        >
          Show fewer
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* CTA */}
      <button
        type="button"
        disabled={!selectedSplitId || isSaving}
        onClick={handleChoose}
        className="w-full rounded-xl py-4 text-base font-semibold text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: selectedSplitId ? '#10b981' : '#1a1d27' }}
      >
        {isSaving ? 'Saving…' : 'Choose This Program →'}
      </button>
    </div>
  )
}

export default SplitSelectionPage
