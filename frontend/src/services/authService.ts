import { apiClient } from '../api/apiClient'
import type { AuthResponse, LoginRequest, RegisterRequest } from '../auth/authTypes'

export const authService = {
  async login(payload: LoginRequest) {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload)
    return response.data
  },

  async register(payload: RegisterRequest) {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload)
    return response.data
  },
}
