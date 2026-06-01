import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/apiClient'
import { profileService } from '../services/profileService'
import type { UserProfile } from '../types/coaching'
import { getErrorMessage } from '../utils/getErrorMessage'

const GOAL_OPTIONS = [
  {
    value: 'Fat Loss',
    emoji: '🔥',
    label: 'Fat Loss',
    description: 'Reduce body fat while preserving muscle mass',
    bullets: ['Calorie deficit nutrition', 'High-rep conditioning work', 'Cardio integration'],
  },
  {
    value: 'Muscle Gain',
    emoji: '💪',
    label: 'Muscle Gain',
    description: 'Build muscle size and overall strength',
    bullets: ['Progressive overload', 'Higher training volume', 'Surplus nutrition'],
  },
  {
    value: 'Recomposition',
    emoji: '⚖️',
    label: 'Recomposition',
    description: 'Lose fat and build muscle simultaneously',
    bullets: ['Maintenance calories', 'Balanced split', 'Consistent training'],
  },
  {
    value: 'Strength',
    emoji: '🏋️',
    label: 'Strength',
    description: 'Maximise absolute strength in big lifts',
    bullets: ['Heavy compound lifts', 'Low-rep power work', 'Longer rest periods'],
  },
  {
    value: 'Maintenance',
    emoji: '🛡️',
    label: 'Maintenance',
    description: 'Maintain current physique and fitness',
    bullets: ['Sustainable schedule', 'Balanced volume', 'Health-focused habits'],
  },
]

const MUSCLE_OPTIONS = [
  'Chest', 'Back', 'Shoulders', 'Arms', 'Core',
  'Quads', 'Hamstrings', 'Glutes', 'Calves',
]

function TargetPage() {
  const navigate = useNavigate()
  const [selectedGoal, setSelectedGoal] = useState('')
  const [weakAreas, setWeakAreas] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    profileService.getLatestProfile().then(setProfile).catch(() => null)
  }, [])

  const weeklyWeightTarget = profile?.weeklyWeightTarget ?? 0

  const filteredGoals = useMemo(() => {
    if (weeklyWeightTarget > 0.05) return GOAL_OPTIONS.filter(o => ['Muscle Gain', 'Strength'].includes(o.value))
    if (weeklyWeightTarget < -0.05) return GOAL_OPTIONS.filter(o => ['Fat Loss', 'Strength'].includes(o.value))
    return GOAL_OPTIONS.filter(o => ['Recomposition', 'Fat Loss', 'Strength', 'Maintenance'].includes(o.value))
  }, [weeklyWeightTarget])

  useEffect(() => {
    if (selectedGoal && !filteredGoals.find(o => o.value === selectedGoal)) {
      setSelectedGoal('')
    }
  }, [filteredGoals, selectedGoal])

  function toggleWeakArea(area: string) {
    setWeakAreas((prev) => {
      if (prev.includes(area)) return prev.filter((a) => a !== area)
      if (prev.length >= 3) return prev
      return [...prev, area]
    })
  }

  async function handleGenerate() {
    if (!selectedGoal) return
    setIsSaving(true)
    setError('')
    try {
      await apiClient.post('/goals', {
        goalType: selectedGoal,
        focus: weakAreas.join(', '),
      }).catch(() => null)

      localStorage.setItem('gofit.target', JSON.stringify({ goal: selectedGoal, weakAreas }))
      localStorage.removeItem('gofit.split')
      navigate('/splits')
    } catch (e) {
      setError(getErrorMessage(e))
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-['DM_Serif_Display'] text-3xl text-white">Set your target</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[#64748b]">
          Choose the goal that best describes what you want to achieve. GoFit will build your complete training program, nutrition targets, and coaching recommendations around your selection.
        </p>
      </div>

      {/* Goal cards */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#64748b] mb-3">
          Primary Goal
        </p>
        {weeklyWeightTarget !== 0 && (
          <p className="text-[11px] text-[#64748b] mb-3 rounded-lg px-3 py-2 border border-white/5" style={{ background: '#1a1d27' }}>
            Showing goals aligned with your {weeklyWeightTarget > 0 ? 'weight gain' : 'weight loss'} target.
          </p>
        )}
        <div className="grid gap-3">
          {filteredGoals.map((opt) => {
            const active = selectedGoal === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedGoal(opt.value)}
                className="flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-150"
                style={{
                  background: active ? 'rgba(16,185,129,0.05)' : '#1a1d27',
                  border: active ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span style={{ fontSize: 28, lineHeight: 1, marginTop: 2 }}>{opt.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#f1f5f9]">{opt.label}</span>
                    {active && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#10b981] text-white" style={{ fontSize: 11 }}>
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[#64748b]">{opt.description}</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {opt.bullets.map((b) => (
                      <li
                        key={b}
                        className="rounded-full px-2 py-0.5 text-[11px]"
                        style={{
                          background: active ? 'rgba(16,185,129,0.12)' : '#13161f',
                          color: active ? '#6ee7b7' : '#64748b',
                        }}
                      >
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Muscle group chips */}
      <div>
        <div className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#64748b]">
            Weak Areas <span className="normal-case font-normal">(optional, max 3)</span>
          </p>
          <p className="mt-1 text-[11px] text-[#64748b] mb-2">
            GoFit adds extra volume and emphasis to your priority muscle groups within your chosen training split.
          </p>
        </div>
        {weakAreas.length > 0 && (
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={() => setWeakAreas([])}
              className="text-xs text-[#64748b] hover:text-[#94a3b8] transition-colors"
            >
              Clear
            </button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {MUSCLE_OPTIONS.map((area) => {
            const active = weakAreas.includes(area)
            const disabled = !active && weakAreas.length >= 3
            return (
              <button
                key={area}
                type="button"
                disabled={disabled}
                onClick={() => toggleWeakArea(area)}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150"
                style={{
                  background: active ? '#10b981' : '#1a1d27',
                  color: active ? '#fff' : disabled ? '#334155' : '#94a3b8',
                  border: active ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.5 : 1,
                }}
              >
                {area}
              </button>
            )
          })}
        </div>
        {weakAreas.length === 3 && (
          <p className="mt-2 text-xs text-[#64748b]">Max 3 areas selected</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* CTA */}
      <button
        type="button"
        disabled={!selectedGoal || isSaving}
        onClick={handleGenerate}
        className="w-full rounded-xl py-4 text-base font-semibold text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: selectedGoal ? '#10b981' : '#1a1d27' }}
      >
        {isSaving ? 'Generating…' : 'Generate My Plan →'}
      </button>
    </div>
  )
}

export default TargetPage
