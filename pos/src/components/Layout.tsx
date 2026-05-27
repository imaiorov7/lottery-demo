import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Ticket, ScanLine, LogOut } from 'lucide-react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()

  const logout = () => {
    localStorage.removeItem('pos_token')
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-lg">POS Terminal</span>
            <Link to="/" className={`text-sm font-medium ${location.pathname === '/' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              <Ticket className="w-4 h-4 inline mr-1" />Sell
            </Link>
            <Link to="/validate" className={`text-sm font-medium ${location.pathname === '/validate' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              <ScanLine className="w-4 h-4 inline mr-1" />Validate
            </Link>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-gray-600">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
