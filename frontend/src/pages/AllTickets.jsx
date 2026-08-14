import { useEffect, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import api from '../api/axios'
import TicketCard from '../components/TicketCard'

const STATUSES = ['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed', 'Reopened']
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

export default function AllTickets() {
  const [tickets, setTickets] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', priority: '', ticket_type_id: '', search: '' })

  useEffect(() => { api.get('/ticket-types').then(({ data }) => setTypes(data.ticketTypes)) }, [])

  useEffect(() => {
    setLoading(true)
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    api.get('/tickets', { params }).then(({ data }) => setTickets(data.tickets)).finally(() => setLoading(false))
  }, [filters])

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold font-display">All Tickets</h1>
        <p className="text-ink/50 text-sm mt-1">Every ticket raised across the organization.</p>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            className="input pl-10" placeholder="Search by title, reference, or description…"
            value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal size={16} className="text-ink/30 hidden sm:block" />
          <select className="input !w-auto" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input !w-auto" value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="input !w-auto" value={filters.ticket_type_id} onChange={(e) => setFilters((f) => ({ ...f, ticket_type_id: e.target.value }))}>
            <option value="">All types</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="card p-16 text-center text-ink/40 text-sm">No tickets match these filters.</div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
        </div>
      )}
    </div>
  )
}
