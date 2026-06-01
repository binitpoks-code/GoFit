import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import { clearStoredAuth, getStoredToken } from '../auth/tokenStorage'

const SESSION_EXPIRED_MSG = 'Session expired. Please login again.'

function redirectToLogin() {
  clearStoredAuth()
  window.location.href = '/login'
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL
  : '/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()

  if (token) {
    try {
      const decoded = jwtDecode<{ exp: number }>(token)
      if (decoded.exp * 1000 < Date.now()) {
        redirectToLogin()
        return Promise.reject(new Error(SESSION_EXPIRED_MSG))
      }
    } catch {
      redirectToLogin()
      return Promise.reject(new Error(SESSION_EXPIRED_MSG))
    }
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      if (status === 401 || status === 403) {
        redirectToLogin()
        return Promise.reject(new Error(SESSION_EXPIRED_MSG))
      }
    }
    return Promise.reject(error)
  },
)
