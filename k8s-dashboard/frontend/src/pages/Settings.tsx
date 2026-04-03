import { useState } from 'react'
import { User, Mail, Shield, Lock, Monitor, Clock, Save, CheckCircle, Key, Bell, AlertTriangle } from 'lucide-react'
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

  const activeTabIndex = tabs.findIndex(t => t.id === activeTab)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
          <Shield className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-slate-400 mt-1">Manage your account and preferences</p>
        </div>
      </div>

      {/* Save Indicator */}
      {saved && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4" />
          <span className="font-medium">Settings saved successfully</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="relative">
        <div className="flex gap-1 p-1 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm w-fit">
          <div 
            className="absolute top-1 h-[calc(100%-8px)] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg transition-all duration-300 ease-out"
            style={{
              left: `${activeTabIndex * (100 / tabs.length)}%`,
              width: `${100 / tabs.length}%`,
            }}
          />
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10"></div>
            <div className="relative p-6 pt-12">
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-purple-500/20 border-4 border-slate-800/50">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-slate-800/50"></div>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-white">{user?.username}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-400 text-sm font-semibold rounded-lg border border-purple-500/30">
                        <Shield className="w-3.5 h-3.5" /> Administrator
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-semibold rounded-lg border border-blue-500/30">
                        <User className="w-3.5 h-3.5" /> User
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Username</p>
                      <p className="text-white font-medium">{user?.username}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Email</p>
                      <p className="text-white font-medium">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                      <Shield className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Role</p>
                      <p className="text-white font-medium">{user?.role === 'admin' ? 'Administrator' : 'Regular User'}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/20">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Account Status</p>
                      <p className="text-green-400 font-medium">Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/20">
                  <Clock className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Data Refresh</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="max-w-md">
                <label className="block text-sm font-medium text-slate-400 mb-3">
                  Auto-Refresh Interval
                </label>
                <div className="relative">
                  <select
                    value={refreshInterval}
                    onChange={(e) => handleRefreshChange(Number(e.target.value))}
                    title="Auto-refresh interval"
                    className="w-full appearance-none px-4 py-3 pr-10 bg-slate-900/80 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all cursor-pointer"
                  >
                    <option value={10000}>10 seconds</option>
                    <option value={15000}>15 seconds</option>
                    <option value={30000}>30 seconds</option>
                    <option value={60000}>1 minute</option>
                    <option value={120000}>2 minutes</option>
                    <option value={300000}>5 minutes</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">How often dashboard data refreshes automatically</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/20">
                  <Bell className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Notifications</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-slate-200 font-medium mb-1">In-App Alerts</p>
                    <p className="text-slate-400 text-sm">Alert notifications are displayed as in-app toasts when new critical events are detected. Alerts appear in the top-right corner of the dashboard.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Password Change Form */}
          <div className="relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/20">
                  <Key className="w-5 h-5 text-red-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Change Password</h2>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-slate-400 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      id="current-password"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-slate-400 mb-2">New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-400 mb-2">Confirm New Password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>

                {passwordError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-xl">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {passwordError}
                  </div>
                )}

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 font-medium"
                >
                  <Save className="w-4 h-4" />
                  Update Password
                </button>
              </form>
            </div>
          </div>

          {/* Session Information */}
          <div className="relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/20">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Session Information</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-4">
                  <p className="text-slate-500 text-xs mb-1">Token Type</p>
                  <p className="text-white font-medium">JWT (Bearer)</p>
                </div>
                <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-4">
                  <p className="text-slate-500 text-xs mb-1">Session Timeout</p>
                  <p className="text-white font-medium">8 hours</p>
                </div>
                <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-4">
                  <p className="text-slate-500 text-xs mb-1">Encryption</p>
                  <p className="text-white font-medium">AES-256 (Fernet)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
