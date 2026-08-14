import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, Pencil } from 'lucide-react'
import api from '../api/axios'
import Modal from '../components/Modal'
import { TypeIcon } from '../components/TicketCard'

const ICONS = ['Cpu', 'AppWindow', 'Wifi', 'KeyRound', 'HelpCircle', 'Ticket']
const COLORS = ['#6366F1', '#0EA5E9', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
const emptyForm = { name: '', description: '', icon: 'Ticket', color: '#6366F1' }

export default function AdminTicketTypes() {
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await api.get('/ticket-types')
    setTypes(data.ticketTypes)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditing(null); setForm(emptyForm); setModalOpen(true)
  }
  function openEdit(t) {
    setEditing(t); setForm({ name: t.name, description: t.description || '', icon: t.icon, color: t.color }); setModalOpen(true)
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/ticket-types/${editing.id}`, form)
        toast.success('Ticket type updated.')
      } else {
        await api.post('/ticket-types', form)
        toast.success('Ticket type created.')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save ticket type.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(t) {
    if (!confirm(`Delete "${t.name}"?`)) return
    try {
      await api.delete(`/ticket-types/${t.id}`)
      toast.success('Ticket type deleted.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete ticket type.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Ticket Types</h1>
          <p className="text-ink/50 text-sm mt-1">The categories users choose from when raising a ticket.</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> New type</button>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map((t) => (
            <div key={t.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${t.color}1A`, color: t.color }}>
                  <TypeIcon name={t.icon} size={20} />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(t)} className="btn-ghost !px-2"><Pencil size={14} /></button>
                  <button onClick={() => remove(t)} className="btn-ghost !px-2 hover:!text-rose-600"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="font-semibold mt-3">{t.name}</p>
              <p className="text-xs text-ink/50 mt-1 leading-relaxed">{t.description || 'No description'}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit ticket type' : 'New ticket type'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[70px]" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map((i) => (
                <button type="button" key={i} onClick={() => setForm((f) => ({ ...f, icon: i }))}
                  className={`h-10 w-10 rounded-lg flex items-center justify-center border ${form.icon === i ? 'border-brand-400 ring-2 ring-brand-100' : 'border-black/10'}`}>
                  <TypeIcon name={i} size={17} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button type="button" key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`h-8 w-8 rounded-full border-2 ${form.color === c ? 'border-ink' : 'border-transparent'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving…' : 'Save ticket type'}</button>
        </form>
      </Modal>
    </div>
  )
}
