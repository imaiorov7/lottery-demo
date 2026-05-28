import { Link, useNavigate } from 'react-router-dom'
import { Monitor, Settings, ScanLine, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../api'
import type { User } from '../api'

export default function Hub() {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get<User>('/auth/me').then(setUser).catch(() => {
      localStorage.removeItem('token')
      navigate('/login')
    })
  }, [navigate])

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const portals = [
    { to: '/player', icon: Monitor, label: 'Player Frontend', desc: 'Buy tickets, play games, redeem coupons and check your entries.', color: 'indigo' },
    { to: '/admin', icon: Settings, label: 'Admin Backoffice', desc: 'Manage lotteries, view reports, run draws and configure integrations.', color: 'purple' },
    { to: '/pos', icon: ScanLine, label: 'POS Terminal', desc: 'Sell physical tickets, validate entries and check winners.', color: 'pink' },
  ]

  const colors: Record<string, string> = {
    indigo: 'from-indigo-500/10 to-blue-500/10 border-indigo-500/20 hover:border-indigo-500/40',
    purple: 'from-purple-500/10 to-violet-500/10 border-purple-500/20 hover:border-purple-500/40',
    pink: 'from-pink-500/10 to-rose-500/10 border-pink-500/20 hover:border-pink-500/40',
  }

  const iconColors: Record<string, string> = {
    indigo: 'text-indigo-400', purple: 'text-purple-400', pink: 'text-pink-400',
  }

  if (!user) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl font-bold mb-2">
          Welcome, <span className="text-brand-400">{user.full_name}</span>
        </h1>
        <p className="text-gray-400 mb-10">Select a portal to continue</p>

        <div className="grid grid-cols-3 gap-6">
          {portals.map(p => (
            <Link key={p.to} to={p.to}
              className={`bg-gradient-to-br ${colors[p.color]} border rounded-2xl p-8 hover:scale-[1.03] transition-all text-center`}>
              <p.icon className={`w-12 h-12 mx-auto mb-4 ${iconColors[p.color]}`} />
              <h2 className="font-bold text-lg text-white mb-2">{p.label}</h2>
              <p className="text-sm text-gray-400">{p.desc}</p>
            </Link>
          ))}
        </div>

        <button onClick={logout}
          className="mt-10 text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-2 mx-auto">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  )
}
