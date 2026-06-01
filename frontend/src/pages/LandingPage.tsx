import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, CheckCircle, ChevronDown, Dumbbell, Menu, TrendingUp, User, X } from 'lucide-react'
import GoFitLogo from '../components/ui/GoFitLogo'

const LANDING_CSS = `
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes float {
  0%,100% { transform: translateY(0px); }
  50%     { transform: translateY(-10px); }
}
@keyframes bounceDot {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(6px); }
}
.hero-badge  { animation: fadeSlideUp 0.6s ease 0s    both; }
.hero-line-1 { animation: fadeSlideUp 0.6s ease 0s    both; }
.hero-line-2 { animation: fadeSlideUp 0.6s ease 0.15s both; }
.hero-line-3 { animation: fadeSlideUp 0.6s ease 0.3s  both; }
.hero-sub    { animation: fadeSlideUp 0.6s ease 0.5s  both; }
.hero-cta    { animation: fadeSlideUp 0.6s ease 0.7s  both; }
.hero-card   { animation: fadeSlideUp 0.6s ease 0.9s both, float 4s ease-in-out 1.5s infinite; }
.scroll-bounce { animation: bounceDot 2s ease infinite; }

[data-animate]         { opacity: 0; transform: translateY(30px); transition: opacity 0.5s ease, transform 0.5s ease; }
[data-animate].visible { opacity: 1; transform: translateY(0); }
.stagger-1 { transition-delay: 0s; }
.stagger-2 { transition-delay: 0.12s; }
.stagger-3 { transition-delay: 0.24s; }

@media (max-width: 767px) {
  .nav-links     { display: none !important; }
  .nav-hamburger { display: flex !important; }
  .hero-grid     { grid-template-columns: 1fr !important; }
  .hero-card-col { display: none !important; }
  .feature-row   { grid-template-columns: 1fr !important; direction: ltr !important; }
  .stats-grid    { grid-template-columns: 1fr !important; gap: 40px !important; }
}
@media (min-width: 768px) {
  .nav-hamburger { display: none !important; }
}
`

function NavBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 14, padding: '8px 16px', borderRadius: 6, transition: 'color 150ms' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
    >
      {label}
    </button>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [statsVisible, setStatsVisible] = useState(false)
  const [count1, setCount1] = useState(0)
  const [count2, setCount2] = useState(0)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll('[data-animate]')
    const obs = new IntersectionObserver(
      entries =>
        entries.forEach(e => {
          if (e.isIntersecting) {
            ;(e.target as HTMLElement).classList.add('visible')
            obs.unobserve(e.target)
          }
        }),
      { threshold: 0.15 },
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) setStatsVisible(true) },
      { threshold: 0.3 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!statsVisible) return
    const steps = 60
    const interval = 1200 / steps
    let step = 0
    const t = setInterval(() => {
      step++
      setCount1(Math.round((step / steps) * 15))
      setCount2(Math.round((step / steps) * 8))
      if (step >= steps) clearInterval(t)
    }, interval)
    return () => clearInterval(t)
  }, [statsVisible])

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const features: Array<{ pill: string; title: string; desc: string; visual: ReactNode }> = [
    {
      pill: 'Recovery',
      title: 'Recovery Intelligence',
      desc: 'Daily check-ins take 30 seconds. After 7 days your weekly recovery score unlocks, adjusting training intensity automatically.',
      visual: (
        <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>WEEKLY RECOVERY</p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <svg width={80} height={80} viewBox="0 0 80 80">
              <circle cx={40} cy={40} r={30} fill="none" stroke="#1a1a1a" strokeWidth={6} />
              <circle cx={40} cy={40} r={30} fill="none" stroke="#10b981" strokeWidth={6}
                strokeDasharray="188.5 188.5" strokeDashoffset="32" strokeLinecap="round"
                transform="rotate(-90 40 40)" />
              <text x={40} y={38} textAnchor="middle" fill="#ffffff" fontSize={22} fontFamily="'DM Serif Display', serif">83</text>
              <text x={40} y={52} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={11}>/100</text>
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: i < 5 ? '#10b981' : '#1a1a1a', margin: '0 auto 4px' }} />
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      pill: 'Training',
      title: 'Adaptive Training Programs',
      desc: '8 science-based splits matched to your goal, schedule, and experience. Your program adapts as your data comes in each week.',
      visual: (
        <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>RECOMMENDED SPLITS</p>
          {[
            { name: 'Push / Pull / Legs', days: '3–5 days', match: '96%' },
            { name: 'Upper / Lower', days: '4 days', match: '91%' },
            { name: 'Full Body', days: '3 days', match: '84%' },
          ].map((split, i) => (
            <div key={split.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div>
                <p style={{ fontSize: 13, color: '#ffffff', margin: 0 }}>{split.name}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{split.days}</p>
              </div>
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 500 }}>{split.match}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      pill: 'Strength',
      title: '1RM & Overload Planning',
      desc: 'Calculate your one-rep max and generate a week-by-week progression plan to any goal weight — with automatic deload weeks included.',
      visual: (
        <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>PROGRESSION PLAN</p>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', paddingBottom: 8, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>Week</th>
                <th style={{ textAlign: 'left', paddingBottom: 8, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>Weight</th>
                <th style={{ textAlign: 'left', paddingBottom: 8, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {[
                { week: 1, weight: '135 lb', type: 'Training', deload: false },
                { week: 2, weight: '137.5 lb', type: 'Training', deload: false },
                { week: 3, weight: '140 lb', type: 'Training', deload: false },
                { week: 4, weight: '84 lb', type: 'DELOAD', deload: true },
                { week: 5, weight: '142.5 lb', type: 'Training', deload: false },
              ].map(row => (
                <tr key={row.week} style={{ background: row.deload ? 'rgba(245,158,11,0.05)' : 'transparent' }}>
                  <td style={{ padding: '6px 0', color: 'rgba(255,255,255,0.5)' }}>{row.week}</td>
                  <td style={{ padding: '6px 0', color: '#ffffff' }}>{row.weight}</td>
                  <td style={{ padding: '6px 0', color: row.deload ? '#f59e0b' : '#10b981', fontSize: 11 }}>{row.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      pill: 'Nutrition',
      title: 'Precision Calorie Targets',
      desc: 'Your daily calories are calculated using the Mifflin-St Jeor formula based on your exact metrics and goal. Updates automatically.',
      visual: (
        <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>TODAY'S TARGETS</p>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 48, color: '#10b981', lineHeight: 1 }}>2,847</div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>calories / day</p>
          </div>
          {[
            { label: 'Protein', value: '185g', pct: 70 },
            { label: 'Carbs', value: '320g', pct: 85 },
            { label: 'Fat', value: '78g', pct: 50 },
          ].map(m => (
            <div key={m.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{m.label}</span>
                <span style={{ fontSize: 12, color: '#ffffff' }}>{m.value}</span>
              </div>
              <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${m.pct}%`, background: '#10b981', borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      pill: 'Analytics',
      title: 'Coaching Analytics',
      desc: "Every chart includes a plain-language coaching note. No raw numbers to interpret — GoFit tells you what your data means and what to do.",
      visual: (
        <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>STRENGTH PROGRESS</p>
          <svg viewBox="0 0 200 80" style={{ width: '100%', marginBottom: 12 }}>
            <polyline points="10,65 50,52 90,42 130,30 170,18" fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {[{ x: 10, y: 65 }, { x: 50, y: 52 }, { x: 90, y: 42 }, { x: 130, y: 30 }, { x: 170, y: 18 }].map((pt, i) => (
              <circle key={i} cx={pt.x} cy={pt.y} r={3} fill="#10b981" />
            ))}
          </svg>
          <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: 8, padding: '10px 14px' }}>
            <p style={{ fontSize: 12, color: '#10b981', fontWeight: 500, margin: 0 }}>Coaching note</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', lineHeight: 1.5 }}>Consistent upward trend. Maintain current progression — deload in 2 weeks.</p>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#000000', color: '#ffffff', overflowX: 'hidden' }}>
      <style>{LANDING_CSS}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 64,
        background: scrolled ? 'rgba(0,0,0,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
        transition: 'background 300ms, backdrop-filter 300ms, border-color 300ms',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0 }}
          >
            <GoFitLogo size="md" variant="green-o" />
          </button>

          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <NavBtn label="How It Works" onClick={() => scrollTo('how-it-works')} />
            <NavBtn label="Why GoFit" onClick={() => scrollTo('why-gofit')} />
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', margin: '0 16px' }} />
            <button
              onClick={() => navigate('/register')}
              style={{ background: '#ffffff', color: '#000000', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '8px 20px', borderRadius: 8, transition: 'background 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.85)')}
              onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
            >
              Join Now
            </button>
          </div>

          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: 4, display: 'flex', alignItems: 'center' }}
          >
            <Menu size={22} />
          </button>
        </div>
      </nav>

      {/* ── MOBILE OVERLAY ── */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000000', display: 'flex', flexDirection: 'column', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
            <GoFitLogo size="sm" variant="green-o" />
            <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
              <X size={24} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'How It Works', id: 'how-it-works' },
              { label: 'Why GoFit', id: 'why-gofit' },
            ].map((item, i) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffffff', fontSize: 20, padding: '12px 0', textAlign: 'left', animation: 'fadeSlideUp 0.4s ease forwards', animationDelay: `${i * 0.08}s`, opacity: 0 }}
              >
                {item.label}
              </button>
            ))}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '16px 0' }} />
            <button
              onClick={() => { setMenuOpen(false); navigate('/register') }}
              style={{ background: '#ffffff', color: '#000000', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, padding: '14px 24px', borderRadius: 10, textAlign: 'center', animation: 'fadeSlideUp 0.4s ease forwards', animationDelay: '0.16s', opacity: 0 }}
            >
              Join GoFit {'→'}
            </button>
          </div>
        </div>
      )}

      {/* ── SECTION 1: HERO ── */}
      <section style={{ minHeight: '100vh', background: '#000000', display: 'flex', alignItems: 'center', overflow: 'hidden', position: 'relative', paddingTop: 64 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 800px 600px at 80% 60%, rgba(255,255,255,0.025) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="hero-grid" style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: '80px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div style={{ maxWidth: 580 }}>
            <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 100, padding: '6px 16px', marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffffff', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 500, letterSpacing: '0.05em' }}>Adaptive Performance Coaching</span>
            </div>

            <div className="hero-badge" style={{ marginBottom: 32 }}>
              <GoFitLogo size="lg" variant="green-o" />
            </div>

            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(44px, 5vw, 68px)', color: '#ffffff', lineHeight: 1.05, letterSpacing: '-1px' }}>
              <div className="hero-line-1">Train smarter.</div>
              <div className="hero-line-2">Recover better.</div>
              <div className="hero-line-3">Progress consistently.</div>
            </div>

            <p className="hero-sub" style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, maxWidth: 460, marginTop: 20 }}>
              GoFit analyzes your recovery, training load, and nutrition to deliver personalized coaching that adapts every week to your actual data.
            </p>

            <div className="hero-cta" style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 32, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/register')}
                style={{ background: '#ffffff', color: '#000000', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, padding: '14px 28px', borderRadius: 12, transition: 'all 200ms' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                Join GoFit {'→'}
              </button>
              <button
                onClick={() => scrollTo('how-it-works')}
                style={{ background: 'transparent', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: 15, padding: '14px 28px', borderRadius: 12, transition: 'color 200ms, border-color 200ms' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; (e.currentTarget.style as CSSStyleDeclaration).borderColor = 'rgba(255,255,255,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; (e.currentTarget.style as CSSStyleDeclaration).borderColor = 'rgba(255,255,255,0.15)' }}
              >
                See how it works
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 12 }}>No equipment required {'·'} Works for any goal</p>
          </div>

          <div className="hero-card-col" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="hero-card" style={{ maxWidth: 360, width: '100%', background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 24, boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 40px 80px rgba(0,0,0,0.8)' }}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>RECOVERY SCORE</p>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
                <svg width={80} height={80} viewBox="0 0 80 80">
                  <circle cx={40} cy={40} r={30} fill="none" stroke="#1a1a1a" strokeWidth={6} />
                  <circle cx={40} cy={40} r={30} fill="none" stroke="#10b981" strokeWidth={6}
                    strokeDasharray="188.5 188.5" strokeDashoffset="32" strokeLinecap="round"
                    transform="rotate(-90 40 40)" />
                  <text x={40} y={38} textAnchor="middle" fill="#ffffff" fontSize={22} fontFamily="'DM Serif Display', serif">83</text>
                  <text x={40} y={52} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={11}>/100</text>
                </svg>
                <p style={{ fontSize: 12, color: '#10b981', marginTop: 8 }}>Excellent — push hard today</p>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '16px 0' }} />
              {[
                { label: 'Training Readiness', value: 'HIGH' },
                { label: "Today's Split", value: 'Push Day' },
                { label: 'Calorie Target', value: '2,847 kcal' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
                  <span style={{ fontSize: 12, color: '#ffffff', fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="scroll-bounce" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <ChevronDown size={20} color="rgba(255,255,255,0.3)" />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Scroll</span>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: WHY GOFIT ── */}
      <section id="why-gofit" style={{ background: '#060606', padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>WHY GOFIT</p>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(36px, 5vw, 52px)', color: '#ffffff' }}>Most apps track your data.</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(36px, 5vw, 52px)', color: '#ffffff', fontStyle: 'italic' }}>GoFit understands it.</div>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', textAlign: 'center', maxWidth: 500, margin: '20px auto 0', lineHeight: 1.65 }}>
              There's a difference between logging workouts and actually knowing if you should train hard today.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {[
              {
                title: 'Generic Recommendations',
                text: 'Every user gets the same advice regardless of how they slept, how hard last week was, or how their body is actually recovering.',
                solution: 'We personalize every recommendation based on your sleep, recovery, and training load.',
              },
              {
                title: 'Data Without Context',
                text: 'Raw numbers mean nothing without interpretation. Most apps show you charts but never tell you what to actually do differently.',
                solution: 'We turn your data into clear, actionable insights so you know exactly what to do next.',
              },
              {
                title: 'No Recovery Intelligence',
                text: "Training hard when your body needs rest leads to stagnation. Without recovery tracking, you're just guessing every single session.",
                solution: 'We track your recovery in real time so you know when to push hard and when to rest.',
              },
            ].map((card, i) => (
              <div key={card.title} data-animate className={`stagger-${i + 1}`}
                style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 28 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} color="#ef4444" />
                </div>
                <h3 style={{ fontSize: 16, color: '#ffffff', fontWeight: 500, margin: '16px 0 0' }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginTop: 8 }}>{card.text}</p>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '16px 0' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    <CheckCircle size={16} color="#10b981" />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 13, color: '#10b981', fontWeight: 600 }}>GoFit does better</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{card.solution}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div data-animate style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '24px 32px', marginTop: 48, textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Check size={18} color="#ffffff" />
            </div>
            <p style={{ fontSize: 18, color: '#ffffff', fontWeight: 500, margin: 0 }}>GoFit fixes all of this — automatically, every week.</p>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: '#000000', padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>HOW IT WORKS</p>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(36px, 5vw, 52px)', color: '#ffffff' }}>Up and running in minutes.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              { num: '01', Icon: User, title: 'Set Up Your Profile', desc: 'Enter your body metrics, goal, experience level, and training days. GoFit calculates your TDEE and builds your coaching baseline.' },
              { num: '02', Icon: Dumbbell, title: 'Choose Your Program', desc: 'GoFit recommends 2–3 training splits matched to your goal and schedule. Pick one and your full program is ready instantly.' },
              { num: '03', Icon: TrendingUp, title: 'Check In Weekly', desc: 'Log sleep, energy, and training quality in 30 seconds each day. After 7 check-ins, your weekly recovery score unlocks and coaching adjusts.' },
            ].map((step, i) => (
              <div key={step.num} data-animate className={`stagger-${i + 1}`}
                style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 32, textAlign: 'center' }}>
                <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 100, padding: '4px 16px' }}>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#ffffff' }}>{step.num}</span>
                </div>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                  <step.Icon size={32} color="rgba(255,255,255,0.75)" />
                </div>
                <h3 style={{ fontSize: 18, color: '#ffffff', fontWeight: 500, margin: '16px 0 0' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginTop: 8 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: KEY FEATURES ── */}
      <section style={{ background: '#060606', padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>WHAT YOU GET</p>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(36px, 5vw, 52px)', color: '#ffffff' }}>Everything you need.</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(36px, 5vw, 52px)', color: '#ffffff', fontStyle: 'italic' }}>Nothing you don't.</div>
          </div>

          {features.map((f, i) => (
            <div
              key={f.title}
              data-animate
              className={`feature-row${i % 2 === 1 ? ' feature-row-even' : ''}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 64,
                alignItems: 'center',
                padding: '64px 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                direction: i % 2 === 1 ? 'rtl' : 'ltr',
              }}
            >
              <div style={{ direction: 'ltr' }}>
                <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 100, padding: '4px 12px', fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.pill}</span>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: '#ffffff', margin: '16px 0 0' }}>{f.title}</h3>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginTop: 16, maxWidth: 400 }}>{f.desc}</p>
              </div>
              <div style={{ direction: 'ltr' }}>{f.visual}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 5: STATS ── */}
      <section ref={statsRef} style={{ background: '#000000', padding: '80px 24px' }}>
        <div className="stats-grid" style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48, textAlign: 'center' }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 64, color: '#ffffff', lineHeight: 1 }}>{statsVisible ? `${count1}+` : '0+'}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Coaching Services</div>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 64, color: '#ffffff', lineHeight: 1 }}>{statsVisible ? count2 : 0}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Training Programs</div>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 64, color: '#ffffff', lineHeight: 1 }}>7-Day</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Recovery Cycles</div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: FINAL CTA ── */}
      <section style={{ background: '#060606', padding: '120px 24px', textAlign: 'center' }}>
        <div data-animate style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(36px, 5vw, 56px)', color: '#ffffff' }}>Ready to train smarter?</div>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', maxWidth: 460, margin: '20px auto 0', lineHeight: 1.65 }}>
            Join GoFit and get a complete adaptive coaching program built around your body, your goal, and your recovery.
          </p>
          <button
            onClick={() => navigate('/register')}
            style={{ display: 'inline-block', background: '#ffffff', color: '#000000', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 600, padding: '16px 40px', borderRadius: 12, marginTop: 40, transition: 'all 200ms' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Join GoFit →
          </button>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 16 }}>Free to get started {'·'} No card needed</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#000000', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <GoFitLogo size="sm" variant="green-o" />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© 2026 GoFit. Adaptive Fitness Intelligence.</span>
        </div>
      </footer>
    </div>
  )
}
