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
} from 'recharts'

const COLORS = ['#326CE5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

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
      {/* Current Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-400">
              {currentMetrics?.cluster?.nodes_ready || 0}/{currentMetrics?.cluster?.nodes_total || 0}
            </p>
            <p className="text-gray-400 text-sm">Nodes Ready</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">
              {currentMetrics?.cluster?.pods_running || 0}
            </p>
            <p className="text-gray-400 text-sm">Pods Running</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10">
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-400">
              {currentMetrics?.cluster?.pods_pending || 0}
            </p>
            <p className="text-gray-400 text-sm">Pods Pending</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10">
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-400">
              {currentMetrics?.cluster?.total_restarts || 0}
            </p>
            <p className="text-gray-400 text-sm">Total Restarts</p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU & Memory Chart */}
        <Card title="CPU & Memory Usage">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricsHistory?.data || []}>
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
                  formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                />
                <Line 
                  type="monotone" 
                  dataKey="cpu_percent" 
                  stroke="#326CE5" 
                  strokeWidth={2}
                  dot={false}
                  name="CPU"
                />
                <Line 
                  type="monotone" 
                  dataKey="memory_percent" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={false}
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
                >
                  {resourceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #326CE5' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {resourceData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-400">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Network Traffic */}
        <Card title="Network Traffic">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricsHistory?.data || []}>
                <defs>
                  <linearGradient id="netInGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#326CE5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#326CE5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="netOutGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#718096"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
                <YAxis stroke="#718096" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #326CE5' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="network_in" 
                  stroke="#326CE5" 
                  fill="url(#netInGradient)"
                  name="Network In (KB/s)"
                />
                <Area 
                  type="monotone" 
                  dataKey="network_out" 
                  stroke="#F59E0B" 
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
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#718096"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
                <YAxis stroke="#718096" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #326CE5' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="pod_count" 
                  stroke="#8B5CF6" 
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
            {anomalies.map((anomaly: any, index: number) => (
              <div 
                key={index}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Anomaly Detected</p>
                    <p className="text-sm text-gray-400">
                      Score: {(anomaly.normalized_score * 100).toFixed(1)}%
                    </p>
                    {anomaly.contributing_factors?.map((factor: any, i: number) => (
                      <p key={i} className="text-sm text-red-400">
                        {factor.feature}: {factor.current_value?.toFixed(2)} (z-score: {factor.z_score?.toFixed(2)})
                      </p>
                    ))}
                  </div>
                  <span className="text-gray-500 text-sm">
                    {new Date(anomaly.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-green-400 text-lg">✓ No anomalies detected</p>
            <p className="text-gray-500 text-sm mt-2">
              Isolation Forest algorithm is monitoring cluster metrics
            </p>
          </div>
        )}
      </Card>

      {/* Model Summary */}
      {metricsSummary && metricsSummary.model_trained && (
        <Card title="Anomaly Detection Model Summary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Training Samples</p>
              <p className="text-white text-lg font-medium">{metricsSummary.total_samples}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Model Status</p>
              <p className="text-green-400 text-lg font-medium">Trained</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Anomalies Detected</p>
              <p className="text-white text-lg font-medium">{metricsSummary.anomalies_detected}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Features Monitored</p>
              <p className="text-white text-lg font-medium">
                {Object.keys(metricsSummary.features || {}).length}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
