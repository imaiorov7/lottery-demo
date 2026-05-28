import { useEffect, useState } from 'react'
import { api, type Ticket } from '../../api'

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const q = filter ? `?status=${filter}` : ''
    api.get<Ticket[]>(`/tickets${q}`).then(setTickets).catch(() => {})
  }, [filter])

  const statusColor = (s: string) =>
    s === 'active' ? 'bg-green-50 text-green-700' :
    s === 'won' ? 'bg-yellow-50 text-yellow-700' :
    s === 'lost' ? 'bg-gray-100 text-gray-600' :
    s === 'checked' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="checked">Checked</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
          <option value="void">Void</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600">Code</th>
              <th className="px-4 py-3 font-medium text-gray-600">Lottery</th>
              <th className="px-4 py-3 font-medium text-gray-600">User</th>
              <th className="px-4 py-3 font-medium text-gray-600">Source</th>
              <th className="px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 font-medium text-gray-600">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{t.ticket_code}</td>
                <td className="px-4 py-3 text-gray-700">{t.lottery_name || '-'}</td>
                <td className="px-4 py-3 text-gray-700">{t.user_name || '-'}</td>
                <td className="px-4 py-3 text-gray-500">{t.source}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(t.status)}`}>{t.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(t.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {tickets.length === 0 && (
          <p className="text-center py-8 text-gray-500">No tickets found</p>
        )}
      </div>
    </div>
  )
}
