import React, { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { getErrorMessage } from '../utils/getErrorMessage'
import LoadingButton from '../components/LoadingButton'

function passwordStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: '', color: '', width: 'w-0' }
  const hasUpper = /[A-Z]/.test(pw)
  const hasNum = /[0-9]/.test(pw)
  const hasSpecial = /[^A-Za-z0-9]/.test(pw)
  const score = (pw.length >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpecial ? 1 : 0)
  if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' }
  if (score === 2) return { label: 'Fair', color: 'bg-amber-400', width: 'w-2/4' }
  if (score === 3) return { label: 'Good', color: 'bg-white', width: 'w-3/4' }
  return { label: 'Strong', color: 'bg-white', width: 'w-full' }
}

function RegisterPage() {
  const navigate = useNavigate()
  const { isAuthenticated, register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const strength = passwordStrength(password)

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      await register({ username, email, password })
      navigate('/profile', { replace: true })
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <h1 className="font-['DM_Serif_Display'] text-3xl text-white">Create your account</h1>
      <p className="mt-2 text-sm text-[#64748b]">Get started with GoFit — it takes 30 seconds.</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-[#94a3b8]">Username</span>
          <input
            autoComplete="username"
            className="mt-1.5 block w-full rounded-xl border border-white/8 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/10 placeholder:text-[rgba(255,255,255,0.2)]"
            name="username"
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourname"
            required
            type="text"
            value={username}
          />
        </label>

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
            autoComplete="new-password"
            className="mt-1.5 block w-full rounded-xl border border-white/8 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/10 placeholder:text-[rgba(255,255,255,0.2)]"
            minLength={8}
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required
            type="password"
            value={password}
          />
          {password.length > 0 && (
            <div className="mt-2">
              <div className="h-1 w-full rounded-full bg-white/8">
                <div className={`h-1 rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
              </div>
              <p className={`mt-1 text-xs font-medium ${strength.label === 'Weak' ? 'text-red-400' : strength.label === 'Strong' || strength.label === 'Good' ? 'text-white' : 'text-amber-400'}`}>
                {strength.label}
              </p>
            </div>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-[#94a3b8]">Confirm password</span>
          <input
            autoComplete="new-password"
            className="mt-1.5 block w-full rounded-xl border border-white/8 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/10 placeholder:text-[rgba(255,255,255,0.2)]"
            name="confirmPassword"
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            required
            type="password"
            value={confirmPassword}
          />
        </label>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <LoadingButton isLoading={isSubmitting} type="submit" className="w-full">
          Create account
        </LoadingButton>
      </form>

      <p className="mt-6 text-center text-sm text-[#64748b]">
        Already have an account?{' '}
        <Link className="font-medium text-[rgba(255,255,255,0.55)] hover:text-white" to="/login">
          Sign in
        </Link>
      </p>
    </>
  )
}

export default RegisterPage


