import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react'
import { api, type Lottery } from '../../api'

interface RevenueReport {
  total_revenue: string
  revenue_by_day: Array<{ date: string; revenue: string }>
  revenue_by_source: Record<string, string>
  revenue_by_lottery: Array<{ lottery_id: string; name: string; revenue: string }>
}

interface EntryReport {
  total_entries: number
  entries_by_day: Array<{ date: string; count: number }>
  entries_by_source: Record<string, number>
  entries_by_lottery: Array<{ lottery_id: string; name: string; count: number }>
  conversion_rate: number
}

export default function Reports() {
  const [tab, setTab] = useState<'revenue' | 'entries'>('revenue')
  const [revenue, setRevenue] = useState<RevenueReport | null>(null)
  const [entries, setEntries] = useState<EntryReport | null>(null)
  const [lotteries, setLotteries] = useState<Lottery[]>([])
  const [lotteryFilter, setLotteryFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Lottery[]>('/lotteries').then(setLotteries).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const q = lotteryFilter ? `?lottery_id=${lotteryFilter}` : ''
    Promise.all([
      api.get<RevenueReport>(`/reports/revenue${q}`),
      api.get<EntryReport>(`/reports/entries${q}`),
    ]).then(([rev, ent]) => {
      setRevenue(rev)
      setEntries(ent)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [lotteryFilter])

  const Bar = ({ value, max, label, color }: { value: number; max: number; label: string; color: string }) => (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs text-gray-500 text-right truncate">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
      </div>
      <div className="w-20 text-xs font-medium text-right">{value}</div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <select value={lotteryFilter} onChange={e => setLotteryFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Lotteries</option>
          {lotteries.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('revenue')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'revenue' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <DollarSign className="w-4 h-4 inline mr-1" /> Revenue
        </button>
        <button onClick={() => setTab('entries')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'entries' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <BarChart3 className="w-4 h-4 inline mr-1" /> Entries
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading reports...</div>
      ) : tab === 'revenue' && revenue ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-50 text-green-600"><DollarSign className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold">{revenue.total_revenue} EUR</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600"><TrendingUp className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm text-gray-500">Sources</p>
                  <p className="text-2xl font-bold">{Object.keys(revenue.revenue_by_source).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-50 text-purple-600"><Users className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm text-gray-500">Lotteries</p>
                  <p className="text-2xl font-bold">{revenue.revenue_by_lottery.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Revenue by Source</h3>
            <div className="space-y-2">
              {Object.entries(revenue.revenue_by_source).map(([src, val]) => (
                <Bar key={src} label={src.replace('_', ' ')} value={Number(val)}
                  max={Math.max(...Object.values(revenue.revenue_by_source).map(Number))} color="bg-green-500" />
              ))}
              {Object.keys(revenue.revenue_by_source).length === 0 && <p className="text-sm text-gray-400">No revenue data yet</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Revenue by Lottery</h3>
            <div className="space-y-2">
              {revenue.revenue_by_lottery.map(l => (
                <Bar key={l.lottery_id} label={l.name || 'Unknown'} value={Number(l.revenue)}
                  max={Math.max(...revenue.revenue_by_lottery.map(x => Number(x.revenue)))} color="bg-blue-500" />
              ))}
              {revenue.revenue_by_lottery.length === 0 && <p className="text-sm text-gray-400">No revenue data yet</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Daily Revenue</h3>
            <div className="space-y-2">
              {revenue.revenue_by_day.map(d => (
                <Bar key={d.date} label={d.date} value={Number(d.revenue)}
                  max={Math.max(...revenue.revenue_by_day.map(x => Number(x.revenue)))} color="bg-emerald-500" />
              ))}
              {revenue.revenue_by_day.length === 0 && <p className="text-sm text-gray-400">No daily data yet</p>}
            </div>
          </div>
        </div>
      ) : tab === 'entries' && entries ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border p-5">
              <p className="text-sm text-gray-500">Total Entries</p>
              <p className="text-2xl font-bold">{entries.total_entries}</p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <p className="text-sm text-gray-500">Game Conversion Rate</p>
              <p className="text-2xl font-bold">{entries.conversion_rate}%</p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <p className="text-sm text-gray-500">Lotteries with Entries</p>
              <p className="text-2xl font-bold">{entries.entries_by_lottery.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Entries by Source</h3>
            <div className="space-y-2">
              {Object.entries(entries.entries_by_source).map(([src, val]) => (
                <Bar key={src} label={src.replace('_', ' ')} value={val}
                  max={Math.max(...Object.values(entries.entries_by_source))} color="bg-orange-500" />
              ))}
              {Object.keys(entries.entries_by_source).length === 0 && <p className="text-sm text-gray-400">No entry data yet</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Entries by Lottery</h3>
            <div className="space-y-2">
              {entries.entries_by_lottery.map(l => (
                <Bar key={l.lottery_id} label={l.name || 'Unknown'} value={l.count}
                  max={Math.max(...entries.entries_by_lottery.map(x => x.count))} color="bg-purple-500" />
              ))}
              {entries.entries_by_lottery.length === 0 && <p className="text-sm text-gray-400">No entry data yet</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Daily Entries</h3>
            <div className="space-y-2">
              {entries.entries_by_day.map(d => (
                <Bar key={d.date} label={d.date} value={d.count}
                  max={Math.max(...entries.entries_by_day.map(x => x.count))} color="bg-indigo-500" />
              ))}
              {entries.entries_by_day.length === 0 && <p className="text-sm text-gray-400">No daily data yet</p>}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
