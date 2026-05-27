import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, type Coupon, type Lottery, type Ticket } from '../api'
import MiniGame from '../components/MiniGame'

// ── Tier config ────────────────────────────────────────────────────────────────
const TIER = {
  gold:   { emoji: '🥇', label: 'Gold',   color: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-500/10' },
  silver: { emoji: '🥈', label: 'Silver', color: 'text-slate-300',  border: 'border-slate-400/40',  bg: 'bg-slate-500/10' },
  bronze: { emoji: '🥉', label: 'Bronze', color: 'text-amber-500',  border: 'border-amber-500/40',  bg: 'bg-amber-500/10' },
} as const

type Tier = keyof typeof TIER

// ── Helpers ────────────────────────────────────────────────────────────────────
function msToHms(ms: number) {
  if (ms <= 0) return '00:00:00'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function parseCouponRules(json: string | null): Array<{ tier: Tier; count: number }> {
  try { return json ? JSON.parse(json) : [] } catch { return [] }
}

// ── Countdown hook ─────────────────────────────────────────────────────────────
function useCountdown(target: string) {
  const [remaining, setRemaining] = useState(() => new Date(target).getTime() - Date.now())
  useEffect(() => {
    const id = setInterval(() => setRemaining(new Date(target).getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [target])
  return remaining
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function CouponBadge({ tier, count }: { tier: Tier; count: number }) {
  const cfg = TIER[tier]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${cfg.border} ${cfg.bg} ${cfg.color}`}>
      {cfg.emoji} {count > 1 ? `${count}×` : ''}{cfg.label}
    </span>
  )
}

// ── Simple Reaction Game ───────────────────────────────────────────────────────
function ReactionGame({
  lottery, onWin, onCancel
}: {
  lottery: Lottery
  onWin: () => void
  onCancel: () => void
}) {
  const [showMiniGame, setShowMiniGame] = useState(false)
  const [gameSession, setGameSession] = useState<any>(null)

  const startGame = async () => {
    try {
      const session = await api.post<any>('/game/start', { lottery_id: lottery.id })
      setGameSession(session)
      setShowMiniGame(true)
    } catch (e: any) {
      console.error('Failed to start game:', e)
    }
  }

  if (showMiniGame && gameSession) {
    return (
      <MiniGame
        gameType={gameSession.game_type}
        duration={gameSession.duration_seconds}
        maxScore={gameSession.max_score}
        minScore={gameSession.min_score_required}
        onComplete={async (score: number) => {
          try {
            const result = await api.post<any>('/game/submit', {
              session_id: gameSession.id,
              score
            })
            if (result.qualified) {
              onWin()
            } else {
              setShowMiniGame(false)
              setGameSession(null)
            }
          } catch (e: any) {
            console.error('Failed to submit score:', e)
          }
        }}
        onCancel={() => {
          setShowMiniGame(false)
          setGameSession(null)
        }}
      />
    )
  }

  return (
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 text-center">
      <p className="text-purple-400 font-semibold mb-2">🎮 Play to Enter</p>
      <p className="text-xs text-gray-400 mb-3">
        Score {lottery.game_min_score || 50}+ points in {lottery.game_duration_seconds || 30} seconds to win {lottery.game_entries_per_win || 1} ticket{lottery.game_entries_per_win !== 1 ? 's' : ''}.
      </p>
      <button onClick={startGame} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
        Start Game
      </button>
      <button onClick={onCancel} className="ml-2 text-gray-400 text-xs hover:text-gray-300">
        Cancel
      </button>
    </div>
  )
}

function WalletBar({ stats, coupons }: { stats: Record<string, number>; coupons: Coupon[] }) {
  const active = coupons.filter(c => c.status === 'active')
  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Your Ticket Wallet</p>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {(['gold', 'silver', 'bronze'] as Tier[]).map(tier => {
          const cfg = TIER[tier]
          const n = stats[tier] || 0
          return (
            <div key={tier} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-3 text-center`}>
              <div className="text-2xl mb-0.5">{cfg.emoji}</div>
              <div className={`text-2xl font-black ${cfg.color}`}>{n}</div>
              <div className="text-xs text-gray-400">{cfg.label}</div>
            </div>
          )
        })}
      </div>
      {active.length === 0 && (
        <p className="text-xs text-gray-500 text-center">Earn tickets by playing casino games.</p>
      )}
    </div>
  )
}

// ── Entry options component ────────────────────────────────────────────────────
function EntryOptions({
  lottery, coupons, stats, onEntered
}: {
  lottery: Lottery
  coupons: Coupon[]
  stats: Record<string, number>
  onEntered: () => void
}) {
  const rules = parseCouponRules(lottery.coupon_entry_rules)
  const activeCoupons = coupons.filter(c => c.status === 'active')
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [showGame, setShowGame] = useState(false)

  // Group active coupons by tier for display
  const byTier = {
    gold:   activeCoupons.filter(c => c.tier === 'gold'),
    silver: activeCoupons.filter(c => c.tier === 'silver'),
    bronze: activeCoupons.filter(c => c.tier === 'bronze'),
  }

  const countSelected = (tier: Tier) => selectedCoupons.filter(id => activeCoupons.find(c => c.id === id && c.tier === tier)).length

  const selectTier = (tier: Tier, count: number) => {
    // Select exactly `count` coupons of this tier (deselect others of same tier first)
    const ofTier = byTier[tier].map(c => c.id)
    const others = selectedCoupons.filter(id => !ofTier.includes(id))
    setSelectedCoupons([...others, ...ofTier.slice(0, count)])
  }

  const doEnterDirect = async () => {
    setBusy(true); setMsg(null)
    try {
      const t = await api.post<any>('/tickets', { lottery_id: lottery.id, source: 'direct_purchase' })
      setMsg({ type: 'ok', text: `✅ Entered! Ticket #${t.ticket_code}` })
      onEntered()
    } catch (e: any) { setMsg({ type: 'err', text: e.message }) }
    finally { setBusy(false) }
  }

  const doRedeemCoupons = async () => {
    if (selectedCoupons.length === 0) return
    setBusy(true); setMsg(null)
    try {
      const t = await api.post<any>('/coupons/redeem', { lottery_id: lottery.id, coupons: selectedCoupons })
      setMsg({ type: 'ok', text: `✅ Entered with tickets! #${t.ticket_code}` })
      setSelectedCoupons([])
      onEntered()
    } catch (e: any) { setMsg({ type: 'err', text: e.message }) }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-3">
      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold text-center ${msg.type === 'ok' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
          {msg.text}
        </div>
      )}

      {/* ── Game Layer ── */}
      {lottery.game_layer_enabled && !showGame && (
        <button
          onClick={() => setShowGame(true)}
          className="w-full py-3 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white transition-all"
        >
          🎮 Play {Number(lottery.game_entry_price) > 0 ? `for ${lottery.game_entry_price} ${lottery.currency} to Win` : 'to Win'} {lottery.game_entries_per_win || 1} Ticket{lottery.game_entries_per_win !== 1 ? 's' : ''}
        </button>
      )}

      {showGame && (
        <ReactionGame
          lottery={lottery}
          onWin={() => {
            const entries = lottery.game_entries_per_win || 1
            setMsg({ type: 'ok', text: `🎉 You won ${entries} ticket${entries !== 1 ? 's' : ''}!` })
            setShowGame(false)
            onEntered()
          }}
          onCancel={() => setShowGame(false)}
        />
      )}

      {/* ── Coupon redemption ── */}
      {lottery.coupon_entry_enabled && rules.length > 0 && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🎟️</span>
            <p className="font-semibold text-sm text-white">Use Casino Tickets</p>
          </div>

          {/* Each redemption rule shown as a button-group */}
          <div className="space-y-2">
            {rules.map((rule, i) => {
              const cfg = TIER[rule.tier as Tier]
              const have = stats[rule.tier] || 0
              const canAfford = have >= rule.count
              const isSelected = countSelected(rule.tier as Tier) === rule.count

              return (
                <button
                  key={i}
                  onClick={() => canAfford && selectTier(rule.tier as Tier, rule.count)}
                  disabled={!canAfford}
                  className={`w-full flex items-center justify-between rounded-xl px-4 py-3 border transition-all ${
                    isSelected
                      ? `${cfg.bg} ${cfg.border} ring-1 ring-offset-1 ring-offset-gray-900 ring-yellow-500/60`
                      : canAfford
                        ? `bg-gray-700/50 border-gray-600 hover:border-gray-500`
                        : 'bg-gray-800/40 border-gray-700/50 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cfg.emoji}</span>
                    <div className="text-left">
                      <p className={`text-sm font-bold ${cfg.color}`}>{rule.count}× {cfg.label}</p>
                      <p className="text-xs text-gray-400">= 1 raffle entry</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${canAfford ? cfg.color : 'text-gray-500'}`}>
                      {have}/{rule.count}
                    </p>
                    <p className="text-xs text-gray-500">{canAfford ? 'available' : 'not enough'}</p>
                  </div>
                </button>
              )
            })}
          </div>

          <button
            onClick={doRedeemCoupons}
            disabled={busy || selectedCoupons.length === 0}
            className="w-full py-3 rounded-xl font-bold text-sm bg-yellow-500 hover:bg-yellow-400 text-black disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {busy ? 'Processing…' : selectedCoupons.length > 0 ? `Redeem ${selectedCoupons.length} Ticket${selectedCoupons.length !== 1 ? 's' : ''} for 1 Entry` : 'Select ticket option above'}
          </button>
        </div>
      )}

      {/* ── No coupons available hint ── */}
      {lottery.coupon_entry_enabled && rules.length > 0 && rules.every(r => (stats[r.tier] || 0) < r.count) && (
        <p className="text-xs text-center text-gray-500 -mt-1">
          Keep playing to earn more tickets and unlock free entries.
        </p>
      )}

      {/* ── Direct purchase ── */}
      {lottery.allow_direct_purchase && (
        <button
          onClick={doEnterDirect}
          disabled={busy}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 ${
            Number(lottery.ticket_price) === 0
              ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {busy ? 'Processing…' : Number(lottery.ticket_price) === 0
            ? 'Claim Free Entry'
            : `Buy Entry — ${lottery.ticket_price} ${lottery.currency}`}
        </button>
      )}
    </div>
  )
}

// ── Lottery Card (in list) ─────────────────────────────────────────────────────
function LotteryCard({
  lottery, myTickets, onSelect, isDark
}: {
  lottery: Lottery
  myTickets: Ticket[]
  onSelect: () => void
  isDark: boolean
}) {
  const remaining = useCountdown(lottery.end_date)
  const rules = parseCouponRules(lottery.coupon_entry_rules)
  const myCount = myTickets.filter(t => t.lottery_id === lottery.id && t.status === 'active').length
  const card = isDark ? 'bg-gray-800/70 border-gray-700' : 'bg-white border-gray-200'

  return (
    <div className={`rounded-2xl border overflow-hidden ${card}`}>
      {lottery.banner_image_url && (
        <div className="relative h-28">
          <img src={lottery.banner_image_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
            <span className="text-white font-bold text-sm drop-shadow">{lottery.name}</span>
            {lottery.show_countdown && (
              <span className="text-xs text-white/80 font-mono bg-black/40 px-2 py-0.5 rounded-full">
                {msToHms(remaining)}
              </span>
            )}
          </div>
        </div>
      )}
      {!lottery.banner_image_url && (
        <div className="px-4 pt-3 flex items-center justify-between">
          <p className="font-bold text-sm">{lottery.name}</p>
          {lottery.show_countdown && (
            <span className="text-xs text-gray-400 font-mono">{msToHms(remaining)}</span>
          )}
        </div>
      )}

      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-yellow-400 font-semibold">{lottery.prize_description}</span>
          {lottery.show_entries_count && (
            <span className="text-xs text-gray-400">{lottery.ticket_count} entries</span>
          )}
        </div>

        {/* Entry method badges */}
        <div className="flex flex-wrap gap-1">
          {lottery.allow_direct_purchase && Number(lottery.ticket_price) === 0 && (
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">Free Entry</span>
          )}
          {lottery.allow_direct_purchase && Number(lottery.ticket_price) > 0 && (
            <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
              €{lottery.ticket_price}
            </span>
          )}
          {lottery.coupon_entry_enabled && rules.map((r, i) => (
            <CouponBadge key={i} tier={r.tier as Tier} count={r.count} />
          ))}
          {lottery.game_layer_enabled && (
            <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">🎮 Play to Enter</span>
          )}
        </div>

        {/* My entries */}
        {myCount > 0 && (
          <p className="text-xs text-emerald-400">✓ You have {myCount} entr{myCount === 1 ? 'y' : 'ies'}</p>
        )}

        <button
          onClick={onSelect}
          className="w-full mt-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all"
        >
          Enter Now
        </button>
      </div>
    </div>
  )
}

// ── Main Widget ────────────────────────────────────────────────────────────────
export default function Widget() {
  const [params] = useSearchParams()
  const theme = params.get('theme') || 'dark'
  const isDark = theme !== 'light'
  const tokenParam = params.get('token')  // JWT passed directly from casino

  const [ready, setReady] = useState(false)
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [lotteries, setLotteries] = useState<Lottery[]>([])
  const [coupons, setCoupons]   = useState<Coupon[]>([])
  const [stats, setStats]       = useState<Record<string, number>>({ bronze: 0, silver: 0, gold: 0 })
  const [tickets, setTickets]   = useState<Ticket[]>([])
  const [selected, setSelected] = useState<Lottery | null>(null)

  // If casino passes ?token=JWT, store it
  useEffect(() => {
    if (tokenParam) {
      localStorage.setItem('token', tokenParam)
    }
    setReady(true)
  }, [tokenParam])

  const token = localStorage.getItem('token')
  const isAuth = !!token

  const refresh = () => {
    if (!isAuth) return
    api.get<Coupon[]>('/coupons').then(setCoupons).catch(() => {})
    api.get<Record<string, number>>('/coupons/stats').then(setStats).catch(() => {})
    api.get<Ticket[]>('/tickets').then(setTickets).catch(() => {})
  }

  useEffect(() => {
    if (!ready) return
    api.get<Lottery[]>('/lotteries').then(ls => {
      setLotteries(ls.filter(l => l.status === 'active'))
    })
    refresh()
  }, [ready, isAuth])

  const openDetail = (l: Lottery) => { setSelected(l); setView('detail') }
  const goBack = () => { setView('list'); setSelected(null) }

  const bg   = isDark ? 'bg-gray-900 text-white'     : 'bg-gray-50 text-gray-900'
  const muted = isDark ? 'text-gray-400'              : 'text-gray-500'
  const hdr  = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'

  if (!ready) return <div className={`${bg} min-h-screen flex items-center justify-center`}><span className="text-gray-400 text-sm">Loading…</span></div>

  return (
    <div className={`${bg} min-h-screen flex flex-col`} style={{ fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* ── Header ── */}
      <div className={`sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b ${hdr}`}>
        {view === 'detail' && (
          <button onClick={goBack} className="text-gray-400 hover:text-white text-lg leading-none">←</button>
        )}
        <span className="text-lg">🎟️</span>
        <span className="font-black text-sm tracking-tight">
          {view === 'list' ? 'Lottery Hub' : selected?.name}
        </span>
        {isAuth && view === 'list' && (
          <div className="ml-auto flex items-center gap-2">
            {(['gold', 'silver', 'bronze'] as Tier[]).map(tier => (
              stats[tier] > 0 && (
                <span key={tier} className={`text-xs font-bold ${TIER[tier].color}`}>
                  {TIER[tier].emoji}{stats[tier]}
                </span>
              )
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">

        {/* ── Lottery list ── */}
        {view === 'list' && (
          <>
            {/* Wallet */}
            {isAuth && <WalletBar stats={stats} coupons={coupons} />}

            {/* Not authenticated hint */}
            {!isAuth && (
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 text-sm text-indigo-300 text-center">
                Your account is connected automatically when you play.<br />
                <span className="text-xs text-gray-400 mt-1 block">Token passed via URL parameter from the casino.</span>
              </div>
            )}

            {/* How to earn */}
            {isAuth && (
              <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-gray-300 mb-1">How to earn tickets</p>
                <p className="text-xs text-gray-400">🥉 Bronze — wager €10+ on any game</p>
                <p className="text-xs text-gray-400">🥈 Silver — wager €50+ on any game</p>
                <p className="text-xs text-gray-400">🥇 Gold — wager €100+ on table games</p>
              </div>
            )}

            {/* Active lotteries */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Active Raffles ({lotteries.length})
              </p>
              <div className="space-y-3">
                {lotteries.map(l => (
                  <LotteryCard
                    key={l.id}
                    lottery={l}
                    myTickets={tickets}
                    onSelect={() => openDetail(l)}
                    isDark={isDark}
                  />
                ))}
                {lotteries.length === 0 && (
                  <p className="text-center text-gray-500 text-sm py-8">No active lotteries right now.</p>
                )}
              </div>
            </div>

            {/* My active entries summary */}
            {isAuth && tickets.filter(t => t.status === 'active').length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">My Entries</p>
                <div className="space-y-1">
                  {tickets.filter(t => t.status === 'active').map(t => (
                    <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-800/50 border border-gray-700/50 text-xs">
                      <span className="text-gray-300">{t.lottery_name}</span>
                      <span className="font-mono text-gray-500">{t.ticket_code}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Lottery detail ── */}
        {view === 'detail' && selected && (
          <div className="space-y-4">
            {/* Banner */}
            {selected.banner_image_url && (
              <div className="relative rounded-2xl overflow-hidden h-36">
                <img src={selected.banner_image_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-white font-black text-lg leading-tight">{selected.name}</p>
                  <p className="text-yellow-400 font-semibold text-sm">{selected.prize_description}</p>
                </div>
              </div>
            )}

            {/* Description */}
            <p className={`text-sm leading-relaxed ${muted}`}>{selected.description}</p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {[
                { label: 'Closes', value: new Date(selected.end_date).toLocaleDateString() },
                { label: 'Entries', value: selected.show_entries_count ? String(selected.ticket_count) : '—' },
                { label: 'Max / player', value: String(selected.max_entries_per_user) },
              ].map(s => (
                <div key={s.label} className="bg-gray-800/60 border border-gray-700 rounded-xl py-2">
                  <p className="text-white font-bold">{s.value}</p>
                  <p className="text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* My entries for this lottery */}
            {isAuth && (
              <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">My Entries ({tickets.filter(t => t.lottery_id === selected.id).length})</p>
                {tickets.filter(t => t.lottery_id === selected.id).length > 0 ? (
                  <div className="space-y-1.5">
                    {tickets.filter(t => t.lottery_id === selected.id).map(t => (
                      <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-900/60 border border-gray-700/40">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-400">{t.ticket_code}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 capitalize">{t.source.replace('_', ' ')}</span>
                        </div>
                        <span className="text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">You haven't entered this lottery yet.</p>
                )}
              </div>
            )}

            {/* Coupon rules explainer */}
            {selected.coupon_entry_enabled && parseCouponRules(selected.coupon_entry_rules).length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-3">
                <p className="text-xs font-semibold text-yellow-400 mb-1">🎟️ Ticket Redemption</p>
                <p className="text-xs text-gray-400">Use any one of these combinations for 1 free entry:</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {parseCouponRules(selected.coupon_entry_rules).map((r, i) => (
                    <CouponBadge key={i} tier={r.tier as Tier} count={r.count} />
                  ))}
                </div>
              </div>
            )}

            {/* Entry options */}
            {isAuth
              ? <EntryOptions lottery={selected} coupons={coupons} stats={stats} onEntered={refresh} />
              : (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 text-center text-sm text-indigo-300">
                  Your casino account is linked automatically.<br />
                  <span className="text-xs text-gray-500">If you see this, contact support.</span>
                </div>
              )
            }
          </div>
        )}
      </div>
    </div>
  )
}
