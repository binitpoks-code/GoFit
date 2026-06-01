import { apiClient } from '../api/apiClient'

export const coachingService = {
  async getTestingScenario(path: string) {
    const response = await apiClient.get(`/testing/${path}`)
    return response.data
  },
}
