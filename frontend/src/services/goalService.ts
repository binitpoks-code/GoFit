import { apiClient } from '../api/apiClient'
import type { UserGoal } from '../types/goals'

export const GOALS_UPDATED_EVENT = 'gofit:goals-updated'

export function selectPrimaryGoal(goals: UserGoal[]) {
  return goals.find((goal) => goal.active) ?? goals[0] ?? null
}

function publishGoalsUpdated(goals: UserGoal[]) {
  window.dispatchEvent(new CustomEvent(GOALS_UPDATED_EVENT, { detail: goals }))
}

export const goalService = {
  async getGoals() {
    const response = await apiClient.get<UserGoal[]>('/goals')
    return response.data
  },

  async createGoal(payload: UserGoal) {
    const response = await apiClient.post<UserGoal>('/goals', payload)
    publishGoalsUpdated([response.data])
    return response.data
  },
}
