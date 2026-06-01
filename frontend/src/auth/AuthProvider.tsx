import {
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { authService } from '../services/authService'
import { profileService } from '../services/profileService'
import {
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  storeAuthSession,
} from './tokenStorage'
import { AuthContext } from './authContext'
import type { AuthUser, LoginRequest, RegisterRequest } from './authTypes'

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [token, setToken] = useState<string | null>(() => getStoredToken())

  const login = async (payload: LoginRequest) => {
    const response = await authService.login(payload)
    if (!response.authenticated || !response.token) {
      throw new Error('Authentication failed.')
    }

    const authenticatedUser = storeAuthSession(response)

    setUser(authenticatedUser)
    setToken(response.token)
  }

  const register = async (payload: RegisterRequest) => {
    const response = await authService.register(payload)
    if (!response.authenticated || !response.token) {
      throw new Error('Registration failed.')
    }

    const authenticatedUser = storeAuthSession(response)

    setUser(authenticatedUser)
    setToken(response.token)
  }

  const logout = () => {
    profileService.clearCachedProfile()
    clearStoredAuth()
    setUser(null)
    setToken(null)
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
    }),
    [token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
