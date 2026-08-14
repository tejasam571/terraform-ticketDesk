import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Send } from 'lucide-react'
import api from '../api/axios'
import { TypeIcon } from '../components/TicketCard'

const PRIORITIES = [
  { value: 'Low', desc: 'No rush, whenever convenient' },
  { value: 'Medium', desc: 'Affects my work, not urgent' },
  { value: 'High', desc: 'Blocking my work today' },
  { value: 'Urgent', desc: 'Critical — needs attention now' },
]

export default function NewTicket() {
  const [types, setTypes] = useState([])
  const [form, setForm] = useState({ title: '', description: '', ticket_type_id: '', priority: 'Medium' })
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { api.get('/ticket-types').then(({ data }) => setTypes(data.ticketTypes)) }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.ticket_type_id) return toast.error('Please choose a ticket type.')
    setSubmitting(true)
    try {
      const { data } = await api.post('/tickets', form)
      toast.success(`Ticket ${data.ticket.reference} raised!`)
      navigate(`/tickets/${data.ticket.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not raise ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold font-display">Raise a Ticket</h1>
        <p className="text-ink/50 text-sm mt-1">Tell us what's going on — the help desk will pick it up shortly.</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div>
          <label className="label">What type of issue is this?</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {types.map((t) => (
              <button
                type="button" key={t.id}
                onClick={() => setForm((f) => ({ ...f, ticket_type_id: t.id }))}
                className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all ${
                  form.ticket_type_id === t.id ? 'border-brand-400 ring-4 ring-brand-100 bg-brand-50/40' : 'border-black/10 hover:border-black/20'
                }`}
              >
                <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${t.color}1A`, color: t.color }}>
                  <TypeIcon name={t.icon} size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-[11px] text-ink/45 leading-snug mt-0.5">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Title</label>
          <input
            className="input" required maxLength={120} placeholder="Short summary of the issue"
            value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-[120px] resize-y" required placeholder="What happened? Steps to reproduce, error messages, anything that helps."
            value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div>
          <label className="label">Priority</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PRIORITIES.map((p) => (
              <button
                type="button" key={p.value}
                onClick={() => setForm((f) => ({ ...f, priority: p.value }))}
                className={`rounded-xl border p-3 text-left transition-all ${
                  form.priority === p.value ? 'border-brand-400 ring-4 ring-brand-100 bg-brand-50/40' : 'border-black/10 hover:border-black/20'
                }`}
              >
                <p className="text-sm font-semibold">{p.value}</p>
                <p className="text-[11px] text-ink/45 leading-snug mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Raising ticket…' : 'Raise ticket'}
          {!submitting && <Send size={16} />}
        </button>
      </form>
    </div>
  )
}
