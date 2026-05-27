import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <button onClick={copy} className="absolute top-2 right-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function Code({ children, lang = 'json' }: { children: string; lang?: string }) {
  return (
    <div className="relative">
      <pre className={`bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto border border-gray-700 language-${lang}`}>
        <code>{children.trim()}</code>
      </pre>
      <CopyButton text={children.trim()} />
    </div>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3 border-b pb-2">{children}</h2>
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">{children}</h3>
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-600 leading-relaxed mb-3">{children}</p>
}
function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mr-1 ${color}`}>{children}</span>
}

const SECTIONS = [
  'Overview',
  'Authentication',
  'Lottery Sync',
  'Player Verification',
  'Coupon Issuance',
  'Entry Flow',
  'Webhooks',
  'Widget Embed',
  'Error Codes',
]

export default function IntegrationDocs() {
  const [active, setActive] = useState(0)
  const BASE = 'https://your-domain.com/api'

  return (
    <div className="flex gap-6">
      {/* Sidebar nav */}
      <div className="w-52 shrink-0">
        <div className="sticky top-0 bg-white border rounded-xl p-3 space-y-0.5">
          <p className="text-xs font-semibold text-gray-400 px-2 pb-2 uppercase tracking-wider">Integration Guide</p>
          {SECTIONS.map((s, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${active === i ? 'bg-blue-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl">
        <div className="bg-white border rounded-xl p-6">

          {/* ── Overview ── */}
          {active === 0 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Integration Overview</h1>
              <p className="text-gray-500 text-sm mb-6">Everything you need to connect your platform to the Lottery Engine.</p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { title: 'REST API', desc: 'Full CRUD over HTTPS with JWT auth', icon: '🔌' },
                  { title: 'Webhooks', desc: 'Real-time push events to your backend', icon: '📡' },
                  { title: 'Widget / iFrame', desc: 'Embed the lottery UI in your casino site', icon: '🖼️' },
                ].map(c => (
                  <div key={c.title} className="border rounded-xl p-4">
                    <div className="text-2xl mb-2">{c.icon}</div>
                    <div className="font-semibold text-sm text-gray-800">{c.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{c.desc}</div>
                  </div>
                ))}
              </div>

              <H2>Main Integration Flow</H2>
              <div className="space-y-2">
                {[
                  ['1', 'Create a Partner Integration in Settings → Integrations with your API credentials.'],
                  ['2', 'Set up Lottery Sync to pull your existing lotteries automatically, or create them manually.'],
                  ['3', 'Configure which entry channels each lottery supports (direct purchase, casino eligibility, coupon redemption).'],
                  ['4', 'Embed the Widget iFrame in your casino site for players to view lotteries and earn coupons.'],
                  ['5', 'Call the Coupon API from your casino backend to award Bronze/Silver/Gold coupons after qualifying play.'],
                  ['6', 'Listen to Webhooks for draw results and entry confirmations.'],
                ].map(([n, t]) => (
                  <div key={n} className="flex gap-3 items-start text-sm">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">{n}</span>
                    <span className="text-gray-600 pt-0.5">{t}</span>
                  </div>
                ))}
              </div>

              <H2>Base URL</H2>
              <Code lang="bash">{`${BASE}`}</Code>

              <H2>API Versioning</H2>
              <P>The API is currently at v1 (implicit). Breaking changes will be released as v2 with a migration period.</P>
            </>
          )}

          {/* ── Authentication ── */}
          {active === 1 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Authentication</h1>
              <P>All protected endpoints require a JWT Bearer token. Obtain one via the login endpoint.</P>

              <H3>Login</H3>
              <Code lang="bash">{`POST ${BASE}/auth/login
Content-Type: application/json

{
  "email": "admin@yourdomain.com",
  "password": "your-password"
}`}</Code>

              <H3>Response</H3>
              <Code>{`{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}`}</Code>

              <H3>Using the token</H3>
              <Code lang="bash">{`GET ${BASE}/lotteries
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}</Code>

              <H3>Token Claims</H3>
              <P>The JWT payload contains:</P>
              <Code>{`{
  "sub": "user-uuid",
  "role": "admin",        // admin | player | pos_operator
  "email": "admin@...",
  "exp": 1700000000
}`}</Code>

              <H3>Machine-to-Machine (Backend API)</H3>
              <P>For backend-to-backend calls (e.g. awarding coupons), use your admin credentials or a dedicated service account. Store credentials securely — never in frontend code.</P>

              <H3>Server-to-Server Partner Webhook Auth</H3>
              <P>Incoming webhooks from partners are verified by computing HMAC-SHA256 over the raw request body using the <code>webhook_secret</code> set in the integration config, and comparing to the <code>X-Signature-256</code> header.</P>
              <Code lang="python">{`import hmac, hashlib

def verify_webhook(body: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)`}</Code>
            </>
          )}

          {/* ── Lottery Sync ── */}
          {active === 2 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Lottery Sync</h1>
              <P>If you already manage lotteries on your platform, you can pull them into the Lottery Engine automatically.</P>

              <H3>How Pull Sync Works</H3>
              <P>We call your <code>sync_lottery_endpoint</code> (configured in the integration) on the specified interval. Your endpoint must return a JSON array of lottery objects:</P>
              <Code>{`GET https://your-platform.com/api/lotteries
X-API-Key: your-api-key

Response 200:
[
  {
    "external_id": "lot-12345",
    "name": "Weekly Jackpot",
    "description": "Win up to €10,000 every week",
    "status": "active",
    "start_date": "2025-06-01T00:00:00Z",
    "end_date": "2025-06-07T23:59:59Z",
    "draw_date": "2025-06-08T12:00:00Z",
    "ticket_price": "5.00",
    "currency": "EUR",
    "prize_description": "€10,000 cash",
    "banner_image_url": "https://cdn.your-platform.com/banners/weekly.jpg",
    "max_entries_per_user": 5
  }
]`}</Code>

              <H3>Field Mapping</H3>
              <P>Fields not provided will use system defaults. The <code>external_id</code> field is used to match updates on subsequent syncs — lotteries with the same <code>external_id</code> are updated, not duplicated.</P>

              <H3>Manual Trigger</H3>
              <Code lang="bash">{`POST ${BASE}/partners/{partner_id}/sync
Authorization: Bearer admin-token`}</Code>
            </>
          )}

          {/* ── Player Verification ── */}
          {active === 3 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Player Verification</h1>
              <P>The casino eligibility channel checks whether a player has qualified for a free or discounted lottery entry based on their gameplay.</P>

              <H3>Verification Flow</H3>
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                {[
                  'Player clicks "Claim Entry" on the casino widget.',
                  'We call your player_verification_url with the player\'s external ID.',
                  'Your system checks if the player has met the qualifying criteria.',
                  'You return eligible: true/false with optional reason.',
                  'If eligible, we create a ticket automatically.',
                ].map((s, i) => (
                  <div key={i} className="flex gap-2"><span className="text-blue-500 font-bold">{i + 1}.</span>{s}</div>
                ))}
              </div>

              <H3>Verification Request (we send to you)</H3>
              <Code>{`POST https://your-platform.com/players/verify
X-API-Key: your-api-key
Content-Type: application/json

{
  "external_player_id": "CASINO1_player-uuid",
  "lottery_id": "lottery-uuid",
  "check_type": "casino_eligibility"
}`}</Code>

              <H3>Your Response</H3>
              <Code>{`// Eligible
{
  "eligible": true,
  "player_name": "John D.",
  "play_amount_eur": 75.50,
  "qualifying_games": ["Book of Ra", "Starburst"]
}

// Not eligible
{
  "eligible": false,
  "reason": "Minimum play amount not reached (need €50, have €23.00)"
}`}</Code>

              <H3>Alternative: Push Eligibility</H3>
              <P>Instead of us calling you, your system can push eligibility events to us:</P>
              <Code lang="bash">{`POST ${BASE}/tickets/casino-eligibility
X-API-Key: your-admin-key
Content-Type: application/json

{
  "external_player_id": "CASINO1_player-uuid",
  "lottery_id": "lottery-uuid"
}`}</Code>
            </>
          )}

          {/* ── Coupon Issuance ── */}
          {active === 4 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Coupon Issuance</h1>
              <P>Award Bronze, Silver, or Gold coupons to players as they play on your platform. Players collect these in their wallet and redeem them for lottery entries.</P>

              <H3>Coupon Tiers</H3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { tier: 'Bronze 🥉', bg: 'bg-amber-50 border-amber-200', desc: 'Low-stakes play (e.g. €10+ wager)' },
                  { tier: 'Silver 🥈', bg: 'bg-gray-50 border-gray-300', desc: 'Mid-stakes play (e.g. €50+ wager)' },
                  { tier: 'Gold 🥇', bg: 'bg-yellow-50 border-yellow-300', desc: 'High-stakes play (e.g. €100+ wager)' },
                ].map(t => (
                  <div key={t.tier} className={`border rounded-xl p-3 ${t.bg}`}>
                    <div className="font-semibold text-sm mb-1">{t.tier}</div>
                    <div className="text-xs text-gray-600">{t.desc}</div>
                  </div>
                ))}
              </div>

              <H3>Issue a Coupon (from your backend)</H3>
              <Code lang="bash">{`POST ${BASE}/coupons
Authorization: Bearer admin-token
Content-Type: application/json

{
  "user_id": "player-uuid",
  "tier": "gold",
  "source": "casino_play",
  "source_ref": "session-12345"
}`}</Code>

              <H3>Response</H3>
              <Code>{`{
  "id": "coupon-uuid",
  "user_id": "player-uuid",
  "tier": "gold",
  "status": "active",
  "source": "casino_play",
  "created_at": "2025-06-01T14:30:00Z"
}`}</Code>

              <H3>Check Player's Coupon Balance</H3>
              <Code lang="bash">{`GET ${BASE}/coupons/stats
Authorization: Bearer player-token

Response:
{ "bronze": 3, "silver": 1, "gold": 2 }`}</Code>

              <H3>Redemption Rules</H3>
              <P>Each lottery defines what combinations of coupons can be exchanged for one entry. Example configured on a lottery:</P>
              <Code>{`// 1 Gold = 1 entry, OR 2 Silver = 1 entry, OR 3 Bronze = 1 entry
[
  { "tier": "gold",   "count": 1 },
  { "tier": "silver", "count": 2 },
  { "tier": "bronze", "count": 3 }
]`}</Code>

              <H3>Player Redeems Coupons</H3>
              <Code lang="bash">{`POST ${BASE}/coupons/redeem
Authorization: Bearer player-token
Content-Type: application/json

{
  "lottery_id": "lottery-uuid",
  "coupons": ["coupon-id-1", "coupon-id-2"]
}

// Returns: TicketOut (the new lottery ticket)`}</Code>
            </>
          )}

          {/* ── Entry Flow ── */}
          {active === 5 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Entry Flow</h1>
              <P>There are four ways a player can get a lottery entry.</P>

              {[
                {
                  title: '1. Direct Purchase',
                  badge: <Badge color="bg-blue-100 text-blue-700">POST /api/tickets</Badge>,
                  body: `POST ${BASE}/tickets
Authorization: Bearer player-token
Content-Type: application/json

{
  "lottery_id": "lottery-uuid",
  "source": "direct_purchase"
}`,
                },
                {
                  title: '2. Casino Eligibility (push)',
                  badge: <Badge color="bg-purple-100 text-purple-700">POST /api/tickets/casino-eligibility</Badge>,
                  body: `POST ${BASE}/tickets/casino-eligibility
Content-Type: application/json

{
  "external_player_id": "CASINO1_abc123",
  "lottery_id": "lottery-uuid"
}`,
                },
                {
                  title: '3. Coupon Redemption',
                  badge: <Badge color="bg-yellow-100 text-yellow-700">POST /api/coupons/redeem</Badge>,
                  body: `POST ${BASE}/coupons/redeem
Authorization: Bearer player-token
Content-Type: application/json

{
  "lottery_id": "lottery-uuid",
  "coupons": ["coupon-id-1"]
}`,
                },
                {
                  title: '4. Game Layer Win',
                  badge: <Badge color="bg-green-100 text-green-700">POST /api/game/start + /api/game/submit</Badge>,
                  body: `// Step 1: Start game session
POST ${BASE}/game/start
Authorization: Bearer player-token
{ "lottery_id": "lottery-uuid" }

// Step 2: Submit score (ticket awarded if score >= min_score_required)
POST ${BASE}/game/submit
Authorization: Bearer player-token
{ "session_id": "session-uuid", "score": 75 }`,
                },
              ].map(item => (
                <div key={item.title} className="mb-5">
                  <H3>{item.title}</H3>
                  {item.badge}
                  <div className="mt-2"><Code lang="bash">{item.body}</Code></div>
                </div>
              ))}
            </>
          )}

          {/* ── Webhooks ── */}
          {active === 6 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Webhooks</h1>
              <P>Configure webhook URLs on each lottery to receive real-time POST events. We also support global partner-level webhooks for payment events.</P>

              <H3>Draw Complete</H3>
              <Code>{`// Sent to lottery.webhook_url on draw completion
{
  "event": "draw_complete",
  "lottery_id": "lottery-uuid",
  "lottery_name": "Weekly Jackpot",
  "drawn_at": "2025-06-08T12:00:00Z",
  "winners": [
    {
      "ticket_code": "A1B2C3D4E5F6",
      "user_id": "player-uuid",
      "user_name": "John D.",
      "prize_tier": "Grand Prize"
    }
  ]
}`}</Code>

              <H3>Entry Created</H3>
              <Code>{`// Sent to lottery.callback_url on each new entry
{
  "event": "entry_created",
  "lottery_id": "lottery-uuid",
  "ticket_code": "A1B2C3D4E5F6",
  "user_id": "player-uuid",
  "source": "direct_purchase",
  "created_at": "2025-06-01T14:30:00Z"
}`}</Code>

              <H3>Retry Policy</H3>
              <P>Failed webhooks (non-2xx response) are retried up to 5 times with exponential backoff: 1min, 5min, 30min, 2h, 12h. After 5 failures the webhook is marked failed and an alert is raised in the backoffice.</P>

              <H3>Signature Verification</H3>
              <Code lang="python">{`import hmac, hashlib

def verify(raw_body: bytes, header: str, secret: str) -> bool:
    sig = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={sig}", header)`}</Code>
            </>
          )}

          {/* ── Widget Embed ── */}
          {active === 7 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Widget & iFrame Embed</h1>
              <P>Embed the lottery hub directly in your casino website. Players can browse lotteries, check their coupons, and enter — all without leaving your site.</P>

              <H3>Basic iFrame Embed</H3>
              <Code lang="html">{`<iframe
  src="https://your-lottery-domain.com/widget?partner=PARTNER_ID&theme=dark"
  width="420"
  height="640"
  frameborder="0"
  style="border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.15);"
  allow="payment"
></iframe>`}</Code>

              <H3>Popup Widget Button</H3>
              <Code lang="html">{`<!-- Place this anywhere on your page -->
<script>
  window.LotteryWidget = {
    partnerId: 'YOUR_PARTNER_ID',
    theme: 'dark',
    position: 'bottom-right',
    buttonText: '🎟️ Enter Lottery'
  }
</script>
<script src="https://your-lottery-domain.com/widget.js" async></script>`}</Code>

              <H3>Widget URL Parameters</H3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead><tr className="bg-gray-50">{['Parameter', 'Values', 'Description'].map(h => <th key={h} className="text-left p-2 border font-semibold">{h}</th>)}</tr></thead>
                  <tbody>
                    {[
                      ['partner', 'partner-uuid', 'Your partner ID — filters lotteries to only those linked to your integration'],
                      ['theme', 'dark | light', 'Widget colour scheme'],
                      ['lang', 'en | de | fr | es', 'UI language'],
                      ['player_id', 'external-id', 'Pre-authenticate a player (SSO). Pass your external player ID.'],
                      ['lottery_id', 'lottery-uuid', 'Open directly to a specific lottery page'],
                      ['mode', 'list | detail | hub', 'Default view: lottery list, single lottery, or gamification hub'],
                    ].map(([p, v, d]) => (
                      <tr key={p} className="border-b hover:bg-gray-50">
                        <td className="p-2 border font-mono">{p}</td>
                        <td className="p-2 border text-gray-500">{v}</td>
                        <td className="p-2 border text-gray-600">{d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <H3>SSO / Auto-Login</H3>
              <P>To automatically log in the player when they open the widget, pass their external player ID. We look up the account by <code>external_player_id</code> and issue a session token.</P>
              <Code lang="html">{`<iframe
  src="https://your-lottery-domain.com/widget
    ?partner=PARTNER_ID
    &player_id=CASINO1_abc123
    &token_sig=SHA256_HMAC_OF_PLAYER_ID"
  ...
/>`}</Code>
            </>
          )}

          {/* ── Error Codes ── */}
          {active === 8 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Error Codes</h1>
              <P>All errors return a JSON body with a <code>detail</code> field.</P>
              <Code>{`{ "detail": "Lottery is not active" }`}</Code>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead><tr className="bg-gray-50">{['HTTP', 'Scenario'].map(h => <th key={h} className="text-left p-2 border font-semibold">{h}</th>)}</tr></thead>
                  <tbody>
                    {[
                      ['400', 'Invalid request body or business rule violation (e.g. max entries reached)'],
                      ['401', 'Missing or invalid Bearer token'],
                      ['403', 'Valid token but insufficient role (e.g. player accessing admin endpoint)'],
                      ['404', 'Resource not found (lottery, ticket, user, partner)'],
                      ['409', 'Conflict — duplicate ticket code or entry already exists'],
                      ['422', 'Validation error — request body failed schema validation'],
                      ['429', 'Rate limit exceeded — max 100 requests/min per API key'],
                      ['500', 'Internal server error — contact support with the request ID from X-Request-Id header'],
                    ].map(([code, desc]) => (
                      <tr key={code} className="border-b hover:bg-gray-50">
                        <td className="p-2 border font-mono font-bold">{code}</td>
                        <td className="p-2 border text-gray-600">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <H3>Common Business Errors</H3>
              <Code>{`"Lottery is not active"         → Status is not 'active'
"Lottery not found"            → Invalid lottery_id
"Maximum entries reached"      → User hit max_entries_per_user
"Casino eligibility not enabled" → Channel not configured for this lottery
"Coupon entry not enabled"     → coupon_entry_enabled = false
"Insufficient coupons"         → Player doesn't have enough of the right tier
"Some coupons not found or already redeemed" → Coupon IDs invalid or used
"Game session not found"       → session_id invalid or belongs to different user`}</Code>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
