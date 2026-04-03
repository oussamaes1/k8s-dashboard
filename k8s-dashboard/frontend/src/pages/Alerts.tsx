import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertsApi } from '../services/api'
import { Card, StatusBadge } from '../components/ui/Card'
import { Bell, Check, X, Plus, Settings, AlertCircle, AlertTriangle, Shield, Clock, AlertOctagon } from 'lucide-react'
import { toast } from '../components/Toast'

export default function Alerts() {
  const [showRules, setShowRules] = useState(false)
  const queryClient = useQueryClient()

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.getActive().then(res => res.data),
    refetchInterval: 15000,
  })

  const { data: rules } = useQuery({
    queryKey: ['alert-rules'],
    queryFn: () => alertsApi.getRules().then(res => res.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['alert-stats'],
    queryFn: () => alertsApi.getStats().then(res => res.data),
  })

  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: string) => alertsApi.acknowledge(alertId, 'admin'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  })

  const resolveMutation = useMutation({
    mutationFn: (alertId: string) => alertsApi.resolve(alertId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  })

  const getSeverityConfig = (sev: string) => {
    switch (sev) {
      case 'critical': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-l-red-500', badge: 'bg-red-500/15 text-red-400 border-red-500/30', icon: AlertOctagon }
      case 'error': return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-l-orange-500', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: AlertCircle }
      case 'warning': return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-l-amber-500', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: AlertTriangle }
      default: return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-l-blue-500', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: Bell }
    }
  }

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className={`bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm transition-all duration-300 hover:border-slate-600/50 hover:shadow-lg hover:shadow-slate-900/20 border-l-4 ${color}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center`}>
          <Icon size={18} className={color.replace('border-l-', 'text-')} />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value?.toLocaleString() || 0}</p>
          <p className="text-slate-400 text-sm">{label}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Alerts</h1>
        <p className="text-slate-400 mt-1">Monitor and manage cluster alerts and rules</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Bell}
          label="Total Alerts"
          value={stats?.total_alerts}
          color="border-l-slate-400"
        />
        <StatCard
          icon={AlertOctagon}
          label="Critical"
          value={stats?.by_severity?.critical}
          color="border-l-red-500"
        />
        <StatCard
          icon={AlertCircle}
          label="Error"
          value={stats?.by_severity?.error}
          color="border-l-orange-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Warning"
          value={stats?.by_severity?.warning}
          color="border-l-amber-500"
        />
        <StatCard
          icon={Check}
          label="Resolved"
          value={stats?.resolved_alerts}
          color="border-l-emerald-500"
        />
      </div>

      <div className="flex items-center gap-2 bg-slate-800/30 border border-slate-700/30 rounded-xl p-1.5 w-fit">
        <button
          onClick={() => setShowRules(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            !showRules
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Bell size={16} />
          Active Alerts
          {alerts?.count > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              !showRules ? 'bg-white/20' : 'bg-red-500/20 text-red-400'
            }`}>
              {alerts?.count}
            </span>
          )}
        </button>
        <button
          onClick={() => setShowRules(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            showRules
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Settings size={16} />
          Alert Rules
        </button>
      </div>

      {!showRules ? (
        <Card title="Active Alerts" className="!p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">Loading alerts...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 px-4 pb-4">
              {alerts?.alerts?.map((alert: any) => {
                const sevConfig = getSeverityConfig(alert.severity)
                const SeverityIcon = sevConfig.icon
                return (
                  <div
                    key={alert.id}
                    className={`p-5 bg-slate-900/30 border border-slate-700/30 rounded-xl border-l-4 ${sevConfig.border} transition-all duration-200 hover:border-slate-600/50 hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <SeverityIcon size={18} className={sevConfig.color} />
                          <h4 className="text-white font-semibold">{alert.rule_name}</h4>
                          <StatusBadge status={alert.status} size="sm" />
                          <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${sevConfig.badge} border`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-slate-300 mb-3">{alert.message}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Resource:</span>
                            <span className="text-slate-300 font-mono text-xs bg-slate-800/50 px-2 py-0.5 rounded">{alert.resource}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Value:</span>
                            <span className="text-white font-semibold">{alert.value}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Threshold:</span>
                            <span className="text-white font-semibold">{alert.threshold}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-500" />
                            <span className="text-slate-400 text-xs">{new Date(alert.triggered_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {alert.status === 'active' && (
                          <button
                            onClick={() => acknowledgeMutation.mutate(alert.id)}
                            disabled={acknowledgeMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/25 transition-all duration-200 text-sm font-medium disabled:opacity-50"
                            title="Acknowledge"
                          >
                            <Check size={14} />
                            Acknowledge
                          </button>
                        )}
                        {alert.status !== 'resolved' && (
                          <button
                            onClick={() => resolveMutation.mutate(alert.id)}
                            disabled={resolveMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/25 transition-all duration-200 text-sm font-medium disabled:opacity-50"
                            title="Resolve"
                          >
                            <X size={14} />
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {(!alerts?.alerts || alerts.alerts.length === 0) && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <Shield size={28} className="text-emerald-400" />
                  </div>
                  <p className="text-emerald-400 text-lg font-medium">No active alerts</p>
                  <p className="text-slate-500 text-sm mt-1">All systems are operating normally</p>
                </div>
              )}
            </div>
          )}
        </Card>
      ) : (
        <Card
          title="Alert Rules"
          action={
            <button
              onClick={() => toast('Navigate to the Alerts Rules tab to create rules via the API', 'info')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all duration-200 text-sm font-medium"
            >
              <Plus size={16} />
              Add Rule
            </button>
          }
          className="!p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-4 px-5 text-slate-400 font-medium text-sm uppercase tracking-wider">Name</th>
                  <th className="text-left py-4 px-5 text-slate-400 font-medium text-sm uppercase tracking-wider">Metric</th>
                  <th className="text-left py-4 px-5 text-slate-400 font-medium text-sm uppercase tracking-wider">Condition</th>
                  <th className="text-left py-4 px-5 text-slate-400 font-medium text-sm uppercase tracking-wider">Severity</th>
                  <th className="text-left py-4 px-5 text-slate-400 font-medium text-sm uppercase tracking-wider">Status</th>
                  <th className="text-left py-4 px-5 text-slate-400 font-medium text-sm uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules?.map((rule: any) => {
                  const sevConfig = getSeverityConfig(rule.severity)
                  return (
                    <tr key={rule.id} className="border-b border-slate-700/30 hover:bg-slate-800/40 transition-colors duration-200">
                      <td className="py-4 px-5">
                        <div>
                          <p className="text-white font-medium">{rule.name}</p>
                          <p className="text-sm text-slate-500 mt-0.5">{rule.description}</p>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <code className="text-sm text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md font-mono">{rule.metric}</code>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-slate-300 text-sm font-mono">
                          {rule.operator} <span className="text-white font-semibold">{rule.threshold}</span>
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${sevConfig.badge} border`}>
                          {rule.severity}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          rule.enabled
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                        }`}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <button
                          title="Configure rule"
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                        >
                          <Settings size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {(!rules || rules.length === 0) && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                  <Settings size={28} className="text-slate-500" />
                </div>
                <p className="text-slate-400 text-lg font-medium">No alert rules configured</p>
                <p className="text-slate-500 text-sm mt-1">Add a rule to start monitoring your cluster</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
