type Variant = 'success' | 'warning' | 'danger' | 'info' | 'muted'

const STYLES: Record<Variant, string> = {
  success: 'bg-[#10b981]/15 text-[#34d399]',
  warning: 'bg-amber-400/15 text-amber-300',
  danger: 'bg-red-500/15 text-red-400',
  info: 'bg-blue-500/15 text-blue-300',
  muted: 'bg-white/6 text-[#64748b]',
}

type Props = { status: string; variant?: Variant; className?: string }

export function StatusBadge({ status, variant = 'muted', className = '' }: Props) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[variant]} ${className}`}>
      {status}
    </span>
  )
}

export function readinessVariant(level: string): Variant {
  const l = level.toLowerCase()
  if (l.includes('high')) return 'success'
  if (l.includes('moderate') || l.includes('medium')) return 'warning'
  return 'danger'
}
