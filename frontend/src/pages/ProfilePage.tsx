import { Dumbbell, Flame, Shield, Zap } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import CoachingInsightCard from '../components/CoachingInsightCard'
import EmptyState from '../components/EmptyState'
import LoadingButton from '../components/LoadingButton'
import LoadingSkeleton from '../components/LoadingSkeleton'
import SectionHeader from '../components/SectionHeader'
import { profileService } from '../services/profileService'
import type { CoachingResponse, UserProfile } from '../types/coaching'
import { getErrorMessage } from '../utils/getErrorMessage'
import { calculateDailyTarget, calculateTDEE, getPhase } from '../utils/tdeeCalculator'
import { fromKilograms, getStoredWeightUnit, storeWeightUnit, toKilograms, type WeightUnit } from '../utils/weightUnits'

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Forearms', 'Traps']

const defaultProfile: UserProfile = {
  name: '',
  age: 28,
  height: 175,
  weight: 75,
  bodyFatPercentage: 0,
  goal: 'Muscle Gain',
  weakArea: '',
  experienceLevel: 'Intermediate',
  calorieTracking: false,
  currentCalories: 0,
  recoveryQuality: 'Moderate',
  fatigueTolerance: 'Moderate',
  trainingDaysAvailable: 4,
  gender: '',
  activityLevel: '',
  weeklyWeightTarget: 0,
}

/* ─── Card selector ─────────────────────────────────────────────── */
type CardOption = { value: string; label: string; description: string; icon?: React.ReactNode }

function CardSelector({
  options,
  value,
  onChange,
  gridClassName,
}: {
  options: CardOption[]
  value: string
  onChange: (v: string) => void
  gridClassName?: string
}) {
  const defaultGrid =
    options.length === 4 ? 'grid-cols-2' : options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
  return (
    <div className={`grid gap-3 ${gridClassName ?? defaultGrid}`}>
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-col gap-1.5 rounded-xl border p-3.5 text-left transition-all duration-150 ${
              active
                ? 'border-white bg-white/8'
                : 'border-white/8 bg-[#0a0a0a] hover:border-white/15 hover:bg-white/4'
            }`}
          >
            {opt.icon && (
              <span className={`${active ? 'text-[#10b981]' : 'text-[rgba(255,255,255,0.35)]'} transition-colors`}>
                {opt.icon}
              </span>
            )}
            <span className={`text-sm font-semibold ${active ? 'text-white' : 'text-[rgba(255,255,255,0.55)]'}`}>
              {opt.label}
            </span>
            <span className="text-xs leading-4 text-[rgba(255,255,255,0.35)]">{opt.description}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ─── Segmented button ──────────────────────────────────────────── */
function SegmentedButtons({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex rounded-xl border border-white/8 bg-[#0a0a0a] p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-150 ${
            value === opt
              ? 'bg-[#141414] text-white border border-white/8'
              : 'text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.55)] hover:bg-white/4'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

/* ─── Weekly weight target selector ────────────────────────────── */
function WeeklyTargetSelector({
  value,
  onChange,
  unit,
}: {
  value: number
  onChange: (v: number) => void
  unit: WeightUnit
}) {
  const kgOptions = [
    { label: '-0.5 kg', value: -0.5 },
    { label: '-0.25 kg', value: -0.25 },
    { label: '0 maintain', value: 0 },
    { label: '+0.25 kg', value: 0.25 },
    { label: '+0.5 kg', value: 0.5 },
  ]
  const lbOptions = [
    { label: '-1 lb', value: -0.45 },
    { label: '-0.5 lb', value: -0.23 },
    { label: '0 maintain', value: 0 },
    { label: '+0.5 lb', value: 0.23 },
    { label: '+1 lb', value: 0.45 },
  ]
  const options = unit === 'kg' ? kgOptions : lbOptions

  return (
    <div className="flex rounded-xl border border-white/8 bg-[#0a0a0a] p-1 gap-1 flex-wrap sm:flex-nowrap">
      {options.map((opt) => {
        const active = Math.abs(value - opt.value) < 0.1
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 min-w-0 rounded-lg px-2 py-2 text-xs font-medium transition-all duration-150 whitespace-nowrap ${
              active
                ? 'bg-white text-black'
                : 'text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.55)] hover:bg-white/4'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Text/number input ─────────────────────────────────────────── */
function FieldInput({
  label,
  helperText,
  children,
}: {
  label: string
  helperText?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[rgba(255,255,255,0.55)] mb-1.5">{label}</label>
      {children}
      {helperText && <p className="mt-1.5 text-xs leading-5 text-[rgba(255,255,255,0.35)]">{helperText}</p>}
    </div>
  )
}

const inputCls =
  'block w-full rounded-xl border border-white/8 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/10 placeholder:text-[rgba(255,255,255,0.2)]'

/* ─── Options ───────────────────────────────────────────────────── */
const GOAL_OPTIONS: CardOption[] = [
  { value: 'Muscle Gain', label: 'Muscle Gain', description: 'Build size and strength', icon: <Dumbbell size={18} /> },
  { value: 'Fat Loss', label: 'Fat Loss', description: 'Reduce body fat', icon: <Flame size={18} /> },
  { value: 'Maintenance', label: 'Maintenance', description: 'Sustain physique', icon: <Shield size={18} /> },
  { value: 'Performance', label: 'Performance', description: 'Improve athletic output', icon: <Zap size={18} /> },
]

const EXPERIENCE_OPTIONS: CardOption[] = [
  { value: 'Beginner', label: 'Beginner', description: 'Under 1 year' },
  { value: 'Intermediate', label: 'Intermediate', description: '1–4 years' },
  { value: 'Advanced', label: 'Advanced', description: '4+ years' },
]

const GENDER_OPTIONS: CardOption[] = [
  { value: 'Male', label: 'Male', description: 'Biological male' },
  { value: 'Female', label: 'Female', description: 'Biological female' },
]

const ACTIVITY_OPTIONS: CardOption[] = [
  { value: 'Sedentary', label: 'Sedentary', description: 'Desk job, little exercise' },
  { value: 'Lightly Active', label: 'Lightly Active', description: '1–3 days/week' },
  { value: 'Moderately Active', label: 'Moderately Active', description: '3–5 days/week' },
  { value: 'Very Active', label: 'Very Active', description: '6–7 days/week' },
  { value: 'Extremely Active', label: 'Extremely Active', description: 'Physical job + training' },
]

/* ─── Main page ─────────────────────────────────────────────────── */
function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(() => getStoredWeightUnit())
  const [weightStr, setWeightStr] = useState<string>('')
  const [coachingResponse, setCoachingResponse] = useState<CoachingResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isMounted = true
    profileService.getLatestProfile()
      .then((p) => {
        if (isMounted && p) {
          setProfile(p)
          setWeightStr(p.weight > 0 ? fromKilograms(p.weight, getStoredWeightUnit()).toFixed(1) : '')
        }
      })
      .catch((e) => { if (isMounted) setError(getErrorMessage(e)) })
      .finally(() => { if (isMounted) setIsLoading(false) })
    return () => { isMounted = false }
  }, [])

  const set = (name: string, value: string | number | boolean | null) =>
    setProfile((c) => ({ ...c, [name]: value }))

  const handleWeightChange = (val: string) => {
    if (val === '') { setWeightStr(''); return }
    const num = parseFloat(val)
    if (isNaN(num)) return
    const maxVal = weightUnit === 'lb' ? 800 : 362
    if (num > maxVal) return
    setWeightStr(val)
    set('weight', toKilograms(num, weightUnit))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')
    try {
      const response = await profileService.saveProfile(profile)
      setCoachingResponse(response)
      setSuccess('Profile saved. Coaching recommendations updated.')
      setIsRedirecting(true)
      const destination = localStorage.getItem('gofit.split') ? '/dashboard' : '/target'
      window.setTimeout(() => navigate(destination), 900)
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      if (!isRedirecting) setIsSaving(false)
    }
  }

  /* ─── Live TDEE preview ── */
  const canShowTdee =
    (profile.gender === 'Male' || profile.gender === 'Female') &&
    profile.activityLevel &&
    profile.weight > 0 &&
    profile.height > 0 &&
    profile.age > 0

  let tdeePreview: { maintenance: number; dailyTarget: number; phase: string } | null = null
  if (canShowTdee) {
    const maintenance = calculateTDEE(
      profile.weight,
      profile.height,
      profile.age,
      profile.gender as 'Male' | 'Female',
      profile.activityLevel!
    )
    const dailyTarget = calculateDailyTarget(maintenance, profile.weeklyWeightTarget ?? 0, 'kg')
    tdeePreview = { maintenance, dailyTarget, phase: getPhase(profile.weeklyWeightTarget ?? 0) }
  }

  if (isLoading) return <LoadingSkeleton className="min-h-96" />

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <SectionHeader
        eyebrow="Profile"
        title="Training context"
        description="Keep your physical profile, goal, recovery tolerance, and weekly target updated so GoFit can generate adaptive recommendations."
      />

      {error ? <EmptyState title="Profile data needs attention" description={error} /> : null}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Body Metrics ── */}
        <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-5">Body Metrics</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FieldInput label="Name">
              <input
                className={inputCls}
                value={profile.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Your name"
              />
            </FieldInput>

            <FieldInput label="Age">
              <input
                className={inputCls}
                type="number"
                min={13}
                max={100}
                value={profile.age}
                onChange={(e) => set('age', Number(e.target.value))}
              />
            </FieldInput>

            <FieldInput label="Height (cm)">
              <input
                className={inputCls}
                type="number"
                min={1}
                step={0.1}
                value={profile.height}
                onChange={(e) => set('height', Number(e.target.value))}
              />
            </FieldInput>

            {/* Weight with unit switcher */}
            <FieldInput label="Weight" helperText="Stored in kg internally, displayed in your preferred unit.">
              <div className="flex rounded-xl border border-white/8 bg-[#0a0a0a] focus-within:border-white/30 overflow-hidden transition">
                <input
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none"
                  type="number"
                  min={0}
                  max={weightUnit === 'lb' ? 800 : 362}
                  step={0.1}
                  value={weightStr}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  placeholder="e.g. 185"
                />
                <select
                  aria-label="Weight unit"
                  className="border-l border-white/8 bg-transparent px-3 text-sm text-[rgba(255,255,255,0.55)] outline-none"
                  value={weightUnit}
                  onChange={(e) => {
                    const newUnit = e.target.value as WeightUnit
                    setWeightUnit(newUnit)
                    storeWeightUnit(newUnit)
                    if (profile.weight > 0) setWeightStr(fromKilograms(profile.weight, newUnit).toFixed(1))
                  }}
                >
                  <option value="lb">lb</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </FieldInput>

            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-sm font-medium text-[rgba(255,255,255,0.55)] mb-1">Priority Muscle Groups</p>
              <p className="text-xs text-[rgba(255,255,255,0.35)] mb-3">These areas get extra volume emphasis in your program. Max 3.</p>
              <div className="flex flex-wrap gap-2">
                {MUSCLE_GROUPS.map((area) => {
                  const selected = (profile.weakArea ?? '').split(',').map(s => s.trim()).filter(Boolean).includes(area)
                  const count = (profile.weakArea ?? '').split(',').map(s => s.trim()).filter(Boolean).length
                  const disabled = !selected && count >= 3
                  return (
                    <button
                      key={area}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        const current = (profile.weakArea ?? '').split(',').map(s => s.trim()).filter(Boolean)
                        if (selected) {
                          set('weakArea', current.filter(a => a !== area).join(', '))
                        } else if (current.length < 3) {
                          set('weakArea', [...current, area].join(', '))
                        }
                      }}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150"
                      style={{
                        background: selected ? 'rgba(255,255,255,0.12)' : '#0a0a0a',
                        border: `1px solid ${selected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        color: selected ? '#ffffff' : disabled ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.55)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.4 : 1,
                      }}
                    >
                      {area}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Gender — after body metrics */}
          <div className="mt-5">
            <p className="text-sm font-medium text-[rgba(255,255,255,0.55)] mb-2">Biological Sex</p>
            <CardSelector
              options={GENDER_OPTIONS}
              value={profile.gender ?? ''}
              onChange={(v) => set('gender', v)}
            />
          </div>
        </div>

        {/* ── Training Goal ── */}
        <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-5">Training Goal</p>
          <CardSelector
            options={GOAL_OPTIONS}
            value={profile.goal}
            onChange={(v) => set('goal', v)}
          />
        </div>

        {/* ── Experience & Schedule ── */}
        <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-5">Experience &amp; Schedule</p>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-[rgba(255,255,255,0.55)] mb-2">Experience Level</p>
              <CardSelector
                options={EXPERIENCE_OPTIONS}
                value={profile.experienceLevel}
                onChange={(v) => set('experienceLevel', v)}
              />
            </div>

            <FieldInput label="Training Days per Week">
              <div className="flex rounded-xl border border-white/8 bg-[#0a0a0a] p-1 gap-1">
                {[3, 4, 5, 6, 7].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => set('trainingDaysAvailable', d)}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-150 ${
                      profile.trainingDaysAvailable === d
                        ? 'bg-[#141414] text-white border border-white/8'
                        : 'text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.55)] hover:bg-white/4'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </FieldInput>

            {/* Activity Level */}
            <div>
              <p className="text-sm font-medium text-[rgba(255,255,255,0.55)] mb-2">Activity Level</p>
              <CardSelector
                options={ACTIVITY_OPTIONS}
                value={profile.activityLevel ?? ''}
                onChange={(v) => set('activityLevel', v)}
                gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              />
            </div>
          </div>
        </div>

        {/* ── Recovery Profile ── */}
        <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-5">Recovery Profile</p>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-[rgba(255,255,255,0.55)] mb-2">Recovery Quality</p>
              <SegmentedButtons
                options={['Low', 'Moderate', 'High']}
                value={profile.recoveryQuality}
                onChange={(v) => set('recoveryQuality', v)}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-[rgba(255,255,255,0.55)] mb-2">Fatigue Tolerance</p>
              <SegmentedButtons
                options={['Low', 'Moderate', 'High']}
                value={profile.fatigueTolerance}
                onChange={(v) => set('fatigueTolerance', v)}
              />
            </div>
          </div>
        </div>

        {/* ── Weekly Goal ── */}
        <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Weekly Goal</p>
          <p className="text-xs text-[rgba(255,255,255,0.35)] mb-5">How much do you want to gain or lose per week?</p>
          <WeeklyTargetSelector
            value={profile.weeklyWeightTarget ?? 0}
            onChange={(v) => set('weeklyWeightTarget', v)}
            unit={weightUnit}
          />

          {/* Live TDEE preview */}
          {tdeePreview && (
            <div className="mt-5 rounded-xl border border-white/10 bg-white/4 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.5)] mb-3">
                Your Estimated Targets
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-[10px] text-[rgba(255,255,255,0.35)]">Maintenance</p>
                  <p className="text-sm font-semibold text-white">{tdeePreview.maintenance.toLocaleString()} kcal</p>
                </div>
                <div>
                  <p className="text-[10px] text-[rgba(255,255,255,0.35)]">Daily Target</p>
                  <p className="text-sm font-semibold text-[rgba(255,255,255,0.5)]">{tdeePreview.dailyTarget.toLocaleString()} kcal</p>
                </div>
                <div>
                  <p className="text-[10px] text-[rgba(255,255,255,0.35)]">Phase</p>
                  <p className="text-sm font-semibold text-white">{tdeePreview.phase}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[rgba(255,255,255,0.35)]">Expected</p>
                  <p className="text-sm font-semibold text-white">
                    {(profile.weeklyWeightTarget ?? 0) === 0
                      ? 'Maintain weight'
                      : `${(profile.weeklyWeightTarget ?? 0) > 0 ? '+' : ''}${
                          weightUnit === 'kg'
                            ? `${profile.weeklyWeightTarget?.toFixed(1)} kg`
                            : `${(fromKilograms(Math.abs(profile.weeklyWeightTarget ?? 0), 'lb') * Math.sign(profile.weeklyWeightTarget ?? 1)).toFixed(1)} lb`
                        }/week`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/8 bg-[#0f0f0f] px-5 py-4">
          <div>
            {success ? <p className="text-sm text-[#10b981]">{success}</p> : null}
            {!success ? <p className="text-sm text-[rgba(255,255,255,0.35)]">Saving updates your baseline and lets GoFit recalculate recommendations.</p> : null}
          </div>
          <LoadingButton isLoading={isSaving || isRedirecting} loadingLabel="Updating guidance..." type="submit">
            Save Profile
          </LoadingButton>
        </div>
      </form>

      {coachingResponse ? (
        <CoachingInsightCard
          title="Latest coaching response"
          insight={coachingResponse.adaptiveAdjustment || coachingResponse.additionalAdvice}
          tone="strong"
        />
      ) : null}
    </div>
  )
}

export default ProfilePage

