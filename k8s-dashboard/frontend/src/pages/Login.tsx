import { Link } from 'react-router-dom'
import { Shield, Monitor, ArrowRight, Server } from 'lucide-react'

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-xl">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-5 shadow-2xl shadow-blue-500/20">
            <Server className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">K8s Dashboard</h1>
          <p className="text-gray-400 mt-3 text-lg">Choose your login portal</p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Admin Portal */}
          <Link
            to="/admin-login"
            className="group relative bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl mb-4 shadow-lg shadow-purple-500/30">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Admin Portal</h2>
              <p className="text-gray-400 text-sm mb-4">
                Full cluster management, user administration, and system configuration.
              </p>
              <div className="flex items-center gap-1 text-purple-400 text-sm font-medium group-hover:gap-2 transition-all">
                Sign in as Admin
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* User Portal */}
          <Link
            to="/user-login"
            className="group relative bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-6 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl mb-4 shadow-lg shadow-blue-500/30">
                <Monitor className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">User Portal</h2>
              <p className="text-gray-400 text-sm mb-4">
                Monitor clusters, view workloads, check logs, and analyze metrics.
              </p>
              <div className="flex items-center gap-1 text-blue-400 text-sm font-medium group-hover:gap-2 transition-all">
                Sign in as User
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-xs">
          Kubernetes Cluster Management &middot; Secure Access
        </div>
      </div>
    </div>
  )
}
