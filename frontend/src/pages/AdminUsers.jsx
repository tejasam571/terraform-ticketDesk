import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { UserPlus, KeyRound, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../api/axios'
import Modal from '../components/Modal'
import { RoleBadge } from '../components/Badges'

const emptyForm = { name: '', email: '', password: '', role: 'user', department: '' }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)
  const [newPassword, setNewPassword] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await api.get('/users')
    setUsers(data.users)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function createUser(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/users', form)
      toast.success('User created.')
      setModalOpen(false)
      setForm(emptyForm)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create user.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(u) {
    try {
      await api.put(`/users/${u.id}`, { is_active: u.is_active ? 0 : 1 })
      toast.success(u.is_active ? 'User deactivated.' : 'User activated.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update user.')
    }
  }

  async function removeUser(u) {
    if (!confirm(`Remove ${u.name}? This cannot be undone unless they have ticket history.`)) return
    try {
      const { data } = await api.delete(`/users/${u.id}`)
      toast.success(data.message)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove user.')
    }
  }

  async function resetPassword(e) {
    e.preventDefault()
    try {
      await api.post(`/users/${resetTarget.id}/reset-password`, { newPassword })
      toast.success('Password reset.')
      setResetTarget(null); setNewPassword('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Manage Users</h1>
          <p className="text-ink/50 text-sm mt-1">Create admins, IT desk agents, and end users.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary"><UserPlus size={16} /> New user</button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-ink/40 border-b border-black/5">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold hidden sm:table-cell">Department</th>
                <th className="px-5 py-3 font-semibold hidden md:table-cell">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-black/[0.015]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ backgroundColor: u.avatar_color }}>
                        {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="font-semibold">{u.name}</p>
                        <p className="text-xs text-ink/45">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-5 py-3 hidden sm:table-cell text-ink/60">{u.department || '—'}</td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <button onClick={() => toggleActive(u)} className={`flex items-center gap-1.5 text-xs font-semibold ${u.is_active ? 'text-emerald-600' : 'text-ink/40'}`}>
                      {u.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      {u.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setResetTarget(u)} className="btn-ghost !px-2" title="Reset password"><KeyRound size={15} /></button>
                      <button onClick={() => removeUser(u)} className="btn-ghost !px-2 hover:!text-rose-600" title="Remove user"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create a new user">
        <form onSubmit={createUser} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Temporary password</label>
            <input className="input" required minLength={6} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="user">User</option>
                <option value="itdesk">IT Desk</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <input className="input" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Creating…' : 'Create user'}</button>
        </form>
      </Modal>

      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title={`Reset password for ${resetTarget?.name || ''}`}>
        <form onSubmit={resetPassword} className="space-y-4">
          <div>
            <label className="label">New password</label>
            <input className="input" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary w-full">Reset password</button>
        </form>
      </Modal>
    </div>
  )
}
