import { useEffect, useState } from 'react'
import { Printer } from 'lucide-react'
import { api, type Lottery, type Ticket } from '../api'

export default function SellTicket() {
  const [lotteries, setLotteries] = useState<Lottery[]>([])
  const [selected, setSelected] = useState('')
  const [userId, setUserId] = useState('')
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get<Lottery[]>('/lotteries?status=active').then(setLotteries)
  }, [])

  const sell = async () => {
    if (!selected) return
    setLoading(true)
    setError('')
    setTicket(null)
    try {
      const t = await api.post<Ticket>('/tickets', {
        lottery_id: selected,
        source: 'physical_sale',
      })
      setTicket(t)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const printTicket = () => {
    window.print()
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Sell Ticket</h1>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lottery</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full border rounded-lg px-3 py-2">
            <option value="">Select lottery...</option>
            {lotteries.map(l => (
              <option key={l.id} value={l.id}>{l.name} - {l.ticket_price} {l.currency}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID (optional)</label>
          <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="Link to customer account"
            className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button onClick={sell} disabled={loading || !selected}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 disabled:opacity-50">
          {loading ? 'Processing...' : 'Issue Ticket'}
        </button>
      </div>

      {ticket && (
        <div className="mt-6 bg-white rounded-xl border p-6 text-center" id="print-area">
          <h2 className="text-lg font-bold text-green-700 mb-3">Ticket Issued!</h2>
          <p className="font-mono text-2xl font-bold mb-3">{ticket.ticket_code}</p>
          {ticket.qr_code_data && (
            <img src={`data:image/png;base64,${ticket.qr_code_data}`} alt="QR"
              className="w-48 h-48 mx-auto bg-white p-2 border rounded" />
          )}
          <p className="text-sm text-gray-500 mt-3">{ticket.lottery_name}</p>
          <button onClick={printTicket} className="mt-4 flex items-center gap-2 mx-auto bg-gray-100 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      )}
    </div>
  )
}
