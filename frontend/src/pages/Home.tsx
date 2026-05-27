import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Users, Ticket, Gamepad2 } from 'lucide-react'
import { api } from '../api'
import Countdown from '../components/Countdown'

export default function Home() {
  const [lotteries, setLotteries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<any[]>('/lotteries?status=active')
      .then(setLotteries)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Win <span className="text-brand-400">Big Prizes</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Enter our exciting lotteries for a chance to win amazing prizes. Multiple ways to participate!
        </p>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading...</div>
      ) : lotteries.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <Ticket className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No active lotteries right now. Check back soon!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lotteries.map((lot) => (
            <Link key={lot.id} to={`/lottery/${lot.id}`} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-brand-500/50 hover:bg-gray-900/80 transition-all group">
              {lot.banner_image_url && (
                <img src={lot.banner_image_url} alt={lot.name} className="w-full h-32 object-cover" />
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400">
                    {lot.lottery_type?.replace('_', ' ').toUpperCase() || 'RAFFLE'}
                  </span>
                  {lot.game_layer_enabled && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400 flex items-center gap-1">
                      <Gamepad2 className="w-3 h-3" /> GAME
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold mb-2 group-hover:text-brand-400 transition-colors">
                  {lot.name}
                </h2>
                {lot.prize_description && (
                  <p className="text-brand-300 text-sm mb-3">{lot.prize_description}</p>
                )}
                {lot.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{lot.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <Countdown endDate={lot.end_date} />
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {lot.ticket_count}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-brand-400">
                    {lot.game_layer_enabled
                      ? `Play from ${lot.game_entry_price || lot.ticket_price} ${lot.currency}`
                      : Number(lot.ticket_price) === 0 ? 'FREE' : `${lot.ticket_price} ${lot.currency}`}
                  </span>
                  <span className="text-brand-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {lot.game_layer_enabled ? 'Play Now' : 'Enter Now'} &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
