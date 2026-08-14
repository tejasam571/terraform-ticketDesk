import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Ticket, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Headset, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@tickette.com', password: 'Admin@123', icon: ShieldCheck, color: '#7C3AED' },
  { role: 'IT Desk', email: 'itdesk@tickette.com', password: 'ItDesk@123', icon: Headset, color: '#0EA5E9' },
  { role: 'User', email: 'user@tickette.com', password: 'User@123', icon: UserRound, color: '#F59E0B' },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(acc) {
    setEmail(acc.email)
    setPassword(acc.password)
  }

  return (
    <div className="min-h-screen flex bg-[#F6F5FB]">
      {/* Left visual panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 bg-grid-fade [background-size:22px_22px] opacity-20" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute bottom-0 -left-24 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow">
              <Ticket size={20} />
            </div>
            <span className="font-display font-bold text-xl">Tickette</span>
          </div>

          <div className="max-w-md animate-fade-up">
            <h1 className="font-display text-4xl font-bold leading-tight">
              Every issue,<br />tracked from raise to resolve.
            </h1>
            <p className="mt-4 text-white/60 leading-relaxed">
              Raise a ticket in seconds, watch the IT desk pick it up, and get a photo-verified
              resolution — all in one calm, well-organized queue.
            </p>

            <div className="mt-10 flex items-center gap-6">
              {[
                ['Open → Resolved', 'clear workflow'],
                ['Photo proof', 'on every fix'],
                ['3 roles', 'admin, desk, user'],
              ].map(([big, small]) => (
                <div key={big}>
                  <p className="font-display font-bold text-lg">{big}</p>
                  <p className="text-xs text-white/40 mt-0.5">{small}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/30">Tickette Help Desk · Proof-of-concept build</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-8">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow">
              <Ticket size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl">Tickette</span>
          </div>

          <h2 className="text-2xl font-bold font-display">Sign in</h2>
          <p className="text-ink/50 text-sm mt-1.5 mb-8">Use your Tickette account to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@tickette.com" className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
                <input
                  type={showPw ? 'text' : 'password'} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" className="input pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Signing in…' : 'Sign in'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-2.5">Try a demo account</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => fillDemo(acc)}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-black/10 bg-white py-3 hover:border-brand-300 hover:shadow-card transition-all"
                  >
                    <Icon size={16} style={{ color: acc.color }} />
                    <span className="text-[11px] font-semibold text-ink/70">{acc.role}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
