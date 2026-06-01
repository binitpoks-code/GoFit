import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart2,
  Brain,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Salad,
  Settings,
  Target,
  TrendingUp,
  X,
} from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import GoFitLogo from '../components/ui/GoFitLogo'

type NavSection = {
  label: string
  items: { to: string; icon: React.ReactNode; label: string }[]
}

const navSections: NavSection[] = [
  {
    label: '',
    items: [
      { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Overview' },
      { to: '/training', icon: <Dumbbell size={18} />, label: 'Training' },
      { to: '/progress', icon: <TrendingUp size={18} />, label: 'Progress' },
      { to: '/recovery', icon: <Moon size={18} />, label: 'Recovery' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/analytics', icon: <BarChart2 size={18} />, label: 'Analytics' },
      { to: '/coaching', icon: <Brain size={18} />, label: 'Coach AI' },
      { to: '/nutrition', icon: <Salad size={18} />, label: 'Nutrition' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/goals', icon: <Target size={18} />, label: 'Goals' },
      { to: '/settings', icon: <Settings size={18} />, label: 'Settings' },
    ],
  },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '?'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-full flex-col border-r" style={{ background: '#080808', borderColor: 'rgba(255,255,255,0.06)' }}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center">
          <GoFitLogo size="sm" variant="green-o" />
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 lg:hidden transition-colors"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.label || '_root'}>
            {section.label && (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={`${item.to}-${item.label}`}
                  to={item.to}
                  end
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
                      isActive
                        ? 'pl-2.5 font-medium'
                        : 'font-normal'
                    }`
                  }
                  style={({ isActive }) => isActive ? {
                    background: 'rgba(255,255,255,0.06)',
                    borderLeft: '2px solid #ffffff',
                    color: '#ffffff',
                  } : {
                    color: 'rgba(255,255,255,0.45)',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget
                    if (!el.getAttribute('aria-current')) {
                      el.style.background = 'rgba(255,255,255,0.04)'
                      el.style.color = 'rgba(255,255,255,0.8)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget
                    if (!el.getAttribute('aria-current')) {
                      el.style.background = ''
                      el.style.color = 'rgba(255,255,255,0.45)'
                    }
                  }}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User panel */}
      <div className="border-t p-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.username}</p>
            <p className="truncate text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Performance Plan</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
          style={{ color: 'rgba(255,255,255,0.45)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  )
}

function DashboardLayout() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: '#000000' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-60 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="lg:pl-60">
        {/* Top header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b px-6 backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.9)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              className="rounded-lg p-2 lg:hidden transition-colors"
              style={{ color: 'rgba(255,255,255,0.35)' }}
              onClick={() => setSidebarOpen(true)}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{formatDate()}</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {getGreeting()},{' '}
                <span className="font-semibold text-white">{user?.username}</span>
              </p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
