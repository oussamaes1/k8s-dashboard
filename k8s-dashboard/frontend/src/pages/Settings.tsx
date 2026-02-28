import { useState } from 'react'
import { User, Mail, Shield, Lock, Monitor, Clock, Save, CheckCircle } from 'lucide-react'
import { useAuthStore, useClusterStore } from '../store'
import { toast } from '../components/Toast'
import axios from 'axios'

export default function Settings() {
  const { user, isAdmin } = useAuthStore()
  const { refreshInterval, setRefreshInterval } = useClusterStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile')
  const [saved, setSaved] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')

  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleRefreshChange = (value: number) => {
    setRefreshInterval(value)
    showSaved()
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    try {
      await axios.post('/api/v1/auth/change-password', {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      }, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token}`,
        },
      })
      toast('Password changed successfully', 'success')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to change password'
      setPasswordError(msg)
    }
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'preferences' as const, label: 'Preferences', icon: Monitor },
    { id: 'security' as const, label: 'Security', icon: Lock },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* Save indicator */}
      {saved && (
        <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm">
          <CheckCircle className="w-4 h-4" />
          Settings saved
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 p-1 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white">Profile Information</h2>

          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{user?.username}</h3>
              <div className="flex items-center gap-2 mt-1">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-full">
                    <Shield className="w-3 h-3" /> Administrator
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">
                    <User className="w-3 h-3" /> User
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-300">
                <User className="w-4 h-4 text-gray-500" />
                {user?.username}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-300">
                <Mail className="w-4 h-4 text-gray-500" />
                {user?.email}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-300">
                <Shield className="w-4 h-4 text-gray-500" />
                {user?.role === 'admin' ? 'Administrator' : 'Regular User'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Account Status</label>
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-green-400">
                <CheckCircle className="w-4 h-4" />
                Active
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white">Dashboard Preferences</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Auto-Refresh Interval
              </label>
              <select
                value={refreshInterval}
                onChange={(e) => handleRefreshChange(Number(e.target.value))}
                title="Auto-refresh interval"
                className="w-full md:w-64 px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value={10000}>10 seconds</option>
                <option value={15000}>15 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
                <option value={120000}>2 minutes</option>
                <option value={300000}>5 minutes</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">How often dashboard data refreshes automatically</p>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Notifications</h3>
              <p className="text-sm text-gray-500">
                Alert notifications are displayed as in-app toasts when new critical events are detected.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white">Security Settings</h2>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <h3 className="text-sm font-medium text-gray-400">Change Password</h3>
            <div>
              <label htmlFor="current-password" className="block text-sm text-gray-400 mb-1">Current Password</label>
              <input
                id="current-password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm text-gray-400 mb-1">New Password</label>
              <input
                id="new-password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
                minLength={6}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
              <input
                id="confirm-password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
                minLength={6}
              />
            </div>

            {passwordError && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 px-3 py-2 rounded">
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Save className="w-4 h-4" />
              Update Password
            </button>
          </form>

          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Session Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Token Type</span>
                <span className="text-gray-400">JWT (Bearer)</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Session Timeout</span>
                <span className="text-gray-400">8 hours</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Encryption</span>
                <span className="text-gray-400">AES-256 (Fernet)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
