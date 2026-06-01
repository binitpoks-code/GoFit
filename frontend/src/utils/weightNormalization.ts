import type { ProgressEntry, UserProfile } from '../types/coaching'
import { toKilograms } from './weightUnits'

const LEGACY_POUNDS_THRESHOLD = 140
const MAX_PLAUSIBLE_BODYWEIGHT_KG = 280

function bmi(weightKg: number, heightCm?: number) {
  if (!heightCm) {
    return 0
  }

  const heightMeters = heightCm / 100
  return weightKg / (heightMeters * heightMeters)
}

function looksLikeLegacyPounds(value: number, referenceKg?: number, heightCm?: number) {
  if (!Number.isFinite(value) || value <= LEGACY_POUNDS_THRESHOLD) {
    return false
  }

  if (value > MAX_PLAUSIBLE_BODYWEIGHT_KG) {
    return true
  }

  if (referenceKg && referenceKg > 0) {
    return value / referenceKg > 1.65
  }

  return bmi(value, heightCm) > 45
}

export function normalizeStoredWeightKg(value: number, referenceKg?: number, heightCm?: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return value
  }

  return looksLikeLegacyPounds(value, referenceKg, heightCm) ? toKilograms(value, 'lb') : value
}

export function normalizeStoredProfileWeight(profile: UserProfile): UserProfile {
  return {
    ...profile,
    weight: normalizeStoredWeightKg(profile.weight, undefined, profile.height),
  }
}

export function normalizeStoredProgressEntry(entry: ProgressEntry, profile?: UserProfile | null): ProgressEntry {
  return {
    ...entry,
    bodyWeight: normalizeStoredWeightKg(entry.bodyWeight, profile?.weight, profile?.height),
  }
}

export function normalizeStoredProgressEntries(entries: ProgressEntry[], profile?: UserProfile | null) {
  return entries.map((entry) => normalizeStoredProgressEntry(entry, profile))
}
