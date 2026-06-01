import { Outlet } from 'react-router-dom'
import GoFitLogo from '../components/ui/GoFitLogo'

function AppLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-[#0a0a0a] p-12 border-r border-white/6">
        <div>
          <div className="flex items-center gap-2">
            <GoFitLogo size="lg" variant="green-o" />
          </div>
          <p className="mt-6 text-base text-[rgba(255,255,255,0.45)]">Adaptive performance coaching.</p>
          <div className="mt-10 flex flex-col gap-3">
            {[
              'Recovery-aware training guidance',
              'Intelligent nutrition recommendations',
              'Adaptive progression coaching',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                <span className="text-sm text-[rgba(255,255,255,0.45)]">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-[rgba(255,255,255,0.2)]">Powered by GoFit Engine</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-[#000000] p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <GoFitLogo size="md" variant="green-o" />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AppLayout
