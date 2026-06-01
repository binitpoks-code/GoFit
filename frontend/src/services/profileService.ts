import { apiClient } from '../api/apiClient'
import { getStoredUser } from '../auth/tokenStorage'
import type { CoachingResponse, UserProfile } from '../types/coaching'
import { normalizeStoredProfileWeight } from '../utils/weightNormalization'

const PROFILE_CACHE_KEY = 'gofit.latestProfile'
export const COACHING_KEY = 'gofit.coaching'
export const PROFILE_UPDATED_EVENT = 'gofit:profile-updated'

type ProfilePayload = UserProfile & {
  calorieTarget?: number
  currentDailyIntake?: number
}

function latestProfile(profiles: UserProfile[]) {
  return [...profiles].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0] ?? null
}

function normalizeProfile(profile: ProfilePayload, options: { normalizeLegacyWeight?: boolean } = {}): UserProfile {
  const normalizedProfile = {
    ...profile,
    currentCalories: profile.currentCalories || profile.calorieTarget || profile.currentDailyIntake || 0,
  }

  return options.normalizeLegacyWeight ? normalizeStoredProfileWeight(normalizedProfile) : normalizedProfile
}

function toBackendProfilePayload(profile: ProfilePayload) {
  const currentIntake = profile.currentCalories || profile.calorieTarget || profile.currentDailyIntake || 0

  return {
    ...profile,
    currentCalories: currentIntake,
    calorieTarget: currentIntake,
  }
}

function readCachedProfile() {
  const cached = localStorage.getItem(profileCacheKey())

  if (!cached) {
    return null
  }

  try {
    return normalizeProfile(JSON.parse(cached) as ProfilePayload)
  } catch {
    localStorage.removeItem(profileCacheKey())
    return null
  }
}

function cacheProfile(profile: UserProfile) {
  localStorage.setItem(profileCacheKey(), JSON.stringify(profile))
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: profile }))
}

function profileCacheKey() {
  const email = getStoredUser()?.email
  return email ? `${PROFILE_CACHE_KEY}.${email}` : PROFILE_CACHE_KEY
}

export const profileService = {
  async getProfiles() {
    const response = await apiClient.get<ProfilePayload[]>('/profiles')
    const profiles = response.data.map((profile) => normalizeProfile(profile, { normalizeLegacyWeight: true }))
    const currentProfile = latestProfile(profiles)

    if (currentProfile) {
      cacheProfile(currentProfile)
      return profiles
    }

    const cachedProfile = readCachedProfile()
    return cachedProfile ? [cachedProfile] : profiles
  },

  async getLatestProfile() {
    const profiles = await this.getProfiles()
    return latestProfile(profiles)
  },

  async saveProfile(payload: ProfilePayload) {
    const normalizedProfile = normalizeProfile(payload)
    const response = await apiClient.post<CoachingResponse>('/profile', toBackendProfilePayload(payload))
    cacheProfile(normalizedProfile)
    localStorage.setItem(COACHING_KEY, JSON.stringify(response.data))
    return response.data
  },

  clearCachedProfile() {
    localStorage.removeItem(profileCacheKey())
  },
}
