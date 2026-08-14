import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Inbox, UserCheck } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import TicketCard from '../components/TicketCard'

export default function ITDeskQueue() {
  const { user } = useAuth()
  const [unassigned, setUnassigned] = useState([])
  const [mine, setMine] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: all }, { data: mineRes }] = await Promise.all([
      api.get('/tickets'),
      api.get('/tickets', { params: { assigned_to: user.id } }),
    ])
    setUnassigned(all.tickets.filter((t) => !t.assigned_to && t.status !== 'Closed'))
    setMine(mineRes.tickets.filter((t) => !['Closed'].includes(t.status)))
    setLoading(false)
  }, [user.id])

  useEffect(() => { load() }, [load])

  async function claim(ticketId) {
    try {
      await api.patch(`/tickets/${ticketId}/assign`, { assigned_to: user.id })
      toast.success('Ticket claimed — moved to your queue.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not claim ticket.')
    }
  }

  if (loading) {
    return <div className="h-64 flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
    </div>
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold font-display">My Queue</h1>
        <p className="text-ink/50 text-sm mt-1">Tickets assigned to you, and unclaimed tickets ready to pick up.</p>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <UserCheck size={16} className="text-brand-600" />
          <h3 className="font-bold font-display">Assigned to me ({mine.length})</h3>
        </div>
        {mine.length === 0 ? (
          <div className="card p-8 text-center text-sm text-ink/40">Nothing assigned to you right now.</div>
        ) : (
          <div className="space-y-3">{mine.map((t) => <TicketCard key={t.id} ticket={t} />)}</div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Inbox size={16} className="text-amber-600" />
          <h3 className="font-bold font-display">Unclaimed ({unassigned.length})</h3>
        </div>
        {unassigned.length === 0 ? (
          <div className="card p-8 text-center text-sm text-ink/40">No unclaimed tickets — the queue is clear 🎉</div>
        ) : (
          <div className="space-y-3">
            {unassigned.map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0"><TicketCard ticket={t} /></div>
                <button onClick={() => claim(t.id)} className="btn-secondary shrink-0">Claim</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
