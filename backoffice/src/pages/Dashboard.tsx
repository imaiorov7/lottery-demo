import { useEffect, useState } from 'react'
import { Trophy, Ticket, DollarSign, Users } from 'lucide-react'
import { api, type DashboardStats } from '../api'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    api.get<DashboardStats>('/dashboard').then(setStats).catch(() => {})
  }, [])

  if (!stats) return <div className="text-center py-12 text-gray-500">Loading...</div>

  const cards = [
    { label: 'Active Lotteries', value: stats.active_lotteries, icon: Trophy, color: 'bg-blue-50 text-blue-600' },
    { label: 'Tickets Today', value: stats.total_tickets_today, icon: Ticket, color: 'bg-green-50 text-green-600' },
    { label: 'Revenue Today', value: `${stats.total_revenue_today}`, icon: DollarSign, color: 'bg-purple-50 text-purple-600' },
    { label: 'Total Users', value: stats.total_users, icon: Users, color: 'bg-orange-50 text-orange-600' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="bg-white rounded-xl border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{c.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{c.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${c.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Recent Tickets</h2>
        </div>
        <div className="divide-y">
          {stats.recent_tickets.map((t) => (
            <div key={t.id} className="px-4 py-3 flex items-center justify-between text-sm">
              <div>
                <span className="font-mono font-medium">{t.ticket_code}</span>
                <span className="text-gray-500 ml-3">{t.lottery_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500">{t.source}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  t.status === 'active' ? 'bg-green-50 text-green-600' :
                  t.status === 'won' ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-100 text-gray-600'
                }`}>{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
