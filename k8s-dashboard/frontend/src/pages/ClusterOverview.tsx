import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { clusterApi } from '../services/api'

import { Server, Database, HardDrive, Activity, AlertTriangle, CheckCircle, RefreshCw, Shield } from 'lucide-react'

function StatCard({ icon: Icon, title, primary, secondary, gradient, delay }: any) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 group hover:border-slate-600/80 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50 hover:-translate-y-0.5 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500 blur-2xl`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${gradient} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
        <p className="text-3xl font-bold text-white tracking-tight">{primary}</p>
        {secondary && (
          <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-1.5">
            {secondary.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{item.label}</span>
                <span className={`font-semibold ${item.color || 'text-slate-300'}`}>{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function HealthScoreBanner({ health }: { health: any }) {
  const anomalyCount = health?.anomalies?.length || 0
  const warningCount = health?.warnings?.length || 0

  const getScore = () => {
    if (anomalyCount > 0) return { score: Math.max(0, 100 - (anomalyCount * 25) - (warningCount * 10)), label: 'Critical', gradient: 'from-red-500 via-rose-500 to-pink-600', glow: 'shadow-red-500/25', indicator: 'bg-red-400' }
    if (warningCount > 0) return { score: Math.max(0, 100 - (warningCount * 15)), label: 'Warning', gradient: 'from-amber-500 via-orange-500 to-yellow-600', glow: 'shadow-amber-500/25', indicator: 'bg-amber-400' }
    return { score: 100, label: 'Healthy', gradient: 'from-emerald-500 via-green-500 to-teal-600', glow: 'shadow-emerald-500/25', indicator: 'bg-emerald-400' }
  }

  const healthData = getScore()
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (healthData.score / 100) * circumference

  return (
    <div className="relative overflow-hidden rounded-2xl animate-fade-in">
      <div className={`absolute inset-0 bg-gradient-to-r ${healthData.gradient} animate-gradient opacity-90`} />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTFWMzRoMXptMCAxMHY2aC0xVjQ0aDF6bS0xMCAwdjZoLTFWNDRoMXptLTEwIDB2NmgtMVY0NGgxeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <svg className="w-28 h-28 transform -rotate-90 drop-shadow-lg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.15)" strokeWidth="8" fill="none" />
                <circle
                  cx="50" cy="50" r="40"
                  stroke="white"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{healthData.score}</span>
                <span className="text-[10px] uppercase tracking-wider text-white/60">Score</span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Cluster Health Score</h2>
              <p className="text-white/70 text-sm">
                {anomalyCount > 0 && `${anomalyCount} critical issue${anomalyCount > 1 ? 's' : ''} require${anomalyCount === 1 ? 's' : ''} immediate attention`}
                {warningCount > 0 && anomalyCount === 0 && `${warningCount} warning${warningCount > 1 ? 's' : ''} should be reviewed`}
                {anomalyCount === 0 && warningCount === 0 && 'All systems operating normally'}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className={`w-2.5 h-2.5 rounded-full ${healthData.indicator} animate-pulse shadow-lg`} />
                <span className="text-white font-semibold text-sm">{healthData.label}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 lg:gap-8">
            {[
              { label: 'Nodes', value: health?.nodes?.total || 0 },
              { label: 'Pods', value: health?.pods?.total || 0 },
              { label: 'Deployments', value: health?.deployments?.total || 0 },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/50 uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AnomalyCard({ anomalies, warnings }: { anomalies: any[]; warnings: any[] }) {
  const items = [
    ...(anomalies || []).map((a: any) => ({ ...a, severity: 'critical' as const })),
    ...(warnings || []).map((w: any) => ({ ...w, severity: 'warning' as const })),
  ].sort((a) => (a.severity === 'critical' ? -1 : 0))

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-8 animate-slide-up">
        <div className="flex flex-col items-center justify-center text-center py-4">
          <div className="p-4 rounded-full bg-emerald-500/10 mb-4 ring-1 ring-emerald-500/20">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">All Systems Operational</h3>
          <p className="text-slate-400 max-w-md">No anomalies or warnings detected. Your cluster is running smoothly.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden animate-slide-up">
      <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-3 bg-slate-900/30">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Issues Detected</h3>
        <span className="ml-auto px-2.5 py-1 text-xs font-medium rounded-full bg-slate-700/80 text-slate-300 border border-slate-600/50">{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="divide-y divide-slate-700/30 max-h-96 overflow-y-auto">
        {items.slice(0, 8).map((item: any, idx: number) => (
          <div key={idx} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-700/20 transition-colors duration-200">
            <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.severity === 'critical' ? 'bg-red-400 shadow-sm shadow-red-400/50' : 'bg-amber-400 shadow-sm shadow-amber-400/50'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${item.severity === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  {item.severity === 'critical' ? 'Critical' : 'Warning'}
                </span>
                <span className="text-xs text-slate-500 font-mono">{item.resource_type}</span>
              </div>
              <p className="text-sm font-medium text-slate-200 truncate">{item.name}</p>
              <p className="text-xs text-slate-400 mt-1">{item.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ClusterOverview() {
  const [refreshing, setRefreshing] = useState(false)
  const { data: clusterInfo, isLoading: infoLoading } = useQuery({
    queryKey: ['cluster-info'],
    queryFn: () => clusterApi.getInfo().then(res => res.data),
    refetchInterval: 30000,
  })

  const { data: summary, isLoading: summaryLoading, refetch } = useQuery({
    queryKey: ['cluster-summary'],
    queryFn: () => clusterApi.getSummary().then(res => res.data),
    refetchInterval: 10000,
  })

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['cluster-health'],
    queryFn: () => clusterApi.getHealth().then(res => res.data),
    refetchInterval: 15000,
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  if (infoLoading || summaryLoading || healthLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-slate-700 border-b-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
          <p className="text-slate-400 text-sm animate-pulse">Loading cluster data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 bg-slate-950 min-h-screen">
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.5s ease-out forwards; opacity: 0; }
        .animate-gradient { background-size: 200% 200%; animation: gradient-shift 4s ease infinite; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent tracking-tight">Cluster Overview</h1>
          <p className="text-slate-400 mt-1">Real-time monitoring and health status of your Kubernetes cluster</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border border-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700/80 hover:border-slate-600/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-slate-900/30 backdrop-blur-sm group"
        >
          <RefreshCw size={16} className={`transition-transform duration-500 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
          <span className="text-sm font-medium">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Health Score Banner */}
      <HealthScoreBanner health={health} />

      {/* Cluster Info */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-start justify-between">
          <div className="space-y-3 w-full">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <Shield className="w-4 h-4 text-blue-400" />
              </div>
              Cluster Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Kubernetes Version</p>
                <p className="text-sm font-semibold text-slate-200">{clusterInfo?.kubernetes_version || 'N/A'}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Platform</p>
                <p className="text-sm font-semibold text-slate-200">{clusterInfo?.platform || 'N/A'}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Connection Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${clusterInfo?.connected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-red-400 shadow-sm shadow-red-400/50'} ${clusterInfo?.connected ? 'animate-pulse' : ''}`} />
                  <p className={`text-sm font-semibold ${clusterInfo?.connected ? 'text-emerald-400' : 'text-red-400'}`}>
                    {clusterInfo?.connected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Server}
          title="Nodes"
          primary={summary?.nodes?.total || 0}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          delay={150}
          secondary={[
            { label: 'Ready', value: summary?.nodes?.ready || 0, color: 'text-emerald-400' },
            { label: 'Not Ready', value: summary?.nodes?.not_ready || 0, color: 'text-red-400' },
          ]}
        />
        <StatCard
          icon={Database}
          title="Pods"
          primary={summary?.pods?.total || 0}
          gradient="bg-gradient-to-br from-emerald-500 to-green-500"
          delay={200}
          secondary={[
            { label: 'Running', value: summary?.pods?.running || 0, color: 'text-emerald-400' },
            { label: 'Failed', value: summary?.pods?.failed || 0, color: 'text-red-400' },
            { label: 'Restarts', value: summary?.pods?.total_restarts || 0, color: 'text-amber-400' },
          ]}
        />
        <StatCard
          icon={HardDrive}
          title="Deployments"
          primary={summary?.deployments?.total || 0}
          gradient="bg-gradient-to-br from-violet-500 to-purple-500"
          delay={250}
          secondary={[
            { label: 'Healthy', value: summary?.deployments?.healthy || 0, color: 'text-emerald-400' },
          ]}
        />
        <StatCard
          icon={Activity}
          title="Namespaces"
          primary={summary?.namespaces?.total || 0}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          delay={300}
          secondary={[
            { label: 'Services', value: summary?.services?.total || 0, color: 'text-slate-300' },
          ]}
        />
      </div>

      {/* Anomalies and Warnings */}
      <AnomalyCard anomalies={health?.anomalies} warnings={health?.warnings} />
    </div>
  )
}
