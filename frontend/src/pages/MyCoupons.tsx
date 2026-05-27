import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, type Coupon, type Lottery } from '../api'

const TIER_CONFIG = {
  gold:   { emoji: '🥇', bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', label: 'Gold',   value: 3 },
  silver: { emoji: '🥈', bg: 'bg-gray-50',   border: 'border-gray-300',   text: 'text-gray-700',   label: 'Silver', value: 2 },
  bronze: { emoji: '🥉', bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-800',  label: 'Bronze', value: 1 },
} as const

export default function MyCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [stats, setStats] = useState<Record<string, number>>({ bronze: 0, silver: 0, gold: 0 })
  const [lotteries, setLotteries] = useState<Lottery[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [redeemLottery, setRedeemLottery] = useState('')
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) return
    api.get<Coupon[]>('/coupons').then(setCoupons)
    api.get<Record<string, number>>('/coupons/stats').then(setStats)
    api.get<Lottery[]>('/lotteries').then(ls => setLotteries(ls.filter(l => l.coupon_entry_enabled)))
  }, [token])

  const toggle = (id: string) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  const redeem = async () => {
    if (!redeemLottery || selected.length === 0) return
    setLoading(true); setError(''); setResult('')
    try {
      const ticket = await api.post<any>('/coupons/redeem', { lottery_id: redeemLottery, coupons: selected })
      setResult(`✅ Entry confirmed! Ticket #${ticket.ticket_code}`)
      setSelected([])
      api.get<Coupon[]>('/coupons').then(setCoupons)
      api.get<Record<string, number>>('/coupons/stats').then(setStats)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const activeCoupons = coupons.filter(c => c.status === 'active')
  const usedCoupons = coupons.filter(c => c.status !== 'active')

  if (!token) return (
    <div className="text-center py-20">
      <p className="text-gray-500 mb-4">Please log in to view your coupons.</p>
      <Link to="/login" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg">Login</Link>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Coupons</h1>
      <p className="text-sm text-gray-500 mb-6">Earn coupons through casino gameplay and redeem them for lottery entries.</p>

      {/* Balance summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(['gold', 'silver', 'bronze'] as const).map(tier => {
          const cfg = TIER_CONFIG[tier]
          return (
            <div key={tier} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 text-center`}>
              <div className="text-3xl mb-1">{cfg.emoji}</div>
              <div className={`text-2xl font-bold ${cfg.text}`}>{stats[tier] || 0}</div>
              <div className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</div>
            </div>
          )
        })}
      </div>

      {/* How to earn */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
        <strong>How to earn coupons:</strong> Play casino games and qualifying activities to automatically receive Bronze, Silver, or Gold coupons in your wallet. Redeem them below for free lottery entries!
      </div>

      {/* Redeem section */}
      {lotteries.length > 0 && activeCoupons.length > 0 && (
        <div className="bg-white rounded-xl border p-5 mb-6">
          <h2 className="font-bold text-gray-900 mb-3">Redeem Coupons for Entry</h2>

          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">Select Lottery</label>
            <select value={redeemLottery} onChange={e => setRedeemLottery(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">— Choose a lottery —</option>
              {lotteries.map(l => {
                let rules: any[] = []
                try { rules = JSON.parse(l.coupon_entry_rules || '[]') } catch {}
                return (
                  <option key={l.id} value={l.id}>
                    {l.name} — {rules.map((r: any) => `${r.count}×${r.tier}`).join(' or ')}
                  </option>
                )
              })}
            </select>
          </div>

          {redeemLottery && (() => {
            const lot = lotteries.find(l => l.id === redeemLottery)
            let rules: any[] = []
            try { rules = JSON.parse(lot?.coupon_entry_rules || '[]') } catch {}
            return rules.length > 0 && (
              <div className="bg-gray-50 border rounded-lg p-3 mb-3 text-xs text-gray-600">
                <strong>Entry rules:</strong>{' '}
                {rules.map((r: any, i: number) => (
                  <span key={i}>{i > 0 && ' <em>or</em> '}{r.count}× {r.tier}</span>
                ))}
                {' '}coupon{rules[0]?.count > 1 ? 's' : ''} = 1 entry
              </div>
            )
          })()}

          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-2">Select coupons to use ({selected.length} selected)</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeCoupons.map(c => {
                const cfg = TIER_CONFIG[c.tier]
                const isSel = selected.includes(c.id)
                return (
                  <label key={c.id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${isSel ? `${cfg.border} ${cfg.bg}` : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={isSel} onChange={() => toggle(c.id)} className="w-4 h-4" />
                    <span className="text-lg">{cfg.emoji}</span>
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${cfg.text}`}>{cfg.label} Coupon</span>
                      <span className="text-xs text-gray-400 ml-2">from {c.source.replace('_', ' ')}</span>
                    </div>
                    {c.expires_at && (
                      <span className="text-xs text-gray-400">exp. {new Date(c.expires_at).toLocaleDateString()}</span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          {result && <p className="text-green-600 text-sm font-medium mb-2">{result}</p>}

          <button onClick={redeem} disabled={loading || selected.length === 0 || !redeemLottery}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Redeeming...' : `Redeem ${selected.length} Coupon${selected.length !== 1 ? 's' : ''} for Entry`}
          </button>
        </div>
      )}

      {/* Active coupons list */}
      <h2 className="font-bold text-gray-900 mb-3">Active Coupons ({activeCoupons.length})</h2>
      {activeCoupons.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl border text-gray-400 mb-6">
          <p className="text-4xl mb-2">🎟️</p>
          <p>No active coupons yet. Play casino games to earn some!</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {activeCoupons.map(c => {
            const cfg = TIER_CONFIG[c.tier]
            return (
              <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                <span className="text-2xl">{cfg.emoji}</span>
                <div className="flex-1">
                  <div className={`font-semibold text-sm ${cfg.text}`}>{cfg.label} Coupon</div>
                  <div className="text-xs text-gray-500">Source: {c.source.replace(/_/g, ' ')}</div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(c.created_at).toLocaleDateString()}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Used coupons */}
      {usedCoupons.length > 0 && (
        <>
          <h2 className="font-bold text-gray-600 mb-3 text-sm">Redeemed / Expired ({usedCoupons.length})</h2>
          <div className="space-y-1 opacity-50">
            {usedCoupons.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-gray-50 text-sm">
                <span>🎟️</span>
                <span className="flex-1 text-gray-500">{c.tier} — {c.status}</span>
                <span className="text-xs text-gray-400">{c.redeemed_at ? new Date(c.redeemed_at).toLocaleDateString() : ''}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
