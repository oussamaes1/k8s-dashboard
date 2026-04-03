import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store'
import { User, Lock, UserPlus, Monitor, Loader2 } from 'lucide-react'

export default function UserLogin() {
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
      navigate(adminRole ? '/admin' : '/user-dashboard')
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/50 to-slate-950" />
        {/* Floating orbs */}
        <div className="absolute -top-20 -right-20 w-[450px] h-[450px] bg-blue-600/12 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[120px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-blue-500/20 shadow-2xl shadow-blue-500/10 p-8 relative overflow-hidden">
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-5 shadow-lg shadow-blue-500/30">
              <Monitor className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">User Portal</h1>
            <p className="text-blue-300/70 mt-2 text-sm">Monitor your Kubernetes clusters</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="user-username" className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-400/60 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="user-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300"
                  placeholder="Enter your username"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="user-password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-400/60 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300"
                  placeholder="Enter your password"
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
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-blue-500 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Sign up link */}
          <div className="mt-5 text-center">
            <Link
              to="/signup"
              className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors group"
            >
              <UserPlus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Don&apos;t have an account? Sign up
            </Link>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-xs font-semibold text-blue-300/70 mb-3">Demo User Credentials:</p>
            <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 px-4 py-2.5 rounded-xl">
              <span className="text-sm text-blue-200 font-medium">user</span>
              <span className="text-sm text-blue-400/50 font-mono">/</span>
              <span className="text-sm text-blue-200 font-medium">user</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
