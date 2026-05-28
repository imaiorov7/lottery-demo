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
      navigate('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2 text-center">LuckyDraw</h1>
        <p className="text-gray-400 text-center mb-8">Sign in to your account</p>
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
        <div className="mt-6 p-4 bg-gray-900/50 border border-gray-800 rounded-lg text-center">
          <p className="text-xs text-gray-500 mb-1">Demo credentials</p>
          <p className="text-sm text-gray-300 font-mono">admin@lottery.demo / admin123</p>
        </div>
      </div>
    </div>
  )
}
