export type UserProfile = {
  id?: number
  name: string
  age: number
  height: number
  weight: number
  bodyFatPercentage: number
  goal: string
  weakArea?: string
  experienceLevel: string
  calorieTracking: boolean
  currentCalories: number
  recoveryQuality: string
  fatigueTolerance: string
  trainingDaysAvailable: number
  gender?: string
  activityLevel?: string
  weeklyWeightTarget?: number
}

export type CoachingResponse = {
  splitRecommendation: string
  splitReason: string
  calorieFeedback: string
  recoveryFeedback: string
  fatigueFeedback: string
  weeklyTrainingVolume: string
  estimatedWeeklySets: number
  muscleFrequencyEmphasis: string
  specializationAdjustment: string
  volumeReason: string
  progressAnalysis: string
  plateauDetection: string
  adaptiveAdjustment: string
  workloadStatus: string
  workloadObservation: string
  recoveryScore: number
  recoveryScoreFeedback: string
  trainingReadinessLevel: string
  trainingReadinessFeedback: string
  deloadRecommendation: string
  consistencyScore: number
  consistencyFeedback: string
  progressionState: string
  progressionStrategy: string
  coachingMemory: string
  estimatedMaintenanceCalories: number
  cuttingCalories: number
  bulkingCalories: number
  maintenanceCaloriesLow: number
  maintenanceCaloriesHigh: number
  deficitSeverity: string
  surplusSustainability: string
  calorieStrategy: string
  additionalAdvice: string
  trainingFrequency: number
  recommendedCalories: number
}

export type ProgressEntry = {
  id?: number
  bodyWeight: number
  calories: number
  sleepHours: number
  fatigueLevel: string
  workoutPerformance: string
  notes?: string
  date: string
  recoveryScore?: number
  workoutCompleted?: boolean
  energyLevel?: number
  optionalNotes?: string
  createdAt?: string
  userProfileId?: number
}

export type DashboardSummary = {
  recoveryScore: number
  recoverySubtitle: string
  trainingReadiness: string
  trainingReadinessSubtitle: string
  splitRecommendation: string
  splitSubtitle: string
  calorieStrategy: string
  calorieSubtitle: string
  fatigueLevel: string
  fatigueSubtitle: string
  progressionState: string
  progressionSubtitle: string
  coachingInsight: string
  adaptiveFocus: string
  overviewTitle: string
  overviewMessage: string
}
