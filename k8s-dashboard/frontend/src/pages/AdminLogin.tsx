import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store'
import { Shield, ArrowLeft, Lock, User, Loader2 } from 'lucide-react'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(username, password)
      const { isAdmin: adminRole } = useAuthStore.getState()
      if (!adminRole) {
        useAuthStore.getState().logout()
        setError('Access denied. This portal is for administrators only.')
        setIsLoading(false)
        return
      }
      navigate('/admin')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/50 to-slate-950" />
        {/* Floating orbs */}
        <div className="absolute top-10 right-10 w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back button */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to portals
        </Link>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-violet-500/20 shadow-2xl shadow-violet-500/10 p-8 relative overflow-hidden">
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl mb-5 shadow-lg shadow-violet-500/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
            <p className="text-violet-300/70 mt-2 text-sm">Restricted access &mdash; Administrators only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-username" className="block text-sm font-medium text-slate-300 mb-2">
                Admin Username
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                  <User className="w-5 h-5 text-violet-400/60 group-focus-within:text-violet-400 transition-colors" />
                </div>
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition-all duration-300"
                  placeholder="Enter admin username"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-violet-400/60 group-focus-within:text-violet-400 transition-colors" />
                </div>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition-all duration-300"
                  placeholder="Enter password"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </span>
              ) : (
                'Sign In as Administrator'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-xs font-semibold text-violet-300/70 mb-3">Demo Admin Credentials:</p>
            <div className="flex items-center justify-between bg-violet-500/10 border border-violet-500/20 px-4 py-2.5 rounded-xl">
              <span className="text-sm text-violet-200 font-medium">admin</span>
              <span className="text-sm text-violet-400/50 font-mono">/</span>
              <span className="text-sm text-violet-200 font-medium">admin</span>
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-2 text-xs text-violet-400/40">
            <Lock className="w-3.5 h-3.5" />
            Protected by JWT Authentication &middot; AES-256 Encryption
          </div>
        </div>
      </div>
    </div>
  )
}
