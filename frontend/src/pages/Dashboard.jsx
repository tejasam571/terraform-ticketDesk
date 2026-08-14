import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Ticket, Clock, CheckCircle2, AlertCircle, ArrowRight, PlusCircle, Sparkles } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, PriorityBadge } from '../components/Badges'

const STATUS_COLORS = {
  'Open': '#0ea5e9', 'In Progress': '#f59e0b', 'On Hold': '#94a3b8',
  'Resolved': '#10b981', 'Closed': '#8b5cf6', 'Reopened': '#f43f5e',
}

function StatCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${tint}1A`, color: tint }}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold font-display leading-none">{value}</p>
        <p className="text-xs text-ink/50 mt-1.5">{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/dashboard').then(({ data }) => setData(data))
  }, [])

  if (!data) {
    return <div className="h-64 flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
    </div>
  }

  const openCount = (data.byStatus.find((s) => s.status === 'Open')?.count) || 0
  const progressCount = (data.byStatus.find((s) => s.status === 'In Progress')?.count) || 0
  const resolvedCount = (data.byStatus.find((s) => s.status === 'Resolved')?.count) || 0
  const urgentCount = (data.byPriority.find((p) => p.priority === 'Urgent')?.count) || 0

  const pieData = data.byStatus.map((s) => ({ name: s.status, value: s.count }))

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Hi {user.name.split(' ')[0]} 👋</h1>
          <p className="text-ink/50 text-sm mt-1">
            {user.role === 'user' ? "Here's the status of everything you've raised." : "Here's what's happening across the help desk."}
          </p>
        </div>
        {user.role === 'user' && (
          <Link to="/new-ticket" className="btn-primary"><PlusCircle size={16} /> Raise a ticket</Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Ticket} label={user.role === 'user' ? 'Your tickets' : 'Total tickets'} value={data.total} tint="#6f56fb" />
        <StatCard icon={Clock} label="Open" value={openCount} tint="#0ea5e9" />
        <StatCard icon={AlertCircle} label="In Progress" value={progressCount} tint="#f59e0b" />
        <StatCard icon={CheckCircle2} label="Resolved" value={resolvedCount} tint="#10b981" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-bold font-display mb-1">Tickets by status</h3>
          <p className="text-xs text-ink/45 mb-4">A full picture of where things stand right now.</p>
          {data.total === 0 ? (
            <p className="text-sm text-ink/40 py-10 text-center">No tickets yet.</p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3}>
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#ccc'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 text-sm">
                {pieData.map((s) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.name] }} />
                    <span className="text-ink/60">{s.name}</span>
                    <span className="font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 card p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold font-display">Volume by ticket type</h3>
            {data.avgResolutionHours != null && (
              <span className="chip bg-brand-50 text-brand-700"><Sparkles size={12} /> avg resolve: {data.avgResolutionHours}h</span>
            )}
          </div>
          <p className="text-xs text-ink/45 mb-4">Which categories are keeping the desk busy.</p>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={data.byType}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="type" tick={{ fontSize: 12, fill: '#8a889c' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#8a889c' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(111,86,251,0.06)' }} />
                <Bar dataKey="count" fill="#6f56fb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {data.agentLoad?.length > 0 && (
        <div className="card p-6">
          <h3 className="font-bold font-display mb-4">IT desk workload</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.agentLoad.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-black/5 p-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: a.avatar_color }}>
                  {a.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{a.name}</p>
                  <p className="text-xs text-ink/45">{a.active_count} active · {a.resolved_count} resolved</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold font-display">Recent activity</h3>
          <Link to={user.role === 'user' ? '/my-tickets' : '/tickets'} className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {data.recent.length === 0 ? (
          <p className="text-sm text-ink/40 py-6 text-center">Nothing raised yet — it'll show up here.</p>
        ) : (
          <div className="divide-y divide-black/5">
            {data.recent.map((t) => (
              <Link to={`/tickets/${t.id}`} key={t.id} className="flex items-center justify-between py-3 group">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-brand-700 transition-colors">{t.title}</p>
                  <p className="text-xs text-ink/45 mt-0.5">{t.reference} · {t.ticket_type_name} · raised by {t.raised_by_name}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
