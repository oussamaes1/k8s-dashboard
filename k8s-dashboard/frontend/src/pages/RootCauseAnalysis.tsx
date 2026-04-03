import { useQuery } from '@tanstack/react-query'
import { clusterApi, alertsApi } from '../services/api'

import { AlertTriangle, Activity, TrendingUp, RefreshCw, CheckCircle, X, ChevronDown, ChevronUp, Clock, Zap, AlertCircle, Server, Cpu, ArrowRight, Sparkles } from 'lucide-react'
import { useState } from 'react'

export default function RootCauseAnalysis() {
  const [selectedResource, setSelectedResource] = useState<any>(null)
  const [expandedAnomaly, setExpandedAnomaly] = useState<number | null>(null)

  const { data: health, isLoading: healthLoading, refetch } = useQuery({
    queryKey: ['cluster-health'],
    queryFn: () => clusterApi.getHealth().then(res => res.data),
    refetchInterval: 15000,
  })

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.getAll().then(res => res.data),
    refetchInterval: 15000,
  })

  const { data: events } = useQuery({
    queryKey: ['cluster-events'],
    queryFn: () => clusterApi.getEvents().then(res => res.data),
    refetchInterval: 10000,
  })

  if (healthLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-2 border-slate-700 border-t-cyan-400"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-purple-400"></div>
          </div>
        </div>
      </div>
    )
  }

  const anomalies = health?.anomalies || []
  const warnings = health?.warnings || []
  const recentAlerts = alerts?.filter((alert: any) => alert.status === 'active').slice(0, 10) || []
  const criticalEvents = events?.filter((event: any) => 
    event.type === 'Warning' || event.reason === 'Failed'
  ).slice(0, 10) || []

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border border-red-500/30'
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
      case 'medium':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
    }
  }

  const getSeverityGlow = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'shadow-red-500/20'
      case 'high':
        return 'shadow-orange-500/20'
      case 'medium':
        return 'shadow-amber-500/20'
      case 'low':
        return 'shadow-blue-500/20'
      default:
        return 'shadow-slate-500/20'
    }
  }

  const statCards = [
    {
      label: 'Anomalies',
      value: anomalies.length,
      subtitle: 'Detected by AI',
      icon: Zap,
      gradient: 'from-red-500/20 to-orange-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
    },
    {
      label: 'Warnings',
      value: warnings.length,
      subtitle: 'Cluster warnings',
      icon: AlertTriangle,
      gradient: 'from-amber-500/20 to-yellow-500/10',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
    },
    {
      label: 'Active Alerts',
      value: recentAlerts.length,
      subtitle: 'Require attention',
      icon: Activity,
      gradient: 'from-orange-500/20 to-red-500/10',
      borderColor: 'border-orange-500/30',
      textColor: 'text-orange-400',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
    },
    {
      label: 'Critical Events',
      value: criticalEvents.length,
      subtitle: 'Recent events',
      icon: TrendingUp,
      gradient: 'from-cyan-500/20 to-blue-500/10',
      borderColor: 'border-cyan-500/30',
      textColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20">
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Root Cause Analysis</h1>
            <p className="text-slate-400 mt-1">AI-powered anomaly detection and problem investigation</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="group flex items-center gap-2 px-5 py-2.5 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700/80 hover:border-slate-600/50 hover:text-white transition-all duration-200 shadow-lg shadow-slate-900/50"
        >
          <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${stat.gradient} backdrop-blur-sm border ${stat.borderColor} p-5 shadow-lg ${getSeverityGlow(stat.label === 'Anomalies' ? anomalies.length > 0 ? 'critical' : 'low' : 'low')}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                  <p className={`text-4xl font-bold ${stat.textColor} mt-2 tracking-tight`}>{stat.value}</p>
                  <p className="text-slate-500 text-xs mt-1">{stat.subtitle}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.iconBg} border border-white/5`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/5 blur-xl"></div>
            </div>
          )
        })}
      </div>

      {/* No Issues Found */}
      {anomalies.length === 0 && warnings.length === 0 && recentAlerts.length === 0 && criticalEvents.length === 0 && (
        <div className="relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-12 shadow-xl">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <div className="absolute inset-0 rounded-full bg-green-400/10 animate-ping opacity-30"></div>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">All Systems Operational</h3>
            <p className="text-slate-400 max-w-md">No anomalies, warnings, or critical issues detected. Your cluster is running smoothly.</p>
          </div>
          <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-green-500/10 blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-cyan-500/10 blur-3xl"></div>
        </div>
      )}

      {/* Detected Anomalies */}
      {anomalies.length > 0 && (
        <div className="relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl">
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/20">
                <Zap className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">AI-Detected Anomalies</h2>
              <span className="ml-auto px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium border border-red-500/30">
                {anomalies.length} detected
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {anomalies.map((anomaly: any, idx: number) => (
              <div
                key={idx}
                onClick={() => setSelectedResource(anomaly)}
                className={`group relative overflow-hidden rounded-lg border transition-all duration-200 cursor-pointer ${
                  expandedAnomaly === idx
                    ? 'bg-red-500/10 border-red-500/40 shadow-lg shadow-red-500/10'
                    : 'bg-slate-900/50 border-slate-700/50 hover:border-red-500/30 hover:bg-red-500/5'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getSeverityBadge(anomaly.severity || 'medium')}`}>
                          {anomaly.resource_type}
                        </span>
                        <h3 className="text-white font-semibold">{anomaly.name}</h3>
                      </div>
                      <p className="text-slate-400 text-sm">{anomaly.message}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getSeverityBadge(anomaly.severity || 'medium')}`}>
                        {anomaly.severity || 'Medium'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedAnomaly(expandedAnomaly === idx ? null : idx)
                        }}
                        className="p-1 rounded-md text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {expandedAnomaly === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  {expandedAnomaly === idx && anomaly.details && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(anomaly.details).map(([key, value]: [string, any]) => (
                          <div key={key} className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                            <p className="text-slate-500 text-xs mb-1">{key}</p>
                            <p className="text-white font-medium text-sm">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl">
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Cluster Warnings</h2>
              <span className="ml-auto px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium border border-amber-500/30">
                {warnings.length} warnings
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {warnings.map((warning: any, idx: number) => (
              <div
                key={idx}
                className="group rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-200 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-md text-xs font-medium border border-amber-500/30">
                        {warning.resource_type}
                      </span>
                      <h3 className="text-white font-medium">{warning.name}</h3>
                    </div>
                    <p className="text-slate-400 text-sm">{warning.message}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {recentAlerts.length > 0 && (
        <div className="relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl">
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/20">
                <Activity className="w-5 h-5 text-orange-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Active Alerts</h2>
              <span className="ml-auto px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium border border-orange-500/30">
                {recentAlerts.length} active
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {recentAlerts.map((alert: any) => (
              <div
                key={alert.id}
                className="group rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all duration-200 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                      <h3 className="text-white font-semibold">{alert.title}</h3>
                    </div>
                    <p className="text-slate-400 text-sm">{alert.description}</p>
                  </div>
                  <span className={`ml-4 px-2.5 py-1 rounded-md text-xs font-medium border whitespace-nowrap ${getSeverityBadge(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3 text-slate-500 text-xs">
                  <Clock size={12} />
                  <span>{new Date(alert.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Events Timeline */}
      {criticalEvents.length > 0 && (
        <div className="relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl">
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/20">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Critical Events Timeline</h2>
            </div>
          </div>

          <div className="p-6">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-700/50"></div>
              <div className="space-y-4">
                {criticalEvents.map((event: any, idx: number) => (
                  <div key={idx} className="relative flex items-start gap-4 pl-10 group">
                    <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                      event.type === 'Warning' 
                        ? 'bg-yellow-400 border-yellow-400/30 shadow-lg shadow-yellow-500/20' 
                        : 'bg-cyan-400 border-cyan-400/30 shadow-lg shadow-cyan-500/20'
                    }`}></div>
                    <div className="flex-1 rounded-lg bg-slate-900/50 border border-slate-700/50 p-4 group-hover:border-slate-600/50 transition-colors">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{event.reason}</span>
                          <span className="text-slate-500 text-sm">• {event.namespace}</span>
                        </div>
                        <span className="text-slate-500 text-xs whitespace-nowrap">{event.age}</span>
                      </div>
                      <p className="text-slate-400 text-sm">{event.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Detail Modal */}
      {selectedResource && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedResource(null)}
        >
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
          <div 
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-slate-900/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 p-6 border-b border-slate-700/50 bg-slate-800/90 backdrop-blur-xl rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/20">
                      <Server className="w-5 h-5 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">{selectedResource.name}</h2>
                  </div>
                  <span className={`inline-flex px-3 py-1 rounded-md text-sm font-medium border ${getSeverityBadge(selectedResource.severity || 'medium')}`}>
                    {selectedResource.resource_type}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedResource(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Issue Description */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Issue Description
                </h3>
                <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-4">
                  <p className="text-slate-200">{selectedResource.message}</p>
                </div>
              </div>

              {/* Details */}
              {selectedResource.details && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    Resource Details
                  </h3>
                  <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 overflow-hidden">
                    <div className="grid grid-cols-2 gap-px bg-slate-700/50">
                      {Object.entries(selectedResource.details).map(([key, value]: [string, any]) => (
                        <div key={key} className="bg-slate-900/80 p-4">
                          <p className="text-slate-500 text-xs mb-1">{key}</p>
                          <p className="text-white font-medium">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Recommended Actions */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Recommended Actions
                </h3>
                <div className="space-y-2">
                  {[
                    'Check pod logs for error messages',
                    'Verify resource limits and requests',
                    'Review recent configuration changes',
                    'Check node capacity and health',
                  ].map((action, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-lg bg-slate-900/50 border border-slate-700/50 p-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-slate-300 text-sm">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
