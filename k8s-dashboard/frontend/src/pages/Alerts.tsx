import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertsApi } from '../services/api'
import { Card, StatusBadge } from '../components/ui/Card'
import { Bell, Check, X, Plus, Settings } from 'lucide-react'

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

  const getSeverityColor = (sev: string) => {
    switch(sev) {
      case 'critical': return 'border-red-500 bg-red-500/10'
      case 'error': return 'border-orange-500 bg-orange-500/10'
      case 'warning': return 'border-yellow-500 bg-yellow-500/10'
      default: return 'border-blue-500 bg-blue-500/10'
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{stats?.total_alerts || 0}</p>
            <p className="text-gray-400 text-sm">Total Alerts</p>
          </div>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">{stats?.by_severity?.critical || 0}</p>
            <p className="text-gray-400 text-sm">Critical</p>
          </div>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-400">{stats?.by_severity?.error || 0}</p>
            <p className="text-gray-400 text-sm">Error</p>
          </div>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats?.by_severity?.warning || 0}</p>
            <p className="text-gray-400 text-sm">Warning</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{stats?.resolved_alerts || 0}</p>
            <p className="text-gray-400 text-sm">Resolved</p>
          </div>
        </Card>
      </div>

      {/* Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowRules(false)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            !showRules ? 'bg-k8s-blue text-white' : 'bg-k8s-card text-gray-400 hover:text-white'
          }`}
        >
          <Bell size={16} className="inline mr-2" />
          Active Alerts
        </button>
        <button
          onClick={() => setShowRules(true)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            showRules ? 'bg-k8s-blue text-white' : 'bg-k8s-card text-gray-400 hover:text-white'
          }`}
        >
          <Settings size={16} className="inline mr-2" />
          Alert Rules
        </button>
      </div>

      {!showRules ? (
        /* Active Alerts */
        <Card title={`Active Alerts (${alerts?.count || 0})`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-k8s-blue"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts?.alerts?.map((alert: any) => (
                <div 
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-white font-medium">{alert.rule_name}</h4>
                        <StatusBadge status={alert.status} size="sm" />
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                          alert.severity === 'error' ? 'bg-orange-500/20 text-orange-400' :
                          alert.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-2">{alert.message}</p>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>Resource: {alert.resource}</span>
                        <span>Value: {alert.value}</span>
                        <span>Threshold: {alert.threshold}</span>
                        <span>Triggered: {new Date(alert.triggered_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {alert.status === 'active' && (
                        <button
                          onClick={() => acknowledgeMutation.mutate(alert.id)}
                          className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                          title="Acknowledge"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      {alert.status !== 'resolved' && (
                        <button
                          onClick={() => resolveMutation.mutate(alert.id)}
                          className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                          title="Resolve"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(!alerts?.alerts || alerts.alerts.length === 0) && (
                <p className="text-gray-400 text-center py-8">No active alerts</p>
              )}
            </div>
          )}
        </Card>
      ) : (
        /* Alert Rules */
        <Card 
          title="Alert Rules" 
          action={
            <button className="flex items-center gap-2 px-3 py-1.5 bg-k8s-blue text-white rounded-lg hover:bg-blue-600 text-sm">
              <Plus size={14} />
              Add Rule
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-k8s-border">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Metric</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Condition</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Severity</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules?.map((rule: any) => (
                  <tr key={rule.id} className="border-b border-k8s-border/50 hover:bg-k8s-border/30">
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-white font-medium">{rule.name}</p>
                        <p className="text-sm text-gray-500">{rule.description}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-300 font-mono">{rule.metric}</td>
                    <td className="py-4 px-4 text-gray-300">
                      {rule.operator} {rule.threshold}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        rule.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        rule.severity === 'error' ? 'bg-orange-500/20 text-orange-400' :
                        rule.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {rule.severity}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        rule.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button className="text-gray-400 hover:text-white">
                        <Settings size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
