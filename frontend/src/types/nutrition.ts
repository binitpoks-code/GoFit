export type CaloriePhase = 'Surplus' | 'Maintenance' | 'Deficit'

export type MacroTarget = {
  label: string
  grams: number
  calories: number
  percent: number
  explanation: string
}

export type NutritionPlan = {
  currentDailyIntake: number
  recommendedCalories: number
  recommendedCalorieRange: string
  calorieAdjustment: number
  calorieAdjustmentRange: string
  caloriePhase: CaloriePhase
  recommendationReason: string
  recommendationBasis: string
  phase: CaloriePhase
  phaseExplanation: string
  expectedOutcome: string
  recoveryImplication: string
  performanceImplication: string
  hydrationLiters: number
  recoveryGuidance: string
  macros: {
    protein: MacroTarget
    carbs: MacroTarget
    fats: MacroTarget
  }
}
