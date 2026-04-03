import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, User, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react'
import axios from 'axios'
import { toast } from '../components/Toast'

export default function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setIsLoading(true)
    try {
      await axios.post('/api/v1/auth/signup', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      })
      toast('Account created successfully! Please login.', 'success')
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-950" />
        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-20 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back button */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to login
        </Link>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-blue-500/20 shadow-2xl shadow-blue-500/10 p-8 relative overflow-hidden">
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-5 shadow-lg shadow-blue-500/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-slate-400 mt-2 text-sm">Join K8s Dashboard today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-400/60 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300"
                  placeholder="Choose a username"
                  required
                  disabled={isLoading}
                  minLength={3}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-400/60 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300"
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-400/60 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300"
                  placeholder="Create a password"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">Must be at least 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-400/60 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300"
                  placeholder="Confirm your password"
                  required
                  disabled={isLoading}
                  minLength={6}
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
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
              Already have an account? Sign in
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-xs text-center text-slate-500">
              By creating an account, you agree to monitor your Kubernetes cluster responsibly.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
