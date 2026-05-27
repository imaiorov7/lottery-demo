import { useEffect, useState } from 'react'
import { api, type Lottery } from '../api'

export default function WidgetPreview() {
  const [lotteries, setLotteries] = useState<Lottery[]>([])
  const [selected, setSelected] = useState('')
  const [mode, setMode] = useState<'standalone' | 'iframe' | 'popup'>('standalone')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [showPopup, setShowPopup] = useState(false)

  // SSO simulation
  const [ssoPlayerId, setSsoPlayerId] = useState('CASINO_PLAYER_001')
  const [ssoToken, setSsoToken] = useState('')
  const [ssoErr, setSsoErr] = useState('')
  const [ssoLoading, setSsoLoading] = useState(false)

  useEffect(() => {
    api.get<Lottery[]>('/lotteries').then(l => {
      setLotteries(l)
      if (l.length) setSelected(l[0].id)
    })
  }, [])

  const simulateSSO = async () => {
    setSsoLoading(true); setSsoErr(''); setSsoToken('')
    try {
      const res = await api.post<any>('/auth/widget-sso', {
        api_key: 'demo_api_key_123',
        external_player_id: ssoPlayerId,
        player_name: 'Demo Casino Player',
      })
      setSsoToken(res.access_token)
    } catch (e: any) { setSsoErr(e.message) }
    finally { setSsoLoading(false) }
  }

  const widgetBase = `${import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/widget`
  const widgetUrl = `${widgetBase}?theme=${theme}${ssoToken ? `&token=${ssoToken}` : ''}`
  const embedCode = `<!-- Step 1: Your backend calls our SSO endpoint -->
POST /api/auth/widget-sso
{ "api_key": "YOUR_API_KEY", "external_player_id": "PLAYER_123" }
→ returns { "access_token": "eyJ..." }

<!-- Step 2: Embed the iframe with the token -->
<iframe
  src="https://your-lottery-domain.com/widget?theme=dark&token=eyJ..."
  width="420" height="700"
  frameborder="0"
  style="border-radius:12px;"
></iframe>`

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Widget Preview & Code Generator</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Controls */}
        <div className="col-span-1 space-y-4">
          {/* SSO Simulation */}
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">🔐 Simulate Casino SSO</h3>
            <p className="text-xs text-gray-500">Your backend calls our SSO endpoint with a player ID and gets a token to inject into the iframe URL.</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">External Player ID</label>
              <input value={ssoPlayerId} onChange={e => setSsoPlayerId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="CASINO_PLAYER_001" />
            </div>
            <button onClick={simulateSSO} disabled={ssoLoading}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {ssoLoading ? 'Getting token…' : 'Get Widget Token'}
            </button>
            {ssoErr && <p className="text-xs text-red-500">{ssoErr}</p>}
            {ssoToken && (
              <div>
                <p className="text-xs text-green-600 font-medium mb-1">✓ Token received — widget is now authenticated</p>
                <p className="text-xs font-mono text-gray-400 truncate">{ssoToken.slice(0, 40)}…</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {(['standalone', 'iframe', 'popup'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium capitalize ${mode === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <div className="grid grid-cols-2 gap-2">
                {(['dark', 'light'] as const).map(t => (
                  <button key={t} onClick={() => setTheme(t)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium capitalize ${theme === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Embed code */}
          {mode === 'iframe' && (
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Embed Code</h3>
              <textarea value={embedCode} readOnly rows={4}
                className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs font-mono" />
              <button onClick={() => navigator.clipboard.writeText(embedCode)}
                className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-blue-700">
                Copy to Clipboard
              </button>
            </div>
          )}

          {mode === 'popup' && (
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Popup Widget Code</h3>
              <textarea readOnly rows={5} value={`<button onclick="openLotteryWidget('${selected}')" style="position:fixed;bottom:20px;right:20px;background:#6366f1;color:white;border:none;padding:12px 24px;border-radius:999px;cursor:pointer;font-size:14px;font-weight:600;box-shadow:0 4px 12px rgba(99,102,241,.4)">Enter Lottery</button>\n<script src="${import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/widget.js"></script>`}
                className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs font-mono" />
              <button onClick={() => setShowPopup(true)}
                className="mt-2 w-full bg-purple-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-purple-700">
                Preview Popup
              </button>
            </div>
          )}
        </div>

        {/* Preview area */}
        <div className="col-span-2">
          {mode === 'standalone' && (
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 bg-gray-800 rounded px-3 py-1 text-xs text-gray-400 font-mono">{widgetUrl}</div>
              </div>
              <iframe src={widgetUrl} className="w-full h-[560px] rounded-lg bg-black" />
            </div>
          )}

          {mode === 'iframe' && (
            <div className="bg-gray-300 rounded-xl p-6 min-h-[560px] flex flex-col items-center">
              <p className="text-sm text-gray-600 mb-4 font-medium">↓ Simulated Partner Casino Site ↓</p>
              <div className="w-full bg-white rounded-xl shadow-inner p-4 mb-4 text-sm text-gray-500 min-h-16">
                Casino page content here…
              </div>
              <iframe
                src={widgetUrl}
                width={420}
                height={560}
                style={{ borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,.15)', border: 'none' }}
                title="Lottery Widget"
              />
            </div>
          )}

          {mode === 'popup' && (
            <div className="bg-gray-200 rounded-xl min-h-[560px] relative overflow-hidden">
              <div className="p-6">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="font-bold text-lg mb-2">Partner Casino Website</h3>
                  <p className="text-gray-500 text-sm">The floating button below is injected by the lottery widget script. Clicking it opens the full widget in a modal.</p>
                  <div className="h-32 bg-gray-100 rounded mt-4 flex items-center justify-center text-gray-400 text-sm">
                    Casino page content…
                  </div>
                </div>
              </div>

              <button onClick={() => setShowPopup(!showPopup)}
                className="absolute bottom-4 right-4 bg-indigo-600 text-white px-5 py-3 rounded-full font-semibold shadow-lg hover:bg-indigo-700 transition-all text-sm">
                🎟️ Lottery Hub
              </button>

              {showPopup && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
                  <div className="relative">
                    <button onClick={() => setShowPopup(false)}
                      className="absolute -top-3 -right-3 z-10 bg-gray-700 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-gray-600">
                      ×
                    </button>
                    <iframe
                      src={widgetUrl}
                      width={380}
                      height={520}
                      style={{ borderRadius: 16, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,.5)' }}
                      title="Lottery Widget Popup"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
