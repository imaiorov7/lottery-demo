import { useState, useRef } from 'react'
import { ScanLine, CheckCircle, XCircle } from 'lucide-react'
import { api, type Ticket } from '../../api'

export default function ValidateTicket() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<Ticket | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = async (ticketCode?: string) => {
    const c = ticketCode || code
    if (!c.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const t = await api.post<Ticket>('/tickets/validate', { ticket_code: c.trim() })
      setResult(t)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    validate()
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Validate Ticket</h1>

      <div className="bg-white rounded-xl border p-6">
        <form onSubmit={handleSubmit} className="flex gap-3 mb-4">
          <input value={code} onChange={e => setCode(e.target.value)}
            placeholder="Enter ticket code or scan QR..."
            className="flex-1 border rounded-lg px-4 py-3 text-lg font-mono"
            autoFocus />
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            <ScanLine className="w-5 h-5" />
          </button>
        </form>

        <p className="text-sm text-gray-500 mb-4">
          Scan a QR code or manually enter the ticket code to validate
        </p>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <XCircle className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <p className="font-medium text-red-800">Validation Failed</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
            <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
            <div>
              <p className="font-medium text-green-800">Ticket Valid!</p>
              <p className="text-sm text-green-600">
                Code: {result.ticket_code} | Status: {result.status}
              </p>
              <p className="text-sm text-green-600">
                Lottery: {result.lottery_name}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
