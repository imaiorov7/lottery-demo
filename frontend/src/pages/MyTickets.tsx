import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Ticket as TicketIcon } from 'lucide-react'
import { api, type Ticket } from '../api'

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  checked: 'bg-blue-500/10 text-blue-400',
  won: 'bg-yellow-500/10 text-yellow-400',
  lost: 'bg-gray-500/10 text-gray-400',
  void: 'bg-red-500/10 text-red-400',
}

export default function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    api.get<Ticket[]>('/tickets')
      .then(setTickets)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const token = localStorage.getItem('token')
  if (!token) {
    return (
      <div className="text-center py-12">
        <TicketIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
        <p className="text-gray-500 mb-4">Login to view your tickets</p>
        <Link to="/login" className="text-brand-400 hover:underline">Login</Link>
      </div>
    )
  }

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Tickets</h1>
      {tickets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <TicketIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No tickets yet. Enter a lottery to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-bold">{t.lottery_name || 'Lottery'}</p>
                <p className="text-sm text-gray-500 font-mono">{t.ticket_code}</p>
                <p className="text-xs text-gray-600">{t.source.replace('_', ' ')}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[t.status] || ''}`}>
                  {t.status.toUpperCase()}
                </span>
                {t.qr_code_data && (
                  <img src={`data:image/png;base64,${t.qr_code_data}`} alt="QR" className="w-16 h-16 mt-2 bg-white p-1 rounded" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
