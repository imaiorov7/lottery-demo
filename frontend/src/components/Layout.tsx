import { Link, useNavigate } from 'react-router-dom'
import { Ticket, Home } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../api'
import type { User as UserType } from '../api'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get<UserType>('/auth/me').then(setUser).catch(() => {
        localStorage.removeItem('token')
      })
    }
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/player" className="flex items-center gap-2 text-xl font-bold text-brand-400">
            <Ticket className="w-6 h-6" />
            <span>LuckyDraw</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1"><Home className="w-4 h-4" /> Hub</Link>
            <Link to="/player/my-tickets" className="text-sm text-gray-300 hover:text-white transition-colors">My Tickets</Link>
            <Link to="/player/my-coupons" className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1">Coupons</Link>
            {user && <span className="text-sm text-gray-500">{user.full_name}</span>}
            <button onClick={logout} className="text-sm text-gray-400 hover:text-white transition-colors">Logout</button>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
