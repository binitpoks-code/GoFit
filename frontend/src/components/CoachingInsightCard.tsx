import type { ReactNode } from 'react'

type CoachingInsightCardProps = {
  title: string
  insight: string
  feedback?: string
  icon?: ReactNode
  tone?: 'default' | 'strong'
}

function CoachingInsightCard({ title, insight, feedback, icon, tone = 'default' }: CoachingInsightCardProps) {
  return (
    <div className="h-full rounded-xl p-5" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="mt-0.5 text-white">{icon}</div>
        ) : (
          <div
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
              tone === 'strong'
                ? 'bg-white'
                : 'bg-white'
            }`}
          />
        )}
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
            ADAPTIVE COACHING
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{title}</p>
          <p className="mt-2 text-sm leading-6" style={{ color: 'rgba(255,255,255,0.7)' }}>{insight}</p>
          {feedback ? <p className="mt-2 text-xs leading-5" style={{ color: 'rgba(255,255,255,0.4)' }}>{feedback}</p> : null}
        </div>
      </div>
    </div>
  )
}

export default CoachingInsightCard
