import type { DashboardSummary, ProgressEntry, UserProfile } from '../types/coaching'

const fatigueScore: Record<string, number> = {
  low: 88,
  moderate: 68,
  medium: 68,
  high: 42,
}

function latestProgress(entries: ProgressEntry[]) {
  return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
}

function average(values: number[]) {
  if (!values.length) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function normalizeFatigue(value?: string) {
  return fatigueScore[value?.toLowerCase() ?? ''] ?? 70
}

function splitFor(profile: UserProfile) {
  if (profile.trainingDaysAvailable >= 5) {
    return 'Push / Pull / Legs'
  }

  if (profile.trainingDaysAvailable === 4) {
    return 'Upper / Lower'
  }

  return 'Full Body'
}

function progressionFor(entries: ProgressEntry[]) {
  if (entries.length < 3) {
    return 'Baseline Building'
  }

  const recent = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-3)
  const performanceText = recent.map((entry) => entry.workoutPerformance.toLowerCase()).join(' ')

  if (performanceText.includes('stall') || performanceText.includes('flat') || performanceText.includes('no major')) {
    return 'Measured Progression'
  }

  if (performanceText.includes('strong') || performanceText.includes('progress')) {
    return 'Progression Ready'
  }

  return 'Stability Phase'
}

function adaptiveOverview(profile: UserProfile, recoveryScore: number, readiness: string, progressionState: string, progressEntries: ProgressEntry[]) {
  const goal = profile.goal.toLowerCase()
  const hasProgress = progressEntries.length > 0

  if (!hasProgress) {
    return {
      adaptiveFocus: 'Baseline setup',
      overviewTitle: 'GoFit is ready to establish your baseline',
      overviewMessage:
        'Your profile gives GoFit enough context to start. Add recovery and performance check-ins to unlock more precise adaptation signals.',
    }
  }

  if (recoveryScore < 58) {
    return {
      adaptiveFocus: 'Recovery-focused',
      overviewTitle: 'Recovery demand appears elevated',
      overviewMessage:
        'GoFit recommends keeping intake stable and training volume controlled while fatigue and sleep signals normalize.',
    }
  }

  if (progressionState === 'Measured Progression') {
    return {
      adaptiveFocus: 'Progression-focused',
      overviewTitle: 'Progression signals need a measured push',
      overviewMessage:
        'Recent performance suggests adaptation may benefit from a modest workload increase, provided recovery remains stable.',
    }
  }

  if (goal.includes('fat')) {
    return {
      adaptiveFocus: 'Deficit management',
      overviewTitle: 'Fat-loss guidance is calibrated around recovery',
      overviewMessage:
        'GoFit is balancing intake reduction with training quality so the deficit remains productive instead of disruptive.',
    }
  }

  if (readiness === 'High') {
    return {
      adaptiveFocus: 'Progression-ready',
      overviewTitle: 'Training and recovery appear aligned',
      overviewMessage:
        'Current intake, recovery, and training frequency support gradual progression with deliberate increases in demand.',
    }
  }

  return {
    adaptiveFocus: 'Maintenance-aligned',
    overviewTitle: 'Current signals support a steady training baseline',
    overviewMessage:
      'GoFit recommends maintaining repeatable sessions while progress data continues to sharpen future adjustments.',
  }
}

export function buildDashboardSummary(profile: UserProfile, progressEntries: ProgressEntry[]): DashboardSummary {
  const recentEntry = latestProgress(progressEntries)
  const recentEntries = [...progressEntries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7)
  const explicitRecoveryAverage = average(recentEntries.map((entry) => entry.recoveryScore ?? 0).filter(Boolean))
  const sleepAverage = average(recentEntries.map((entry) => entry.sleepHours))
  const fatigueAverage = average(recentEntries.map((entry) => normalizeFatigue(entry.fatigueLevel)))
  const recoveryScore = explicitRecoveryAverage
    ? Math.round(explicitRecoveryAverage)
    : Math.round(Math.min(96, Math.max(38, (sleepAverage ? sleepAverage * 9 : 62) + fatigueAverage * 0.35)))
  const readiness = recoveryScore >= 78 ? 'High' : recoveryScore >= 58 ? 'Moderate' : 'Conservative'
  const fatigueLevel = recentEntry?.fatigueLevel ?? profile.fatigueTolerance
  const progressionState = progressionFor(progressEntries)
  const splitRecommendation = splitFor(profile)
  const overview = adaptiveOverview(profile, recoveryScore, readiness, progressionState, progressEntries)
  const calorieStrategy = profile.currentCalories
    ? `${profile.currentCalories.toLocaleString()} kcal baseline`
    : `${profile.goal} baseline`

  return {
    recoveryScore,
    recoverySubtitle:
      recoveryScore >= 78
        ? 'Recovery signals support productive training'
        : "Recovery should guide today's training load",
    trainingReadiness: readiness,
    trainingReadinessSubtitle:
      readiness === 'High'
        ? 'Work capacity appears supportive'
        : 'Keep progression measured until signals improve',
    splitRecommendation,
    splitSubtitle: `${profile.trainingDaysAvailable} training days available`,
    calorieStrategy,
    calorieSubtitle: profile.calorieTracking ? 'Current intake used as recommendation context' : 'Nutrition baseline not enabled',
    fatigueLevel,
    fatigueSubtitle: recentEntry ? `Latest check-in from ${recentEntry.date}` : 'No progress check-ins yet',
    progressionState,
    progressionSubtitle: progressEntries.length ? `${progressEntries.length} progress entries analyzed` : 'Awaiting progress data',
    coachingInsight: buildCoachingInsight(profile, progressEntries, recoveryScore, progressionState),
    ...overview,
  }
}

export function buildCoachingInsight(
  profile: UserProfile,
  progressEntries: ProgressEntry[],
  recoveryScore: number,
  progressionState: string,
) {
  if (!progressEntries.length) {
    return `${profile.name || 'Your'} profile is ready. Add progress check-ins so GoFit can compare recovery, workload, and nutrition signals before making larger training adjustments.`
  }

  const weakArea = profile.weakArea || 'priority muscle groups'

  if (recoveryScore < 58) {
    return `Recovery signals are currently constrained, so ${weakArea} work should stay controlled while sleep, fatigue, and intake consistency stabilize. This is a good window for preserving quality and managing training demand.`
  }

  if (progressionState === 'Measured Progression') {
    return `${weakArea} recovery appears workable, but progression has slowed slightly. A modest workload increase may improve adaptation over the next training cycle if fatigue remains stable.`
  }

  return `Recovery and recent performance signals look supportive of steady progression. Keep increases deliberate, monitor ${weakArea}, and let the next few check-ins confirm whether training demand remains productive.`
}

export function sortedProgress(entries: ProgressEntry[]) {
  return [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
