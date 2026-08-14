const STATUS_STYLES = {
  'Open': 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  'In Progress': 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  'On Hold': 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  'Resolved': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  'Closed': 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  'Reopened': 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
}

const STATUS_DOT = {
  'Open': 'bg-sky-500',
  'In Progress': 'bg-amber-500',
  'On Hold': 'bg-slate-400',
  'Resolved': 'bg-emerald-500',
  'Closed': 'bg-violet-500',
  'Reopened': 'bg-rose-500',
}

export function StatusBadge({ status }) {
  return (
    <span className={`chip ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status] || 'bg-gray-400'}`} />
      {status}
    </span>
  )
}

const PRIORITY_STYLES = {
  'Low': 'bg-gray-100 text-gray-600',
  'Medium': 'bg-blue-50 text-blue-700',
  'High': 'bg-orange-50 text-orange-700',
  'Urgent': 'bg-red-50 text-red-700',
}

export function PriorityBadge({ priority }) {
  return (
    <span className={`chip ${PRIORITY_STYLES[priority] || 'bg-gray-100 text-gray-600'}`}>
      {priority === 'Urgent' && '🔥 '}{priority}
    </span>
  )
}

export function RoleBadge({ role }) {
  const styles = {
    admin: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
    itdesk: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
    user: 'bg-gray-100 text-gray-600',
  }
  const labels = { admin: 'Admin', itdesk: 'IT Desk', user: 'User' }
  return <span className={`chip ${styles[role]}`}>{labels[role]}</span>
}
