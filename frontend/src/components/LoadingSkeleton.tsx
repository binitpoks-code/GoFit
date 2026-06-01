type LoadingSkeletonProps = {
  className?: string
}

function LoadingSkeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <div
      className={`h-full animate-pulse rounded-xl p-5 sm:p-6 ${className}`}
      style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}
      aria-label="Loading"
      aria-busy="true"
    >
      <div className="h-3 w-24 rounded" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="mt-4 h-7 w-32 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="mt-3 h-3 w-full rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="mt-2 h-3 w-2/3 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
    </div>
  )
}

export default LoadingSkeleton
