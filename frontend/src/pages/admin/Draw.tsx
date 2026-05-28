import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { api, type Lottery, type DrawResult } from '../../api'

export default function Draw() {
  const [lotteries, setLotteries] = useState<Lottery[]>([])
  const [selected, setSelected] = useState('')
  const [winnerCount, setWinnerCount] = useState(1)
  const [result, setResult] = useState<DrawResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get<Lottery[]>('/lotteries?status=active').then(setLotteries)
  }, [])

  const doDraw = async () => {
    if (!selected) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const r = await api.post<DrawResult>('/draw', {
        lottery_id: selected, winner_count: winnerCount,
      })
      setResult(r)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Draw Winners</h1>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Lottery</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">-- Select --</option>
            {lotteries.map(l => (
              <option key={l.id} value={l.id}>{l.name} ({l.ticket_count} entries)</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Winners</label>
          <input type="number" min={1} value={winnerCount} onChange={e => setWinnerCount(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button onClick={doDraw} disabled={loading || !selected}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Drawing...' : 'Draw Winners'}
        </button>
      </div>

      {result && (
        <div className="mt-6 bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-lg font-bold text-gray-900">Winners - {result.lottery_name}</h2>
          </div>
          <div className="space-y-2">
            {result.winners.map((w, i) => (
              <div key={w.id} className="flex items-center justify-between bg-yellow-50 rounded-lg p-3">
                <div>
                  <span className="font-bold text-yellow-800">#{i + 1}</span>
                  <span className="ml-3 font-medium">{w.user_name}</span>
                </div>
                <span className="font-mono text-sm text-gray-600">{w.ticket_code}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-3">Drawn at: {new Date(result.drawn_at).toLocaleString()}</p>
        </div>
      )}
    </div>
  )
}
