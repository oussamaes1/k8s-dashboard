import { useState, useEffect } from 'react'
import { Activity, Server, AlertCircle, TrendingUp, Clock, ArrowRight, CheckCircle, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store'
import axios from 'axios'

interface UserStats {
  pods_viewed: number
  nodes_viewed: number
  alerts_count: number
  last_login: string
}

interface SystemStatus {
  api: boolean
  cluster: boolean
  monitoring: boolean
}

const SkeletonCard = () => (
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

const SkeletonActivity = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-12 bg-slate-700/30 rounded-lg animate-pulse" />
    ))}
  </div>
)

export default function UserDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({ api: false, cluster: false, monitoring: false })

  useEffect(() => {
    fetchUserStats()
    fetchRecentActivity()
    fetchSystemStatus()
  }, [])

  const fetchSystemStatus = async () => {
    try {
      const healthRes = await axios.get('/api/v1/cluster/health')
      const healthy = healthRes.data?.healthy === true
      setSystemStatus({ api: true, cluster: healthy, monitoring: healthy })
    } catch {
      setSystemStatus(prev => ({ ...prev, api: true }))
    }
  }

  const fetchUserStats = async () => {
    try {
      const response = await axios.get('/api/v1/auth/user-stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setStats({ pods_viewed: 0, nodes_viewed: 0, alerts_count: 0, last_login: new Date().toISOString() })
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const response = await axios.get('/api/v1/auth/recent-activity')
      setRecentActivity(response.data)
    } catch (error) {
      console.error('Failed to fetch activity:', error)
      setRecentActivity([])
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-purple-600/20 border border-slate-700/50 rounded-xl p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome back, <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">{user?.username}</span>
          </h1>
          <p className="text-slate-400 mt-2">Here is your Kubernetes cluster overview and recent activity</p>
        </div>
      </div>

      {/* Quick Stats */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Audit Actions</p>
                <p className="text-3xl font-bold text-white mt-2 tracking-tight">{stats.pods_viewed}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Clusters</p>
                <p className="text-3xl font-bold text-white mt-2 tracking-tight">{stats.nodes_viewed}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <Server className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Active Alerts</p>
                <p className="text-3xl font-bold text-amber-400 mt-2 tracking-tight">{stats.alerts_count}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Last Login</p>
                <p className="text-lg font-bold text-white mt-2 tracking-tight">{new Date(stats.last_login).toLocaleDateString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/pods" className="group bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mr-4">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">View Pods</h3>
                <p className="text-sm text-slate-500">Monitor running pods</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
        <Link to="/nodes" className="group bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 mr-4">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors">View Nodes</h3>
                <p className="text-sm text-slate-500">Check cluster nodes</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
        <Link to="/metrics" className="group bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-violet-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-0.5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30 mr-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-violet-300 transition-colors">View Metrics</h3>
                <p className="text-sm text-slate-500">Analyze performance</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl backdrop-blur-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <SkeletonActivity />
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-slate-700/30 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-500 font-medium">No recent activity to display</p>
              <p className="text-sm text-slate-600 mt-1">Start exploring your cluster to see activity here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((activity: any, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-700/20 transition-colors duration-150 group"
                >
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full shadow-lg shadow-blue-500/30" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white group-hover:text-blue-300 transition-colors">{activity.action}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl backdrop-blur-sm p-6">
        <h2 className="text-lg font-semibold text-white mb-4">System Status</h2>
        <div className="space-y-3">
          {[
            { label: 'API Server', ok: systemStatus.api },
            { label: 'Cluster Health', ok: systemStatus.cluster },
            { label: 'Monitoring', ok: systemStatus.monitoring },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                item.ok
                  ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                  : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.ok ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40' : 'bg-red-500 shadow-lg shadow-red-500/40'} ${item.ok ? '' : 'animate-pulse'}`} />
                <span className="text-sm font-medium text-white">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.ok ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-xs font-semibold ${item.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {item.ok ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
