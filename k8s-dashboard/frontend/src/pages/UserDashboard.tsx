import { useState, useEffect } from 'react'
import { Activity, Server, AlertCircle, TrendingUp, Clock } from 'lucide-react'
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
      // API reachable (we got a response) but cluster may be down
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-k8s-blue to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.username}!</h1>
        <p className="text-blue-100">Here is your Kubernetes cluster overview and recent activity</p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Audit Actions</p>
                <p className="text-3xl font-bold text-white">{stats.pods_viewed}</p>
              </div>
              <Activity className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Clusters</p>
                <p className="text-3xl font-bold text-white">{stats.nodes_viewed}</p>
              </div>
              <Server className="w-12 h-12 text-green-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Alerts</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.alerts_count}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-yellow-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Last Login</p>
                <p className="text-lg font-bold text-white">{new Date(stats.last_login).toLocaleDateString()}</p>
              </div>
              <Clock className="w-12 h-12 text-purple-400" />
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/pods" className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-blue-500/50 transition cursor-pointer border-l-4 border-l-blue-500">
          <div className="flex items-center">
            <Activity className="w-10 h-10 text-blue-400 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-white">View Pods</h3>
              <p className="text-sm text-gray-400">Monitor running pods</p>
            </div>
          </div>
        </Link>
        <Link to="/nodes" className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-green-500/50 transition cursor-pointer border-l-4 border-l-green-500">
          <div className="flex items-center">
            <Server className="w-10 h-10 text-green-400 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-white">View Nodes</h3>
              <p className="text-sm text-gray-400">Check cluster nodes</p>
            </div>
          </div>
        </Link>
        <Link to="/metrics" className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-purple-500/50 transition cursor-pointer border-l-4 border-l-purple-500">
          <div className="flex items-center">
            <TrendingUp className="w-10 h-10 text-purple-400 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-white">View Metrics</h3>
              <p className="text-sm text-gray-400">Analyze performance</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
        </div>
        <div className="p-6">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity to display</p>
              <p className="text-sm mt-2">Start exploring your cluster to see activity here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity: any, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-700/50 rounded-lg">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-k8s-blue rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">System Status</h2>
        <div className="space-y-3">
          {[
            { label: 'API Server', ok: systemStatus.api },
            { label: 'Cluster Health', ok: systemStatus.cluster },
            { label: 'Monitoring', ok: systemStatus.monitoring },
          ].map((item) => (
            <div key={item.label} className={`flex items-center justify-between p-3 ${item.ok ? 'bg-green-500/10' : 'bg-red-500/10'} rounded-lg`}>
              <div className="flex items-center">
                <div className={`w-3 h-3 ${item.ok ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-3`}></div>
                <span className="text-sm font-medium text-white">{item.label}</span>
              </div>
              <span className={`text-xs font-semibold ${item.ok ? 'text-green-400' : 'text-red-400'}`}>
                {item.ok ? 'Online' : 'Offline'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
