import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, PlusCircle } from 'lucide-react'
import api from '../api/axios'
import TicketCard from '../components/TicketCard'

const STATUSES = ['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed', 'Reopened']

export default function MyTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', search: '' })

  useEffect(() => {
    setLoading(true)
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    api.get('/tickets', { params }).then(({ data }) => setTickets(data.tickets)).finally(() => setLoading(false))
  }, [filters])

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">My Tickets</h1>
          <p className="text-ink/50 text-sm mt-1">Everything you've raised, and where it stands.</p>
        </div>
        <Link to="/new-ticket" className="btn-primary"><PlusCircle size={16} /> Raise a ticket</Link>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            className="input pl-10" placeholder="Search your tickets…"
            value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>
        <select className="input sm:!w-48" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-ink/50 text-sm mb-4">You haven't raised any tickets yet.</p>
          <Link to="/new-ticket" className="btn-primary inline-flex"><PlusCircle size={16} /> Raise your first ticket</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
        </div>
      )}
    </div>
  )
}
