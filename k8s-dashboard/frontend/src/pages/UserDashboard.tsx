import { useState, useEffect } from 'react'
import { Activity, Server, AlertCircle, TrendingUp, Clock } from 'lucide-react'
import { useAuthStore } from '../store'
import axios from 'axios'

interface UserStats {
  pods_viewed: number
  nodes_viewed: number
  alerts_count: number
  last_login: string
}

export default function UserDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserStats()
    fetchRecentActivity()
  }, [])

  const fetchUserStats = async () => {
    try {
      // This would fetch user-specific stats from the backend
      const response = await axios.get('http://localhost:8000/api/v1/auth/user-stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      // Set default stats if API fails
      setStats({
        pods_viewed: 0,
        nodes_viewed: 0,
        alerts_count: 0,
        last_login: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/auth/recent-activity')
      setRecentActivity(response.data)
    } catch (error) {
      console.error('Failed to fetch activity:', error)
      setRecentActivity([])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.username}! 👋</h1>
        <p className="text-indigo-100">
          Here's your Kubernetes cluster overview and recent activity
        </p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pods Viewed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pods_viewed}</p>
              </div>
              <Activity className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nodes Viewed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.nodes_viewed}</p>
              </div>
              <Server className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.alerts_count}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Login</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Date(stats.last_login).toLocaleDateString()}
                </p>
              </div>
              <Clock className="w-12 h-12 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          href="/pods"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer border-l-4 border-blue-500"
        >
          <div className="flex items-center">
            <Activity className="w-10 h-10 text-blue-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">View Pods</h3>
              <p className="text-sm text-gray-600">Monitor running pods</p>
            </div>
          </div>
        </a>
        
        <a
          href="/nodes"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer border-l-4 border-green-500"
        >
          <div className="flex items-center">
            <Server className="w-10 h-10 text-green-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">View Nodes</h3>
              <p className="text-sm text-gray-600">Check cluster nodes</p>
            </div>
          </div>
        </a>
        
        <a
          href="/metrics"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer border-l-4 border-purple-500"
        >
          <div className="flex items-center">
            <TrendingUp className="w-10 h-10 text-purple-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">View Metrics</h3>
              <p className="text-sm text-gray-600">Analyze performance</p>
            </div>
          </div>
        </a>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
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
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-indigo-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm font-medium text-gray-900">API Server</span>
            </div>
            <span className="text-xs text-green-700 font-semibold">Online</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm font-medium text-gray-900">Cluster Health</span>
            </div>
            <span className="text-xs text-green-700 font-semibold">Healthy</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm font-medium text-gray-900">Monitoring</span>
            </div>
            <span className="text-xs text-blue-700 font-semibold">Active</span>
          </div>
        </div>
      </div>
    </div>
  )
}
