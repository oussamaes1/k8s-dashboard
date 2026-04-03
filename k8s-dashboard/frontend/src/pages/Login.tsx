import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Monitor, ArrowRight, Server } from 'lucide-react'

function FloatingOrb({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <div className={`absolute rounded-full blur-3xl ${className}`} style={style} />
}

export default function Login() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />
        <FloatingOrb className="w-[500px] h-[500px] bg-blue-600/[0.07] -top-40 -right-40 animate-pulse" style={{ animationDuration: '4s' }} />
        <FloatingOrb className="w-[400px] h-[400px] bg-violet-600/[0.06] -bottom-32 -left-32 animate-pulse" style={{ animationDuration: '5s' }} />
        <FloatingOrb className="w-[300px] h-[300px] bg-cyan-500/[0.05] top-1/3 left-1/4 animate-pulse" style={{ animationDuration: '6s' }} />
        <FloatingOrb className="w-[200px] h-[200px] bg-indigo-500/[0.04] bottom-1/4 right-1/3 animate-pulse" style={{ animationDuration: '3s' }} />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className={`relative w-full max-w-2xl transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Logo & Title */}
        <div className="text-center mb-12">
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl rotate-6 opacity-50 blur-sm" />
            <div className="relative flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl shadow-2xl shadow-blue-500/25">
              <Server className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-slate-300 bg-clip-text text-transparent">
            K8s Dashboard
          </h1>
          <p className="text-slate-400 mt-4 text-lg font-light tracking-wide">Choose your login portal to continue</p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Portal */}
          <Link
            to="/admin-login"
            className="group relative overflow-hidden bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-violet-500/20 p-8 hover:border-violet-500/40 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-500 hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-violet-500/20 to-transparent blur-xl" />

            <div className="relative">
              <div className="relative inline-flex items-center justify-center w-16 h-16 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl rotate-6 opacity-40 blur-sm group-hover:rotate-12 transition-transform duration-500" />
                <div className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow duration-500">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-violet-100 transition-colors">Admin Portal</h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Full cluster management, user administration, and system configuration access.
              </p>
              <div className="flex items-center gap-2 text-violet-400 text-sm font-semibold group-hover:gap-3 group-hover:text-violet-300 transition-all duration-300">
                Sign in as Admin
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </Link>

          {/* User Portal */}
          <Link
            to="/user-login"
            className="group relative overflow-hidden bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-8 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-blue-500/20 to-transparent blur-xl" />

            <div className="relative">
              <div className="relative inline-flex items-center justify-center w-16 h-16 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl rotate-6 opacity-40 blur-sm group-hover:rotate-12 transition-transform duration-500" />
                <div className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow duration-500">
                  <Monitor className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-100 transition-colors">User Portal</h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Monitor clusters, view workloads, check logs, and analyze real-time metrics.
              </p>
              <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold group-hover:gap-3 group-hover:text-blue-300 transition-all duration-300">
                Sign in as User
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-3 text-slate-500 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500/60 animate-pulse" />
            Kubernetes Cluster Management &middot; Secure Access &middot; Enterprise Ready
          </div>
        </div>
      </div>
    </div>
  )
}
