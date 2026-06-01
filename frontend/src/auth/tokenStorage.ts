import type { AuthResponse, AuthUser } from './authTypes'

const TOKEN_KEY = 'gofit.jwt'
const USER_KEY = 'gofit.user'

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  const rawUser = localStorage.getItem(USER_KEY)

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser) as AuthUser
  } catch {
    clearStoredAuth()
    return null
  }
}

export function storeAuthSession(response: AuthResponse) {
  const user: AuthUser = {
    email: response.email,
    username: response.username,
  }

  localStorage.setItem(TOKEN_KEY, response.token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))

  return user
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem('gofit.coaching')
  localStorage.removeItem('gofit.target')
  localStorage.removeItem('gofit.split')
}
