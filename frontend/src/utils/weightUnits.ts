export type WeightUnit = 'lb' | 'kg'

const WEIGHT_UNIT_KEY = 'gofit.weightUnit'
const LB_PER_KG = 2.2046226218

export function getStoredWeightUnit(): WeightUnit {
  return localStorage.getItem(WEIGHT_UNIT_KEY) === 'kg' ? 'kg' : 'lb'
}

export function storeWeightUnit(unit: WeightUnit) {
  localStorage.setItem(WEIGHT_UNIT_KEY, unit)
}

export function toKilograms(value: number, unit: WeightUnit) {
  return unit === 'lb' ? Math.round((value / LB_PER_KG) * 10) / 10 : Math.round(value * 10) / 10
}

export function fromKilograms(value: number, unit: WeightUnit) {
  return unit === 'lb' ? Math.round(value * LB_PER_KG * 10) / 10 : Math.round(value * 10) / 10
}
