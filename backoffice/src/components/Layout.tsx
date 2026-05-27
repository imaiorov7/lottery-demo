import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Trophy, Ticket, Users, Dices, BarChart3, MonitorPlay, Plug, BookOpen, LogOut } from 'lucide-react'

const nav = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/lotteries', label: 'Lotteries', icon: Trophy },
  { path: '/tickets', label: 'Tickets', icon: Ticket },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/draw', label: 'Draw', icon: Dices },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/widget', label: 'Widget Preview', icon: MonitorPlay },
]

const navBottom = [
  { path: '/integrations', label: 'Integrations', icon: Plug },
  { path: '/docs', label: 'API Docs', icon: BookOpen },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()

  const logout = () => {
    localStorage.removeItem('admin_token')
    navigate('/login')
  }

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-lg font-bold">Lottery Admin</h1>
          <p className="text-xs text-gray-400">Backoffice</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
          <div className="border-t border-gray-700 my-2" />
          {navBottom.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <button onClick={logout} className="flex items-center gap-3 px-5 py-3 text-sm text-gray-400 hover:text-white border-t border-gray-800">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-50 p-6">
        {children}
      </main>
    </div>
  )
}
