import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean
  loadingLabel?: string
  variant?: 'primary' | 'secondary' | 'danger'
}

function LoadingButton({
  children,
  isLoading = false,
  loadingLabel = 'Loading...',
  variant = 'primary',
  className = '',
  disabled,
  ...buttonProps
}: PropsWithChildren<LoadingButtonProps>) {
  const base =
    'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-white text-black hover:bg-[rgba(255,255,255,0.88)] focus:ring-white/40 disabled:bg-white/10 disabled:text-white/30',
    secondary:
      'bg-transparent text-[rgba(255,255,255,0.7)] border border-[rgba(255,255,255,0.15)] hover:border-[rgba(255,255,255,0.3)] hover:text-white focus:ring-white/20 disabled:opacity-40',
    danger:
      'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white focus:ring-red-500/30 disabled:opacity-50',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...buttonProps}
    >
      {isLoading ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  )
}

export default LoadingButton
