import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  ArrowLeft, Send, Paperclip, CheckCircle2, User, Clock, UserCog,
  Image as ImageIcon, X, ShieldCheck, History,
} from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, PriorityBadge } from '../components/Badges'
import { TypeIcon } from '../components/TicketCard'

const TRANSITIONS = {
  'Open': ['In Progress', 'Closed'],
  'In Progress': ['On Hold', 'Resolved', 'Open'],
  'On Hold': ['In Progress'],
  'Resolved': ['Closed', 'Reopened'],
  'Reopened': ['In Progress'],
  'Closed': ['Reopened'],
}

const STATUS_ACTION_STYLE = {
  'In Progress': 'btn-secondary', 'On Hold': 'btn-secondary', 'Open': 'btn-secondary',
  'Resolved': 'btn-primary', 'Closed': 'btn-secondary', 'Reopened': 'btn-danger',
}

function fmt(dt) {
  if (!dt) return '—'
  return format(new Date(dt.replace(' ', 'T')), 'd MMM yyyy, h:mm a')
}

function Avatar({ name, color }) {
  return (
    <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ backgroundColor: color || '#6f56fb' }}>
      {name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
    </div>
  )
}

export default function TicketDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [isProof, setIsProof] = useState(false)
  const [posting, setPosting] = useState(false)
  const [agents, setAgents] = useState([])
  const fileInput = useRef(null)

  const load = useCallback(async () => {
    const { data } = await api.get(`/tickets/${id}`)
    setTicket(data.ticket)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (user.role === 'admin') {
      api.get('/users', { params: { role: 'itdesk' } }).then(({ data }) => setAgents(data.users))
    }
  }, [user.role])

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setFilePreview(URL.createObjectURL(f))
  }

  function clearFile() {
    setFile(null); setFilePreview(null)
    if (fileInput.current) fileInput.current.value = ''
  }

  async function submitComment(e) {
    e.preventDefault()
    if (!comment.trim() && !file) return toast.error('Add a comment or attach a photo.')
    setPosting(true)
    try {
      const form = new FormData()
      form.append('comment', comment.trim())
      if (file) form.append('attachment', file)
      if (isProof) form.append('is_resolution_proof', 'true')
      await api.post(`/tickets/${id}/comments`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setComment(''); clearFile(); setIsProof(false)
      toast.success('Comment added.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not post comment.')
    } finally {
      setPosting(false)
    }
  }

  async function changeStatus(status) {
    try {
      await api.patch(`/tickets/${id}/status`, { status })
      toast.success(`Ticket marked as ${status}.`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status.')
    }
  }

  async function assignAgent(agentId) {
    try {
      await api.patch(`/tickets/${id}/assign`, { assigned_to: agentId || null })
      toast.success('Assignment updated.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not assign ticket.')
    }
  }

  async function claimTicket() {
    try {
      await api.patch(`/tickets/${id}/assign`, { assigned_to: user.id })
      toast.success('Ticket claimed.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not claim ticket.')
    }
  }

  if (loading || !ticket) {
    return <div className="h-64 flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
    </div>
  }

  const canAct = user.role === 'admin' || user.role === 'itdesk'
  const nextStatuses = TRANSITIONS[ticket.status] || []

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
      <Link to={user.role === 'user' ? '/my-tickets' : '/tickets'} className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink">
        <ArrowLeft size={15} /> Back to tickets
      </Link>

      {/* Header card */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ticket.ticket_type_color}1A`, color: ticket.ticket_type_color }}>
            <TypeIcon name={ticket.ticket_type_icon} size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-xs font-mono font-semibold text-ink/40">{ticket.reference}</span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="chip bg-gray-100 text-gray-600">{ticket.ticket_type_name}</span>
            </div>
            <h1 className="text-xl font-bold font-display">{ticket.title}</h1>
            <p className="text-sm text-ink/60 mt-2 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-black/5">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink/40 font-semibold mb-1">Raised by</p>
            <p className="text-sm font-medium flex items-center gap-1.5"><User size={13} className="text-ink/30" />{ticket.raised_by_name}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink/40 font-semibold mb-1">Raised on</p>
            <p className="text-sm font-medium flex items-center gap-1.5"><Clock size={13} className="text-ink/30" />{fmt(ticket.raised_at)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink/40 font-semibold mb-1">Resolved on</p>
            <p className="text-sm font-medium flex items-center gap-1.5"><CheckCircle2 size={13} className="text-ink/30" />{fmt(ticket.resolved_at)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink/40 font-semibold mb-1">Assigned to</p>
            {ticket.assigned_to_name ? (
              <p className="text-sm font-medium flex items-center gap-1.5"><UserCog size={13} className="text-ink/30" />{ticket.assigned_to_name}</p>
            ) : (
              <p className="text-sm text-ink/40">Unassigned</p>
            )}
          </div>
        </div>

        {canAct && (
          <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-black/5">
            {!ticket.assigned_to && user.role === 'itdesk' && (
              <button onClick={claimTicket} className="btn-secondary">Claim ticket</button>
            )}
            {user.role === 'admin' && (
              <select
                className="input !w-auto text-sm" value={ticket.assigned_to || ''}
                onChange={(e) => assignAgent(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Unassigned</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            )}
            <span className="text-ink/20">|</span>
            {nextStatuses.map((s) => (
              <button key={s} onClick={() => changeStatus(s)} className={STATUS_ACTION_STYLE[s] || 'btn-secondary'}>
                Mark as {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status history */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <History size={16} className="text-ink/40" />
          <h3 className="font-bold font-display text-sm">Status timeline</h3>
        </div>
        <div className="space-y-4">
          {ticket.history.map((h, i) => (
            <div key={h.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`h-2.5 w-2.5 rounded-full ${i === ticket.history.length - 1 ? 'bg-brand-600' : 'bg-ink/15'}`} />
                {i < ticket.history.length - 1 && <div className="w-px flex-1 bg-black/10 my-1" />}
              </div>
              <div className="pb-4 -mt-0.5">
                <p className="text-sm">
                  <span className="font-semibold">{h.changed_by_name}</span>
                  <span className="text-ink/50"> moved this to </span>
                  <span className="font-semibold">{h.to_status}</span>
                </p>
                {h.note && <p className="text-xs text-ink/50 mt-0.5">{h.note}</p>}
                <p className="text-[11px] text-ink/35 mt-0.5">{fmt(h.changed_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div className="card p-6">
        <h3 className="font-bold font-display text-sm mb-4">Comments &amp; updates</h3>

        <div className="space-y-5 mb-6">
          {ticket.comments.length === 0 && <p className="text-sm text-ink/40">No comments yet.</p>}
          {ticket.comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar name={c.user_name} color={c.user_color} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{c.user_name}</span>
                  {c.user_role !== 'user' && <span className="chip bg-teal-50 text-teal-700 !py-0.5">{c.user_role === 'admin' ? 'Admin' : 'IT Desk'}</span>}
                  {!!c.is_resolution_proof && (
                    <span className="chip bg-emerald-50 text-emerald-700 !py-0.5"><ShieldCheck size={11} /> Resolution proof</span>
                  )}
                  <span className="text-[11px] text-ink/35">{fmt(c.created_at)}</span>
                </div>
                {c.comment && <p className="text-sm text-ink/70 mt-1 leading-relaxed whitespace-pre-wrap">{c.comment}</p>}
                {c.attachment_path && (
                  <a href={c.attachment_path} target="_blank" rel="noreferrer" className="inline-block mt-2">
                    <img src={c.attachment_path} alt="Attachment" className="max-h-52 rounded-xl border border-black/10 hover:opacity-90 transition-opacity" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submitComment} className="border-t border-black/5 pt-5 space-y-3">
          <textarea
            className="input min-h-[80px] resize-y" placeholder="Add a comment…"
            value={comment} onChange={(e) => setComment(e.target.value)}
          />
          {filePreview && (
            <div className="relative inline-block">
              <img src={filePreview} alt="Preview" className="h-24 rounded-lg border border-black/10" />
              <button type="button" onClick={clearFile} className="absolute -top-2 -right-2 bg-ink text-white rounded-full p-1"><X size={12} /></button>
            </div>
          )}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <label className="btn-ghost cursor-pointer !px-3">
                <Paperclip size={15} />
                <span className="hidden sm:inline">Attach photo</span>
                <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
              {canAct && (
                <label className="flex items-center gap-1.5 text-xs text-ink/60 cursor-pointer select-none">
                  <input type="checkbox" checked={isProof} onChange={(e) => setIsProof(e.target.checked)} className="rounded accent-brand-600" />
                  <ImageIcon size={13} /> Mark as resolution proof
                </label>
              )}
            </div>
            <button type="submit" disabled={posting} className="btn-primary">
              {posting ? 'Posting…' : 'Post comment'} {!posting && <Send size={15} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
