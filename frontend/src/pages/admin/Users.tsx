import { useEffect, useState } from 'react'
import { Search, UserCheck, UserX } from 'lucide-react'
import { api, type User } from '../../api'

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')

  const load = (q = '') => api.get<User[]>(`/users${q ? `?search=${q}` : ''}`).then(setUsers)
  useEffect(() => { load() }, [])

  const toggleActive = async (id: string) => {
    await api.post(`/users/${id}/toggle-active`)
    load(search)
  }

  const doSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load(search)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <form onSubmit={doSearch} className="flex gap-2">
          <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-64" />
          <button type="submit" className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200">
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="px-4 py-3 font-medium text-gray-600">Active</th>
              <th className="px-4 py-3 font-medium text-gray-600">Joined</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  {u.is_active
                    ? <span className="text-green-600">Yes</span>
                    : <span className="text-red-500">No</span>
                  }
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleActive(u.id)} className="text-gray-500 hover:text-gray-700" title="Toggle active">
                    {u.is_active ? <UserX className="w-4 h-4 inline" /> : <UserCheck className="w-4 h-4 inline" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
