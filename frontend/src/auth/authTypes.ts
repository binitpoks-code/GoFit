export type AuthUser = {
  email: string
  username: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  username: string
  email: string
  password: string
}

export type AuthResponse = {
  token: string
  email: string
  username: string
  authenticated: boolean
}
