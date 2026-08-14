import { useState } from 'react'
import toast from 'react-hot-toast'
import { KeyRound } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { RoleBadge } from '../components/Badges'

export default function Account() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (newPassword !== confirmPassword) return toast.error('New passwords do not match.')
    setSaving(true)
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword })
      toast.success('Password updated.')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold font-display">Account</h1>
        <p className="text-ink/50 text-sm mt-1">Your profile and security settings.</p>
      </div>

      <div className="card p-6 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0" style={{ backgroundColor: user.avatar_color }}>
          {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
        </div>
        <div>
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-ink/50">{user.email}</p>
          <div className="mt-1.5"><RoleBadge role={user.role} /></div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={16} className="text-ink/40" />
          <h3 className="font-bold font-display text-sm">Change password</h3>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Current password</label>
            <input type="password" className="input" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label className="label">New password</label>
            <input type="password" className="input" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input type="password" className="input" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Updating…' : 'Update password'}</button>
        </form>
      </div>
    </div>
  )
}
