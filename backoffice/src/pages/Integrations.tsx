import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { api } from '../api'

interface Partner {
  id: string
  name: string
  partner_type: string
  is_active: boolean
  api_base_url: string | null
  api_key: string | null
  api_secret: string | null
  webhook_secret: string | null
  wallet_api_url: string | null
  wallet_provider: string | null
  payment_provider: string | null
  payment_methods: string | null
  payment_webhook_url: string | null
  casino_player_verification_url: string | null
  casino_game_list_url: string | null
  casino_external_id_prefix: string | null
  coupon_issuance_enabled: boolean
  coupon_issuance_rules: string | null
  gamification_enabled: boolean
  sync_enabled: boolean
  sync_direction: string | null
  sync_lottery_endpoint: string | null
  sync_interval_minutes: number | null
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

const blank: Omit<Partner, 'id' | 'created_at' | 'updated_at' | 'last_synced_at'> = {
  name: '', partner_type: 'casino', is_active: true,
  api_base_url: '', api_key: '', api_secret: '', webhook_secret: '',
  wallet_api_url: '', wallet_provider: '', payment_provider: '', payment_methods: '', payment_webhook_url: '',
  casino_player_verification_url: '', casino_game_list_url: '', casino_external_id_prefix: '',
  coupon_issuance_enabled: false, coupon_issuance_rules: '', gamification_enabled: false,
  sync_enabled: false, sync_direction: 'pull', sync_lottery_endpoint: '', sync_interval_minutes: 60,
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-block ml-1">
      <span className="text-gray-400 cursor-help text-xs" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>ⓘ</span>
      {open && <div className="absolute z-50 left-5 -top-1 bg-gray-800 text-white text-xs rounded-lg p-2.5 w-64 shadow-xl">{text}</div>}
    </span>
  )
}

function Field({ label, tip, children }: { label: string; tip?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}{tip && <Tip text={tip} />}</label>
      {children}
    </div>
  )
}

export default function Integrations() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [editing, setEditing] = useState<string | null>(null) // id or 'new'
  const [form, setForm] = useState<any>({ ...blank })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [section, setSection] = useState(0)

  const load = () => api.get<Partner[]>('/partners').then(setPartners).catch(() => {})
  useEffect(() => { load() }, [])

  const openNew = () => { setForm({ ...blank }); setEditing('new'); setSection(0) }
  const openEdit = (p: Partner) => {
    setForm({ ...p })
    setEditing(p.id)
    setSection(0)
  }

  const save = async () => {
    setSaving(true); setError('')
    try {
      const body: any = {}
      for (const [k, v] of Object.entries(form)) {
        body[k] = v === '' ? null : v
      }
      if (editing === 'new') {
        await api.post('/partners', body)
      } else {
        await api.patch(`/partners/${editing}`, body)
      }
      await load()
      setEditing(null)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this integration?')) return
    await api.delete(`/partners/${id}`)
    load()
  }

  const SECTIONS = ['API & Auth', 'Payments & Wallet', 'Casino Config', 'Coupons', 'Sync']

  const typeColor = (t: string) =>
    t === 'casino' ? 'bg-purple-100 text-purple-700' :
    t === 'retail' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Integrations</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage API credentials, wallets, and sync settings for each partner.</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Partner
        </button>
      </div>

      {/* Partner list */}
      {!editing && (
        <div className="space-y-3">
          {partners.length === 0 && (
            <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
              <p className="text-lg font-medium mb-1">No integrations yet</p>
              <p className="text-sm">Add your first partner to start syncing lotteries and processing entries.</p>
            </div>
          )}
          {partners.map(p => (
            <div key={p.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${typeColor(p.partner_type)}`}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{p.name}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColor(p.partner_type)}`}>{p.partner_type}</span>
                      {p.is_active
                        ? <span className="flex items-center gap-1 text-green-600 text-xs"><Wifi className="w-3 h-3" />Active</span>
                        : <span className="flex items-center gap-1 text-gray-400 text-xs"><WifiOff className="w-3 h-3" />Inactive</span>
                      }
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      {p.api_base_url && <span>API: {p.api_base_url}</span>}
                      {p.payment_provider && <span>Payments: {p.payment_provider}</span>}
                      {p.sync_enabled && <span className="flex items-center gap-1 text-blue-500"><RefreshCw className="w-3 h-3" />Sync {p.sync_direction}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(p.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex gap-4 text-xs">
                {p.coupon_issuance_enabled && <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded">🎟️ Coupon Issuance</span>}
                {p.gamification_enabled && <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">🎮 Gamification</span>}
                {p.sync_enabled && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">🔄 Auto-sync</span>}
                {p.last_synced_at && <span className="text-gray-400">Last sync: {new Date(p.last_synced_at).toLocaleString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / New drawer */}
      {editing && (
        <div className="bg-white rounded-xl border">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="font-bold text-lg">{editing === 'new' ? 'New Integration' : `Edit: ${form.name}`}</h2>
            <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          {/* Section tabs */}
          <div className="flex gap-1 p-3 border-b bg-gray-50 overflow-x-auto">
            {SECTIONS.map((s, i) => (
              <button key={i} onClick={() => setSection(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${section === i ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-200'}`}>
                {s}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-4">
            {/* Section 0: API & Auth */}
            {section === 0 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Partner Name" tip="Display name for this integration. e.g. 'Galaxy Casino' or 'BetMax Retail'">
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} placeholder="e.g. Galaxy Casino" />
                  </Field>
                  <Field label="Partner Type">
                    <select value={form.partner_type} onChange={e => setForm({...form, partner_type: e.target.value})} className={inputCls}>
                      <option value="casino">Casino (online/land-based)</option>
                      <option value="retail">Retail Chain</option>
                      <option value="online">Online-only Operator</option>
                    </select>
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 rounded" />
                  <span>Integration is active</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="API Base URL" tip="Root URL of the partner's API. e.g. https://api.partner.com/v2">
                    <input value={form.api_base_url || ''} onChange={e => setForm({...form, api_base_url: e.target.value})} className={inputCls} placeholder="https://api.partner.com/v1" />
                  </Field>
                  <Field label="API Key" tip="Your API key issued by the partner for server-to-server calls.">
                    <input value={form.api_key || ''} onChange={e => setForm({...form, api_key: e.target.value})} className={inputCls} placeholder="pk_live_..." type="password" />
                  </Field>
                  <Field label="API Secret" tip="API secret for signing requests. Never exposed to the frontend.">
                    <input value={form.api_secret || ''} onChange={e => setForm({...form, api_secret: e.target.value})} className={inputCls} placeholder="sk_live_..." type="password" />
                  </Field>
                  <Field label="Webhook Secret" tip="Used to sign and verify incoming webhook payloads via HMAC-SHA256.">
                    <input value={form.webhook_secret || ''} onChange={e => setForm({...form, webhook_secret: e.target.value})} className={inputCls} placeholder="whsec_..." type="password" />
                  </Field>
                </div>
              </>
            )}

            {/* Section 1: Payments & Wallet */}
            {section === 1 && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  Payment configuration here applies globally for this partner. Individual lotteries inherit these settings
                  unless overridden. These credentials are never exposed to the player frontend.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Payment Provider" tip="The payment processor used for direct purchases. e.g. Stripe, Adyen, Braintree.">
                    <select value={form.payment_provider || ''} onChange={e => setForm({...form, payment_provider: e.target.value})} className={inputCls}>
                      <option value="">— Select provider —</option>
                      <option value="stripe">Stripe</option>
                      <option value="adyen">Adyen</option>
                      <option value="braintree">Braintree</option>
                      <option value="paypal">PayPal</option>
                      <option value="klarna">Klarna</option>
                      <option value="internal">Internal Wallet</option>
                    </select>
                  </Field>
                  <Field label="Enabled Payment Methods" tip="Comma-separated list of methods to show at checkout. e.g. card,apple_pay,google_pay,klarna">
                    <input value={form.payment_methods || ''} onChange={e => setForm({...form, payment_methods: e.target.value})} className={inputCls} placeholder="card,apple_pay,google_pay" />
                  </Field>
                  <Field label="Wallet / Balance API URL" tip="Endpoint to debit/credit the player's internal casino balance for lottery purchases.">
                    <input value={form.wallet_api_url || ''} onChange={e => setForm({...form, wallet_api_url: e.target.value})} className={inputCls} placeholder="https://wallet.partner.com/api" />
                  </Field>
                  <Field label="Wallet Provider Name" tip="Internal label for the wallet system. e.g. everi, konami, igt.">
                    <input value={form.wallet_provider || ''} onChange={e => setForm({...form, wallet_provider: e.target.value})} className={inputCls} placeholder="e.g. everi_wallet" />
                  </Field>
                  <Field label="Payment Webhook URL" tip="URL in the partner's system to notify about payment events (charges, refunds, etc.)">
                    <input value={form.payment_webhook_url || ''} onChange={e => setForm({...form, payment_webhook_url: e.target.value})} className={inputCls} placeholder="https://partner.com/webhooks/payments" />
                  </Field>
                </div>
              </>
            )}

            {/* Section 2: Casino Config */}
            {section === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Player Verification URL" tip="Endpoint called to verify a casino player's eligibility (play amount, game type, etc.). We POST the player ID and receive eligibility status.">
                    <input value={form.casino_player_verification_url || ''} onChange={e => setForm({...form, casino_player_verification_url: e.target.value})} className={inputCls} placeholder="https://api.partner.com/players/verify" />
                  </Field>
                  <Field label="Game List URL" tip="Endpoint to fetch the partner's game catalogue. Used to populate the eligible games dropdown in lottery settings.">
                    <input value={form.casino_game_list_url || ''} onChange={e => setForm({...form, casino_game_list_url: e.target.value})} className={inputCls} placeholder="https://api.partner.com/games" />
                  </Field>
                  <Field label="External Player ID Prefix" tip="Prefix added to external player IDs for disambiguation when multiple partners are connected. e.g. 'CASINO1_'">
                    <input value={form.casino_external_id_prefix || ''} onChange={e => setForm({...form, casino_external_id_prefix: e.target.value})} className={inputCls} placeholder="e.g. CASINO1_" />
                  </Field>
                </div>
              </>
            )}

            {/* Section 3: Coupons */}
            {section === 3 && (
              <>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.coupon_issuance_enabled} onChange={e => setForm({...form, coupon_issuance_enabled: e.target.checked})} className="w-4 h-4 rounded" />
                  <span>Enable coupon issuance from this partner</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.gamification_enabled} onChange={e => setForm({...form, gamification_enabled: e.target.checked})} className="w-4 h-4 rounded" />
                  <span>Enable gamification hub in iFrame widget</span>
                </label>
                {form.coupon_issuance_enabled && (
                  <>
                    <Field label="Coupon Issuance Rules (JSON)" tip="JSON object defining when each tier of coupon is awarded. Keys are tier names (bronze/silver/gold). min_play is the minimum wager in currency.">
                      <textarea value={form.coupon_issuance_rules || ''} onChange={e => setForm({...form, coupon_issuance_rules: e.target.value})} rows={6} className={inputCls}
                        placeholder={`{\n  "bronze": { "min_play": 10, "games": ["slots"] },\n  "silver": { "min_play": 50, "games": ["slots","blackjack"] },\n  "gold":   { "min_play": 100, "games": ["slots","blackjack","roulette"] }\n}`} />
                    </Field>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                      <strong>How it works:</strong> After each qualifying session at the casino, the partner calls
                      <code className="bg-yellow-100 px-1 mx-1">POST /api/coupons</code> with the player's ID and earned tier.
                      Players can then view their coupons in the player app and redeem them for lottery entries.
                    </div>
                  </>
                )}
              </>
            )}

            {/* Section 4: Sync */}
            {section === 4 && (
              <>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.sync_enabled} onChange={e => setForm({...form, sync_enabled: e.target.checked})} className="w-4 h-4 rounded" />
                  <span>Enable lottery sync with this partner</span>
                </label>
                {form.sync_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Sync Direction" tip="Pull: we fetch lotteries from the partner. Push: we send our lotteries to the partner. Bidirectional: both.">
                      <select value={form.sync_direction || 'pull'} onChange={e => setForm({...form, sync_direction: e.target.value})} className={inputCls}>
                        <option value="pull">Pull (import from partner)</option>
                        <option value="push">Push (export to partner)</option>
                        <option value="bidirectional">Bidirectional</option>
                      </select>
                    </Field>
                    <Field label="Sync Interval (minutes)" tip="How often we automatically check for lottery updates.">
                      <input type="number" min={5} value={form.sync_interval_minutes || 60} onChange={e => setForm({...form, sync_interval_minutes: parseInt(e.target.value)})} className={inputCls} />
                    </Field>
                    <Field label="Partner Lottery Endpoint" tip="The URL on the partner's side we call to fetch their lottery list.">
                      <input value={form.sync_lottery_endpoint || ''} onChange={e => setForm({...form, sync_lottery_endpoint: e.target.value})} className={inputCls} placeholder="https://api.partner.com/lotteries" />
                    </Field>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border">
                  <strong>Sync protocol:</strong> We call the lottery endpoint with your API key in the <code>X-API-Key</code> header.
                  The partner returns a JSON array of lottery objects. We map their fields to our schema and create/update records automatically.
                  Lotteries are matched by <code>external_id</code>.
                </div>
              </>
            )}
          </div>

          {error && <p className="px-6 pb-2 text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
            <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              <Check className="w-4 h-4" />{saving ? 'Saving...' : 'Save Integration'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
