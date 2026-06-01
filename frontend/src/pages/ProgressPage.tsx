import { useEffect, useMemo, useRef, useState } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/apiClient'
import { useToast } from '../components/Toast'
import { profileService } from '../services/profileService'
import { progressService } from '../services/progressService'
import type { ProgressEntry, UserProfile } from '../types/coaching'
import { getErrorMessage } from '../utils/getErrorMessage'
import { fromKilograms, getStoredWeightUnit, toKilograms, type WeightUnit } from '../utils/weightUnits'

/* ─── Score helpers ─────────────────────────────────────────────── */
const ENERGY_MAP: Record<string, { emoji: string; label: string; sublabel: string; fatigue: string; score: number }> = {
  great:  { emoji: '🔥', label: 'Great',  sublabel: 'High energy',   fatigue: 'Low',      score: 35 },
  good:   { emoji: '💪', label: 'Good',   sublabel: 'Feeling okay',  fatigue: 'Low',      score: 25 },
  okay:   { emoji: '😐', label: 'Okay',   sublabel: 'Average',       fatigue: 'Moderate', score: 15 },
  tired:  { emoji: '😴', label: 'Tired',  sublabel: 'Low energy',    fatigue: 'High',     score: 5  },
}
const TRAINING_MAP: Record<string, { emoji: string; label: string; sublabel: string; performance: string; score: number }> = {
  crushed:   { emoji: '💪', label: 'Crushed it', sublabel: 'Strong session',   performance: 'Excellent', score: 35 },
  decent:    { emoji: '👍', label: 'Decent',     sublabel: 'Average session',  performance: 'Good',      score: 25 },
  struggled: { emoji: '😤', label: 'Struggled',  sublabel: 'Tough session',    performance: 'Poor',      score: 15 },
  rest:      { emoji: '😴', label: 'Rest day',   sublabel: 'No training',      performance: 'Rest',      score: 20 },
}
const SLEEP_MAP: Record<string, { emoji: string; label: string; sublabel: string; hours: number; score: number }> = {
  great:   { emoji: '🌙', label: 'Great',   sublabel: '7.5+ hours',  hours: 8.5, score: 30 },
  average: { emoji: '😐', label: 'Average', sublabel: '6–7 hours',   hours: 6.5, score: 20 },
  poor:    { emoji: '😫', label: 'Poor',    sublabel: 'Under 6hrs',  hours: 4.5, score: 10 },
}

type EditDraft = { energy: string; training: string; sleep: string; weight: string }

function reverseEnergy(fatigue: string): string {
  if (fatigue === 'High') return 'tired'
  if (fatigue === 'Moderate') return 'okay'
  return 'good'
}
function reverseTraining(performance: string): string {
  if (performance === 'Excellent') return 'crushed'
  if (performance === 'Poor') return 'struggled'
  if (performance === 'Rest') return 'rest'
  return 'decent'
}
function reverseSleep(hours: number): string {
  if (hours >= 7.5) return 'great'
  if (hours >= 6) return 'average'
  return 'poor'
}

function dailyScore(energy: string, training: string, sleep: string): number {
  return (ENERGY_MAP[energy]?.score ?? 0) + (TRAINING_MAP[training]?.score ?? 0) + (SLEEP_MAP[sleep]?.score ?? 0)
}

function scoreColor(score: number) {
  if (score >= 70) return '#10b981'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekDays(): { dateStr: string; label: string; short: string; dayNum: number }[] {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun … 6=Sat
  const mondayOffset = (dayOfWeek + 6) % 7 // days since last Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - mondayOffset + i)
    return {
      dateStr: localDateStr(d),
      label: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      short: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3).toUpperCase(),
      dayNum: d.getDate(),
    }
  })
}

function todayStr() {
  return localDateStr(new Date())
}

function entryDailyScore(entry: ProgressEntry): number {
  const rawScore = entry.recoveryScore
  if (rawScore && rawScore > 0) return rawScore
  return Math.round(Math.min(100, entry.sleepHours * 12))
}

/* ─── Calendar constants ─────────────────────────────────────────── */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/* ─── Calendar picker ────────────────────────────────────────────── */
function CalendarPicker({
  selectedDate,
  onSelect,
  loggedDates,
}: {
  selectedDate: string
  onSelect: (date: string) => void
  loggedDates: Set<string>
}) {
  const todayIso = localDateStr(new Date())
  const [viewYear, setViewYear] = useState(() => {
    const d = new Date((selectedDate || todayIso) + 'T00:00:00')
    return d.getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date((selectedDate || todayIso) + 'T00:00:00')
    return d.getMonth()
  })

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1)
  const offset = (firstDayOfMonth.getDay() + 6) % 7
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(viewYear, viewMonth, 1 - offset + i)
    return {
      iso: localDateStr(d),
      day: d.getDate(),
      inMonth: d.getMonth() === viewMonth,
    }
  })

  return (
    <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, maxWidth: 280 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-[rgba(255,255,255,0.55)] hover:text-white transition-colors"
          style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          ←
        </button>
        <span className="text-sm font-medium text-white">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-[rgba(255,255,255,0.55)] hover:text-white transition-colors"
          style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {'→'}
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((l) => (
          <div key={l} className="py-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.35)]">
            {l}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7">
        {cells.map(({ iso, day, inMonth }) => {
          const isToday = iso === todayIso
          const isSelected = iso === selectedDate
          const isLogged = loggedDates.has(iso)
          const isFuture = iso > todayIso

          return (
            <div key={iso} className="flex flex-col items-center py-0.5">
              <button
                type="button"
                onClick={() => onSelect(iso)}
                className={!isSelected ? 'hover:bg-[#141414]' : ''}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected ? '#ffffff' : 'transparent',
                  border: isToday && !isSelected ? '1px solid rgba(255,255,255,0.5)' : '1px solid transparent',
                  color: isSelected ? '#000000' : isToday ? '#ffffff' : isFuture ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.55)',
                  opacity: inMonth ? 1 : 0.3,
                  fontSize: 12,
                  fontWeight: isToday || isSelected ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
              >
                {day}
              </button>
              <div className="flex h-1.5 items-center justify-center">
                {isLogged && (
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: isSelected ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)',
                    }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Persistent override helpers ───────────────────────────────── */
const DELETED_KEY = 'gofit.deletedProgress'
const EDITED_KEY = 'gofit.editedProgress'

function readDeletedIds(): number[] {
  try { return JSON.parse(localStorage.getItem(DELETED_KEY) ?? '[]') as number[] } catch { return [] }
}
function addDeletedId(id: number) {
  const ids = readDeletedIds()
  if (!ids.includes(id)) localStorage.setItem(DELETED_KEY, JSON.stringify([...ids, id]))
}
function readEditedMap(): Record<string, Partial<ProgressEntry>> {
  try { return JSON.parse(localStorage.getItem(EDITED_KEY) ?? '{}') as Record<string, Partial<ProgressEntry>> } catch { return {} }
}
function storeEdit(id: number, data: Partial<ProgressEntry>) {
  const map = readEditedMap()
  localStorage.setItem(EDITED_KEY, JSON.stringify({ ...map, [String(id)]: { ...(map[String(id)] ?? {}), ...data } }))
}

/* ─── Emoji card ────────────────────────────────────────────────── */
function EmojiCard({
  emoji, label, sublabel, selected, onClick, compact,
}: { emoji: string; label: string; sublabel: string; selected: boolean; onClick: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-xl border cursor-pointer transition-all duration-150"
      style={{
        padding: compact ? '10px 8px' : '20px 8px',
        background: selected ? 'rgba(255,255,255,0.08)' : '#0f0f0f',
        borderColor: selected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.08)',
        boxShadow: selected ? '0 0 0 1px rgba(255,255,255,0.2)' : 'none',
      }}
    >
      <span style={{ fontSize: compact ? 20 : 28, transform: selected ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.15s' }}>
        {emoji}
      </span>
      <span className="text-xs font-semibold" style={{ color: selected ? '#ffffff' : 'rgba(255,255,255,0.55)' }}>{label}</span>
      {!compact && sublabel && <span className="text-[11px]" style={{ color: '#64748b' }}>{sublabel}</span>}
    </button>
  )
}

/* ─── Week day card ─────────────────────────────────────────────── */
function WeekDayCard({
  label, dayNum, entry, isToday, isFuture, onClick,
}: {
  label: string; dayNum: number; dateStr?: string; entry: ProgressEntry | null; isToday: boolean; isFuture: boolean; onClick?: () => void
}) {
  if (isFuture) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex flex-col items-center gap-1 rounded-xl p-3 text-center transition-all hover:border-[#10b981]/30"
        style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)', minWidth: 72 }}
      >
        <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.35)]">{label}</span>
        <span className="text-[11px] text-[rgba(255,255,255,0.2)]">{dayNum}</span>
        <span className="text-[10px] font-medium text-[rgba(255,255,255,0.5)] mt-0.5">Log</span>
      </button>
    )
  }

  if (isToday && !entry) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex flex-col items-center gap-1 rounded-xl p-3 text-center transition-all"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '2px solid rgba(255,255,255,0.4)',
          minWidth: 72,
          boxShadow: '0 0 12px rgba(255,255,255,0.06)',
        }}
      >
        <span className="text-[10px] font-bold text-white">TODAY</span>
        <span className="text-[11px] text-white font-semibold">{dayNum}</span>
        <span className="text-[10px] text-[rgba(255,255,255,0.6)]">Log {'→'}</span>
      </button>
    )
  }

  if (entry) {
    const score = entryDailyScore(entry)
    const energy = entry.fatigueLevel.toLowerCase()
    const emoji = energy === 'low' ? '🔥' : energy === 'moderate' ? '😐' : '😴'
    return (
      <div
        className="flex flex-col items-center gap-1 rounded-xl p-3 text-center"
        style={{
          background: isToday ? 'rgba(16,185,129,0.05)' : '#0f0f0f',
          border: isToday ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
          minWidth: 72,
        }}
      >
        <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.35)]">{label}</span>
        <span className="text-[11px] text-[rgba(255,255,255,0.35)]">{dayNum}</span>
        <span style={{ fontSize: 16 }}>{emoji}</span>
        <span className="text-xs font-semibold" style={{ color: scoreColor(score) }}>{score}</span>
      </div>
    )
  }

  /* Past unlogged — show Log button */
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-xl p-3 text-center transition-all hover:border-[#10b981]/40"
      style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)', minWidth: 72 }}
    >
      <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.35)]">{label}</span>
      <span className="text-[11px] text-[rgba(255,255,255,0.35)]">{dayNum}</span>
      <span className="text-[10px] text-[rgba(255,255,255,0.2)] mt-0.5">Missed</span>
      <span className="text-[10px] font-medium text-[rgba(255,255,255,0.5)] mt-0.5">Log</span>
    </button>
  )
}

/* ─── Edit history card ──────────────────────────────────────────── */
function EditHistoryCard({
  entry, unit, draft, onDraftChange, onSave, onCancel, isSaving,
}: {
  entry: ProgressEntry; unit: WeightUnit
  draft: EditDraft; onDraftChange: (d: EditDraft) => void
  onSave: () => void; onCancel: () => void; isSaving: boolean
}) {
  const d = new Date(entry.date + 'T00:00:00')
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const displayWeight = entry.bodyWeight > 0 ? fromKilograms(entry.bodyWeight, unit).toFixed(1) : ''

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#10b981]">Editing Check-in</p>
      <span className="inline-block rounded bg-[#0a0a0a] px-3 py-1 text-sm text-[rgba(255,255,255,0.55)]">{dateLabel}</span>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-2">Energy</p>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(ENERGY_MAP).map(([key, opt]) => (
            <EmojiCard key={key} emoji={opt.emoji} label={opt.label} sublabel="" compact
              selected={draft.energy === key} onClick={() => onDraftChange({ ...draft, energy: draft.energy === key ? '' : key })} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-2">Training</p>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(TRAINING_MAP).map(([key, opt]) => (
            <EmojiCard key={key} emoji={opt.emoji} label={opt.label} sublabel="" compact
              selected={draft.training === key} onClick={() => onDraftChange({ ...draft, training: draft.training === key ? '' : key })} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-2">Sleep</p>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(SLEEP_MAP).map(([key, opt]) => (
            <EmojiCard key={key} emoji={opt.emoji} label={opt.label} sublabel="" compact
              selected={draft.sleep === key} onClick={() => onDraftChange({ ...draft, sleep: draft.sleep === key ? '' : key })} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">Weight <span className="normal-case font-normal">(optional)</span></p>
        <input type="number" min={1} step={0.1}
          placeholder={displayWeight || '0.0'}
          value={draft.weight}
          onChange={(e) => onDraftChange({ ...draft, weight: e.target.value })}
          className="w-full rounded-lg p-2.5 text-sm outline-none focus:border-[#10b981]"
          style={{ background: '#080808', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }} />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button type="button" onClick={onSave} disabled={isSaving}
          className="rounded-lg bg-white text-black text-sm font-medium px-4 py-2 hover:bg-white/90 transition-colors disabled:opacity-50">
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
        <button type="button" onClick={onCancel}
          className="text-sm text-[rgba(255,255,255,0.35)] hover:text-white transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

/* ─── History entry card ─────────────────────────────────────────── */
function HistoryCard({
  entry, unit, onEditStart, onDeleteStart, isDeleting, onDeleteConfirm, onDeleteCancel,
}: {
  entry: ProgressEntry; unit: WeightUnit
  onEditStart: () => void
  onDeleteStart: () => void
  isDeleting: boolean
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
}) {
  const score = entryDailyScore(entry)
  const energy = entry.fatigueLevel.toLowerCase()
  const energyEmoji = energy === 'low' ? '🔥' : energy === 'moderate' ? '😐' : '😴'
  const perfEmoji = entry.workoutPerformance.toLowerCase().includes('excellent') ? '💪'
    : entry.workoutPerformance.toLowerCase().includes('good') ? '👍'
    : entry.workoutPerformance.toLowerCase().includes('poor') ? '😤'
    : '😴'
  const sleepHrs = entry.sleepHours
  const sleepEmoji = sleepHrs >= 7.5 ? '🌙' : sleepHrs >= 6 ? '😐' : '😫'
  const d = new Date(entry.date + 'T00:00:00')
  const weight = entry.bodyWeight > 0 ? `${fromKilograms(entry.bodyWeight, unit).toFixed(1)}${unit}` : null
  const r = 14
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = scoreColor(score)

  if (isDeleting) {
    return (
      <div className="rounded-xl p-4" style={{ background: '#0f0f0f', border: '1px solid rgba(239,68,68,0.2)' }}>
        <p className="text-sm font-medium text-white mb-3">Delete this check-in?</p>
        <p className="text-xs text-[rgba(255,255,255,0.35)] mb-3">
          {d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onDeleteConfirm}
            className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-2 hover:bg-red-500/20 transition-colors">
            Yes, delete
          </button>
          <button type="button" onClick={onDeleteCancel}
            className="rounded-lg border px-4 py-2 text-sm text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.55)] transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 rounded-xl p-4" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="shrink-0 w-14">
        <p className="font-['DM_Serif_Display'] text-base text-white">
          {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
        <p className="text-xs text-[rgba(255,255,255,0.35)]">{d.toLocaleDateString('en-US', { weekday: 'short' })}</p>
      </div>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span style={{ fontSize: 20 }}>{energyEmoji}</span>
        <span style={{ fontSize: 20 }}>{perfEmoji}</span>
        <span style={{ fontSize: 20 }}>{sleepEmoji}</span>
        {weight && <span className="text-xs text-[rgba(255,255,255,0.35)] hidden sm:block">{weight}</span>}
      </div>
      <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0">
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" transform="rotate(-90 18 18)" />
        <text x="18" y="22" textAnchor="middle" fontSize="9" fontWeight="600" fill={color} fontFamily="Inter, sans-serif">{score}</text>
      </svg>
      <div className="flex gap-1 shrink-0">
        <button type="button" onClick={onEditStart}
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors text-[rgba(255,255,255,0.35)] hover:text-white hover:bg-white/8">
          <Pencil size={13} />
        </button>
        <button type="button" onClick={onDeleteStart}
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors text-[rgba(255,255,255,0.35)] hover:text-[#ef4444] hover:bg-red-500/10">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

/* ─── Info tooltip ───────────────────────────────────────────────── */
const InfoTooltip = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 6 }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          width: 16, height: 16,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.25)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: 'rgba(255,255,255,0.4)',
          cursor: 'default',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        i
      </span>
      {show && (
        <span style={{
          position: 'absolute',
          left: 24, top: -4,
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 12,
          color: 'rgba(255,255,255,0.7)',
          whiteSpace: 'nowrap',
          zIndex: 50,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
        }}>
          {text}
        </span>
      )}
    </span>
  )
}

/* ─── Main page ─────────────────────────────────────────────────── */
function ProgressPage() {
  const navigate = useNavigate()
  const { show: showToast } = useToast()
  const formRef = useRef<HTMLDivElement>(null)
  const [entries, setEntries] = useState<ProgressEntry[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [unit, setUnit] = useState<WeightUnit>(() => getStoredWeightUnit())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  /* Check-in form */
  const [checkInDate, setCheckInDate] = useState(todayStr())
  const [energy, setEnergy] = useState('')
  const [training, setTraining] = useState('')
  const [sleep, setSleep] = useState('')
  const [weight, setWeight] = useState('')

  /* Edit state — inline history list */
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<EditDraft>({ energy: '', training: '', sleep: '', weight: '' })
  const [isEditSaving, setIsEditSaving] = useState(false)

  /* Edit state — calendar date selection */
  const [editingExistingEntry, setEditingExistingEntry] = useState<ProgressEntry | null>(null)

  /* Delete state */
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [rawEntries, currentProfile] = await Promise.all([
          progressService.getProgressEntries(),
          profileService.getLatestProfile().catch(() => null),
        ])
        if (!mounted) return
        setProfile(currentProfile)
        const deletedIds = readDeletedIds()
        const editedMap = readEditedMap()
        const processed = rawEntries
          .filter((e) => !e.id || !deletedIds.includes(e.id))
          .map((e) => (e.id && editedMap[String(e.id)] ? { ...e, ...editedMap[String(e.id)] } : e))
        setEntries([...processed].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
        if (currentProfile) setUnit(getStoredWeightUnit())
      } catch {
        // silent — page still works without history
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const hasEmojiSelection = energy !== '' || training !== '' || sleep !== ''
  const hasWeight = weight !== '' && parseFloat(weight) > 0
  const canSubmit = hasEmojiSelection && hasWeight

  function clearForm() {
    setEnergy('')
    setTraining('')
    setSleep('')
    setWeight('')
    setCheckInDate(todayStr())
    setEditingExistingEntry(null)
  }

  const handleSubmit = async () => {
    if (!hasEmojiSelection || !hasWeight) return
    setIsSaving(true)
    try {
      const fatigueLevel = energy ? ENERGY_MAP[energy].fatigue : 'Moderate'
      const workoutPerformance = training ? TRAINING_MAP[training].performance : 'Good'
      const sleepHours = sleep ? SLEEP_MAP[sleep].hours : 7
      const bodyWeightKg = weight ? toKilograms(parseFloat(weight), unit) : (profile?.weight ?? 0)

      if (editingExistingEntry) {
        /* Update existing entry selected via calendar */
        const entryId = editingExistingEntry.id
        const updated: ProgressEntry = {
          ...editingExistingEntry,
          fatigueLevel,
          workoutPerformance,
          sleepHours,
          bodyWeight: bodyWeightKg,
          workoutCompleted: training !== 'rest',
        }
        setEntries((prev) => prev.map((e) => e.id === entryId ? updated : e))
        if (entryId) storeEdit(entryId, updated)
        clearForm()
        try {
          await apiClient.put(`/progress/${entryId}`, updated)
          showToast('Check-in updated ✓')
        } catch {
          showToast('Edit saved locally')
        }
      } else {
        /* Create new entry */
        const payload: ProgressEntry = {
          bodyWeight: bodyWeightKg,
          calories: 0,
          sleepHours,
          fatigueLevel,
          workoutPerformance,
          notes: '',
          date: checkInDate,
          userProfileId: profile?.id,
          workoutCompleted: training !== 'rest',
        }
        const saved = await progressService.createProgressEntry(payload)
        setEntries((prev) => [saved, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
        showToast('Check-in logged! ✓')
        clearForm()
      }
    } catch (e) {
      showToast(getErrorMessage(e), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  function startEdit(entry: ProgressEntry) {
    setEditingId(entry.id ?? null)
    setEditDraft({
      energy: reverseEnergy(entry.fatigueLevel),
      training: reverseTraining(entry.workoutPerformance),
      sleep: reverseSleep(entry.sleepHours),
      weight: entry.bodyWeight > 0 ? fromKilograms(entry.bodyWeight, unit).toFixed(1) : '',
    })
    setDeletingId(null)
  }

  async function saveEdit(entry: ProgressEntry) {
    setIsEditSaving(true)
    const updated: ProgressEntry = {
      ...entry,
      fatigueLevel: editDraft.energy ? ENERGY_MAP[editDraft.energy].fatigue : entry.fatigueLevel,
      workoutPerformance: editDraft.training ? TRAINING_MAP[editDraft.training].performance : entry.workoutPerformance,
      sleepHours: editDraft.sleep ? SLEEP_MAP[editDraft.sleep].hours : entry.sleepHours,
      bodyWeight: editDraft.weight ? toKilograms(parseFloat(editDraft.weight), unit) : entry.bodyWeight,
    }
    setEntries((prev) => prev.map((e) => e.id === entry.id ? updated : e))
    setEditingId(null)
    if (entry.id) storeEdit(entry.id, updated)
    try {
      await apiClient.put(`/progress/${entry.id}`, updated)
      showToast('Check-in updated ✓')
    } catch {
      showToast('Edit saved locally')
    } finally {
      setIsEditSaving(false)
    }
  }

  async function deleteEntry(id: number) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setDeletingId(null)
    addDeletedId(id)
    try {
      await apiClient.delete(`/progress/${id}`)
      showToast('Check-in deleted')
    } catch {
      showToast('Check-in removed')
    }
  }

  function logDay(dateStr: string) {
    setCheckInDate(dateStr)
    const existing = entries.find((e) => e.date === dateStr) ?? null
    if (existing) {
      setEditingExistingEntry(existing)
      setEnergy(reverseEnergy(existing.fatigueLevel))
      setTraining(reverseTraining(existing.workoutPerformance))
      setSleep(reverseSleep(existing.sleepHours))
      setWeight(existing.bodyWeight > 0 ? fromKilograms(existing.bodyWeight, unit).toFixed(1) : '')
    } else {
      setEditingExistingEntry(null)
      setEnergy('')
      setTraining('')
      setSleep('')
      setWeight('')
    }
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /* Week helpers — last 7 days (today-6 → today) */
  const weekDays = getWeekDays()
  const today = todayStr()
  const weekEntries = weekDays.map((d) => entries.find((e) => e.date === d.dateStr) ?? null)
  const currentCycleCount = entries.length % 7
  const isCycleComplete = currentCycleCount === 0 && entries.length >= 7

  /* Weight display */
  const lastEntry = entries.find((e) => e.bodyWeight > 0) ?? null
  const prevEntry = lastEntry ? entries.find((e) => e.bodyWeight > 0 && e.date < lastEntry.date) ?? null : null
  const lastWeight = lastEntry ? fromKilograms(lastEntry.bodyWeight, unit) : null
  const weightChange = lastEntry && prevEntry
    ? fromKilograms(lastEntry.bodyWeight, unit) - fromKilograms(prevEntry.bodyWeight, unit)
    : null
  const daysSinceLastWeight = lastEntry
    ? Math.round((new Date().getTime() - new Date(lastEntry.date + 'T00:00:00').getTime()) / 86400000)
    : null

  const historyEntries = entries.slice(0, 28)
  const loggedDates = useMemo(() => new Set(entries.map((e) => e.date)), [entries])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-[#0f0f0f]" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-['DM_Serif_Display'] text-2xl text-white">Daily Check-in</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[rgba(255,255,255,0.35)]">
          Log how you felt today in under 30 seconds. Your daily check-ins power your recovery score, coaching recommendations, and progress analytics.
        </p>
      </div>

      {/* Recovery button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/recovery')}
          className="w-full rounded-[10px] text-white font-semibold transition-colors"
          style={{ background: '#ffffff', color: '#000000', fontSize: 16, padding: '14px 20px' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.88)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
        >
          Check Recovery Status
        </button>
        <p className="mt-2 text-center text-xs text-[rgba(255,255,255,0.35)]">
          Log 7 check-ins to unlock your weekly recovery score
        </p>
      </div>

      {/* Cycle progress / completion banner */}
      {isCycleComplete ? (
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <p className="text-sm font-semibold text-white mb-1">🎉 Cycle complete! Your recovery score is ready to view.</p>
          <button type="button" onClick={() => navigate('/recovery')}
            className="text-sm font-medium text-[#10b981] hover:text-[#34d399] transition-colors">
            View Weekly Recovery {'→'}
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">Current Cycle</p>
            <p className="text-xs text-[rgba(255,255,255,0.35)]">{currentCycleCount} of 7 check-ins</p>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#141414' }}>
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${(currentCycleCount / 7) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Calendar date picker */}
      <CalendarPicker
        selectedDate={checkInDate}
        onSelect={logDay}
        loggedDates={loggedDates}
      />

      {/* Daily check-in form */}
      <div ref={formRef} className="rounded-xl p-5 sm:p-6" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Selected date display */}
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-2">Logging for</p>
          <div
            className="rounded-lg px-3 py-3"
            style={{ background: '#080808', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <span className="text-sm text-white">
              {new Date(checkInDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}
            </span>
          </div>
          {editingExistingEntry && (
            <div
              className="mt-2 flex items-center gap-1.5 rounded-lg px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#10b981]">
                Editing existing check-in
              </span>
            </div>
          )}
        </div>

        {/* Energy */}
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-3">
          How was today?<InfoTooltip text="Rate your overall energy and recovery today." />
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {Object.entries(ENERGY_MAP).map(([key, opt]) => (
            <EmojiCard key={key} emoji={opt.emoji} label={opt.label} sublabel={opt.sublabel}
              selected={energy === key} onClick={() => setEnergy(energy === key ? '' : key)} />
          ))}
        </div>

        {/* Training */}
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-3">
          Today's training<InfoTooltip text="Rate how the workout felt, not whether you completed it." />
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {Object.entries(TRAINING_MAP).map(([key, opt]) => (
            <EmojiCard key={key} emoji={opt.emoji} label={opt.label} sublabel={opt.sublabel}
              selected={training === key} onClick={() => setTraining(training === key ? '' : key)} />
          ))}
        </div>

        {/* Sleep */}
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-3">
          Sleep last night<InfoTooltip text="Sleep quality impacts your recovery score and readiness." />
        </p>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {Object.entries(SLEEP_MAP).map(([key, opt]) => (
            <EmojiCard key={key} emoji={opt.emoji} label={opt.label} sublabel={opt.sublabel}
              selected={sleep === key} onClick={() => setSleep(sleep === key ? '' : key)} />
          ))}
        </div>

        {/* Weight */}
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-3">
          Your weight today <span className="text-red-400">*</span><InfoTooltip text="Required for weight trend tracking in analytics." />
        </p>
        <div className="flex flex-col items-center gap-2 mb-5">
          <div className="relative w-full max-w-xs">
            <input
              type="number"
              min={1}
              step={0.1}
              placeholder="Required — e.g. 165"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full rounded-xl text-center font-semibold outline-none transition"
              style={{
                background: '#080808',
                border: hasEmojiSelection && !hasWeight ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                color: '#ffffff',
                fontSize: 32,
                padding: '16px 48px 16px 16px',
                borderRadius: 12,
              }}
            />
            <div className="absolute right-3 inset-y-0 flex items-center">
              <button
                type="button"
                className="text-xs font-semibold text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.55)] transition-colors"
                onClick={() => setUnit((u) => u === 'kg' ? 'lb' : 'kg')}
              >
                {unit}
              </button>
            </div>
          </div>
          {hasEmojiSelection && !hasWeight && (
            <p className="text-xs text-red-400">
              Please enter your body weight to complete your check-in
            </p>
          )}
          {lastWeight !== null && (
            <p className="text-xs" style={{ color: '#64748b' }}>
              Last logged: {lastWeight.toFixed(1)}{unit}
              {daysSinceLastWeight !== null && ` (${daysSinceLastWeight === 0 ? 'today' : `${daysSinceLastWeight} day${daysSinceLastWeight !== 1 ? 's' : ''} ago`})`}
              {weightChange !== null && weightChange !== 0 && (
                <span style={{ color: weightChange > 0 ? '#10b981' : '#f59e0b', marginLeft: 8 }}>
                  Change: {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}{unit} {weightChange > 0 ? '↑' : '↓'}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Preview score */}
        {hasEmojiSelection && (
          <div className="mb-4 text-center">
            <span className="text-sm text-[rgba(255,255,255,0.35)]">Today's score: </span>
            <span className="text-sm font-bold" style={{ color: scoreColor(dailyScore(energy, training, sleep)) }}>
              {dailyScore(energy, training, sleep)}/100
            </span>
          </div>
        )}

        {/* Submit + Clear */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isSaving}
            title={!canSubmit && !isSaving ? 'Complete all required fields' : undefined}
            className="flex-1 rounded-[10px] text-white font-semibold transition-all"
            style={{
              background: canSubmit ? '#ffffff' : '#141414',
              color: canSubmit ? '#000000' : 'rgba(255,255,255,0.35)',
              fontSize: 16,
              padding: '14px 20px',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {isSaving ? 'Saving…' : editingExistingEntry ? 'Update Check-in' : 'Log Check-in'}
          </button>
          <button
            type="button"
            onClick={clearForm}
            className="flex items-center gap-1.5 rounded-[10px] px-4 text-sm font-medium text-[rgba(255,255,255,0.35)] hover:text-white transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <X size={14} />Clear
          </button>
        </div>
      </div>

      {/* Week grid */}
      <div className="rounded-xl p-5 sm:p-6" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-1">This week</p>
        <p className="text-xs text-[rgba(255,255,255,0.35)] mb-4">
          Log 7 check-ins to unlock your cycle recovery score and coaching adjustment.
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {weekDays.map((day, i) => (
            <WeekDayCard
              key={day.dateStr}
              label={day.short}
              dayNum={day.dayNum}
              dateStr={day.dateStr}
              entry={weekEntries[i]}
              isToday={day.dateStr === today}
              isFuture={day.dateStr > today}
              onClick={() => logDay(day.dateStr)}
            />
          ))}
        </div>
      </div>

      {/* History */}
      {historyEntries.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.35)] mb-3">
            Recent check-ins
          </p>
          <div className="space-y-2">
            {historyEntries.map((entry) => {
              const entryId = entry.id ?? 0

              if (editingId === entryId && entryId !== 0) {
                return (
                  <EditHistoryCard
                    key={entryId}
                    entry={entry}
                    unit={unit}
                    draft={editDraft}
                    onDraftChange={setEditDraft}
                    onSave={() => saveEdit(entry)}
                    onCancel={() => setEditingId(null)}
                    isSaving={isEditSaving}
                  />
                )
              }

              return (
                <HistoryCard
                  key={entryId || entry.date}
                  entry={entry}
                  unit={unit}
                  onEditStart={() => startEdit(entry)}
                  onDeleteStart={() => { setDeletingId(entryId); setEditingId(null) }}
                  isDeleting={deletingId === entryId && entryId !== 0}
                  onDeleteConfirm={() => deleteEntry(entryId)}
                  onDeleteCancel={() => setDeletingId(null)}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressPage


