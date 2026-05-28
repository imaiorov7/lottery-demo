import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ArrowLeft, Info, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '../../api'

// ── Tooltip ──────────────────────────────────────────────────────────────────
function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-block ml-1">
      <Info
        className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-blue-500 inline"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      />
      {open && (
        <div className="absolute z-50 left-5 -top-1 bg-gray-800 text-white text-xs rounded-lg p-2.5 w-64 shadow-xl border border-gray-700">
          {text}
        </div>
      )}
    </span>
  )
}

// ── Field components ──────────────────────────────────────────────────────────
function Field({ label, tip, children }: { label: string; tip?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{tip && <Tip text={tip} />}
      </label>
      {children}
    </div>
  )
}

const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
const checkClass = "w-4 h-4 text-blue-600 rounded"

function Input({ k, form, set, type = 'text', placeholder = '' }: any) {
  return (
    <input type={type} value={form[k] ?? ''} onChange={e => set({ ...form, [k]: e.target.value })}
      placeholder={placeholder} className={inputClass} />
  )
}

function NumberInput({ k, form, set, min, placeholder = '' }: any) {
  return (
    <input type="number" min={min} value={form[k] ?? ''} onChange={e => set({ ...form, [k]: e.target.value })}
      placeholder={placeholder} className={inputClass} />
  )
}

function Select({ k, form, set, options }: { k: string; form: any; set: any; options: Array<{ value: string; label: string }> }) {
  return (
    <select value={form[k] ?? ''} onChange={e => set({ ...form, [k]: e.target.value })} className={inputClass}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Checkbox({ k, form, set, label }: any) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={!!form[k]} onChange={e => set({ ...form, [k]: e.target.checked })} className={checkClass} />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

function Textarea({ k, form, set, rows = 3, placeholder = '' }: any) {
  return (
    <textarea value={form[k] ?? ''} onChange={e => set({ ...form, [k]: e.target.value })}
      rows={rows} placeholder={placeholder} className={inputClass} />
  )
}

function Section({ title, children, collapsible = false }: { title: string; children: React.ReactNode; collapsible?: boolean }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button type="button" onClick={() => collapsible && setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-gray-50 ${collapsible ? 'cursor-pointer hover:bg-gray-100' : ''}`}>
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        {collapsible && (open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />)}
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
}

// ── Default form ──────────────────────────────────────────────────────────────
const defaultForm: Record<string, any> = {
  name: '', description: '', lottery_type: 'raffle', status: 'draft',
  // Partner-managed
  is_partner_managed: false, partner_id: null, external_lottery_id: '',
  partner_draw_url: '', partner_entry_webhook: '', last_synced_at: null,
  start_date: '', end_date: '', draw_date: '',
  is_recurring: false, recurrence_interval_hours: '',
  max_entries_per_user: 1, max_entries_per_user_per_day: '', max_entries_total: '',
  ticket_price: '0.00', currency: 'EUR',
  ticket_price_casino: '', ticket_price_physical: '',
  bulk_discount_threshold: '', bulk_discount_percent: '',
  draw_mode: 'manual', draw_winner_count: 1, draw_auto_complete: true,
  // Channels
  allow_direct_purchase: true, allow_casino_eligibility: false, allow_physical_sales: false,
  // Casino channel
  casino_online_enabled: false, casino_retail_enabled: false,
  casino_verification_method: 'api',
  casino_min_play_amount: '', casino_eligible_games: '',
  casino_eligibility_period_hours: '',
  // Physical
  physical_pos_enabled: true, physical_printer_enabled: false,
  physical_qr_code_enabled: true, physical_ticket_code_length: 12,
  physical_require_customer_id: false,
  // Game Layer
  game_layer_enabled: false, game_layer_type: 'none',
  game_min_score: 50, game_max_score: 100, game_duration_seconds: 30,
  game_entry_price: '', game_entries_per_win: 1,
  // Coupon entry
  coupon_entry_enabled: false, coupon_entry_rules: '',
  // Eligibility
  min_age: 18, allowed_countries: '', min_vip_level: '',
  require_kyc: false, min_account_age_days: '',
  // Display
  prize_description: '', brand_color: '#6366f1',
  banner_image_url: '', terms_and_conditions: '',
  show_countdown: true, show_entries_count: true, show_prize_pool: true,
  // Webhook (per-lottery, not integration)
  webhook_url: '', callback_url: '',
  // Prizes
  prize_tiers: [] as any[],
  // Coupon rules (parsed array for UI)
  _coupon_rules: [{ tier: 'gold', count: 1 }] as Array<{ tier: string; count: number }>,
}

const TABS = [
  { label: 'Setup', icon: '🎯' },
  { label: 'Entry Channels', icon: '🔗' },
  { label: 'Game Layer', icon: '🎮' },
  { label: 'Coupons', icon: '🎟️' },
  { label: 'Prize Tiers', icon: '🏆' },
  { label: 'Eligibility', icon: '✅' },
  { label: 'Display', icon: '🎨' },
  { label: 'Notifications', icon: '🔔' },
]

// ── Main component ─────────────────────────────────────────────────────────────
export default function LotteryEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const [tab, setTab] = useState(0)
  const [form, setForm] = useState<Record<string, any>>({ ...defaultForm })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id) {
      api.get<any>(`/lotteries/${id}`).then((l) => {
        const f: Record<string, any> = {}
        for (const key of Object.keys(defaultForm)) {
          if (key === 'start_date' || key === 'end_date' || key === 'draw_date') {
            f[key] = l[key]?.slice(0, 16) || ''
          } else if (key === 'prize_tiers') {
            f[key] = l[key] || []
          } else if (key === '_coupon_rules') {
            try { f[key] = l.coupon_entry_rules ? JSON.parse(l.coupon_entry_rules) : [{ tier: 'gold', count: 1 }] }
            catch { f[key] = [{ tier: 'gold', count: 1 }] }
          } else {
            f[key] = l[key] ?? defaultForm[key]
          }
        }
        setForm(f)
      })
    }
  }, [id])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body: Record<string, any> = { ...form }
      // Serialize coupon rules
      body.coupon_entry_rules = JSON.stringify(form._coupon_rules || [])
      delete body._coupon_rules
      // Clean up empty strings to null
      for (const k of Object.keys(body)) {
        if (body[k] === '') body[k] = null
      }
      if (isNew) {
        await api.post('/lotteries', body)
      } else {
        await api.patch(`/lotteries/${id}`, body)
      }
      navigate('/admin/lotteries')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const addPrizeTier = () => {
    const tiers = [...(form.prize_tiers || [])]
    tiers.push({ tier_order: tiers.length + 1, name: '', description: '', prize_value: '0', currency: form.currency || 'EUR', winner_count: 1, prize_type: 'cash' })
    setForm({ ...form, prize_tiers: tiers })
  }

  const updateTier = (i: number, key: string, val: any) => {
    const tiers = [...form.prize_tiers]
    tiers[i] = { ...tiers[i], [key]: val }
    setForm({ ...form, prize_tiers: tiers })
  }

  const removeTier = (i: number) => {
    setForm({ ...form, prize_tiers: form.prize_tiers.filter((_: any, idx: number) => idx !== i) })
  }

  const addCouponRule = () => {
    setForm({ ...form, _coupon_rules: [...(form._coupon_rules || []), { tier: 'bronze', count: 1 }] })
  }

  const updateCouponRule = (i: number, key: string, val: any) => {
    const rules = [...form._coupon_rules]
    rules[i] = { ...rules[i], [key]: key === 'count' ? Number(val) : val }
    setForm({ ...form, _coupon_rules: rules })
  }

  const removeCouponRule = (i: number) => {
    setForm({ ...form, _coupon_rules: form._coupon_rules.filter((_: any, idx: number) => idx !== i) })
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/lotteries')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'New Lottery' : 'Edit Lottery'}</h1>
        {!isNew && <span className="ml-auto text-xs text-gray-400 font-mono">ID: {id}</span>}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map((t, i) => (
          <button key={i} type="button" onClick={() => setTab(i)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === i ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <form onSubmit={save} className="space-y-4">
        {/* ── Tab 0: Setup ─────────────────────────────────────────── */}
        {tab === 0 && (
          <>
            {/* Partner-managed banner */}
            {form.is_partner_managed && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <span className="text-2xl">🔗</span>
                <div>
                  <p className="font-semibold text-amber-800 text-sm">Partner-Managed Lottery</p>
                  <p className="text-amber-700 text-xs mt-0.5">
                    This lottery is owned by the partner. Name, description, dates and draw are synced from their system and are read-only here.
                    You can only configure entry channels, coupon rules and display settings.
                  </p>
                  {form.external_lottery_id && (
                    <p className="text-amber-600 text-xs mt-1 font-mono">External ID: {form.external_lottery_id}</p>
                  )}
                  {form.last_synced_at && (
                    <p className="text-amber-600 text-xs">Last synced: {new Date(form.last_synced_at).toLocaleString()}</p>
                  )}
                  {form.partner_draw_url && (
                    <a href={form.partner_draw_url} target="_blank" rel="noreferrer"
                      className="text-xs text-amber-700 underline mt-1 inline-block">View draw on partner site →</a>
                  )}
                </div>
              </div>
            )}

            <Section title="Basic Information">
              {!form.is_partner_managed && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <input type="checkbox" id="partner_toggle" checked={!!form.is_partner_managed}
                    onChange={e => setForm({ ...form, is_partner_managed: e.target.checked })}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded" />
                  <label htmlFor="partner_toggle" className="cursor-pointer">
                    <p className="text-sm font-medium text-blue-800">Partner-managed lottery</p>
                    <p className="text-xs text-blue-600">Check this if the lottery is owned by a partner system. Timing and draw controls will be hidden — those are managed on their side.</p>
                  </label>
                </div>
              )}
              <Field label="Lottery Name" tip={form.is_partner_managed ? 'Read-only — synced from partner.' : 'The public-facing name players will see on the website and app.'}>
                <Input k="name" form={form} set={setForm} placeholder="e.g. Grand Summer Raffle 2025" />
              </Field>
              <Field label="Description" tip="Detailed description shown on the lottery page. Supports plain text.">
                <Textarea k="description" form={form} set={setForm} rows={3} placeholder="Tell players what this lottery is about, what they can win, and why they should enter..." />
              </Field>
              <Grid>
                <Field label="Type" tip="Raffle: random draw from all entries. Draw: scheduled draw event. Instant Win: player knows result immediately.">
                  <Select k="lottery_type" form={form} set={setForm} options={[
                    { value: 'raffle', label: 'Raffle' },
                    { value: 'draw', label: 'Prize Draw' },
                    { value: 'instant_win', label: 'Instant Win' },
                  ]} />
                </Field>
                <Field label="Status" tip="Draft: not visible to players. Active: live and accepting entries. Paused: visible but no new entries.">
                  <Select k="status" form={form} set={setForm} options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'active', label: 'Active' },
                    { value: 'paused', label: 'Paused' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]} />
                </Field>
              </Grid>
            </Section>

            {/* Timing — hidden for partner-managed (dates come from their system via sync) */}
            {!form.is_partner_managed ? (
              <Section title="Timing">
                <Grid>
                  <Field label="Start Date" tip="When the lottery opens for entries.">
                    <Input k="start_date" form={form} set={setForm} type="datetime-local" />
                  </Field>
                  <Field label="End Date" tip="When entries close. No new entries after this time.">
                    <Input k="end_date" form={form} set={setForm} type="datetime-local" />
                  </Field>
                  <Field label="Draw Date" tip="When the winner will be drawn. Can be set automatically by the system.">
                    <Input k="draw_date" form={form} set={setForm} type="datetime-local" />
                  </Field>
                  <Field label="Draw Mode" tip="Manual: admin triggers the draw. Automatic: draw runs at draw date. Scheduled: runs on a recurring schedule.">
                    <Select k="draw_mode" form={form} set={setForm} options={[
                      { value: 'manual', label: 'Manual (admin triggers)' },
                      { value: 'automatic', label: 'Automatic (at draw date)' },
                      { value: 'scheduled', label: 'Scheduled (recurring)' },
                    ]} />
                  </Field>
                </Grid>
                <Checkbox k="is_recurring" form={form} set={setForm} label="Recurring lottery (auto-recreates after each draw)" />
                {form.is_recurring && (
                  <Field label="Recurrence Interval (hours)" tip="How often (in hours) a new round is automatically created. e.g. 168 = weekly.">
                    <NumberInput k="recurrence_interval_hours" form={form} set={setForm} min={1} placeholder="168 (weekly)" />
                  </Field>
                )}
              </Section>
            ) : (
              <Section title="Timing (from partner)">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {[
                    { label: 'Start', val: form.start_date ? new Date(form.start_date).toLocaleString() : '—' },
                    { label: 'End', val: form.end_date ? new Date(form.end_date).toLocaleString() : '—' },
                    { label: 'Draw', val: form.draw_date ? new Date(form.draw_date).toLocaleString() : '—' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{s.label}</p>
                      <p className="font-semibold text-gray-700">{s.val}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-600">These dates are synced from the partner and cannot be edited here. The draw is also triggered by the partner system.</p>
              </Section>
            )}

            <Section title="Entry Limits & Pricing">
              <Grid>
                <Field label="Max Entries per User" tip="Total number of tickets one player can hold in this lottery across all entry methods.">
                  <NumberInput k="max_entries_per_user" form={form} set={setForm} min={1} />
                </Field>
                <Field label="Max Entries per Day" tip="Optional daily cap per user. Resets at midnight UTC.">
                  <NumberInput k="max_entries_per_user_per_day" form={form} set={setForm} min={1} placeholder="Unlimited" />
                </Field>
                <Field label="Total Entry Cap" tip="Maximum tickets across all users. Leave blank for unlimited.">
                  <NumberInput k="max_entries_total" form={form} set={setForm} min={1} placeholder="Unlimited" />
                </Field>
                {!form.is_partner_managed && (
                  <Field label="Draw - Winner Count" tip="How many winners are drawn in one draw event.">
                    <NumberInput k="draw_winner_count" form={form} set={setForm} min={1} />
                  </Field>
                )}
              </Grid>
              <Grid>
                <Field label="Ticket Price" tip="Base price for a direct purchase entry. Set 0.00 for free entry.">
                  <Input k="ticket_price" form={form} set={setForm} type="number" placeholder="0.00" />
                </Field>
                <Field label="Currency" tip="ISO 4217 currency code. e.g. EUR, USD, GBP.">
                  <Select k="currency" form={form} set={setForm} options={[
                    { value: 'EUR', label: 'EUR — Euro' },
                    { value: 'USD', label: 'USD — US Dollar' },
                    { value: 'GBP', label: 'GBP — British Pound' },
                    { value: 'CHF', label: 'CHF — Swiss Franc' },
                    { value: 'SEK', label: 'SEK — Swedish Krona' },
                  ]} />
                </Field>
                <Field label="Casino Entry Price Override" tip="Price when entry is purchased via the casino channel. Leave blank to use the base ticket price.">
                  <Input k="ticket_price_casino" form={form} set={setForm} type="number" placeholder="Same as base price" />
                </Field>
                <Field label="Physical Ticket Price Override" tip="Price when sold at a retail POS terminal. Leave blank to use the base ticket price.">
                  <Input k="ticket_price_physical" form={form} set={setForm} type="number" placeholder="Same as base price" />
                </Field>
                <Field label="Bulk Discount Threshold" tip="If a player buys this many tickets or more in one transaction, they get a discount.">
                  <NumberInput k="bulk_discount_threshold" form={form} set={setForm} min={2} placeholder="e.g. 5" />
                </Field>
                <Field label="Bulk Discount %" tip="Percentage discount applied when the bulk threshold is reached. e.g. 10 = 10% off.">
                  <NumberInput k="bulk_discount_percent" form={form} set={setForm} min={1} max={100} placeholder="e.g. 10" />
                </Field>
              </Grid>
            </Section>
          </>
        )}

        {/* ── Tab 1: Entry Channels ────────────────────────────────── */}
        {tab === 1 && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <strong>Entry Channels</strong> define <em>how</em> players can enter this lottery.
              Wallet, payment provider, and API credentials are managed globally in <strong>Settings → Integrations</strong>.
              Here you only decide which channels are enabled and any lottery-specific overrides.
            </div>

            <Section title="🖥️ Direct Purchase (Standalone Website)">
              <Checkbox k="allow_direct_purchase" form={form} set={setForm} label="Enable direct purchase channel" />
              {form.allow_direct_purchase && (
                <Grid>
                  <Checkbox k="direct_standalone_enabled" form={form} set={setForm} label="Show on standalone website" />
                  <Checkbox k="direct_iframe_enabled" form={form} set={setForm} label="Show in embedded widget / iframe" />
                </Grid>
              )}
            </Section>

            <Section title="🎰 Casino / Operator Channel">
              <Checkbox k="allow_casino_eligibility" form={form} set={setForm} label="Enable casino eligibility entry" />
              {form.allow_casino_eligibility && (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    Casino integration credentials (API keys, endpoints) are configured in <strong>Settings → Integrations</strong>.
                    Set the eligibility requirements for this specific lottery below.
                  </div>
                  <Grid>
                    <Checkbox k="casino_online_enabled" form={form} set={setForm} label="Online casino players" />
                    <Checkbox k="casino_retail_enabled" form={form} set={setForm} label="Retail / land-based casino players" />
                  </Grid>
                  <Grid>
                    <Field label="Verification Method" tip="How we confirm a player qualifies. API: query partner API. Player Card: scan loyalty card. IFRAME: display partner eligibility page.">
                      <Select k="casino_verification_method" form={form} set={setForm} options={[
                        { value: 'api', label: 'API (automatic)' },
                        { value: 'player_card', label: 'Player Card Scan' },
                        { value: 'iframe', label: 'Partner iFrame Check' },
                        { value: 'redirect', label: 'Redirect to Partner' },
                      ]} />
                    </Field>
                    <Field label="Minimum Play Amount" tip="Player must have wagered at least this amount (in the lottery currency) within the eligibility period to qualify.">
                      <NumberInput k="casino_min_play_amount" form={form} set={setForm} min={0} placeholder="e.g. 50.00" />
                    </Field>
                    <Field label="Eligibility Window (hours)" tip="How far back to look when checking if a player has reached the minimum play amount. e.g. 24 = last 24 hours only.">
                      <NumberInput k="casino_eligibility_period_hours" form={form} set={setForm} min={1} placeholder="e.g. 24" />
                    </Field>
                    <Field label="Eligible Games" tip="Comma-separated list of game types that count towards eligibility. Leave blank for all games. e.g. slots,blackjack,roulette">
                      <Input k="casino_eligible_games" form={form} set={setForm} placeholder="slots,blackjack,roulette" />
                    </Field>
                  </Grid>
                  <Grid>
                    <Checkbox k="casino_require_player_card" form={form} set={setForm} label="Require physical player card scan" />
                    <Checkbox k="casino_use_two_way_code" form={form} set={setForm} label="Use two-way verification code" />
                  </Grid>
                </>
              )}
            </Section>

            <Section title="🏪 Physical / Retail Sales (POS)">
              <Checkbox k="allow_physical_sales" form={form} set={setForm} label="Enable physical retail ticket sales" />
              {form.allow_physical_sales && (
                <Grid>
                  <Checkbox k="physical_pos_enabled" form={form} set={setForm} label="POS terminal sales" />
                  <Checkbox k="physical_printer_enabled" form={form} set={setForm} label="Thermal printer support" />
                  <Checkbox k="physical_qr_code_enabled" form={form} set={setForm} label="QR code on printed ticket" />
                  <Checkbox k="physical_require_customer_id" form={form} set={setForm} label="Require customer ID at point of sale" />
                  <Field label="Ticket Code Length" tip="Length of the physical ticket alphanumeric code. Default 12.">
                    <NumberInput k="physical_ticket_code_length" form={form} set={setForm} min={6} max={32} />
                  </Field>
                </Grid>
              )}
            </Section>
          </>
        )}

        {/* ── Tab 2: Game Layer ─────────────────────────────────────── */}
        {tab === 2 && (
          <>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800">
              <strong>Game Layer</strong> — players pay a small fee to play a mini-game. If they score above the threshold,
              they earn a lottery entry. This is separate from direct purchase and adds a gamification element to your campaign.
            </div>
            <Section title="Game Layer Settings">
              <Checkbox k="game_layer_enabled" form={form} set={setForm} label="Enable game layer for this lottery" />
              {form.game_layer_enabled && (
                <>
                  <Grid>
                    <Field label="Game Type" tip="The type of mini-game players play to earn entries.">
                      <Select k="game_layer_type" form={form} set={setForm} options={[
                        { value: 'spin_wheel', label: 'Tap Attack (tap targets)' },
                        { value: 'scratch_card', label: 'Scratch Card' },
                        { value: 'pick_number', label: 'Pick a Number' },
                        { value: 'slot_spin', label: 'Slot Spin' },
                      ]} />
                    </Field>
                    <Field label="Game Entry Fee" tip="Cost to play one game session. Players pay this to start the game, regardless of outcome.">
                      <NumberInput k="game_entry_price" form={form} set={setForm} min={0} placeholder="e.g. 1.00" />
                    </Field>
                    <Field label="Minimum Score to Qualify" tip="Player must achieve at least this score to earn a lottery entry. Score is out of the Max Score.">
                      <NumberInput k="game_min_score" form={form} set={setForm} min={0} />
                    </Field>
                    <Field label="Maximum Possible Score" tip="The upper bound of the game score. Used to display progress to the player.">
                      <NumberInput k="game_max_score" form={form} set={setForm} min={1} />
                    </Field>
                    <Field label="Game Duration (seconds)" tip="How long each game session lasts.">
                      <NumberInput k="game_duration_seconds" form={form} set={setForm} min={5} />
                    </Field>
                    <Field label="Entries Awarded on Win" tip="How many lottery tickets the player receives when they qualify.">
                      <NumberInput k="game_entries_per_win" form={form} set={setForm} min={1} />
                    </Field>
                  </Grid>
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border">
                    <strong>Example:</strong> Entry fee = 1 EUR, Min score = 50 / 100, Duration = 30s, Awards = 1 entry.
                    A player pays 1 EUR, plays for 30 seconds. If they score 50+, they get 1 lottery ticket.
                    If they score below 50, they lose the fee.
                  </div>
                </>
              )}
            </Section>
          </>
        )}

        {/* ── Tab 3: Coupons ────────────────────────────────────────── */}
        {tab === 3 && (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
              <strong>Coupon Entry</strong> — players collect Bronze, Silver, and Gold coupons through casino gameplay or promotions.
              They can redeem these coupons to enter this lottery without paying cash.
              Each rule below defines one valid redemption combination.
            </div>
            <Section title="Coupon Entry Settings">
              <Checkbox k="coupon_entry_enabled" form={form} set={setForm} label="Allow coupon redemption for entries" />
              {form.coupon_entry_enabled && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">Redemption Rules</p>
                      <button type="button" onClick={addCouponRule}
                        className="flex items-center gap-1 text-blue-600 text-xs hover:text-blue-800">
                        <Plus className="w-3.5 h-3.5" /> Add Rule
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Each row is an alternative way to earn 1 entry. A player can use any ONE of these combinations.</p>

                    {(form._coupon_rules || []).map((rule: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 border rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-500 w-6">{i + 1}.</span>
                        <select value={rule.tier} onChange={e => updateCouponRule(i, 'tier', e.target.value)}
                          className="border rounded px-2 py-1 text-sm">
                          <option value="bronze">🥉 Bronze</option>
                          <option value="silver">🥈 Silver</option>
                          <option value="gold">🥇 Gold</option>
                        </select>
                        <span className="text-xs text-gray-400">×</span>
                        <input type="number" min={1} value={rule.count} onChange={e => updateCouponRule(i, 'count', e.target.value)}
                          className="border rounded px-2 py-1 text-sm w-16" />
                        <span className="text-xs text-gray-500">coupons = 1 entry</span>
                        <button type="button" onClick={() => removeCouponRule(i)} className="ml-auto text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {(form._coupon_rules || []).length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No rules yet. Add at least one rule.</p>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border">
                    <strong>Example:</strong> Rule 1: 1 Gold coupon = 1 entry. Rule 2: 2 Silver coupons = 1 entry. Rule 3: 3 Bronze coupons = 1 entry.
                    A player with 1 Gold OR 2 Silver OR 3 Bronze can enter once.
                    Coupon issuance rules are configured in <strong>Settings → Integrations</strong>.
                  </div>
                </>
              )}
            </Section>
          </>
        )}

        {/* ── Tab 4: Prize Tiers ───────────────────────────────────── */}
        {tab === 4 && (
          <Section title="Prize Tiers">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">Define all prize positions. Tier 1 is the grand prize.</p>
              <button type="button" onClick={addPrizeTier}
                className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
                <Plus className="w-3.5 h-3.5" /> Add Tier
              </button>
            </div>
            <Field label="Prize Description (summary)" tip="Short text shown on the lottery card, e.g. '10,000 EUR Cash Prize'">
              <Input k="prize_description" form={form} set={setForm} placeholder="e.g. 10,000 EUR Cash Prize + 5 Runner-Up Bonuses" />
            </Field>
            <div className="space-y-3 mt-2">
              {(form.prize_tiers || []).map((tier: any, i: number) => (
                <div key={i} className="border rounded-xl p-4 bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-gray-700">Prize #{i + 1}</span>
                    <button type="button" onClick={() => removeTier(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Name</label>
                      <input value={tier.name} onChange={e => updateTier(i, 'name', e.target.value)}
                        placeholder="e.g. Grand Prize" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Type</label>
                      <select value={tier.prize_type} onChange={e => updateTier(i, 'prize_type', e.target.value)} className={inputClass}>
                        <option value="cash">Cash</option>
                        <option value="bonus">Bonus Credit</option>
                        <option value="freebet">Free Bet</option>
                        <option value="physical">Physical Prize</option>
                        <option value="experience">Experience</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Value ({form.currency})</label>
                      <input type="number" value={tier.prize_value} onChange={e => updateTier(i, 'prize_value', e.target.value)}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Winners</label>
                      <input type="number" min={1} value={tier.winner_count} onChange={e => updateTier(i, 'winner_count', parseInt(e.target.value))}
                        className={inputClass} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Description</label>
                      <input value={tier.description || ''} onChange={e => updateTier(i, 'description', e.target.value)}
                        placeholder="Optional prize details" className={inputClass} />
                    </div>
                  </div>
                </div>
              ))}
              {(form.prize_tiers || []).length === 0 && (
                <p className="text-center text-gray-400 text-sm py-6">No prize tiers yet. Add at least one.</p>
              )}
            </div>
          </Section>
        )}

        {/* ── Tab 5: Eligibility ──────────────────────────────────── */}
        {tab === 5 && (
          <Section title="Player Eligibility Requirements">
            <p className="text-sm text-gray-500">Set conditions players must meet to enter this lottery.</p>
            <Grid>
              <Field label="Minimum Age" tip="Players below this age will be blocked from entering. Default 18. Set 0 to disable.">
                <NumberInput k="min_age" form={form} set={setForm} min={0} placeholder="18" />
              </Field>
              <Field label="Minimum Account Age (days)" tip="Player's account must be this many days old. Prevents new fake accounts from entering.">
                <NumberInput k="min_account_age_days" form={form} set={setForm} min={0} placeholder="e.g. 7" />
              </Field>
              <Field label="Minimum VIP Level" tip="Only players at or above this VIP tier can enter. Levels are defined in partner integration config.">
                <NumberInput k="min_vip_level" form={form} set={setForm} min={0} placeholder="e.g. 2" />
              </Field>
              <Field label="Allowed Countries" tip="Comma-separated ISO country codes. Leave blank for all countries. e.g. DE,AT,CH">
                <Input k="allowed_countries" form={form} set={setForm} placeholder="DE,AT,CH,GB" />
              </Field>
            </Grid>
            <Checkbox k="require_kyc" form={form} set={setForm} label="Require completed KYC (identity verification) to enter" />
          </Section>
        )}

        {/* ── Tab 6: Display ──────────────────────────────────────── */}
        {tab === 6 && (
          <>
            <Section title="Visual & Branding">
              <Grid>
                <Field label="Brand Colour" tip="Accent colour used on buttons, progress bars, and highlights for this lottery.">
                  <div className="flex gap-2">
                    <input type="color" value={form.brand_color || '#6366f1'} onChange={e => setForm({ ...form, brand_color: e.target.value })}
                      className="h-10 w-16 rounded border cursor-pointer" />
                    <Input k="brand_color" form={form} set={setForm} placeholder="#6366f1" />
                  </div>
                </Field>
                <Field label="Banner Image URL" tip="Full URL of the banner image shown at the top of the lottery page. Recommended 800×300px.">
                  <Input k="banner_image_url" form={form} set={setForm} placeholder="https://..." />
                </Field>
              </Grid>
              {form.banner_image_url && (
                <div className="rounded-lg overflow-hidden border">
                  <img src={form.banner_image_url} alt="Banner preview" className="w-full h-32 object-cover" />
                </div>
              )}
            </Section>

            <Section title="Display Options">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Checkbox k="show_countdown" form={form} set={setForm} label="Show countdown timer" />
                <Checkbox k="show_entries_count" form={form} set={setForm} label="Show total entry count" />
                <Checkbox k="show_prize_pool" form={form} set={setForm} label="Show prize pool value" />
              </div>
            </Section>

            <Section title="Terms & Conditions" collapsible>
              <Field label="Terms & Conditions" tip="Full legal text. Shown in a collapsible section on the lottery page. Players must accept these to enter.">
                <Textarea k="terms_and_conditions" form={form} set={setForm} rows={8}
                  placeholder="1. This lottery is open to residents of...\n2. Participants must be 18 or over..." />
              </Field>
            </Section>

            <Section title="Custom CSS" collapsible>
              <Field label="Custom CSS" tip="Advanced: inject custom CSS to override the default lottery page styling. Only for white-label deployments.">
                <Textarea k="custom_css" form={form} set={setForm} rows={5} placeholder=".lottery-hero { background: linear-gradient(...) }" />
              </Field>
            </Section>
          </>
        )}

        {/* ── Tab 7: Notifications ─────────────────────────────────── */}
        {tab === 7 && (
          <>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700">
              Configure where this lottery sends event notifications.
              For global payment and casino integration webhooks, go to <strong>Settings → Integrations</strong>.
            </div>
            <Section title="Per-Lottery Webhooks">
              <Grid>
                <Field label="Draw Result Webhook URL" tip="POST request sent to this URL when the draw completes, containing winner list and ticket codes.">
                  <Input k="webhook_url" form={form} set={setForm} placeholder="https://yourplatform.com/webhooks/lottery-draw" />
                </Field>
                <Field label="Entry Callback URL" tip="POST request sent each time a new entry is registered. Useful for real-time player notifications.">
                  <Input k="callback_url" form={form} set={setForm} placeholder="https://yourplatform.com/webhooks/lottery-entry" />
                </Field>
              </Grid>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border space-y-1">
                <p><strong>Draw webhook payload:</strong> <code>{`{ "event": "draw_complete", "lottery_id": "...", "winners": [...] }`}</code></p>
                <p><strong>Entry callback payload:</strong> <code>{`{ "event": "entry_created", "lottery_id": "...", "ticket_code": "...", "user_id": "..." }`}</code></p>
                <p>Requests are signed with HMAC-SHA256 using the webhook secret set in <strong>Settings → Integrations</strong>.</p>
              </div>
            </Section>
          </>
        )}

        {/* ── Save bar ───────────────────────────────────────────────── */}
        <div className="sticky bottom-0 bg-white border-t py-4 flex items-center justify-between gap-3 -mx-6 px-6">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="ml-auto flex gap-3">
            <button type="button" onClick={() => navigate('/admin/lotteries')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : isNew ? 'Create Lottery' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
