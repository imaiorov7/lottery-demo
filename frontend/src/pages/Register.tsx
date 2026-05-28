import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      const res = await api.post<{ access_token: string }>('/auth/login', {
        email: form.email, password: form.password,
      })
      localStorage.setItem('token', res.access_token)
      navigate('/')
      window.location.reload()
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
        <p className="text-gray-400 text-center mb-8">Create your account</p>
        <form onSubmit={submit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Full Name</label>
            <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Phone (optional)</label>
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 py-2.5 rounded-lg font-medium transition-colors">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-brand-400 hover:underline">Login</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
