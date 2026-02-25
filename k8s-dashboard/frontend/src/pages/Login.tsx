import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store'
import { Shield, UserPlus } from 'lucide-react'

export default function Login() {
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
      // Navigation will be handled by App.tsx based on role
      const { isAdmin: adminRole } = useAuthStore.getState()
      navigate(adminRole ? '/admin' : '/user-dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">K8s Dashboard</h1>
          <p className="text-gray-600 mt-2">Sign in to monitor your cluster</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="Enter your username"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/signup"
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium transition"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Don't have an account? Sign up
          </Link>
        </div>

        <div className="mt-8 space-y-3">
          <div className="border-t pt-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Demo Credentials:</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between bg-purple-50 px-4 py-2 rounded-lg">
                <span className="font-medium text-gray-700">Admin:</span>
                <code className="text-purple-700">admin / admin123</code>
              </div>
              <div className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-lg">
                <span className="font-medium text-gray-700">User:</span>
                <code className="text-blue-700">user / user123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
