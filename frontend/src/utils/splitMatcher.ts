export type Split = {
  id: string
  name: string
  daysPerWeek: number
  level: string[]
  goals: string[]
  schedule: string[]
  restDays: string[]
  volumePerMuscle: string
  description: string
  whyItWorks: string
  recoveryNote: string
}

export const ALL_SPLITS: Split[] = [
  {
    id: 'full-body-3x',
    name: 'Full Body 3x',
    daysPerWeek: 3,
    level: ['Beginner', 'Intermediate'],
    goals: ['Fat Loss', 'Maintenance', 'Recomposition'],
    schedule: ['Mon', 'Wed', 'Fri'],
    restDays: ['Tue', 'Thu', 'Sat', 'Sun'],
    volumePerMuscle: '6–9 sets',
    description: 'Train every muscle 3x per week with full body sessions',
    whyItWorks: 'High frequency builds skill and strength efficiently',
    recoveryNote: 'Good recovery — alternating days allow full recovery',
  },
  {
    id: 'upper-lower-4x',
    name: 'Upper Lower',
    daysPerWeek: 4,
    level: ['Beginner', 'Intermediate'],
    goals: ['Muscle Gain', 'Strength', 'Recomposition'],
    schedule: ['Mon', 'Tue', 'Thu', 'Fri'],
    restDays: ['Wed', 'Sat', 'Sun'],
    volumePerMuscle: '10–14 sets',
    description: 'Alternate upper and lower body sessions 4x per week',
    whyItWorks: 'Balanced frequency with good recovery between sessions',
    recoveryNote: 'Rest day mid-week prevents accumulated fatigue',
  },
  {
    id: 'ppl',
    name: 'Push Pull Legs',
    daysPerWeek: 6,
    level: ['Intermediate', 'Advanced'],
    goals: ['Muscle Gain', 'Recomposition'],
    schedule: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'],
    restDays: ['Thu'],
    volumePerMuscle: '16–20 sets',
    description: 'Push, Pull, and Legs split twice per week',
    whyItWorks: 'Optimal volume and frequency for muscle hypertrophy',
    recoveryNote: 'High volume — sleep and nutrition are critical',
  },
  {
    id: 'bro-split',
    name: 'Classic Bro Split',
    daysPerWeek: 5,
    level: ['Intermediate', 'Advanced'],
    goals: ['Muscle Gain'],
    schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    restDays: ['Sat', 'Sun'],
    volumePerMuscle: '16–24 sets',
    description: 'One muscle group per day with high volume',
    whyItWorks: 'Maximum volume per muscle session for size focus',
    recoveryNote: 'Each muscle gets full week to recover',
  },
  {
    id: 'arnold-split',
    name: 'Arnold Split',
    daysPerWeek: 6,
    level: ['Advanced'],
    goals: ['Muscle Gain'],
    schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    restDays: ['Sun'],
    volumePerMuscle: '18–22 sets',
    description: 'Chest+Back / Shoulders+Arms / Legs repeated twice',
    whyItWorks: 'Classic bodybuilding split for maximum muscle development',
    recoveryNote: 'Demanding — recovery quality must be high',
  },
  {
    id: '531',
    name: '5/3/1 Strength',
    daysPerWeek: 4,
    level: ['Intermediate', 'Advanced'],
    goals: ['Strength'],
    schedule: ['Mon', 'Wed', 'Fri', 'Sat'],
    restDays: ['Tue', 'Thu', 'Sun'],
    volumePerMuscle: '8–12 sets',
    description: 'Focus on squat, bench, deadlift, overhead press',
    whyItWorks: 'Proven strength progression with weekly PRs',
    recoveryNote: 'Low volume — recovery is rarely an issue',
  },
  {
    id: 'ppl-strength',
    name: 'PPL Strength',
    daysPerWeek: 6,
    level: ['Intermediate', 'Advanced'],
    goals: ['Strength', 'Muscle Gain'],
    schedule: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'],
    restDays: ['Thu'],
    volumePerMuscle: '12–16 sets',
    description: 'Push Pull Legs with strength-focused rep ranges',
    whyItWorks: 'Combines strength and size in one program',
    recoveryNote: 'High frequency — monitor fatigue closely',
  },
  {
    id: 'full-body-4x',
    name: 'Full Body 4x',
    daysPerWeek: 4,
    level: ['Beginner', 'Intermediate'],
    goals: ['Fat Loss', 'Maintenance'],
    schedule: ['Mon', 'Tue', 'Thu', 'Fri'],
    restDays: ['Wed', 'Sat', 'Sun'],
    volumePerMuscle: '8–12 sets',
    description: 'Full body training 4x per week for maximum calorie burn',
    whyItWorks: 'High frequency elevates metabolism for fat loss',
    recoveryNote: 'Good for cutting — manageable fatigue',
  },
]

export function getRecommendedSplits(
  goal: string,
  trainingDays: number,
  experienceLevel: string
): { recommended: Split[]; all: Split[] } {
  const goalMatches = ALL_SPLITS.filter((s) => s.goals.includes(goal))
  const dayMatches = goalMatches.filter((s) => Math.abs(s.daysPerWeek - trainingDays) <= 1)
  const levelMatches = dayMatches.filter((s) => s.level.includes(experienceLevel))

  const recommended =
    levelMatches.length > 0
      ? levelMatches.slice(0, 3)
      : dayMatches.length > 0
        ? dayMatches.slice(0, 3)
        : goalMatches.slice(0, 3)

  return { recommended, all: ALL_SPLITS }
}
