import { apiClient } from '../api/apiClient'
import type { ProgressEntry, UserProfile } from '../types/coaching'
import { normalizeStoredProgressEntry, normalizeStoredProgressEntries } from '../utils/weightNormalization'

export const PROGRESS_UPDATED_EVENT = 'gofit:progress-updated'

function publishProgressUpdated(entry: ProgressEntry) {
  window.dispatchEvent(new CustomEvent(PROGRESS_UPDATED_EVENT, { detail: entry }))
}

export const progressService = {
  async getProgressEntries(profile?: UserProfile | null) {
    const response = await apiClient.get<ProgressEntry[]>('/progress')
    return normalizeStoredProgressEntries(response.data, profile)
  },

  async createProgressEntry(payload: ProgressEntry) {
    const response = await apiClient.post<ProgressEntry>('/progress', {
      ...payload,
      optionalNotes: payload.optionalNotes ?? payload.notes,
      notes: payload.notes ?? payload.optionalNotes,
    })
    const savedEntry = normalizeStoredProgressEntry(response.data)
    publishProgressUpdated(savedEntry)
    return savedEntry
  },
}
