import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Check, ChevronDown, ChevronUp, Clock, Dumbbell, Layout, Moon, Plus, RefreshCw, Target, TrendingUp } from 'lucide-react'
import { COACHING_KEY, profileService } from '../services/profileService'
import type { CoachingResponse, UserProfile } from '../types/coaching'
import type { Split } from '../utils/splitMatcher'
import { useToast } from '../components/Toast'
import { fromKilograms, getStoredWeightUnit, type WeightUnit } from '../utils/weightUnits'
import { useNavigate } from 'react-router-dom'

/* ─── Types ──────────────────────────────────────────────────────── */
type SessionExercise = { name: string; sets: number; reps: string; restSeconds: number; note: string }
type SavedRM = { exerciseName: string; estimated1RM: number; unit: string; date: string }
type OverloadEntry = { date: string; exercise: string; weight: number; reps: number; unit: string }
type CompletionEntry = { date: string; week: string }
type Level = 'Beginner' | 'Novice' | 'Intermediate' | 'Advanced' | 'Elite'
type LiftKey = 'Squat' | 'Bench Press' | 'Deadlift' | 'Overhead Press'
type ProgressionWeek = { week: number; type: 'Training' | 'DELOAD'; targetWeight: number; volume: number; pctIncrease: number }
type ExType = 'Upper Compound' | 'Lower Compound' | 'Isolation'
type ProgStyle = 'Conservative' | 'Standard' | 'Aggressive'

/* ─── Strength standards ─────────────────────────────────────────── */
const MALE_STANDARDS: Record<LiftKey, Record<Level, number>> = {
  'Squat':          { Beginner: 0.75, Novice: 1.25, Intermediate: 1.5,  Advanced: 2.0,  Elite: 2.5  },
  'Bench Press':    { Beginner: 0.5,  Novice: 0.85, Intermediate: 1.15, Advanced: 1.5,  Elite: 1.85 },
  'Deadlift':       { Beginner: 1.0,  Novice: 1.5,  Intermediate: 1.85, Advanced: 2.35, Elite: 2.75 },
  'Overhead Press': { Beginner: 0.35, Novice: 0.55, Intermediate: 0.75, Advanced: 1.0,  Elite: 1.25 },
}

const FEMALE_STANDARDS: Record<LiftKey, Record<Level, number>> = {
  'Squat':          { Beginner: 0.5,  Novice: 0.85, Intermediate: 1.15, Advanced: 1.5,  Elite: 1.9  },
  'Bench Press':    { Beginner: 0.35, Novice: 0.55, Intermediate: 0.75, Advanced: 1.0,  Elite: 1.25 },
  'Deadlift':       { Beginner: 0.75, Novice: 1.1,  Intermediate: 1.4,  Advanced: 1.75, Elite: 2.1  },
  'Overhead Press': { Beginner: 0.2,  Novice: 0.35, Intermediate: 0.5,  Advanced: 0.65, Elite: 0.8  },
}

const LIFT_KEYS: LiftKey[] = ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press']

const LEVEL_COLORS: Record<Level, { bg: string; text: string }> = {
  Beginner:     { bg: '#141414',                 text: '#64748b' },
  Novice:       { bg: 'rgba(59,130,246,0.1)',     text: '#3b82f6' },
  Intermediate: { bg: 'rgba(16,185,129,0.1)',     text: '#10b981' },
  Advanced:     { bg: 'rgba(245,158,11,0.1)',     text: '#f59e0b' },
  Elite:        { bg: 'rgba(239,68,68,0.1)',      text: '#ef4444'  },
}

const PERCENTILES: Record<Level, number> = {
  Beginner: 20, Novice: 40, Intermediate: 60, Advanced: 80, Elite: 95,
}

const ORDERED_LEVELS: Level[] = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite']

function mapToStandardKey(exerciseName: string): LiftKey | null {
  const n = exerciseName.toLowerCase()
  if (n.includes('squat') && !n.includes('goblet')) return 'Squat'
  if (n.includes('bench') && !n.includes('incline') && !n.includes('dumbbell')) return 'Bench Press'
  if (n.includes('deadlift') && !n.includes('romanian') && !n.includes('rdl')) return 'Deadlift'
  if (n.includes('overhead press') || n === 'ohp') return 'Overhead Press'
  if (n.includes('barbell') && n.includes('press') && !n.includes('bench') && !n.includes('incline')) return 'Overhead Press'
  return null
}

/* ─── Session exercise data ──────────────────────────────────────── */
const SESSION_EXERCISES: Record<string, SessionExercise[]> = {
  PUSH: [
    { name: 'Barbell Bench Press', sets: 4, reps: '6–8',   restSeconds: 180, note: 'Control the descent, touch chest, drive powerfully through the press.' },
    { name: 'Incline Dumbbell Press', sets: 3, reps: '10–12', restSeconds: 90, note: 'Slight angle targets upper chest for balanced development.' },
    { name: 'Overhead Press', sets: 3, reps: '8–10', restSeconds: 120, note: 'Brace core, keep ribs down, achieve full lockout at top.' },
    { name: 'Cable Lateral Raise', sets: 3, reps: '15–20', restSeconds: 60, note: 'Slight forward lean isolates the medial deltoid.' },
    { name: 'Tricep Rope Pushdown', sets: 3, reps: '12–15', restSeconds: 60, note: 'Flare hands at the bottom for a full tricep contraction.' },
  ],
  PULL: [
    { name: 'Pull-Ups / Lat Pulldown', sets: 4, reps: '6–10', restSeconds: 120, note: 'Full extension at the bottom maximises lat stretch.' },
    { name: 'Barbell Bent-Over Row', sets: 4, reps: '6–8',   restSeconds: 180, note: 'Hinge at hips and row to lower chest for upper back thickness.' },
    { name: 'Seated Cable Row', sets: 3, reps: '12–15', restSeconds: 90, note: 'Pause at peak contraction, slow eccentric builds thickness.' },
    { name: 'Face Pulls', sets: 3, reps: '15–20', restSeconds: 60, note: 'External rotation pattern protects rotator cuff health long-term.' },
    { name: 'Barbell Curl', sets: 3, reps: '10–12', restSeconds: 60, note: 'Supinate the wrist at the top for peak bicep contraction.' },
  ],
  LEGS: [
    { name: 'Barbell Back Squat', sets: 4, reps: '5–8',   restSeconds: 180, note: 'Break at hips and knees simultaneously, keep torso upright.' },
    { name: 'Romanian Deadlift', sets: 3, reps: '10–12', restSeconds: 120, note: 'Push hips back and feel the hamstring stretch before returning.' },
    { name: 'Leg Press', sets: 3, reps: '12–15', restSeconds: 90, note: 'Higher foot position shifts load toward glutes and hamstrings.' },
    { name: 'Leg Curl', sets: 3, reps: '12–15', restSeconds: 60, note: 'Full range of motion is essential for complete hamstring development.' },
    { name: 'Standing Calf Raise', sets: 4, reps: '15–20', restSeconds: 60, note: 'Full stretch at bottom and pause at top for best results.' },
  ],
  UPPER: [
    { name: 'Barbell Bench Press', sets: 4, reps: '6–8',   restSeconds: 180, note: 'Primary horizontal push for chest and anterior deltoid development.' },
    { name: 'Barbell Bent-Over Row', sets: 4, reps: '6–8', restSeconds: 180, note: 'Balance every pressing movement with equal pulling volume.' },
    { name: 'Overhead Press', sets: 3, reps: '8–10', restSeconds: 120, note: 'Builds shoulder width and overall pressing strength.' },
    { name: 'Pull-Ups', sets: 3, reps: '6–10', restSeconds: 120, note: 'Best lat builder — add weight when bodyweight sets feel easy.' },
    { name: 'Dips', sets: 3, reps: '10–12', restSeconds: 90, note: 'Slight forward lean shifts the load toward the chest.' },
  ],
  LOWER: [
    { name: 'Barbell Squat', sets: 4, reps: '5–8',   restSeconds: 180, note: 'The foundation of lower body strength and muscle development.' },
    { name: 'Conventional Deadlift', sets: 3, reps: '4–6', restSeconds: 180, note: 'Full posterior chain — hinge, brace, drive through the floor.' },
    { name: 'Bulgarian Split Squat', sets: 3, reps: '10–12', restSeconds: 90, note: 'Unilateral training fixes imbalances and targets glutes directly.' },
    { name: 'Leg Curl', sets: 3, reps: '12–15', restSeconds: 60, note: 'Hamstring isolation prevents quad dominance over time.' },
    { name: 'Standing Calf Raise', sets: 4, reps: '15–20', restSeconds: 60, note: 'Calves respond well to high frequency and rep ranges.' },
  ],
  'FULL BODY': [
    { name: 'Barbell Squat', sets: 3, reps: '6–8', restSeconds: 180, note: 'Start with your biggest compound when you are freshest.' },
    { name: 'Barbell Bench Press', sets: 3, reps: '6–8', restSeconds: 180, note: 'Horizontal push — alternate grip width each session.' },
    { name: 'Deadlift', sets: 2, reps: '4–6', restSeconds: 180, note: 'Heavy posterior chain work pairs well with squats.' },
    { name: 'Pull-Ups / Lat Pulldown', sets: 3, reps: '8–10', restSeconds: 120, note: 'Vertical pull balances the bench press volume.' },
    { name: 'Overhead Press', sets: 3, reps: '8–10', restSeconds: 120, note: 'Shoulder development and full-body stability.' },
  ],
  CHEST: [
    { name: 'Barbell Bench Press', sets: 4, reps: '6–8',   restSeconds: 180, note: 'Primary mass builder — prioritise progressive overload here.' },
    { name: 'Incline Dumbbell Press', sets: 3, reps: '10–12', restSeconds: 90, note: 'Upper chest emphasis creates a full, balanced look.' },
    { name: 'Cable Fly', sets: 3, reps: '15–20', restSeconds: 60, note: 'Pure isolation with peak contraction at center crossing.' },
    { name: 'Dips', sets: 3, reps: '10–12', restSeconds: 90, note: 'Lean slightly forward to shift the load toward the chest.' },
  ],
  BACK: [
    { name: 'Deadlift', sets: 3, reps: '5',     restSeconds: 180, note: 'The anchor of all back development — builds everything.' },
    { name: 'Pull-Ups', sets: 4, reps: '6–10',  restSeconds: 120, note: 'Vertical pull for lat width and upper back thickness.' },
    { name: 'Barbell Bent-Over Row', sets: 3, reps: '8–10', restSeconds: 120, note: 'Mid-back thickness builder — keep the back flat.' },
    { name: 'Face Pulls', sets: 3, reps: '15–20', restSeconds: 60, note: 'Rear delt and rotator cuff health for longevity.' },
  ],
  SHOULDERS: [
    { name: 'Barbell Overhead Press', sets: 4, reps: '6–8',   restSeconds: 180, note: 'The king of shoulder exercises for size and strength.' },
    { name: 'Dumbbell Lateral Raise', sets: 4, reps: '15–20', restSeconds: 60, note: 'Side delts create visible shoulder width from the front.' },
    { name: 'Face Pulls', sets: 3, reps: '15–20', restSeconds: 60, note: 'Rear delt and external rotation for healthy pressing joints.' },
    { name: 'Upright Row', sets: 3, reps: '12–15', restSeconds: 60, note: 'Medial and front delt compound movement.' },
  ],
  ARMS: [
    { name: 'Barbell Curl', sets: 4, reps: '8–12',  restSeconds: 90, note: 'Heaviest curl variation for maximum bicep loading and growth.' },
    { name: 'Tricep Dip', sets: 4, reps: '10–12',   restSeconds: 90, note: 'Compound tricep movement for mass and lockout strength.' },
    { name: 'Hammer Curl', sets: 3, reps: '12–15',  restSeconds: 60, note: 'Brachialis emphasis adds arm thickness between the peaks.' },
    { name: 'Skull Crusher', sets: 3, reps: '12–15', restSeconds: 60, note: 'Long head focus for overall tricep size and shape.' },
    { name: 'Cable Curl', sets: 3, reps: '15–20',   restSeconds: 60, note: 'Constant cable tension provides peak bicep pump at end.' },
  ],
  'CHEST+BACK': [
    { name: 'Barbell Bench Press', sets: 4, reps: '6–8',  restSeconds: 180, note: 'Push-pull pairing makes this session time-efficient.' },
    { name: 'Barbell Bent-Over Row', sets: 4, reps: '6–8', restSeconds: 180, note: 'Antagonist pair with bench press — supersets work well here.' },
    { name: 'Incline Dumbbell Press', sets: 3, reps: '10–12', restSeconds: 90, note: 'Upper chest completes the chest development.' },
    { name: 'Pull-Ups', sets: 3, reps: '8–10', restSeconds: 120, note: 'Vertical pull completes the back thickness from rows.' },
  ],
  SQUAT: [
    { name: 'Barbell Back Squat', sets: 5, reps: '5', restSeconds: 180, note: '5/3/1 protocol — work up to your programmed top set.' },
    { name: 'Front Squat', sets: 3, reps: '8–10', restSeconds: 120, note: 'Quad-dominant accessory — great for mobility.' },
    { name: 'Leg Press', sets: 3, reps: '15', restSeconds: 90, note: 'Volume accumulation after the heavy main work.' },
    { name: 'Leg Curl', sets: 3, reps: '12', restSeconds: 60, note: 'Antagonist hamstring work balances the quad-heavy session.' },
  ],
  BENCH: [
    { name: 'Barbell Bench Press', sets: 5, reps: '5', restSeconds: 180, note: '5/3/1 protocol — work up to your programmed top set.' },
    { name: 'Incline Dumbbell Press', sets: 3, reps: '10–12', restSeconds: 90, note: 'Upper chest volume as a pressing accessory.' },
    { name: 'Tricep Pushdown', sets: 3, reps: '15', restSeconds: 60, note: 'Tricep strength directly supports the lockout.' },
    { name: 'Lateral Raise', sets: 3, reps: '15', restSeconds: 60, note: 'Shoulder health and width accessory.' },
  ],
  DEADLIFT: [
    { name: 'Conventional Deadlift', sets: 5, reps: '5', restSeconds: 180, note: '5/3/1 protocol — work up to your programmed top set.' },
    { name: 'Romanian Deadlift', sets: 3, reps: '10–12', restSeconds: 120, note: 'Hamstring volume after the heavy conventional deadlift.' },
    { name: 'Pull-Ups', sets: 3, reps: '8–10', restSeconds: 120, note: 'Vertical pull builds upper back and grip endurance.' },
    { name: 'Barbell Row', sets: 3, reps: '10', restSeconds: 90, note: 'Mid-back strength directly supports the deadlift setup.' },
  ],
  OHP: [
    { name: 'Barbell Overhead Press', sets: 5, reps: '5', restSeconds: 180, note: '5/3/1 protocol — work up to your programmed top set.' },
    { name: 'Dumbbell Shoulder Press', sets: 3, reps: '10–12', restSeconds: 90, note: 'Accessory pressing improves shoulder stability.' },
    { name: 'Face Pulls', sets: 3, reps: '20', restSeconds: 60, note: 'Rear delt health is critical for pressing longevity.' },
    { name: 'Lateral Raise', sets: 3, reps: '15', restSeconds: 60, note: 'Side delt width completes the shoulder silhouette.' },
  ],
  TRAINING: [
    { name: 'Barbell Squat', sets: 3, reps: '8–10', restSeconds: 120, note: 'Start with the compound lower body movement.' },
    { name: 'Bench Press', sets: 3, reps: '8–10', restSeconds: 120, note: 'Primary horizontal push for chest and triceps.' },
    { name: 'Barbell Row', sets: 3, reps: '8–10', restSeconds: 120, note: 'Match pressing volume with equal pulling volume.' },
    { name: 'Overhead Press', sets: 3, reps: '10–12', restSeconds: 90, note: 'Vertical push for shoulder development and stability.' },
  ],
}

/* ─── Progressive overload calc helpers ─────────────────────────── */
function getWeeklyIncrement(style: ProgStyle, exType: ExType): { amount: number; every: number } {
  if (style === 'Conservative') {
    if (exType === 'Lower Compound') return { amount: 5, every: 2 }
    if (exType === 'Isolation') return { amount: 2.5, every: 3 }
    return { amount: 2.5, every: 2 }
  }
  if (style === 'Standard') {
    if (exType === 'Lower Compound') return { amount: 5, every: 1 }
    if (exType === 'Isolation') return { amount: 2.5, every: 2 }
    return { amount: 2.5, every: 1 }
  }
  if (exType === 'Lower Compound') return { amount: 10, every: 1 }
  if (exType === 'Isolation') return { amount: 5, every: 2 }
  return { amount: 5, every: 1 }
}

function buildProgressionPlan(
  currentWeight: number, goalWeight: number, sets: number, reps: number,
  deloadEvery: number, exType: ExType, progStyle: ProgStyle
): ProgressionWeek[] {
  const { amount, every } = getWeeklyIncrement(progStyle, exType)
  const weeks: ProgressionWeek[] = []
  let w = currentWeight
  let weekNum = 0
  let sinceIncrement = 0
  while (w < goalWeight && weekNum < 300) {
    weekNum++
    const isDeload = deloadEvery > 0 && weekNum % deloadEvery === 0
    if (isDeload) {
      const dw = parseFloat((w * 0.6).toFixed(1))
      weeks.push({ week: weekNum, type: 'DELOAD', targetWeight: dw, volume: Math.round(sets * reps * dw), pctIncrease: parseFloat(((dw - currentWeight) / currentWeight * 100).toFixed(1)) })
    } else {
      weeks.push({ week: weekNum, type: 'Training', targetWeight: w, volume: Math.round(sets * reps * w), pctIncrease: parseFloat(((w - currentWeight) / currentWeight * 100).toFixed(1)) })
      sinceIncrement++
      if (sinceIncrement >= every) { w = parseFloat((w + amount).toFixed(1)); sinceIncrement = 0 }
    }
  }
  weekNum++
  weeks.push({ week: weekNum, type: 'Training', targetWeight: w, volume: Math.round(sets * reps * w), pctIncrease: parseFloat(((w - currentWeight) / currentWeight * 100).toFixed(1)) })
  return weeks
}

function getPerformanceStatus(exerciseName: string, history: OverloadEntry[]): 'High' | 'Moderate' | 'Low' | null {
  const sorted = history.filter(e => e.exercise === exerciseName).sort((a, b) => b.date.localeCompare(a.date))
  if (sorted.length < 2) return null
  const latestVol = sorted[0].weight * sorted[0].reps
  const prevVol = sorted[1].weight * sorted[1].reps
  if (prevVol === 0) return null
  const change = (latestVol - prevVol) / prevVol * 100
  if (change > 2.5) return 'High'
  if (change < -2.5) return 'Low'
  return 'Moderate'
}

/* ─── Helpers ────────────────────────────────────────────────────── */
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

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function getWeekKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-W${Math.ceil(now.getDate() / 7)}`
}

function getTodayDayType(split: Split | null): { label: string; isRest: boolean } {
  if (!split) return { label: 'TRAINING', isRest: false }
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const todayDay = DAYS[new Date().getDay()]
  if (!split.schedule.includes(todayDay)) return { label: 'REST', isRest: true }
  const idx = split.schedule.indexOf(todayDay)
  const id = split.id
  if (id === 'ppl' || id === 'ppl-strength') return { label: (['PUSH', 'PULL', 'LEGS'] as const)[idx % 3], isRest: false }
  if (id === 'upper-lower-4x') return { label: idx % 2 === 0 ? 'UPPER' : 'LOWER', isRest: false }
  if (id === 'full-body-3x' || id === 'full-body-4x') return { label: 'FULL BODY', isRest: false }
  if (id === 'bro-split') return { label: (['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS'] as const)[idx % 5], isRest: false }
  if (id === '531') return { label: (['SQUAT', 'BENCH', 'DEADLIFT', 'OHP'] as const)[idx % 4], isRest: false }
  if (id === 'arnold-split') return { label: (['CHEST+BACK', 'ARMS', 'LEGS'] as const)[idx % 3], isRest: false }
  return { label: 'TRAINING', isRest: false }
}

function readCompletions(): CompletionEntry[] {
  try {
    const raw = localStorage.getItem('gofit.completed')
    if (!raw) return []
    return JSON.parse(raw) as CompletionEntry[]
  } catch { return [] }
}

function readOverloadLog(): OverloadEntry[] {
  try { return JSON.parse(localStorage.getItem('gofit.overload') ?? '[]') as OverloadEntry[] } catch { return [] }
}


function readSavedRMs(): SavedRM[] {
  try { return JSON.parse(localStorage.getItem('gofit.1rm') ?? '[]') as SavedRM[] } catch { return [] }
}

function persistRM(rm: SavedRM) {
  const list = readSavedRMs()
  const idx = list.findIndex((r) => r.exerciseName === rm.exerciseName)
  if (idx >= 0) list[idx] = rm; else list.push(rm)
  localStorage.setItem('gofit.1rm', JSON.stringify(list))
}

/* ─── Rest timer overlay ─────────────────────────────────────────── */
function RestTimerOverlay({ timer, onSkip }: { timer: { remaining: number; total: number }; onSkip: () => void }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const fill = (timer.remaining / timer.total) * circ
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center rounded-2xl p-5 shadow-2xl"
      style={{ background: '#0f0f0f', border: '1px solid rgba(16,185,129,0.3)', minWidth: 140 }}>
      <div className="relative flex items-center justify-center">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="50" cy="50" r={r} fill="none" stroke="#ffffff" strokeWidth="8"
            strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" transform="rotate(-90 50 50)" />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-['DM_Serif_Display'] text-[32px] leading-none text-white">{timer.remaining}</span>
          <span className="text-xs text-[rgba(255,255,255,0.35)]">Rest</span>
        </div>
      </div>
      <button type="button" onClick={onSkip} className="mt-3 text-xs font-medium text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.55)] transition-colors">
        Skip
      </button>
    </div>
  )
}

/* ─── Strength Standards ─────────────────────────────────────────── */
function StrengthStandards({
  rm1,
  exerciseName,
  profile,
  unit,
}: {
  rm1: number
  exerciseName: string
  profile: UserProfile | null
  unit: string
}) {
  const [gender, setGender] = useState<'Male' | 'Female'>(
    profile?.gender?.toLowerCase() === 'female' ? 'Female' : 'Male'
  )

  const standardKey = mapToStandardKey(exerciseName)
  const bodyweightInUnit = profile?.weight ? fromKilograms(profile.weight, unit as WeightUnit) : 0
  const standards = gender === 'Male' ? MALE_STANDARDS : FEMALE_STANDARDS

  if (!standardKey) {
    return (
      <div className="mt-4 rounded-xl border border-white/8 bg-[#0f0f0f] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-2">Strength Standards</p>
        <p className="text-sm text-[rgba(255,255,255,0.35)]">Strength standards available for Squat, Bench, Deadlift, and OHP.</p>
      </div>
    )
  }

  if (!bodyweightInUnit) {
    return (
      <div className="mt-4 rounded-xl border border-white/8 bg-[#0f0f0f] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-2">Strength Standards</p>
        <p className="text-sm text-[rgba(255,255,255,0.35)]">Add your bodyweight to your profile to see strength standards.</p>
      </div>
    )
  }

  const liftStandards = standards[standardKey]
  const ratio = rm1 / bodyweightInUnit

  /* Find current level (highest standard the user meets) */
  let currentLevel: Level = 'Beginner'
  for (const lvl of ['Elite', 'Advanced', 'Intermediate', 'Novice', 'Beginner'] as Level[]) {
    if (ratio >= liftStandards[lvl]) { currentLevel = lvl; break }
  }

  const currentIdx = ORDERED_LEVELS.indexOf(currentLevel)
  const nextLevel: Level | null = currentIdx < ORDERED_LEVELS.length - 1 ? ORDERED_LEVELS[currentIdx + 1] : null
  const nextLevelWeight = nextLevel ? Math.round(liftStandards[nextLevel] * bodyweightInUnit) : null
  const neededMore = nextLevelWeight !== null ? Math.max(0, nextLevelWeight - rm1) : null

  const progressPct = nextLevel
    ? Math.min(100, ((ratio - liftStandards[currentLevel]) / (liftStandards[nextLevel] - liftStandards[currentLevel])) * 100)
    : 100

  return (
    <div className="mt-4 space-y-4">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Strength Standards</p>
        <p className="text-[13px] leading-relaxed text-[rgba(255,255,255,0.35)] mb-4">
          Your lift compared to population-level strength standards based on bodyweight ratio. Ratio = your 1RM ÷ your bodyweight.
        </p>
      </div>

      {/* Level banner */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-start gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">Your Level</p>
            <p className="font-['DM_Serif_Display'] text-[28px] leading-tight" style={{ color: LEVEL_COLORS[currentLevel].text }}>
              {currentLevel}
            </p>
          </div>
          {nextLevel ? (
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">Next Level</p>
              <p className="text-sm text-[rgba(255,255,255,0.55)] mt-0.5">{nextLevel} {'→'} need {nextLevelWeight}{unit}</p>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: '#141414' }}>
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">Status</p>
              <p className="text-sm mt-0.5" style={{ color: LEVEL_COLORS.Elite.text }}>Peak level reached</p>
            </div>
          )}
        </div>
      </div>

      {/* Standards table */}
      <div className="rounded-xl overflow-hidden border border-white/8">
        {/* Header row */}
        <div className="grid bg-[#0a0a0a]" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr' }}>
          <div className="p-3"><p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">Level</p></div>
          {LIFT_KEYS.map((k) => (
            <div key={k} className="p-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">
                {k === 'Overhead Press' ? 'OHP' : k === 'Bench Press' ? 'Bench' : k === 'Deadlift' ? 'Dead' : k}
              </p>
            </div>
          ))}
        </div>
        {/* Data rows */}
        {ORDERED_LEVELS.map((lvl) => {
          const isCurrentLevel = lvl === currentLevel
          const isNextLevel = lvl === nextLevel
          const leftBorder = isCurrentLevel ? '3px solid #ffffff'
            : isNextLevel
              ? '3px dashed #f59e0b'
              : '3px solid transparent'
          return (
            <div key={lvl} className="grid"
              style={{
                gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
                background: isCurrentLevel ? 'rgba(255,255,255,0.04)' : '#0f0f0f',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                borderLeft: leftBorder,
              }}>
              {/* Level badge */}
              <div className="p-3">
                <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: LEVEL_COLORS[lvl].bg, color: LEVEL_COLORS[lvl].text }}>
                  {lvl}
                </span>
              </div>
              {/* Lift value cells */}
              {LIFT_KEYS.map((k) => {
                const liftRatio = standards[k][lvl]
                const liftWeight = Math.round(liftRatio * bodyweightInUnit)
                return (
                  <div key={k} className="p-3">
                    <p className="text-sm font-medium" style={{ color: isCurrentLevel ? '#f1f5f9' : '#94a3b8' }}>
                      {liftWeight}{unit}
                    </p>
                    <p className="text-[11px] text-[rgba(255,255,255,0.35)]">({liftRatio}×)</p>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Quick facts */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl bg-white/4 p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Your Ratio</p>
          <p className="font-['DM_Serif_Display'] text-2xl leading-tight text-white">{ratio.toFixed(2)}×</p>
          <p className="text-[11px] text-[rgba(255,255,255,0.35)] mt-0.5">bodyweight ratio</p>
        </div>
        <div className="rounded-xl bg-white/4 p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Your Rank</p>
          <p className="font-['DM_Serif_Display'] text-2xl leading-tight" style={{ color: LEVEL_COLORS[currentLevel].text }}>
            {currentLevel}
          </p>
          <p className="text-[11px] text-[rgba(255,255,255,0.35)] mt-0.5">current level</p>
        </div>
        <div className="rounded-xl bg-white/4 p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">To Next Level</p>
          <p className="font-['DM_Serif_Display'] text-2xl leading-tight text-white">
            {nextLevel && neededMore !== null ? `+${neededMore}${unit}` : '—'}
          </p>
          <p className="text-[11px] text-[rgba(255,255,255,0.35)] mt-0.5">{nextLevel ? `to reach ${nextLevel}` : 'already elite'}</p>
        </div>
        <div className="rounded-xl bg-white/4 p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Percentile</p>
          <p className="font-['DM_Serif_Display'] text-2xl leading-tight text-[#10b981]">{PERCENTILES[currentLevel]}th</p>
          <p className="text-[11px] text-[rgba(255,255,255,0.35)] mt-0.5">percentile estimate</p>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-r-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid rgba(255,255,255,0.12)' }}>
        <p className="text-[13px] text-[rgba(255,255,255,0.55)] leading-relaxed">
          <strong className="text-white">How it works:</strong> Your 1RM is divided by your bodyweight to produce a ratio. That ratio is compared against population-level strength standards. A 80kg person benching 100kg has a 1.25× ratio, placing them at Intermediate level.
        </p>
      </div>

      {/* Gender toggle */}
      <div className="flex items-center gap-3">
        <p className="text-[11px] text-[rgba(255,255,255,0.35)]">Viewing: {gender} standards</p>
        <div className="flex rounded-lg overflow-hidden border border-white/8">
          {(['Male', 'Female'] as const).map((g) => (
            <button key={g} type="button" onClick={() => setGender(g)}
              className="px-3 py-1 text-xs font-medium transition-colors"
              style={{ background: gender === g ? '#10b981' : '#0f0f0f', color: gender === g ? '#fff' : '#64748b' }}>
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────────────────── */
function TrainingPage() {
  const { show: showToast } = useToast()
  const navigate = useNavigate()
  const unit = getStoredWeightUnit()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /* Session tracker */
  const [completedSets, setCompletedSets] = useState<Record<number, boolean[]>>({})
  const [completions, setCompletions] = useState<CompletionEntry[]>(() => readCompletions())

  /* Rest timer */
  const [timer, setTimer] = useState<{ remaining: number; total: number } | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* 1RM calculator */
  const [rmExercise, setRmExercise] = useState('')
  const [rmWeight, setRmWeight] = useState('')
  const [rmReps, setRmReps] = useState('')
  const [rmResult, setRmResult] = useState<{ rm1: number; strength: number; hypertrophy: number; volume: number; endurance: number } | null>(null)
  const [savedRMs, setSavedRMs] = useState<SavedRM[]>(() => readSavedRMs())

  /* Overload log */
  const [savedTodayLogs, _setSavedTodayLogs] = useState<Record<string, OverloadEntry>>(() => {
    const today = todayStr()
    const logs = readOverloadLog().filter((e) => e.date === today)
    return Object.fromEntries(logs.map((e) => [e.exercise, e]))
  })
  const prevOverload = useState<OverloadEntry[]>(() =>
    readOverloadLog().filter((e) => e.date !== todayStr())
  )[0]

  /* Calculator state */
  const [calcExercise, setCalcExercise] = useState('')
  const [calcCurrentWeight, setCalcCurrentWeight] = useState('')
  const [calcGoalWeight, setCalcGoalWeight] = useState('')
  const [calcSets, setCalcSets] = useState('3')
  const [calcReps, setCalcReps] = useState('8')
  const [calcDeloadEvery, setCalcDeloadEvery] = useState('4')
  const [calcExType, setCalcExType] = useState<ExType>('Upper Compound')
  const [calcExperienceLevel, setCalcExperienceLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate')
  const [calcProgStyle, setCalcProgStyle] = useState<ProgStyle>('Standard')
  const [calcPlan, setCalcPlan] = useState<ProgressionWeek[] | null>(null)
  const [plateauOpen, setPlateauOpen] = useState(false)

  const allOverloadHistory = useMemo(
    () => [...prevOverload, ...Object.values(savedTodayLogs)],
    [prevOverload, savedTodayLogs],
  )

  useEffect(() => {
    let mounted = true
    profileService.getLatestProfile()
      .then((p) => { if (mounted) setProfile(p) })
      .catch(() => null)
      .finally(() => { if (mounted) setIsLoading(false) })
    return () => { mounted = false }
  }, [])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  /* Derived */
  const coaching = readStoredCoaching()
  const split = readStoredSplit()
  const dayType = getTodayDayType(split)
  const todayExercises = SESSION_EXERCISES[dayType.label] ?? SESSION_EXERCISES['TRAINING']
  const splitDays = split?.daysPerWeek ?? profile?.trainingDaysAvailable ?? 4

  /* Ring */
  const currentWeek = getWeekKey()
  const completedCount = completions.filter((e) => e.week === currentWeek).length
  const totalSessions = split?.daysPerWeek ?? splitDays
  const ringR = 24, ringCirc = 2 * Math.PI * ringR
  const ringFill = Math.min(1, completedCount / Math.max(1, totalSessions)) * ringCirc

  const recoveryScore = coaching?.recoveryScore ?? 0

  /* Timer */
  function startTimer(seconds: number) {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimer({ remaining: seconds, total: seconds })
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (!t || t.remaining <= 1) { clearInterval(timerRef.current!); timerRef.current = null; return null }
        return { ...t, remaining: t.remaining - 1 }
      })
    }, 1000)
  }

  function skipTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setTimer(null)
  }

  /* Set tracker */
  function toggleSet(exIdx: number, setIdx: number) {
    setCompletedSets((prev) => {
      const cur = prev[exIdx] ?? Array(todayExercises[exIdx].sets).fill(false)
      const next = [...cur]; next[setIdx] = !next[setIdx]
      return { ...prev, [exIdx]: next }
    })
  }

  function markSessionComplete() {
    const now = new Date()
    const week = `${now.getFullYear()}-W${Math.ceil(now.getDate() / 7)}`
    const today = now.toISOString().split('T')[0]
    const all = readCompletions()
    if (all.some((e) => e.date === today)) {
      showToast('Already logged today ✓')
      return
    }
    const next = [...all, { date: today, week }]
    localStorage.setItem('gofit.completed', JSON.stringify(next))
    setCompletions(next)
    showToast('Session complete! Great work 🎉')
  }

  /* 1RM */
  function calculate1RM() {
    const w = parseFloat(rmWeight), r = parseInt(rmReps)
    if (!w || !r || r >= 37) return
    const epley = w * (1 + r / 30)
    const brzycki = w * (36 / (37 - r))
    const rm1 = Math.round((epley + brzycki) / 2)
    setRmResult({ rm1, strength: Math.round(rm1 * 0.925), hypertrophy: Math.round(rm1 * 0.775), volume: Math.round(rm1 * 0.675), endurance: Math.round(rm1 * 0.55) })
  }

  function save1RM() {
    if (!rmResult || !rmExercise) return
    const rm: SavedRM = { exerciseName: rmExercise, estimated1RM: rmResult.rm1, unit, date: todayStr() }
    persistRM(rm)
    setSavedRMs(readSavedRMs())
    showToast('1RM estimate saved ✓')
  }


  if (isLoading) return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-[#0f0f0f]" />)}
    </div>
  )

  /* ─── Gating ─────────────────────────────────────────────────────── */
  const profileComplete = !!(localStorage.getItem('gofit.coaching') && localStorage.getItem('gofit.user'))
  const goalSet = !!localStorage.getItem('gofit.target')
  const splitChosen = !!localStorage.getItem('gofit.split')

  const trainingState =
    !profileComplete ? ('no-profile' as const) :
    !goalSet         ? ('no-goal'    as const) :
    !splitChosen     ? ('no-split'   as const) :
                       ('ready'      as const)

  if (trainingState !== 'ready') {
    const GateIcon =
      trainingState === 'no-profile' ? Dumbbell :
      trainingState === 'no-goal'    ? Target   :
                                       Layout
    const gateTitle =
      trainingState === 'no-profile' ? 'Set up your profile first' :
      trainingState === 'no-goal'    ? 'Choose your training goal' :
                                       'Choose your training program'
    const gateDesc =
      trainingState === 'no-profile'
        ? 'GoFit needs to know your body metrics, experience level, and training goals before building your personalized workout plan.'
        : trainingState === 'no-goal'
        ? 'Tell GoFit what you want to achieve. Your goal determines your training split, calorie targets, and coaching recommendations.'
        : 'GoFit has matched training programs to your goal and schedule. Pick the one that fits your life and your full workout plan unlocks instantly.'
    const gateButton =
      trainingState === 'no-profile' ? 'Set Up Profile →' :
      trainingState === 'no-goal'    ? 'Set My Goal →'    :
                                       'Choose My Program →'
    const gateRoute =
      trainingState === 'no-profile' ? '/profile' :
      trainingState === 'no-goal'    ? '/target'  :
                                       '/splits'

    return (
      <div className="mt-8 mx-auto max-w-[480px]">
        <div
          className="text-center"
          style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '48px 32px' }}
        >
          <GateIcon size={48} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto' }} />
          <p className="font-['DM_Serif_Display'] text-2xl text-white mt-6">{gateTitle}</p>
          <p
            className="mx-auto mt-3"
            style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 360 }}
          >
            {gateDesc}
          </p>
          <button
            type="button"
            onClick={() => navigate(gateRoute)}
            className="mt-6 rounded-lg font-semibold"
            style={{ background: '#ffffff', color: '#000000', padding: '12px 32px' }}
          >
            {gateButton}
          </button>
          {trainingState === 'no-profile' && (
            <p className="mt-2" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Takes about 2 minutes</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {timer && <RestTimerOverlay timer={timer} onSkip={skipTimer} />}

      {/* Weekly Completion Ring */}
      <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-3">Weekly Progress</p>
        <div className="flex items-center gap-4">
          <svg width="60" height="60" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r={ringR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle cx="30" cy="30" r={ringR} fill="none" stroke="#ffffff" strokeWidth="6"
              strokeDasharray={`${ringFill} ${ringCirc}`} strokeLinecap="round" transform="rotate(-90 30 30)" />
          </svg>
          <div>
            <p className="font-['DM_Serif_Display'] text-xl text-white">{completedCount} of {totalSessions} sessions</p>
            <p className="text-xs text-[rgba(255,255,255,0.35)]">this week</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: completedCount / Math.max(1, totalSessions) > 0.5 ? '#ffffff' : 'rgba(255,255,255,0.35)' }}>
              {completedCount / Math.max(1, totalSessions) > 0.5 ? 'Keep it up!' : "Let's go!"}
            </p>
          </div>
        </div>
      </div>

      {/* Program banner */}
      {(split || coaching) && (
        <div className="rounded-xl p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.55)]">Your Program</p>
              <p className="mt-1 font-['DM_Serif_Display'] text-2xl text-white">
                {split?.name ?? coaching?.splitRecommendation ?? ''}
              </p>
              {(split?.description ?? coaching?.splitReason) && (
                <p className="mt-1 text-sm text-[rgba(255,255,255,0.55)]">{split?.description ?? coaching?.splitReason}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-1 text-xs font-medium text-[rgba(255,255,255,0.55)]">
                {split?.daysPerWeek ?? profile?.trainingDaysAvailable ?? '—'} days/week
              </span>
              {coaching && (
                <span className="rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-1 text-xs font-medium text-[rgba(255,255,255,0.55)]">
                  {coaching.trainingReadinessLevel} readiness
                </span>
              )}
            </div>
          </div>
          {coaching && (
            <p className="mt-3 text-sm text-[rgba(255,255,255,0.55)]/80">
              {recoveryScore >= 80
                ? 'Your body is well recovered — ideal conditions to push intensity and attempt progressive overload.'
                : recoveryScore >= 50
                  ? 'Moderate recovery detected. Train at normal intensity and focus on clean form over heavy loads.'
                  : recoveryScore > 0
                    ? 'Recovery is low today. Reducing intensity protects against injury and supports better adaptation.'
                    : 'Log daily check-ins to unlock recovery-based session recommendations.'}
            </p>
          )}
          {coaching?.deloadRecommendation && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">
              <AlertTriangle size={14} className="shrink-0" />{coaching.deloadRecommendation}
            </div>
          )}
        </div>
      )}

      {/* Today's Session */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">Today — {dayType.label}</p>
        {!dayType.isRest && (
          <p className="mt-1 text-[13px] leading-relaxed text-[rgba(255,255,255,0.35)] mb-4">
            Your personalized workout based on your {split?.name ?? 'current'} program and recovery status. Exercises are ordered for optimal muscle activation.
          </p>
        )}
        {dayType.isRest ? (
          <div className="mt-3 rounded-xl border border-white/8 bg-[#0f0f0f] p-6 text-center">
            <p className="text-2xl mb-2">😴</p>
            <p className="font-['DM_Serif_Display'] text-xl text-white">Rest Day</p>
            <p className="mt-1 text-sm text-[rgba(255,255,255,0.35)]">Sleep and nutrition are your training today. Recovery is where adaptation happens.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl px-4 py-3 mb-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#10b981] mb-1">Performance Status</p>
              <p className="text-[12px] text-[rgba(255,255,255,0.55)] leading-relaxed">Each exercise shows your performance status based on your logged history. <strong className="text-white">High</strong> = more weight or reps than last session. <strong className="text-white">Moderate</strong> = maintaining. <strong className="text-white">Low</strong> = below previous session.</p>
            </div>
            {todayExercises.map((ex, i) => {
              const sets = completedSets[i] ?? Array(ex.sets).fill(false) as boolean[]
              const allDone = sets.length === ex.sets && sets.every(Boolean)
              const anyDone = sets.some(Boolean)
              return (
                <div key={i} className="rounded-xl border p-4 transition-all duration-200"
                  style={{ background: allDone ? 'rgba(255,255,255,0.04)' : '#0f0f0f', borderColor: allDone ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)' }}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-white">{ex.name}</p>
                        {allDone && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#10b981]"><Check size={11} className="text-white" /></span>}
                      </div>
                      <p className="text-xs text-[rgba(255,255,255,0.35)] mt-0.5">{ex.sets} sets × {ex.reps} reps {'·'} {ex.restSeconds}s rest</p>
                      <p className="mt-1 text-xs italic text-[rgba(255,255,255,0.35)]">💡 {ex.note}</p>
                    </div>
                    {(() => {
                      const status = getPerformanceStatus(ex.name, allOverloadHistory)
                      if (status === 'High') return <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #10b981', color: '#10b981' }}>↑ High</span>
                      if (status === 'Moderate') return <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid #3b82f6', color: '#3b82f6' }}>{'→'} Moderate</span>
                      if (status === 'Low') return <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444' }}>↓ Low</span>
                      return <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: '#141414', color: 'rgba(255,255,255,0.35)' }}>New</span>
                    })()}
                  </div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {Array.from({ length: ex.sets }, (_, si) => (
                      <button key={si} type="button" onClick={() => toggleSet(i, si)}
                        className="h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all duration-150"
                        style={{ background: sets[si] ? '#ffffff' : '#141414', borderColor: sets[si] ? '#ffffff' : 'rgba(255,255,255,0.15)' }}>
                        {sets[si] && <Check size={11} className="text-white" />}
                      </button>
                    ))}
                    {anyDone && (
                      <button type="button" onClick={() => startTimer(ex.restSeconds)}
                        className="ml-1 text-xs font-medium text-[#10b981] hover:text-[rgba(255,255,255,0.55)] transition-colors">
                        Start Rest Timer
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            <button type="button" onClick={markSessionComplete}
              className="w-full rounded-xl border border-white/10 bg-white/4 py-3 text-sm font-semibold text-white hover:bg-white/8 transition-colors mt-2">
              Mark Session Complete ✓
            </button>
          </div>
        )}
      </div>

      {/* 1RM Calculator */}
      <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">1RM Calculator</p>
        <p className="text-[13px] text-[rgba(255,255,255,0.35)] mb-4">
          Estimate your one rep max from any working set. GoFit uses the Epley and Brzycki formulas averaged for the most accurate estimate.
        </p>
        <select value={rmExercise} onChange={(e) => setRmExercise(e.target.value)}
          className="block w-full rounded-lg bg-[#080808] border border-white/10 text-white p-3 mb-3 outline-none focus:border-white/40 text-sm">
          <option value="">Select exercise…</option>
          {todayExercises.map((ex) => <option key={ex.name} value={ex.name}>{ex.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Weight</p>
            <div className="relative">
              <input type="number" min={1} placeholder="0" value={rmWeight} onChange={(e) => setRmWeight(e.target.value)}
                className="block w-full rounded-lg bg-[#080808] border border-white/10 text-white p-3 pr-12 outline-none focus:border-white/40 text-sm" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[rgba(255,255,255,0.35)]">{unit}</span>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Reps</p>
            <div className="relative">
              <input type="number" min={1} max={36} placeholder="0" value={rmReps} onChange={(e) => setRmReps(e.target.value)}
                className="block w-full rounded-lg bg-[#080808] border border-white/10 text-white p-3 pr-14 outline-none focus:border-white/40 text-sm" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[rgba(255,255,255,0.35)]">reps</span>
            </div>
          </div>
        </div>
        <button type="button" onClick={calculate1RM} disabled={!rmWeight || !rmReps}
          className="w-full rounded-lg bg-white text-black font-medium p-3 text-sm hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          Calculate
        </button>

        {rmResult && (
          <>
            <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#10b981]">Estimated 1RM</p>
              <div className="flex items-end gap-2 mt-1 mb-1">
                <span className="font-['DM_Serif_Display'] text-[48px] leading-none text-white">{rmResult.rm1}</span>
                <span className="mb-2 text-[16px] text-[rgba(255,255,255,0.35)]">{unit}</span>
              </div>
              <p className="text-[11px] text-[rgba(255,255,255,0.35)] mb-3">Calculated using Epley + Brzycki average</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { label: 'Strength', pct: '90–95%', weight: rmResult.strength },
                  { label: 'Hypertrophy', pct: '70–85%', weight: rmResult.hypertrophy },
                  { label: 'Volume', pct: '60–75%', weight: rmResult.volume },
                  { label: 'Endurance', pct: '50–60%', weight: rmResult.endurance },
                ] as const).map((z) => (
                  <div key={z.label} className="rounded-lg bg-[#141414] p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">{z.label}</p>
                    <p className="text-[11px] text-[rgba(255,255,255,0.35)]">{z.pct}</p>
                    <p className="font-['DM_Serif_Display'] text-xl text-white mt-1">{z.weight} <span className="text-xs text-[rgba(255,255,255,0.35)]">{unit}</span></p>
                  </div>
                ))}
              </div>
              {rmExercise && (
                <button type="button" onClick={save1RM}
                  className="mt-3 w-full rounded-lg border border-white/10 bg-white/4 py-2 text-sm font-medium text-white hover:bg-white/8 transition-colors">
                  Save 1RM Estimate
                </button>
              )}
            </div>

            {/* Strength Standards — only when 1RM calculated */}
            <StrengthStandards rm1={rmResult.rm1} exerciseName={rmExercise} profile={profile} unit={unit} />
          </>
        )}

        {savedRMs.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-2">Saved 1RM Estimates</p>
            <div className="space-y-1.5">
              {savedRMs.map((rm) => (
                <div key={rm.exerciseName} className="flex items-center gap-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/60 shrink-0" />
                  <span className="text-white font-medium">{rm.exerciseName}</span>
                  <span className="text-[rgba(255,255,255,0.35)]">{rm.estimated1RM}{rm.unit}</span>
                  <span className="text-[rgba(255,255,255,0.35)] text-xs ml-auto">{rm.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progressive Overload Calculator */}
      <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Progressive Overload Calculator</p>
        <p className="text-[13px] text-[rgba(255,255,255,0.55)] mb-5">Plan your strength progression week by week toward your goal weight.</p>

        <div className="grid gap-3 sm:grid-cols-2 mb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1.5">Exercise</p>
            <select value={calcExercise} onChange={(e) => {
                const val = e.target.value
                setCalcExercise(val)
                const lowerLifts: string[] = ['Barbell Squat', 'Deadlift']
                const upperLifts: string[] = ['Bench Press', 'Overhead Press', 'Barbell Row']
                if (lowerLifts.includes(val)) setCalcExType('Lower Compound')
                else if (upperLifts.includes(val)) setCalcExType('Upper Compound')
              }}
              className="block w-full rounded-lg bg-[#080808] border border-white/10 text-white p-2.5 outline-none focus:border-white/40 text-sm">
              <option value="">Select exercise…</option>
              <optgroup label="Common Lifts">
                <option>Barbell Squat</option>
                <option>Deadlift</option>
                <option>Bench Press</option>
                <option>Overhead Press</option>
                <option>Barbell Row</option>
              </optgroup>
              {todayExercises.length > 0 && (
                <optgroup label="Today's Session">
                  {todayExercises.map((ex) => <option key={ex.name} value={ex.name}>{ex.name}</option>)}
                </optgroup>
              )}
            </select>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1.5">Current Weight ({unit})</p>
            <input type="number" min={0} placeholder="e.g. 135" value={calcCurrentWeight} onChange={(e) => setCalcCurrentWeight(e.target.value)}
              className="block w-full rounded-lg bg-[#080808] border border-white/10 text-white p-2.5 outline-none focus:border-white/40 text-sm" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1.5">Goal Weight ({unit})</p>
            <input type="number" min={0} placeholder="e.g. 185" value={calcGoalWeight} onChange={(e) => setCalcGoalWeight(e.target.value)}
              className="block w-full rounded-lg bg-[#080808] border border-white/10 text-white p-2.5 outline-none focus:border-white/40 text-sm" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1.5">Sets</p>
            <input type="number" min={1} max={10} value={calcSets} onChange={(e) => setCalcSets(e.target.value)}
              className="block w-full rounded-lg bg-[#080808] border border-white/10 text-white p-2.5 outline-none focus:border-white/40 text-sm" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1.5">Reps</p>
            <input type="number" min={1} max={30} value={calcReps} onChange={(e) => setCalcReps(e.target.value)}
              className="block w-full rounded-lg bg-[#080808] border border-white/10 text-white p-2.5 outline-none focus:border-white/40 text-sm" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1.5">Deload Every X Weeks</p>
            <input type="number" min={2} max={12} value={calcDeloadEvery} onChange={(e) => setCalcDeloadEvery(e.target.value)}
              className="block w-full rounded-lg bg-[#080808] border border-white/10 text-white p-2.5 outline-none focus:border-white/40 text-sm" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1.5">Exercise Type</p>
            <select value={calcExType} onChange={(e) => setCalcExType(e.target.value as ExType)}
              className="block w-full rounded-lg bg-[#080808] border border-white/10 text-white p-2.5 outline-none focus:border-white/40 text-sm">
              <option>Upper Compound</option>
              <option>Lower Compound</option>
              <option>Isolation</option>
            </select>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1.5">Experience Level</p>
            <select value={calcExperienceLevel} onChange={(e) => setCalcExperienceLevel(e.target.value as 'Beginner' | 'Intermediate' | 'Advanced')}
              className="block w-full rounded-lg bg-[#080808] border border-white/10 text-white p-2.5 outline-none focus:border-white/40 text-sm">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1.5">Progression Style</p>
            <select value={calcProgStyle} onChange={(e) => setCalcProgStyle(e.target.value as ProgStyle)}
              className="block w-full rounded-lg bg-[#080808] border border-white/10 text-white p-2.5 outline-none focus:border-white/40 text-sm">
              <option value="Conservative">Conservative (+2.5lbs/2 weeks)</option>
              <option value="Standard">Standard (+2.5lbs/week)</option>
              <option value="Aggressive">Aggressive (+5lbs/week)</option>
            </select>
          </div>
        </div>

        <button type="button"
          disabled={!calcCurrentWeight || !calcGoalWeight || parseFloat(calcCurrentWeight) >= parseFloat(calcGoalWeight)}
          onClick={() => {
            const cw = parseFloat(calcCurrentWeight), gw = parseFloat(calcGoalWeight)
            const s = Math.max(1, parseInt(calcSets) || 3), r = Math.max(1, parseInt(calcReps) || 8)
            const d = Math.max(1, parseInt(calcDeloadEvery) || 4)
            if (!cw || !gw || cw >= gw) return
            setCalcPlan(buildProgressionPlan(cw, gw, s, r, d, calcExType, calcProgStyle))
          }}
          className="w-full rounded-lg bg-white text-black font-semibold p-3 text-sm hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-4">
          Generate Plan
        </button>

        {calcPlan && (() => {
          const cw = parseFloat(calcCurrentWeight), gw = parseFloat(calcGoalWeight)
          const deloadWeeks = calcPlan.filter(w => w.type === 'DELOAD').length
          const trainingWeeks = calcPlan.filter(w => w.type === 'Training').length
          const totalWeeks = calcPlan.length
          const avgTrainingIncrements = calcPlan.filter(w => w.type === 'Training' && w.targetWeight > cw)
          const avgIncrease = avgTrainingIncrements.length > 0
            ? parseFloat(((gw - cw) / Math.max(1, trainingWeeks)).toFixed(2))
            : 0
          const progressPct = Math.min(100, Math.round((cw / gw) * 100))

          return (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="rounded-xl bg-white/4 p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Current</p>
                  <p className="font-['DM_Serif_Display'] text-2xl text-white">{cw}<span className="text-sm ml-0.5">{unit}</span></p>
                </div>
                <div className="rounded-xl bg-white/4 p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Goal</p>
                  <p className="font-['DM_Serif_Display'] text-2xl text-[#10b981]">{gw}<span className="text-sm ml-0.5">{unit}</span></p>
                </div>
                <div className="rounded-xl bg-white/4 p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Weeks</p>
                  <p className="font-['DM_Serif_Display'] text-2xl text-white">{totalWeeks}</p>
                  <p className="text-[10px] text-[rgba(255,255,255,0.35)]">{deloadWeeks} deload</p>
                </div>
                <div className="rounded-xl bg-white/4 p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Avg / Week</p>
                  <p className="font-['DM_Serif_Display'] text-2xl text-white">+{avgIncrease}<span className="text-sm ml-0.5">{unit}</span></p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-[rgba(255,255,255,0.35)] mb-1.5">
                  <span>{cw}{unit}</span><span>You are {progressPct}% of the way to your goal</span><span>{gw}{unit}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#141414' }}>
                  <div className="h-full rounded-full transition-all duration-700 bg-white" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              {/* Progression Chart */}
              {calcPlan.length >= 2 && (() => {
                const PW2 = 500, PH2 = 160, PL2 = 42, PR2 = 64, PT2 = 12, PB2 = 24
                const CW2 = PW2 - PL2 - PR2, CH2 = PH2 - PT2 - PB2
                const allW = calcPlan.map(w => w.targetWeight)
                const minW = Math.min(...allW) - 5
                const maxW = Math.max(gw, ...allW) + 5
                const wRange = maxW - minW
                const xOf2 = (i: number) => PL2 + (i / (calcPlan.length - 1)) * CW2
                const yOf2 = (v: number) => PT2 + CH2 - ((v - minW) / wRange) * CH2
                const pts2 = calcPlan.map((w, i) => ({ x: xOf2(i), y: yOf2(w.targetWeight) }))
                let pathD = `M ${pts2[0].x.toFixed(1)},${pts2[0].y.toFixed(1)}`
                for (let i = 1; i < pts2.length; i++) {
                  const prev = pts2[i - 1], curr = pts2[i]
                  const cpx = (prev.x + curr.x) / 2
                  pathD += ` C ${cpx.toFixed(1)},${prev.y.toFixed(1)} ${cpx.toFixed(1)},${curr.y.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`
                }
                const goalY = yOf2(gw), curY = yOf2(cw)
                const xLabels2 = calcPlan.length <= 8
                  ? calcPlan.map((_, i) => i)
                  : [0, Math.round(calcPlan.length * 0.25), Math.round(calcPlan.length * 0.5), Math.round(calcPlan.length * 0.75), calcPlan.length - 1]
                return (
                  <div className="mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] px-4 pt-3 pb-2">Progression Chart</p>
                    <svg viewBox={`0 0 ${PW2} ${PH2}`} width="100%" height="160" preserveAspectRatio="xMidYMid meet" style={{ display: 'block', overflow: 'visible' }}>
                      <line x1={PL2} x2={PW2 - PR2} y1={goalY} y2={goalY} stroke="#f59e0b" strokeWidth="0.75" strokeDasharray="5 3" opacity="0.65" />
                      <text x={PW2 - PR2 + 4} y={goalY + 3} fontSize="8" fill="#f59e0b" fontFamily="Inter,sans-serif">Goal: {gw}{unit}</text>
                      <line x1={PL2} x2={PW2 - PR2} y1={curY} y2={curY} stroke="rgba(255,255,255,0.25)" strokeWidth="0.75" strokeDasharray="5 3" opacity="0.5" />
                      <text x={PW2 - PR2 + 4} y={curY + 3} fontSize="8" fill="rgba(255,255,255,0.35)" fontFamily="Inter,sans-serif">Now: {cw}{unit}</text>
                      <path d={`${pathD} L${pts2[pts2.length - 1].x.toFixed(1)},${PT2 + CH2} L${pts2[0].x.toFixed(1)},${PT2 + CH2} Z`} fill="rgba(255,255,255,0.06)" />
                      <path d={pathD} fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" />
                      {calcPlan.map((w, i) => (
                        <circle key={i} cx={xOf2(i)} cy={yOf2(w.targetWeight)} r={2.5}
                          fill={w.type === 'DELOAD' ? '#f59e0b' : '#ffffff'} stroke="#0f0f0f" strokeWidth="1" />
                      ))}
                      {[Math.round(minW + 5), Math.round((minW + 5 + gw) / 2), Math.round(gw)].map((v, i) => (
                        <text key={i} x={PL2 - 4} y={yOf2(v) + 3} textAnchor="end" fontSize={8} fill="rgba(255,255,255,0.35)" fontFamily="Inter,sans-serif">{v}</text>
                      ))}
                      {xLabels2.map(i => (
                        <text key={i} x={xOf2(i)} y={PH2 - 4} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.35)" fontFamily="Inter,sans-serif">W{calcPlan[i].week}</text>
                      ))}
                    </svg>
                  </div>
                )
              })()}

              {/* Progression Table */}
              <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="grid bg-[#0a0a0a]" style={{ gridTemplateColumns: '48px 80px 1fr 1fr 80px' }}>
                  {['Week', 'Type', 'Target', 'Volume', '% Inc'].map((h) => (
                    <div key={h} className="px-3 py-2"><p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">{h}</p></div>
                  ))}
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
                  {calcPlan.map((w) => {
                    const isDeload = w.type === 'DELOAD'
                    return (
                      <div key={w.week} className="grid"
                        style={{
                          gridTemplateColumns: '48px 80px 1fr 1fr 80px',
                          background: isDeload ? 'rgba(245,158,11,0.05)' : w.week % 2 === 0 ? '#141414' : '#0f0f0f',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          borderLeft: isDeload ? '2px solid #f59e0b' : '2px solid transparent',
                        }}>
                        <div className="px-3 py-2.5"><p className="text-xs text-[rgba(255,255,255,0.55)]">{w.week}</p></div>
                        <div className="px-3 py-2.5">
                          <span className="text-[11px] font-semibold rounded-full px-2 py-0.5"
                            style={{ background: isDeload ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.07)', color: isDeload ? '#f59e0b' : '#ffffff' }}>
                            {isDeload ? 'DELOAD' : 'Training'}
                          </span>
                        </div>
                        <div className="px-3 py-2.5"><p className="text-xs text-white">{w.targetWeight}{unit}</p></div>
                        <div className="px-3 py-2.5"><p className="text-xs text-[rgba(255,255,255,0.55)]">{w.volume.toLocaleString()}{unit}</p></div>
                        <div className="px-3 py-2.5"><p className="text-xs" style={{ color: w.pctIncrease >= 0 ? '#ffffff' : '#ef4444' }}>{w.pctIncrease >= 0 ? '+' : ''}{w.pctIncrease}%</p></div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Plateau Buster */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <button type="button" onClick={() => setPlateauOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#0a0a0a] hover:bg-[#141414] transition-colors">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">Plateau Buster</p>
                  {plateauOpen ? <ChevronUp size={14} className="text-[rgba(255,255,255,0.35)]" /> : <ChevronDown size={14} className="text-[rgba(255,255,255,0.35)]" />}
                </button>
                {plateauOpen && (
                  <div className="p-4 space-y-3">
                    {([
                      { icon: <TrendingUp size={14} />, title: 'Rep Range First', body: 'Increase reps before weight. If your program says 8–12 reps, reach 12 consistently before adding weight. This builds a strength base and reduces injury risk.' },
                      { icon: <Plus size={14} />, title: 'Add Volume', body: 'Add one extra set before increasing weight. Going from 3×8 to 4×8 adds 33% more volume without a weight increase. Progress this for 2 weeks then try adding weight.' },
                      { icon: <Moon size={14} />, title: 'Recovery Check', body: 'Plateaus often signal poor recovery. Are you averaging 7.5+ hours sleep? Is your protein intake at 0.8g per lb of bodyweight? These two factors explain 80% of plateaus.' },
                      { icon: <Clock size={14} />, title: 'Rest Periods', body: 'Extend rest periods to 3–5 minutes on compound lifts. More rest = more recovered CNS = more strength available. Many people plateau simply from insufficient rest between sets.' },
                      { icon: <RefreshCw size={14} />, title: 'Planned Deload', body: 'If stalled for 2+ weeks, take a deload week at 50–60% of your working weight. This removes fatigue while maintaining skill and often leads to a PR the following week.' },
                    ] as const).map((tip) => (
                      <div key={tip.title} className="flex gap-3 rounded-lg bg-[#0a0a0a] p-3">
                        <div className="shrink-0 mt-0.5 text-[#10b981]">{tip.icon}</div>
                        <div>
                          <p className="text-xs font-semibold text-white mb-0.5">{tip.title}</p>
                          <p className="text-xs text-[rgba(255,255,255,0.55)] leading-5">{tip.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="mt-4 rounded-r-xl px-4 py-3" style={{ background: '#0a0a0a', borderLeft: '2px solid #64748b' }}>
                <p className="text-[12px] font-medium text-[rgba(255,255,255,0.35)] mb-1">⚠️ Important Notice</p>
                <p className="text-[12px] text-[rgba(255,255,255,0.35)] leading-relaxed">This progression plan is an estimate based on your current training data and selected settings. Actual progress may be faster or slower depending on recovery, nutrition, sleep, consistency, and individual response. Reaching the projected goal weight by the estimated date is not guaranteed.</p>
              </div>
            </>
          )
        })()}
      </div>

      {/* My Program */}
      {split && (
        <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-6">
          <div className="flex items-start justify-between mb-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">My Program</p>
            <button type="button" onClick={() => navigate('/target')}
              className="text-xs text-[#10b981] hover:text-[rgba(255,255,255,0.55)] transition-colors">
              Change {'→'}
            </button>
          </div>
          <p className="font-['DM_Serif_Display'] text-xl text-white mb-1">{split.name}</p>
          <p className="text-[13px] text-[rgba(255,255,255,0.35)] mb-4">{split.description}</p>

          {/* Schedule dots */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => {
              const isTraining = split.schedule.includes(d)
              return (
                <span key={d} className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{ background: isTraining ? '#ffffff' : '#0a0a0a', color: isTraining ? '#000000' : 'rgba(255,255,255,0.2)' }}>
                  {d}
                </span>
              )
            })}
          </div>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-[rgba(255,255,255,0.55)]">{split.daysPerWeek}d / week</span>
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-[rgba(255,255,255,0.55)]">{split.volumePerMuscle}</span>
            {split.level.map((l) => (
              <span key={l} className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-[rgba(255,255,255,0.55)]">{l}</span>
            ))}
          </div>

          {/* Why it works + Recovery */}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg bg-[#0a0a0a] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.35)] mb-1">Why it works</p>
              <p className="text-xs text-[rgba(255,255,255,0.55)] leading-4">{split.whyItWorks}</p>
            </div>
            <div className="rounded-lg bg-[#0a0a0a] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.35)] mb-1">Recovery</p>
              <p className="text-xs text-[rgba(255,255,255,0.55)] leading-4">{split.recoveryNote}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrainingPage




