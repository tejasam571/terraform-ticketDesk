import { Link } from 'react-router-dom'
import { Cpu, AppWindow, Wifi, KeyRound, HelpCircle, Ticket as TicketIcon, Clock, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { StatusBadge, PriorityBadge } from './Badges'

export const TYPE_ICONS = { Cpu, AppWindow, Wifi, KeyRound, HelpCircle, Ticket: TicketIcon }

export function TypeIcon({ name, ...props }) {
  const Icon = TYPE_ICONS[name] || TicketIcon
  return <Icon {...props} />
}

export default function TicketCard({ ticket }) {
  return (
    <Link
      to={`/tickets/${ticket.id}`}
      className="card p-4 flex items-center gap-4 hover:shadow-glow hover:-translate-y-0.5 transition-all duration-150 group"
    >
      <div
        className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${ticket.ticket_type_color}1A`, color: ticket.ticket_type_color }}
      >
        <TypeIcon name={ticket.ticket_type_icon} size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-semibold text-ink/40">{ticket.reference}</span>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        <p className="font-semibold text-ink mt-1 truncate group-hover:text-brand-700 transition-colors">{ticket.title}</p>
        <div className="flex items-center gap-4 mt-1.5 text-xs text-ink/45">
          <span className="flex items-center gap-1"><User size={12} />{ticket.raised_by_name}</span>
          <span className="flex items-center gap-1"><Clock size={12} />{formatDistanceToNow(new Date(ticket.raised_at.replace(' ', 'T')), { addSuffix: true })}</span>
        </div>
      </div>

      {ticket.assigned_to_name && (
        <div className="hidden sm:flex flex-col items-center gap-1 shrink-0">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
            style={{ backgroundColor: ticket.assigned_to_color || '#6f56fb' }}
            title={ticket.assigned_to_name}
          >
            {ticket.assigned_to_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
        </div>
      )}
    </Link>
  )
}
