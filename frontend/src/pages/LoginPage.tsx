import React, { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { getErrorMessage } from '../utils/getErrorMessage'
import LoadingButton from '../components/LoadingButton'

function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login({ email, password })
      navigate('/dashboard', { replace: true })
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <h1 className="font-['DM_Serif_Display'] text-3xl text-white">Welcome back</h1>
      <p className="mt-2 text-sm text-[#64748b]">Sign in to your GoFit account</p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-[#94a3b8]">Email</span>
          <input
            autoComplete="email"
            className="mt-1.5 block w-full rounded-xl border border-white/8 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/10 placeholder:text-[rgba(255,255,255,0.2)]"
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-[#94a3b8]">Password</span>
          <input
            autoComplete="current-password"
            className="mt-1.5 block w-full rounded-xl border border-white/8 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/10 placeholder:text-[rgba(255,255,255,0.2)]"
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            type="password"
            value={password}
          />
        </label>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <LoadingButton isLoading={isSubmitting} type="submit" className="w-full">
          Sign in
        </LoadingButton>
      </form>

      <p className="mt-6 text-center text-sm text-[#64748b]">
        Don't have an account?{' '}
        <Link className="font-medium text-[rgba(255,255,255,0.55)] hover:text-white" to="/register">
          Create one
        </Link>
      </p>
    </>
  )
}

export default LoginPage


