import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { api, type Lottery } from '../../api'

export default function Lotteries() {
  const [lotteries, setLotteries] = useState<Lottery[]>([])

  const load = () => api.get<Lottery[]>('/lotteries').then(setLotteries)
  useEffect(() => { load() }, [])

  const remove = async (id: string) => {
    if (!confirm('Delete this lottery?')) return
    await api.delete(`/lotteries/${id}`)
    load()
  }

  const statusColor = (s: string) =>
    s === 'active' ? 'bg-green-50 text-green-700' :
    s === 'draft' ? 'bg-gray-100 text-gray-600' :
    s === 'completed' ? 'bg-blue-50 text-blue-600' : 'bg-yellow-50 text-yellow-600'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lotteries</h1>
        <Link to="/admin/lotteries/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Lottery
        </Link>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 font-medium text-gray-600">Price</th>
              <th className="px-4 py-3 font-medium text-gray-600">Tickets</th>
              <th className="px-4 py-3 font-medium text-gray-600">End Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lotteries.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{l.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor(l.status)}`}>{l.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{l.ticket_price} {l.currency}</td>
                <td className="px-4 py-3 text-gray-600">{l.ticket_count}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(l.end_date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/admin/lotteries/${l.id}`} className="text-blue-600 hover:text-blue-800 mr-3">
                    <Edit className="w-4 h-4 inline" />
                  </Link>
                  <button onClick={() => remove(l.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
