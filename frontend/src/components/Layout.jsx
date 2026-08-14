import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, Ticket, PlusCircle, Users, Tags, LogOut,
  Menu, X, Headset, ChevronDown, KeyRound,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { RoleBadge } from './Badges'

const NAV = {
  admin: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tickets', label: 'All Tickets', icon: Ticket },
    { to: '/admin/users', label: 'Manage Users', icon: Users },
    { to: '/admin/ticket-types', label: 'Ticket Types', icon: Tags },
  ],
  itdesk: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tickets', label: 'All Tickets', icon: Ticket },
    { to: '/queue', label: 'My Queue', icon: Headset },
  ],
  user: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/my-tickets', label: 'My Tickets', icon: Ticket },
    { to: '/new-ticket', label: 'Raise a Ticket', icon: PlusCircle },
  ],
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const items = NAV[user.role] || []

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-[#F6F5FB]">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-ink text-white/90 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-fade [background-size:18px_18px] opacity-30 pointer-events-none" />
        <div className="relative px-6 py-6 flex items-center gap-2.5 border-b border-white/10">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow">
            <Ticket size={18} className="text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-lg leading-none text-white">Tickette</p>
            <p className="text-[11px] text-white/40 mt-0.5">Help Desk Portal</p>
          </div>
        </div>

        <nav className="relative flex-1 px-3 py-6 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-white shadow-inner'
                    : 'text-white/55 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="relative px-4 py-5 border-t border-white/10 text-[11px] text-white/30">
          Tickette POC · v1.0
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-ink text-white p-4 animate-fade-up">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display font-bold text-lg">Tickette</span>
              <button onClick={() => setMobileOpen(false)} className="text-white/60"><X size={22} /></button>
            </div>
            <nav className="space-y-1">
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                      isActive ? 'bg-white/10 text-white' : 'text-white/60'
                    }`
                  }
                >
                  <Icon size={18} />{label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-white/80 backdrop-blur border-b border-black/5 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <button className="lg:hidden text-ink/70" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="hidden lg:block" />

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-black/5 transition-colors"
            >
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ backgroundColor: user.avatar_color || '#6f56fb' }}
              >
                {user.name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold leading-tight">{user.name}</p>
                <div className="mt-0.5"><RoleBadge role={user.role} /></div>
              </div>
              <ChevronDown size={16} className="text-ink/40" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 card p-1.5 animate-pop origin-top-right"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-black/5 mb-1">
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-ink/50">{user.email}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); navigate('/account') }}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink/70 hover:bg-black/5"
                >
                  <KeyRound size={15} /> Change password
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
