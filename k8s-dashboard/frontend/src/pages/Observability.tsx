import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts'
import { Activity, AlertTriangle, Cpu, MemoryStick, RefreshCw, Timer, Waves } from 'lucide-react'
import { observabilityApi } from '../services/api'
import { useClusterStore } from '../store'

const RANGE_TO_LIMIT: Record<string, number> = {
  '15m': 15,
  '1h': 60,
  '6h': 120,
  '24h': 240,
}

function MetricCard({ title, value, subtitle, icon }: { title: string; value: string | number; subtitle: string; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-300">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
    </div>
  )
}

function TimeTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null

  const colorByName = (name: string) => {
    if (name.includes('CPU')) return 'bg-blue-500'
    if (name.includes('Memory')) return 'bg-emerald-500'
    if (name.includes('In')) return 'bg-violet-500'
    if (name.includes('Out')) return 'bg-amber-500'
    return 'bg-slate-400'
  }

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-2">{new Date(label).toLocaleString()}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${colorByName(entry.name || '')}`} />
            <span className="text-slate-300 text-sm">{entry.name}</span>
            <span className="text-white text-sm font-semibold">{typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Observability() {
  const { selectedNamespace, refreshInterval } = useClusterStore()
  const [range, setRange] = useState<'15m' | '1h' | '6h' | '24h'>('1h')

  const historyLimit = RANGE_TO_LIMIT[range]

  const { data: snapshot, isLoading: snapshotLoading, refetch: refetchSnapshot } = useQuery({
    queryKey: ['observability', 'snapshot', selectedNamespace],
    queryFn: () => observabilityApi.getSnapshot().then((res) => res.data),
    refetchInterval: refreshInterval,
  })

  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['observability', 'history', selectedNamespace, historyLimit],
    queryFn: () => observabilityApi.getHistory(historyLimit).then((res) => res.data),
    refetchInterval: refreshInterval,
  })

  const { data: anomalies } = useQuery({
    queryKey: ['observability', 'anomalies', selectedNamespace],
    queryFn: () => observabilityApi.getAnomalies(8).then((res) => res.data),
    refetchInterval: refreshInterval,
  })

  const points = useMemo(() => history?.data || [], [history])

  const isLoading = snapshotLoading || historyLoading
  const isDemoMode = Boolean(snapshot?.demo_mode)

  const handleRefresh = () => {
    refetchSnapshot()
    refetchHistory()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Observability</h1>
          <p className="text-slate-400 mt-1">Grafana-style cluster telemetry with anomaly context</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-800/70 border border-slate-700/50 rounded-lg">
            {(['15m', '1h', '6h', '24h'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setRange(option)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  range === option ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {isDemoMode && (
        <div className="border border-amber-500/30 bg-amber-500/10 text-amber-300 rounded-xl px-4 py-3 text-sm">
          Running with reduced-fidelity telemetry (demo mode). Connect a live cluster for full observability depth.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="CPU Utilization"
          value={`${snapshot?.cluster?.cpu_utilization_percent ?? 0}%`}
          subtitle={`Namespace: ${selectedNamespace}`}
          icon={<Cpu size={18} />}
        />
        <MetricCard
          title="Memory Utilization"
          value={`${snapshot?.cluster?.memory_utilization_percent ?? 0}%`}
          subtitle="Cluster aggregate"
          icon={<MemoryStick size={18} />}
        />
        <MetricCard
          title="Pod Restarts"
          value={snapshot?.cluster?.total_restarts ?? 0}
          subtitle="Current observed restarts"
          icon={<AlertTriangle size={18} />}
        />
        <MetricCard
          title="Pod Throughput"
          value={snapshot?.cluster?.pods_running ?? 0}
          subtitle={`${snapshot?.cluster?.pods_pending ?? 0} pending`}
          icon={<Activity size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Timer size={16} className="text-blue-400" />
            <h2 className="text-white font-semibold">CPU / Memory Trend</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip content={<TimeTooltip />} />
                <Line type="monotone" dataKey="cpu_percent" name="CPU %" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="memory_percent" name="Memory %" stroke="#10b981" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Waves size={16} className="text-purple-400" />
            <h2 className="text-white font-semibold">Network Throughput</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points}>
                <defs>
                  <linearGradient id="obsIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="obsOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={<TimeTooltip />} />
                <Area type="monotone" dataKey="network_in" name="Network In" stroke="#8b5cf6" fill="url(#obsIn)" strokeWidth={2} />
                <Area type="monotone" dataKey="network_out" name="Network Out" stroke="#f59e0b" fill="url(#obsOut)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Recent Anomalies</h2>
        {isLoading ? (
          <p className="text-slate-400 text-sm">Loading telemetry...</p>
        ) : anomalies && anomalies.length > 0 ? (
          <div className="space-y-3">
            {anomalies.map((anomaly: any, idx: number) => {
              const score = (anomaly.normalized_score || 0) * 100
              const severityClass = score >= 80
                ? 'border-red-500/40 bg-red-500/10 text-red-300'
                : score >= 50
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  : 'border-blue-500/40 bg-blue-500/10 text-blue-300'

              return (
                <div key={idx} className={`border rounded-lg p-3 ${severityClass}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">Anomaly score: {score.toFixed(1)}%</p>
                    <p className="text-xs opacity-80">{new Date(anomaly.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-emerald-400 text-sm">No anomalies detected in the selected time range.</p>
        )}
      </div>
    </div>
  )
}
