import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { apiClient } from '../api/apiClient'
import { profileService } from '../services/profileService'
import { progressService } from '../services/progressService'
import type { UserProfile } from '../types/coaching'
import { getErrorMessage } from '../utils/getErrorMessage'
import { getStoredWeightUnit, storeWeightUnit, type WeightUnit } from '../utils/weightUnits'
import LoadingButton from '../components/LoadingButton'
import { useToast } from '../components/Toast'

const PREF_KEY = 'gofit.prefs'
type Prefs = { dailyReminder: boolean; weeklySummary: boolean; coachAlerts: boolean }

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    return raw ? JSON.parse(raw) : { dailyReminder: true, weeklySummary: true, coachAlerts: true }
  } catch {
    return { dailyReminder: true, weeklySummary: true, coachAlerts: true }
  }
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 border-b border-white/6 last:border-0 cursor-pointer">
      <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 ${checked ? 'bg-white' : 'bg-white/10'}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full shadow ring-0 transition-all duration-200 ${checked ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white'}`}
        />
      </button>
    </label>
  )
}

const inputCls = "mt-1.5 block w-full rounded-xl border border-white/8 bg-[#0a0a0a] px-4 py-2.5 text-sm text-white outline-none focus:border-white/40 placeholder:text-[#475569]"

function SettingsPage() {
  const { show: showToast } = useToast()
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<UserProfile | null>(null)
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(() => getStoredWeightUnit())
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  /* Password change */
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    profileService.getLatestProfile()
      .then((p) => { setProfile(p); setProfileForm(p) })
      .catch(() => {})
      .finally(() => setIsLoadingProfile(false))
  }, [])

  const updatePref = (key: keyof Prefs, value: boolean) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    localStorage.setItem(PREF_KEY, JSON.stringify(next))
  }

  const handleUnitChange = (unit: WeightUnit) => {
    setWeightUnit(unit)
    storeWeightUnit(unit)
    showToast(`Weight unit set to ${unit}.`)
  }

  const handleSaveProfile = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!profileForm) return
    setIsSavingProfile(true)
    try {
      await profileService.saveProfile(profileForm)
      setProfile(profileForm)
      setIsEditingProfile(false)
      showToast('Profile updated.')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const entries = await progressService.getProgressEntries()
      const rows = [
        ['date', 'bodyWeight', 'calories', 'sleepHours', 'fatigueLevel', 'recoveryScore', 'workoutPerformance', 'notes'],
        ...entries.map((e) => [
          e.date, e.bodyWeight, e.calories, e.sleepHours,
          e.fatigueLevel, e.recoveryScore ?? '', e.workoutPerformance, e.notes ?? '',
        ]),
      ]
      const csv = rows.map((r) => r.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'gofit-progress.csv'
      a.click()
      URL.revokeObjectURL(url)
      showToast('Progress data exported.')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  const handleChangePassword = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setPwError('')
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.')
      return
    }
    setIsChangingPassword(true)
    try {
      await apiClient.put('/auth/change-password', { currentPassword, newPassword })
      showToast('Password updated ✓')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwError(getErrorMessage(err))
    } finally {
      setIsChangingPassword(false)
    }
  }

  const updateForm = (field: keyof UserProfile, value: string | number | boolean) =>
    setProfileForm((f) => f ? { ...f, [field]: value } : f)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-['DM_Serif_Display'] text-2xl text-white">Settings</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[rgba(255,255,255,0.35)] mb-6">
          Manage your account, update your training profile, and customize your GoFit experience. Saving profile changes immediately recalculates your coaching recommendations.
        </p>
      </div>

      {/* Section 1 — Account info */}
      <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-4">Account</p>
        <div className="flex items-center gap-4 mb-5">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            {user?.username ? user.username.slice(0, 2).toUpperCase() : '?'}
          </div>
          <div>
            <p className="text-base font-semibold text-white">{user?.username ?? '—'}</p>
            <p className="text-sm text-[rgba(255,255,255,0.35)]">{user?.email ?? '—'}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-t border-white/6 pt-3">
            <span className="text-sm text-[rgba(255,255,255,0.35)]">Username</span>
            <span className="text-sm font-medium text-white">{user?.username ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between border-t border-white/6 pt-3">
            <span className="text-sm text-[rgba(255,255,255,0.35)]">Email</span>
            <span className="text-sm font-medium text-white">{user?.email ?? '—'}</span>
          </div>
        </div>
        <div className="mt-5 border-t border-white/6 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-4">Change Password</p>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputCls}
              autoComplete="current-password"
            />
            <input
              type="password"
              placeholder="New password (min. 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
            {pwError && (
              <p className="text-xs text-red-400">{pwError}</p>
            )}
            <LoadingButton isLoading={isChangingPassword} loadingLabel="Saving…" type="submit">
              Update Password
            </LoadingButton>
          </form>
        </div>
      </div>

      {/* Section 2 — Training profile */}
      <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">Training Profile</p>
          {!isEditingProfile && (
            <button
              type="button"
              onClick={() => { setProfileForm(profile); setIsEditingProfile(true) }}
              className="text-sm font-medium text-[#10b981] hover:text-[#34d399] transition-colors"
            >
              Edit profile
            </button>
          )}
        </div>

        {isLoadingProfile ? (
          <div className="h-16 animate-pulse rounded-xl bg-white/6" />
        ) : !profile ? (
          <p className="text-sm text-[rgba(255,255,255,0.35)] italic">No profile set up yet.</p>
        ) : !isEditingProfile ? (
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            {[
              ['Name', profile.name], ['Age', profile.age], ['Goal', profile.goal],
              ['Experience', profile.experienceLevel], ['Training days', profile.trainingDaysAvailable],
              ['Recovery quality', profile.recoveryQuality], ['Fatigue tolerance', profile.fatigueTolerance],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex justify-between border-b border-white/6 pb-2">
                <span className="text-[rgba(255,255,255,0.35)]">{label}</span>
                <span className="font-medium text-white">{val}</span>
              </div>
            ))}
          </div>
        ) : profileForm ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                ['name', 'Name', 'text'],
                ['age', 'Age', 'number'],
                ['height', 'Height (cm)', 'number'],
                ['weight', 'Weight', 'number'],
                ['bodyFatPercentage', 'Body Fat %', 'number'],
                ['currentCalories', 'Daily Calories', 'number'],
                ['trainingDaysAvailable', 'Training Days', 'number'],
              ] as [keyof UserProfile, string, string][]).map(([field, label, type]) => (
                <label key={field} className="block">
                  <span className="text-sm font-medium text-[rgba(255,255,255,0.55)]">{label}</span>
                  <input
                    type={type}
                    className={inputCls}
                    value={String(profileForm[field] ?? '')}
                    onChange={(e) => updateForm(field, type === 'number' ? Number(e.target.value) : e.target.value)}
                  />
                </label>
              ))}

              <label className="block">
                <span className="text-sm font-medium text-[rgba(255,255,255,0.55)]">Goal</span>
                <select className={`${inputCls} bg-[#0a0a0a]`} value={profileForm.goal} onChange={(e) => updateForm('goal', e.target.value)}>
                  {['Cut', 'Hypertrophy', 'Bulk', 'Maintenance'].map((g) => <option key={g}>{g}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[rgba(255,255,255,0.55)]">Experience level</span>
                <select className={`${inputCls} bg-[#0a0a0a]`} value={profileForm.experienceLevel} onChange={(e) => updateForm('experienceLevel', e.target.value)}>
                  {['Beginner', 'Intermediate', 'Advanced'].map((l) => <option key={l}>{l}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[rgba(255,255,255,0.55)]">Recovery quality</span>
                <select className={`${inputCls} bg-[#0a0a0a]`} value={profileForm.recoveryQuality} onChange={(e) => updateForm('recoveryQuality', e.target.value)}>
                  {['Low', 'Moderate', 'High', 'Poor', 'Good'].map((q) => <option key={q}>{q}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[rgba(255,255,255,0.55)]">Fatigue tolerance</span>
                <select className={`${inputCls} bg-[#0a0a0a]`} value={profileForm.fatigueTolerance} onChange={(e) => updateForm('fatigueTolerance', e.target.value)}>
                  {['Low', 'Moderate', 'High'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <LoadingButton isLoading={isSavingProfile} loadingLabel="Saving…" type="submit">Save profile</LoadingButton>
              <button type="button" onClick={() => setIsEditingProfile(false)} className="rounded-xl border border-white/8 px-4 py-2.5 text-sm font-medium text-[rgba(255,255,255,0.55)] hover:bg-white/4">
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {/* Section 3 — Preferences */}
      <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-4">Preferences</p>

        <div className="space-y-5 mb-5">
          <div>
            <p className="text-sm font-medium text-[rgba(255,255,255,0.55)] mb-2">Weight unit</p>
            <div className="flex rounded-xl border border-white/8 bg-[#0a0a0a] p-1 gap-1 w-40">
              {(['lb', 'kg'] as WeightUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => handleUnitChange(u)}
                  className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-all ${weightUnit === u ? 'bg-[#141414] text-white border border-white/8' : 'text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.55)]'}`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-[rgba(255,255,255,0.55)] mb-2">Notifications</p>
          <Toggle checked={prefs.dailyReminder} onChange={(v) => updatePref('dailyReminder', v)} label="Daily check-in reminder" />
          <Toggle checked={prefs.weeklySummary} onChange={(v) => updatePref('weeklySummary', v)} label="Weekly summary" />
          <Toggle checked={prefs.coachAlerts} onChange={(v) => updatePref('coachAlerts', v)} label="Coach alerts" />
        </div>
      </div>

      {/* Section 4 — Data */}
      <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-4">Data</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[rgba(255,255,255,0.55)]">Export progress data</p>
            <p className="text-xs text-[rgba(255,255,255,0.35)] mt-0.5">Download all check-ins as a CSV file.</p>
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            className="shrink-0 rounded-xl border border-white/8 bg-[#0f0f0f] px-4 py-2.5 text-sm font-medium text-[rgba(255,255,255,0.55)] hover:bg-white/4 transition-colors"
          >
            Export CSV
          </button>
        </div>

        <div className="mt-5 border-t border-white/6 pt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-red-400">Delete account</p>
            <p className="text-xs text-[rgba(255,255,255,0.35)] mt-0.5">Permanently remove your account and all data.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="shrink-0 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500 hover:text-white transition-colors"
          >
            Delete account
          </button>
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/8 bg-[#0f0f0f] p-6 shadow-2xl">
            <h3 className="font-['DM_Serif_Display'] text-xl text-white">Delete account</h3>
            <p className="mt-2 text-sm text-[rgba(255,255,255,0.55)]">
              To delete your account, please contact support. We don't yet support self-service deletion.
            </p>
            <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">
              Contact <strong>support@gofit.app</strong> to request account deletion.
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-white/8 px-4 py-2.5 text-sm font-medium text-[rgba(255,255,255,0.55)] hover:bg-white/4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage

