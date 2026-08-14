import { Link } from 'react-router-dom'
import { Ghost } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="h-[70vh] flex flex-col items-center justify-center text-center animate-fade-up">
      <Ghost size={40} className="text-ink/20 mb-4" />
      <h1 className="text-xl font-bold font-display">Page not found</h1>
      <p className="text-ink/50 text-sm mt-1 mb-6">This ticket trail went cold.</p>
      <Link to="/" className="btn-primary">Back to dashboard</Link>
    </div>
  )
}
