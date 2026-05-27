import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<{ access_token: string }>('/auth/login', { email, password })
      localStorage.setItem('token', res.access_token)
      // Check role from token payload to redirect admin/pos users
      try {
        const payload = JSON.parse(atob(res.access_token.split('.')[1]))
        if (payload.role === 'admin') {
          window.location.href = 'http://localhost:5174'
          return
        }
        if (payload.role === 'pos_operator') {
          window.location.href = 'http://localhost:5175'
          return
        }
      } catch {}
      navigate('/')
      window.location.reload()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
      <form onSubmit={submit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">{error}</div>}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 py-2.5 rounded-lg font-medium transition-colors">
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p className="text-center text-sm text-gray-500">
          Don't have an account? <Link to="/register" className="text-brand-400 hover:underline">Sign up</Link>
        </p>
      </form>
    </div>
  )
}
