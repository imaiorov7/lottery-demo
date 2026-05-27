import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, Users, DollarSign, Award, Gamepad2 } from 'lucide-react'
import { api, type Lottery, type Ticket } from '../api'
import Countdown from '../components/Countdown'
import MiniGame from '../components/MiniGame'

interface GameSession {
  id: string
  game_type: string
  min_score_required: number
  max_score: number
  duration_seconds: number
  qualified: boolean
  tickets_created: Ticket[]
}

export default function LotteryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [lottery, setLottery] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [entering, setEntering] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<Ticket | null>(null)
  const [gameMode, setGameMode] = useState(false)
  const [gameSession, setGameSession] = useState<GameSession | null>(null)

  useEffect(() => {
    if (!id) return
    api.get<any>(`/lotteries/${id}`)
      .then(setLottery)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const enter = async (source: string) => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }
    setEntering(true)
    setError('')
    try {
      const ticket = await api.post<Ticket>('/tickets', {
        lottery_id: id, source,
      })
      setSuccess(ticket)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setEntering(false)
    }
  }

  const startGameEntry = async () => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }
    setError('')
    try {
      const session = await api.post<GameSession>('/game/start', { lottery_id: id })
      setGameSession(session)
      setGameMode(true)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const onGameComplete = async (score: number) => {
    if (!gameSession) return
    try {
      const result = await api.post<GameSession>('/game/submit', {
        session_id: gameSession.id,
        score,
      })
      if (result.qualified && result.tickets_created.length > 0) {
        setSuccess(result.tickets_created[0])
      }
      setGameMode(false)
      setGameSession(null)
    } catch (err: any) {
      setError(err.message)
      setGameMode(false)
    }
  }

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>
  if (!lottery) return null

  const hasGameLayer = lottery.game_layer_enabled

  // If in game mode, show the mini game
  if (gameMode && gameSession) {
    return (
      <div className="max-w-2xl mx-auto">
        <MiniGame
          gameType={gameSession.game_type}
          duration={gameSession.duration_seconds}
          maxScore={gameSession.max_score}
          minScore={gameSession.min_score_required}
          onComplete={onGameComplete}
          onCancel={() => { setGameMode(false); setGameSession(null) }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Banner image */}
      {lottery.banner_image_url && (
        <div className="rounded-xl overflow-hidden mb-4">
          <img src={lottery.banner_image_url} alt={lottery.name} className="w-full h-48 object-cover" />
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{lottery.name}</h1>
            <div className="flex items-center gap-2">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${lottery.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                {lottery.status.toUpperCase()}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                {lottery.lottery_type?.replace('_', ' ').toUpperCase()}
              </span>
              {hasGameLayer && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400">
                  <Gamepad2 className="w-3 h-3 inline mr-1" />GAME
                </span>
              )}
            </div>
          </div>
          {lottery.prize_description && (
            <div className="text-right">
              <Award className="w-8 h-8 text-brand-400 mx-auto mb-1" />
              <p className="text-brand-300 font-bold">{lottery.prize_description}</p>
            </div>
          )}
        </div>

        {lottery.description && (
          <p className="text-gray-400 mb-6">{lottery.description}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <Clock className="w-5 h-5 text-brand-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Ends In</p>
            <p className="text-sm font-bold"><Countdown endDate={lottery.end_date} /></p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <Users className="w-5 h-5 text-brand-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Entries</p>
            <p className="text-sm font-bold">{lottery.ticket_count}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <DollarSign className="w-5 h-5 text-brand-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Price</p>
            <p className="text-sm font-bold">
              {Number(lottery.ticket_price) === 0 ? 'FREE' : `${lottery.ticket_price} ${lottery.currency}`}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <Users className="w-5 h-5 text-brand-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Max/User</p>
            <p className="text-sm font-bold">{lottery.max_entries_per_user}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-center">
            <p className="font-bold mb-2">Entry Confirmed!</p>
            <p className="text-sm">Ticket Code: <span className="font-mono font-bold">{success.ticket_code}</span></p>
            {success.qr_code_data && (
              <img src={`data:image/png;base64,${success.qr_code_data}`} alt="QR" className="w-32 h-32 mx-auto mt-3 bg-white p-2 rounded" />
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Game layer entry */}
            {hasGameLayer && (
              <button onClick={startGameEntry} disabled={entering}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-3 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2">
                <Gamepad2 className="w-5 h-5" />
                Play Game to Win Entry
                {lottery.game_entry_price && Number(lottery.game_entry_price) > 0 && (
                  <span className="text-sm font-normal opacity-75">({lottery.game_entry_price} {lottery.currency})</span>
                )}
              </button>
            )}
            {hasGameLayer && (
              <p className="text-center text-xs text-gray-500">
                Score {lottery.game_min_score}+ in {lottery.game_duration_seconds}s to earn {lottery.game_entries_per_win} entr{lottery.game_entries_per_win > 1 ? 'ies' : 'y'}
              </p>
            )}

            {/* Direct purchase */}
            {lottery.allow_direct_purchase && !hasGameLayer && (
              <button onClick={() => enter('direct_purchase')} disabled={entering} className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 py-3 rounded-lg font-bold text-lg transition-colors">
                {entering ? 'Processing...' : Number(lottery.ticket_price) === 0 ? 'Enter for Free!' : `Buy Entry - ${lottery.ticket_price} ${lottery.currency}`}
              </button>
            )}
            {lottery.allow_direct_purchase && hasGameLayer && (
              <button onClick={() => enter('direct_purchase')} disabled={entering}
                className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 py-2.5 rounded-lg font-medium text-sm transition-colors">
                {entering ? 'Processing...' : 'Skip Game - Direct Purchase'}
                {Number(lottery.ticket_price) > 0 && <span className="opacity-75 ml-1">({lottery.ticket_price} {lottery.currency})</span>}
              </button>
            )}

            {lottery.allow_casino_eligibility && (
              <p className="text-center text-sm text-gray-500">Play at our casino to earn a free entry!</p>
            )}
          </div>
        )}

        {/* Terms */}
        {lottery.terms_and_conditions && (
          <details className="mt-6 text-sm text-gray-500">
            <summary className="cursor-pointer hover:text-gray-300">Terms & Conditions</summary>
            <p className="mt-2 text-xs whitespace-pre-wrap">{lottery.terms_and_conditions}</p>
          </details>
        )}
      </div>
    </div>
  )
}
