export function calculateTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'Male' | 'Female',
  activityLevel: string
): number {
  // Mifflin-St Jeor
  let bmr: number
  if (gender === 'Male') {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5
  } else {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161
  }

  const multipliers: Record<string, number> = {
    'Sedentary': 1.2,
    'Lightly Active': 1.375,
    'Moderately Active': 1.55,
    'Very Active': 1.725,
    'Extremely Active': 1.9,
  }

  return Math.round(bmr * (multipliers[activityLevel] || 1.55))
}

export function calculateDailyTarget(
  tdee: number,
  weeklyTarget: number,
  unit: 'kg' | 'lb'
): number {
  const kcalPerUnit = unit === 'kg' ? 7700 : 3500
  const dailyAdjustment = Math.round((weeklyTarget * kcalPerUnit) / 7)
  return tdee + dailyAdjustment
}

export function getPhase(weeklyTarget: number): string {
  if (weeklyTarget < 0) return 'Cut'
  if (weeklyTarget > 0) return 'Bulk'
  return 'Maintenance'
}
