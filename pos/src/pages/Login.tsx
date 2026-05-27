import { useState } from 'react'
import { api } from '../api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post<{ access_token: string }>('/auth/login', { email, password })
      localStorage.setItem('pos_token', res.access_token)
      window.location.reload()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={submit} className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-center">POS Login</h1>
        <p className="text-sm text-gray-500 text-center">Use POS operator credentials</p>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full border rounded-lg px-4 py-2.5 text-sm" required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full border rounded-lg px-4 py-2.5 text-sm" required />
        <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">
          Login
        </button>
      </form>
    </div>
  )
}
