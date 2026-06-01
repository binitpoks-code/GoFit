import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
  icon?: ReactNode
}

function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-fade-in px-6 py-10">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl mb-5 text-white"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
        {icon ?? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <h2 className="font-['DM_Serif_Display'] text-2xl text-white">{title}</h2>
      <p className="mt-3 max-w-sm text-sm leading-6" style={{ color: 'rgba(255,255,255,0.35)' }}>{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export default EmptyState
