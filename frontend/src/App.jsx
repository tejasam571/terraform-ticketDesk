import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AllTickets from './pages/AllTickets'
import MyTickets from './pages/MyTickets'
import NewTicket from './pages/NewTicket'
import TicketDetail from './pages/TicketDetail'
import ITDeskQueue from './pages/ITDeskQueue'
import AdminUsers from './pages/AdminUsers'
import AdminTicketTypes from './pages/AdminTicketTypes'
import Account from './pages/Account'
import NotFound from './pages/NotFound'

function withLayout(el) {
  return <Layout>{el}</Layout>
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F6F5FB]">
        <div className="h-10 w-10 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { borderRadius: '12px', fontSize: '14px', fontWeight: 500 },
      }} />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

        <Route path="/" element={<ProtectedRoute>{withLayout(<Dashboard />)}</ProtectedRoute>} />
        <Route path="/tickets" element={<ProtectedRoute roles={['admin', 'itdesk']}>{withLayout(<AllTickets />)}</ProtectedRoute>} />
        <Route path="/tickets/:id" element={<ProtectedRoute>{withLayout(<TicketDetail />)}</ProtectedRoute>} />
        <Route path="/my-tickets" element={<ProtectedRoute roles={['user']}>{withLayout(<MyTickets />)}</ProtectedRoute>} />
        <Route path="/new-ticket" element={<ProtectedRoute roles={['user']}>{withLayout(<NewTicket />)}</ProtectedRoute>} />
        <Route path="/queue" element={<ProtectedRoute roles={['itdesk']}>{withLayout(<ITDeskQueue />)}</ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}>{withLayout(<AdminUsers />)}</ProtectedRoute>} />
        <Route path="/admin/ticket-types" element={<ProtectedRoute roles={['admin']}>{withLayout(<AdminTicketTypes />)}</ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute>{withLayout(<Account />)}</ProtectedRoute>} />

        <Route path="*" element={<ProtectedRoute>{withLayout(<NotFound />)}</ProtectedRoute>} />
      </Routes>
    </>
  )
}
