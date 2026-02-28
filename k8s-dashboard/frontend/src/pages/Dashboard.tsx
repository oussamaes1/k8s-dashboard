import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { clusterApi, metricsApi, alertsApi } from '../services/api'
import { StatCard, Card, StatusBadge } from '../components/ui/Card'
import { Server, Box, Activity, Bell, AlertTriangle, CheckCircle } from 'lucide-react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { useEffect } from 'react'
import { useAlertStore } from '../store'

export default function Dashboard() {
  const { setActiveAlerts, setCriticalAlerts } = useAlertStore()

  // Fetch cluster summary
  const { data: summary } = useQuery({
    queryKey: ['cluster-summary'],
    queryFn: () => clusterApi.getSummary().then(res => res.data),
    refetchInterval: 30000,
  })

  // Fetch cluster health
  const { data: health } = useQuery({
    queryKey: ['cluster-health'],
    queryFn: () => clusterApi.getHealth().then(res => res.data),
    refetchInterval: 30000,
  })

  // Fetch metrics history for charts
  const { data: metricsHistory } = useQuery({
    queryKey: ['metrics-history'],
    queryFn: () => metricsApi.getHistory(undefined, 60).then(res => res.data),
    refetchInterval: 60000,
  })

  // Fetch active alerts
  const { data: alerts } = useQuery({
    queryKey: ['active-alerts'],
    queryFn: () => alertsApi.getActive().then(res => res.data),
    refetchInterval: 15000,
  })

  // Fetch recent events
  const { data: events } = useQuery({
    queryKey: ['recent-events'],
    queryFn: () => clusterApi.getEvents(undefined, 10).then(res => res.data),
    refetchInterval: 30000,
  })

  // Update alert store
  useEffect(() => {
    if (alerts) {
      setActiveAlerts(alerts.count)
      setCriticalAlerts(alerts.by_severity?.critical || 0)
    }
  }, [alerts, setActiveAlerts, setCriticalAlerts])

  return (
    <div className="space-y-6">
      {/* Health Score Banner */}
      <Card className={`bg-gradient-to-r ${
        health?.status === 'healthy' ? 'from-green-500/20 to-green-600/20' :
        health?.status === 'warning' ? 'from-yellow-500/20 to-yellow-600/20' :
        'from-red-500/20 to-red-600/20'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {health?.status === 'healthy' ? (
              <CheckCircle className="w-12 h-12 text-green-500" />
            ) : (
              <AlertTriangle className={`w-12 h-12 ${
                health?.status === 'warning' ? 'text-yellow-500' : 'text-red-500'
              }`} />
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">
                Cluster Health Score: {health?.health_score || 0}%
              </h2>
              <p className="text-gray-400">
                Status: <StatusBadge status={health?.status || 'unknown'} />
                {health?.is_anomaly && (
                  <span className="ml-2 text-red-400">⚠ Anomaly Detected</span>
                )}
              </p>
            </div>
          </div>
          {health?.recommendations && (
            <div className="text-right">
              <p className="text-sm text-gray-400">Recommendations</p>
              <p className="text-white">{health.recommendations[0]}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Nodes"
          value={summary?.nodes?.total || 0}
          subtitle={`${summary?.nodes?.ready || 0} Ready`}
          icon={<Server size={24} />}
          color="blue"
        />
        <StatCard
          title="Total Pods"
          value={summary?.pods?.total || 0}
          subtitle={`${summary?.pods?.running || 0} Running`}
          icon={<Box size={24} />}
          color="green"
        />
        <StatCard
          title="Pod Restarts"
          value={summary?.pods?.total_restarts || 0}
          subtitle="Last 24 hours"
          icon={<Activity size={24} />}
          color={summary?.pods?.total_restarts > 5 ? 'yellow' : 'purple'}
        />
        <StatCard
          title="Active Alerts"
          value={alerts?.count || 0}
          subtitle={`${alerts?.by_severity?.critical || 0} Critical`}
          icon={<Bell size={24} />}
          color={alerts?.by_severity?.critical > 0 ? 'red' : 'blue'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Usage Chart */}
        <Card title="CPU Usage (Last Hour)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricsHistory?.data || []}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#326CE5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#326CE5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#718096"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
                <YAxis stroke="#718096" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #326CE5' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cpu_percent" 
                  stroke="#326CE5" 
                  fill="url(#cpuGradient)"
                  name="CPU %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Memory Usage Chart */}
        <Card title="Memory Usage (Last Hour)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricsHistory?.data || []}>
                <defs>
                  <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#718096"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
                <YAxis stroke="#718096" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #10B981' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="memory_percent" 
                  stroke="#10B981" 
                  fill="url(#memGradient)"
                  name="Memory %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <Card title="Active Alerts" action={
          <Link to="/alerts" className="text-k8s-blue hover:text-blue-400 text-sm">View All →</Link>
        }>
          <div className="space-y-3">
            {alerts?.alerts?.slice(0, 5).map((alert: any) => (
              <div 
                key={alert.id} 
                className="flex items-center justify-between p-3 bg-k8s-dark rounded-lg border border-k8s-border"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    alert.severity === 'critical' ? 'bg-red-500 animate-pulse' :
                    alert.severity === 'error' ? 'bg-orange-500' :
                    alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="text-white font-medium">{alert.rule_name}</p>
                    <p className="text-sm text-gray-400">{alert.message}</p>
                  </div>
                </div>
                <StatusBadge status={alert.status} size="sm" />
              </div>
            )) || (
              <p className="text-gray-400 text-center py-4">No active alerts</p>
            )}
          </div>
        </Card>

        {/* Recent Events */}
        <Card title="Recent Events" action={
          <Link to="/logs" className="text-k8s-blue hover:text-blue-400 text-sm">View All →</Link>
        }>
          <div className="space-y-3">
            {events?.slice(0, 5).map((event: any, index: number) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-k8s-dark rounded-lg border border-k8s-border"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    event.type === 'Warning' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div>
                    <p className="text-white font-medium">{event.reason}</p>
                    <p className="text-sm text-gray-400 truncate max-w-xs">{event.message}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{event.object}</span>
              </div>
            )) || (
              <p className="text-gray-400 text-center py-4">No recent events</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
