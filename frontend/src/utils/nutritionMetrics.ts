import type { ProgressEntry, UserProfile } from '../types/coaching'
import type { CaloriePhase, MacroTarget, NutritionPlan } from '../types/nutrition'

const LB_PER_KG = 2.2046226218

type ProfileWithLegacyCalories = UserProfile & {
  calorieTarget?: number
}

function estimateMaintenance(profile: UserProfile) {
  const base = profile.weight * 22 + profile.trainingDaysAvailable * 115
  return Math.round(Math.max(1600, base))
}

function recommendedCaloriesFor(profile: UserProfile, maintenance: number, fatigue: string) {
  const goal = profile.goal.toLowerCase()
  const recoveryModifier = fatigue.includes('high') ? 100 : 0

  if (goal.includes('fat')) {
    return Math.round(maintenance - 350 + recoveryModifier)
  }

  if (goal.includes('muscle')) {
    return Math.round(maintenance + 250 + recoveryModifier)
  }

  if (goal.includes('performance')) {
    return Math.round(maintenance + 150 + recoveryModifier)
  }

  return Math.round(maintenance + recoveryModifier)
}

function determinePhase(profile: UserProfile, recommendedCalories: number, maintenance: number): CaloriePhase {
  const goal = profile.goal.toLowerCase()

  if (goal.includes('fat') || recommendedCalories < maintenance - 150) {
    return 'Deficit'
  }

  if (goal.includes('muscle') || goal.includes('performance') || recommendedCalories > maintenance + 150) {
    return 'Surplus'
  }

  return 'Maintenance'
}

function macro(label: string, grams: number, caloriesPerGram: number, dailyCalories: number, explanation: string): MacroTarget {
  const calories = Math.round(grams * caloriesPerGram)

  return {
    label,
    grams: Math.round(grams),
    calories,
    percent: Math.round((calories / dailyCalories) * 100),
    explanation,
  }
}

function latestFatigue(entries: ProgressEntry[]) {
  return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.fatigueLevel ?? ''
}

function currentIntakeFor(profile: ProfileWithLegacyCalories, maintenance: number) {
  return profile.currentCalories || profile.calorieTarget || maintenance
}

function recommendationReasonFor(phase: CaloriePhase, adjustment: number, fatigue: string) {
  if (fatigue.includes('high') && adjustment > 0) {
    return 'Recovery indicators suggest elevated training demand. GoFit recommends a modest intake increase to better support adaptation and consistency.'
  }

  if (phase === 'Surplus') {
    return 'GoFit recommends a controlled surplus to support training output, recovery, and gradual progression without unnecessary intake escalation.'
  }

  if (phase === 'Deficit') {
    return 'GoFit recommends a measured deficit that supports fat loss while keeping recovery and training quality in view.'
  }

  return 'GoFit recommends a maintenance-aligned intake to keep recovery predictable while training signals become clearer.'
}

function calorieRange(calories: number) {
  const lower = Math.round((calories - 75) / 10) * 10
  const upper = Math.round((calories + 75) / 10) * 10
  return `${lower.toLocaleString()}-${upper.toLocaleString()} kcal`
}

function adjustmentRange(adjustment: number) {
  if (Math.abs(adjustment) < 75) {
    return 'Hold near baseline'
  }

  const sign = adjustment > 0 ? '+' : '-'
  const lower = Math.max(0, Math.round((Math.abs(adjustment) - 75) / 25) * 25)
  const upper = Math.round((Math.abs(adjustment) + 75) / 25) * 25
  return `${sign}${lower.toLocaleString()}-${upper.toLocaleString()} kcal`
}

export function buildNutritionPlan(profile: UserProfile, progressEntries: ProgressEntry[]): NutritionPlan {
  const maintenance = estimateMaintenance(profile)
  const fatigue = latestFatigue(progressEntries).toLowerCase()
  const currentDailyIntake = currentIntakeFor(profile, maintenance)
  const recommendedCalories = recommendedCaloriesFor(profile, maintenance, fatigue)
  const calorieAdjustment = recommendedCalories - currentDailyIntake
  const phase = determinePhase(profile, recommendedCalories, maintenance)
  const proteinGrams = profile.weight * LB_PER_KG * 0.8
  const fatPercent = phase === 'Deficit' ? 0.28 : 0.25
  const fatGrams = (recommendedCalories * fatPercent) / 9
  const carbCalories = Math.max(0, recommendedCalories - proteinGrams * 4 - fatGrams * 9)
  const carbMultiplier = profile.trainingDaysAvailable >= 5 ? 1 : profile.trainingDaysAvailable >= 3 ? 0.92 : 0.82
  const carbGrams = (carbCalories / 4) * carbMultiplier
  const hydrationLiters = Math.round((2.5 + profile.trainingDaysAvailable * 0.18) * 10) / 10

  const phaseCopy = {
    Surplus: {
      phaseExplanation: 'A surplus gives training more available energy for muscle growth and session-to-session progression.',
      expectedOutcome: 'Best suited for lean mass gain when workload and recovery are stable.',
      recoveryImplication: 'Recovery usually has more nutritional support, especially when sleep and protein are consistent.',
      performanceImplication: 'Carbohydrate availability should support stronger repeated training sessions.',
    },
    Maintenance: {
      phaseExplanation: 'Maintenance keeps intake close to energy needs, which can support recovery, skill practice, and recomposition.',
      expectedOutcome: 'Best suited for stable performance while body composition changes slowly.',
      recoveryImplication: 'Recovery should remain predictable if fatigue is managed and protein stays consistent.',
      performanceImplication: 'Training energy is usually steady, though hard blocks may need slightly higher carbohydrates.',
    },
    Deficit: {
      phaseExplanation: 'A deficit supports fat loss by keeping intake below estimated energy needs.',
      expectedOutcome: 'Best suited for gradual fat loss while preserving training quality.',
      recoveryImplication: 'Recovery margin is smaller, so fatigue and sleep signals matter more.',
      performanceImplication: 'Performance can remain solid, but aggressive progression should be measured.',
    },
  } satisfies Record<CaloriePhase, Omit<NutritionPlan, 'currentDailyIntake' | 'recommendedCalories' | 'recommendedCalorieRange' | 'calorieAdjustment' | 'calorieAdjustmentRange' | 'caloriePhase' | 'recommendationReason' | 'recommendationBasis' | 'phase' | 'hydrationLiters' | 'recoveryGuidance' | 'macros'>>

  return {
    currentDailyIntake,
    recommendedCalories,
    recommendedCalorieRange: calorieRange(recommendedCalories),
    calorieAdjustment,
    calorieAdjustmentRange: adjustmentRange(calorieAdjustment),
    caloriePhase: phase,
    recommendationReason: recommendationReasonFor(phase, calorieAdjustment, fatigue),
    recommendationBasis: 'Estimated from your profile, training frequency, goal, and recent recovery context.',
    phase,
    ...phaseCopy[phase],
    hydrationLiters,
    recoveryGuidance: fatigue.includes('high')
      ? 'Fatigue is elevated, so keep protein consistent and bias carbohydrates around training to protect recovery quality.'
      : 'Current signals support a steady nutrition baseline. Keep meals repeatable and place more carbohydrates near harder sessions.',
    macros: {
      protein: macro(
        'Protein',
        proteinGrams,
        4,
        recommendedCalories,
        'About 0.8g per pound supports muscle protein synthesis, recovery, and lean mass retention.',
      ),
      carbs: macro(
        'Carbohydrates',
        carbGrams,
        4,
        recommendedCalories,
        'Carbs scale with training frequency because they support session energy and repeated performance.',
      ),
      fats: macro(
        'Fats',
        fatGrams,
        9,
        recommendedCalories,
        'A moderate fat range supports hormones, joint comfort, and overall recovery without crowding out training fuel.',
      ),
    },
  }
}
