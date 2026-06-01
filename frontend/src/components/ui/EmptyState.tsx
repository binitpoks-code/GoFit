import type { ReactNode } from 'react'

type Props = {
  icon?: ReactNode
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction, actionHref }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
      <div
        className="rounded-xl p-8 max-w-sm w-full flex flex-col items-center"
        style={{ background: '#1a1d27', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {icon && (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl mb-5"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <span className="text-[#10b981]">{icon}</span>
          </div>
        )}
        <h2 className="font-['DM_Serif_Display'] text-2xl text-white">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-[#64748b]">{subtitle}</p>}
        {(actionLabel && (onAction || actionHref)) && (
          actionHref ? (
            <a
              href={actionHref}
              className="mt-6 inline-flex h-11 min-h-11 items-center rounded-xl px-6 text-sm font-semibold text-white transition-colors"
              style={{ background: '#10b981' }}
            >
              {actionLabel}
            </a>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="mt-6 inline-flex h-11 min-h-11 items-center rounded-xl px-6 text-sm font-semibold text-white transition-colors"
              style={{ background: '#10b981' }}
            >
              {actionLabel}
            </button>
          )
        )}
      </div>
    </div>
  )
}
