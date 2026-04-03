import { useState, useEffect } from 'react'
import { Users, Shield, Activity, Database, UserPlus, Trash2, Edit, X, Search } from 'lucide-react'
import axios from 'axios'
import { toast } from '../components/Toast'

interface User {
  username: string
  email: string
  role: 'admin' | 'user'
  created_at?: string
  is_active: boolean
}

interface Stats {
  total_users: number
  active_users: number
  admin_users: number
  regular_users: number
}

const SkeletonStatCard = () => (
  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-3 bg-slate-700/50 rounded w-20" />
        <div className="h-8 bg-slate-700/50 rounded w-12" />
      </div>
      <div className="w-12 h-12 bg-slate-700/50 rounded-xl" />
    </div>
  </div>
)

const SkeletonTable = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-14 bg-slate-700/30 rounded-lg animate-pulse" />
    ))}
  </div>
)

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    role: 'user' as 'admin' | 'user'
  })

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/v1/auth/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/v1/auth/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post('/api/v1/auth/register', formData)
      closeModal()
      fetchUsers()
      fetchStats()
    } catch (error: any) {
      toast(error.response?.data?.detail || 'Failed to add user', 'error')
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    
    try {
      await axios.put(`/api/v1/auth/users/${editingUser.username}`, {
        email: formData.email,
        role: formData.role,
        is_active: editingUser.is_active
      })
      closeModal()
      fetchUsers()
      fetchStats()
    } catch (error: any) {
      toast(error.response?.data?.detail || 'Failed to update user', 'error')
    }
  }

  const handleDeleteUser = async (username: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return
    
    try {
      await axios.delete(`/api/v1/auth/users/${username}`)
      fetchUsers()
      fetchStats()
    } catch (error: any) {
      toast(error.response?.data?.detail || 'Failed to delete user', 'error')
    }
  }

  const startEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      password: '',
      email: user.email,
      role: user.role
    })
    setShowModal(true)
  }

  const openAddModal = () => {
    setShowModal(true)
    setEditingUser(null)
    setFormData({ username: '', password: '', email: '', role: 'user' })
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({ username: '', password: '', email: '', role: 'user' })
  }

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage users and system access</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 font-medium text-sm"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-white mt-2 tracking-tight">{stats.total_users}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Active Users</p>
                <p className="text-3xl font-bold text-emerald-400 mt-2 tracking-tight">{stats.active_users}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Admins</p>
                <p className="text-3xl font-bold text-violet-400 mt-2 tracking-tight">{stats.admin_users}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
                <Shield className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Regular Users</p>
                <p className="text-3xl font-bold text-indigo-400 mt-2 tracking-tight">{stats.regular_users}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Database className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Users Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl backdrop-blur-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-lg font-semibold text-white">User Management</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
            />
          </div>
        </div>
        {loading ? (
          <div className="p-6"><SkeletonTable /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredUsers.map((user) => (
                  <tr key={user.username} className="hover:bg-slate-700/20 transition-colors duration-150 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-white">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-400">{user.email}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin'
                          ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                          : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
                        user.is_active
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                          title="Edit user"
                          aria-label={`Edit ${user.username}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.username)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Delete user"
                          aria-label={`Delete ${user.username}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>No users found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl shadow-slate-900/50 w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
              <h2 className="text-lg font-semibold text-white">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all text-sm"
                    required
                    disabled={!!editingUser}
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all text-sm"
                    required
                    placeholder="Enter email"
                  />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all text-sm"
                      required
                      placeholder="Enter password"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all text-sm appearance-none cursor-pointer"
                    title="Select user role"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all text-sm font-medium shadow-lg shadow-blue-500/25"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
