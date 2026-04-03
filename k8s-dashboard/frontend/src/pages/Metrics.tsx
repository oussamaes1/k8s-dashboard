import { useQuery } from '@tanstack/react-query'
import { metricsApi } from '../services/api'
import { Card } from '../components/ui/Card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Server, Activity, AlertTriangle, RefreshCw, TrendingUp, Database, Network, Shield } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 shadow-2xl shadow-black/20">
        <p className="text-slate-400 text-xs mb-2 font-medium">
          {new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-300 text-sm">{entry.name}:</span>
              <span className="text-white font-semibold text-sm">{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

function StatCard({ value, label, icon, gradient, iconBg }: { value: string | number; label: string; icon: React.ReactNode; gradient: string; iconBg: string }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm transition-all duration-300 hover:border-slate-600/50 hover:shadow-lg hover:shadow-slate-900/30 hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          <p className="text-slate-400 text-sm mt-1 font-medium">{label}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/5 blur-xl" />
    </div>
  )
}

export default function Metrics() {
  const { data: currentMetrics } = useQuery({
    queryKey: ['current-metrics'],
    queryFn: () => metricsApi.getCurrent().then(res => res.data),
    refetchInterval: 15000,
  })

  const { data: metricsHistory } = useQuery({
    queryKey: ['metrics-history-full'],
    queryFn: () => metricsApi.getHistory(undefined, 60).then(res => res.data),
    refetchInterval: 60000,
  })

  const { data: anomalies } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => metricsApi.getAnomalies(10).then(res => res.data),
  })

  const { data: metricsSummary } = useQuery({
    queryKey: ['metrics-summary'],
    queryFn: () => metricsApi.getSummary().then(res => res.data),
  })

  const resourceData = [
    { name: 'Nodes Ready', value: currentMetrics?.cluster?.nodes_ready || 0 },
    { name: 'Pods Running', value: currentMetrics?.cluster?.pods_running || 0 },
    { name: 'Pods Pending', value: currentMetrics?.cluster?.pods_pending || 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          value={`${currentMetrics?.cluster?.nodes_ready || 0}/${currentMetrics?.cluster?.nodes_total || 0}`}
          label="Nodes Ready"
          icon={<Server size={20} className="text-blue-400" />}
          gradient="from-blue-500/10 via-blue-600/5 to-slate-800/50"
          iconBg="bg-blue-500/20"
        />
        <StatCard
          value={currentMetrics?.cluster?.pods_running || 0}
          label="Pods Running"
          icon={<Activity size={20} className="text-emerald-400" />}
          gradient="from-emerald-500/10 via-emerald-600/5 to-slate-800/50"
          iconBg="bg-emerald-500/20"
        />
        <StatCard
          value={currentMetrics?.cluster?.pods_pending || 0}
          label="Pods Pending"
          icon={<AlertTriangle size={20} className="text-amber-400" />}
          gradient="from-amber-500/10 via-amber-600/5 to-slate-800/50"
          iconBg="bg-amber-500/20"
        />
        <StatCard
          value={currentMetrics?.cluster?.total_restarts || 0}
          label="Total Restarts"
          icon={<RefreshCw size={20} className="text-violet-400" />}
          gradient="from-violet-500/10 via-violet-600/5 to-slate-800/50"
          iconBg="bg-violet-500/20"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU & Memory Chart */}
        <Card title="CPU & Memory Usage">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricsHistory?.data || []}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5} />
                <XAxis
                  dataKey="timestamp"
                  stroke="#475569"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#475569"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  domain={[0, 100]}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="cpu_percent"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#3b82f6', stroke: '#1e293b', strokeWidth: 2 }}
                  name="CPU"
                />
                <Line
                  type="monotone"
                  dataKey="memory_percent"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#10b981', stroke: '#1e293b', strokeWidth: 2 }}
                  name="Memory"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Resource Distribution */}
        <Card title="Resource Distribution">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {resourceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value: string) => <span className="text-slate-300 text-sm">{value}</span>}
                  wrapperStyle={{ paddingTop: '16px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Network Traffic */}
        <Card title="Network Traffic">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricsHistory?.data || []}>
                <defs>
                  <linearGradient id="netInGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="netOutGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5} />
                <XAxis
                  dataKey="timestamp"
                  stroke="#475569"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#475569"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="network_in"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#netInGradient)"
                  name="Network In (KB/s)"
                />
                <Area
                  type="monotone"
                  dataKey="network_out"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#netOutGradient)"
                  name="Network Out (KB/s)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pod Count */}
        <Card title="Pod Count Over Time">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricsHistory?.data || []}>
                <defs>
                  <linearGradient id="podGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5} />
                <XAxis
                  dataKey="timestamp"
                  stroke="#475569"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#475569"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="pod_count"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fill="url(#podGradient)"
                  name="Pods"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Anomalies */}
      <Card title="Recent Anomalies Detected (AI-Powered)">
        {anomalies && anomalies.length > 0 ? (
          <div className="space-y-3">
            {anomalies.map((anomaly: any, index: number) => {
              const score = anomaly.normalized_score * 100
              const severityColor = score > 80 ? 'border-red-500 bg-red-500/10' : score > 50 ? 'border-amber-500 bg-amber-500/10' : 'border-blue-500 bg-blue-500/10'
              const severityText = score > 80 ? 'text-red-400' : score > 50 ? 'text-amber-400' : 'text-blue-400'

              return (
                <div
                  key={index}
                  className={`p-4 border-l-4 ${severityColor} rounded-r-xl backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:shadow-slate-900/20`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Shield size={16} className={severityText} />
                        <p className="text-white font-semibold">Anomaly Detected</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityText} bg-slate-800/50`}>
                          {score.toFixed(1)}%
                        </span>
                      </div>
                      {anomaly.contributing_factors?.map((factor: any, i: number) => (
                        <p key={i} className="text-sm text-slate-400 ml-7">
                          <span className="text-slate-300 font-medium">{factor.feature}</span>: {factor.current_value?.toFixed(2)}{' '}
                          <span className="text-slate-500">(z-score: {factor.z_score?.toFixed(2)})</span>
                        </p>
                      ))}
                    </div>
                    <span className="text-slate-500 text-sm whitespace-nowrap ml-4">
                      {new Date(anomaly.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Shield size={28} className="text-emerald-400" />
            </div>
            <p className="text-emerald-400 text-lg font-semibold">No anomalies detected</p>
            <p className="text-slate-500 text-sm mt-2">
              Isolation Forest algorithm is actively monitoring cluster metrics
            </p>
          </div>
        )}
      </Card>

      {/* Model Summary */}
      {metricsSummary && metricsSummary.model_trained && (
        <Card title="Anomaly Detection Model Summary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Database size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Training Samples</p>
                <p className="text-white text-xl font-bold">{metricsSummary.total_samples}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Model Status</p>
                <p className="text-emerald-400 text-xl font-bold">Trained</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle size={18} className="text-amber-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Anomalies Detected</p>
                <p className="text-white text-xl font-bold">{metricsSummary.anomalies_detected}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Network size={18} className="text-violet-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Features Monitored</p>
                <p className="text-white text-xl font-bold">
                  {Object.keys(metricsSummary.features || {}).length}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
