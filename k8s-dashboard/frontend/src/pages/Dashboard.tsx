import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { clusterApi, metricsApi, alertsApi } from '../services/api'
import { StatCard, Card, StatusBadge } from '../components/ui/Card'
import { Server, Box, Activity, Bell, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react'
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

const CustomTooltip = ({ active, payload, label, color }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700/50 rounded-xl px-4 py-3 shadow-xl shadow-slate-900/50 backdrop-blur-sm">
        <p className="text-slate-400 text-xs mb-1">
          {new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
        <p className="font-semibold text-white" style={{ color: color || '#3b82f6' }}>
          {payload[0].name}: {payload[0].value.toFixed(1)}%
        </p>
      </div>
    )
  }
  return null
}

const SkeletonCard = () => (
  <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50 rounded-xl p-6 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="space-y-3 flex-1">
        <div className="h-4 bg-slate-700/50 rounded w-24" />
        <div className="h-8 bg-slate-700/50 rounded w-16" />
        <div className="h-3 bg-slate-700/30 rounded w-20" />
      </div>
      <div className="w-12 h-12 bg-slate-700/50 rounded-xl" />
    </div>
  </div>
)

const SkeletonChart = () => (
  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 animate-pulse">
    <div className="h-5 bg-slate-700/50 rounded w-32 mb-4" />
    <div className="h-64 bg-slate-700/30 rounded-lg" />
  </div>
)

const SkeletonList = () => (
  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 animate-pulse">
    <div className="h-5 bg-slate-700/50 rounded w-28 mb-4" />
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 p-3 bg-slate-700/20 rounded-lg">
          <div className="w-2 h-2 bg-slate-700/50 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-700/50 rounded w-3/4" />
            <div className="h-3 bg-slate-700/30 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default function Dashboard() {
  const { setActiveAlerts, setCriticalAlerts } = useAlertStore()

  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['cluster-summary'],
    queryFn: () => clusterApi.getSummary().then(res => res.data),
    refetchInterval: 30000,
  })

  const { data: health, isLoading: isLoadingHealth } = useQuery({
    queryKey: ['cluster-health'],
    queryFn: () => clusterApi.getHealth().then(res => res.data),
    refetchInterval: 30000,
  })

  const { data: metricsHistory, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['metrics-history'],
    queryFn: () => metricsApi.getHistory(undefined, 60).then(res => res.data),
    refetchInterval: 60000,
  })

  const { data: alerts } = useQuery({
    queryKey: ['active-alerts'],
    queryFn: () => alertsApi.getActive().then(res => res.data),
    refetchInterval: 15000,
  })

  const { data: events } = useQuery({
    queryKey: ['recent-events'],
    queryFn: () => clusterApi.getEvents(undefined, 10).then(res => res.data),
    refetchInterval: 30000,
  })

  useEffect(() => {
    if (alerts) {
      setActiveAlerts(alerts.count)
      setCriticalAlerts(alerts.by_severity?.critical || 0)
    }
  }, [alerts, setActiveAlerts, setCriticalAlerts])

  const healthScore = health?.health_score || 0
  const healthStatus = health?.status || 'unknown'
  const gradientMap: Record<string, string> = {
    healthy: 'from-emerald-500/20 via-emerald-600/10 to-slate-900/50',
    warning: 'from-amber-500/20 via-amber-600/10 to-slate-900/50',
    critical: 'from-red-500/20 via-red-600/10 to-slate-900/50',
    unknown: 'from-slate-500/20 via-slate-600/10 to-slate-900/50',
  }
  const iconColorMap: Record<string, string> = {
    healthy: 'text-emerald-400',
    warning: 'text-amber-400',
    critical: 'text-red-400',
    unknown: 'text-slate-400',
  }
  const scoreColorMap: Record<string, string> = {
    healthy: 'text-emerald-400',
    warning: 'text-amber-400',
    critical: 'text-red-400',
    unknown: 'text-slate-400',
  }
  const glowColorMap: Record<string, string> = {
    healthy: 'shadow-emerald-500/10',
    warning: 'shadow-amber-500/10',
    critical: 'shadow-red-500/10',
    unknown: 'shadow-slate-500/10',
  }

  const isLoading = isLoadingSummary || isLoadingHealth

  return (
    <div className="space-y-6 animate-fade-in">
      <div className={`relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-r ${gradientMap[healthStatus]} shadow-lg ${glowColorMap[healthStatus]} transition-all duration-500`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-400/5 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-slate-400/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <div className={`relative p-3 rounded-2xl bg-slate-900/50 border border-slate-700/50 ${iconColorMap[healthStatus]}`}>
                {healthStatus === 'healthy' ? (
                  <CheckCircle className="w-10 h-10" />
                ) : (
                  <AlertTriangle className="w-10 h-10" />
                )}
                {health?.is_anomaly && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Cluster Health Score</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className={`text-5xl font-bold tracking-tight ${scoreColorMap[healthStatus]}`}>{healthScore}%</span>
                  <StatusBadge status={healthStatus} />
                  {health?.is_anomaly && (
                    <span className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                      Anomaly Detected
                    </span>
                  )}
                </div>
              </div>
            </div>
            {health?.recommendations && health.recommendations.length > 0 && (
              <div className="text-right max-w-xs">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Top Recommendation</p>
                <p className="text-sm text-slate-300 leading-relaxed">{health.recommendations[0]}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              title="Total Nodes"
              value={summary?.nodes?.total || 0}
              subtitle={`${summary?.nodes?.ready || 0} Ready`}
              icon={<Server size={20} />}
              color="blue"
            />
            <StatCard
              title="Total Pods"
              value={summary?.pods?.total || 0}
              subtitle={`${summary?.pods?.running || 0} Running`}
              icon={<Box size={20} />}
              color="green"
            />
            <StatCard
              title="Pod Restarts"
              value={summary?.pods?.total_restarts || 0}
              subtitle="Last 24 hours"
              icon={<Activity size={20} />}
              color={summary?.pods?.total_restarts > 5 ? 'yellow' : 'purple'}
            />
            <StatCard
              title="Active Alerts"
              value={alerts?.count || 0}
              subtitle={`${alerts?.by_severity?.critical || 0} Critical`}
              icon={<Bell size={20} />}
              color={alerts?.by_severity?.critical > 0 ? 'red' : 'blue'}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoadingMetrics ? (
          <>
            <SkeletonChart />
            <SkeletonChart />
          </>
        ) : (
          <>
            <Card title="CPU Usage" action={<span className="text-xs text-slate-500">Last Hour</span>}>
              <div className="h-64 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metricsHistory?.data || []}>
                    <defs>
                      <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      stroke="#475569"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={{ stroke: '#1e293b' }}
                      tickLine={false}
                      tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    />
                    <YAxis
                      stroke="#475569"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={<CustomTooltip color="#3b82f6" />} />
                    <Area
                      type="monotone"
                      dataKey="cpu_percent"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#cpuGradient)"
                      name="CPU"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Memory Usage" action={<span className="text-xs text-slate-500">Last Hour</span>}>
              <div className="h-64 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metricsHistory?.data || []}>
                    <defs>
                      <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      stroke="#475569"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={{ stroke: '#1e293b' }}
                      tickLine={false}
                      tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    />
                    <YAxis
                      stroke="#475569"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={<CustomTooltip color="#10b981" />} />
                    <Area
                      type="monotone"
                      dataKey="memory_percent"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#memGradient)"
                      name="Memory"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <>
            <SkeletonList />
            <SkeletonList />
          </>
        ) : (
          <>
            <Card title="Active Alerts" action={
              <Link to="/alerts" className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
                View All
              </Link>
            }>
              <div className="space-y-2">
                {alerts?.alerts?.slice(0, 5).map((alert: any) => (
                  <div
                    key={alert.id}
                    className="group flex items-center justify-between p-3 rounded-xl bg-slate-700/20 border border-slate-700/30 hover:bg-slate-700/30 hover:border-slate-600/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        alert.severity === 'critical' ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' :
                        alert.severity === 'error' ? 'bg-orange-500' :
                        alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{alert.rule_name}</p>
                        <p className="text-xs text-slate-500 truncate">{alert.message}</p>
                      </div>
                    </div>
                    <StatusBadge status={alert.status} size="sm" />
                  </div>
                )) || (
                  <div className="text-center py-8">
                    <Bell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No active alerts</p>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Recent Events" action={
              <Link to="/logs" className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
                View All
              </Link>
            }>
              <div className="space-y-2">
                {events?.slice(0, 5).map((event: any, index: number) => (
                  <div
                    key={index}
                    className="group flex items-center justify-between p-3 rounded-xl bg-slate-700/20 border border-slate-700/30 hover:bg-slate-700/30 hover:border-slate-600/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        event.type === 'Warning' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{event.reason}</p>
                        <p className="text-xs text-slate-500 truncate">{event.message}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{event.object}</span>
                  </div>
                )) || (
                  <div className="text-center py-8">
                    <Activity className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No recent events</p>
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
