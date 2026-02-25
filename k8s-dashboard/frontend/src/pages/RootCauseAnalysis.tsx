import { useQuery } from '@tanstack/react-query'
import { clusterApi, alertsApi } from '../services/api'
import { Card } from '../components/ui/Card'
import { AlertTriangle, Activity, TrendingUp, RefreshCw, CheckCircle } from 'lucide-react'
import { useState } from 'react'

export default function RootCauseAnalysis() {
  const [selectedResource, setSelectedResource] = useState<any>(null)

  const { data: health, isLoading: healthLoading, refetch } = useQuery({
    queryKey: ['cluster-health'],
    queryFn: () => clusterApi.getHealth().then(res => res.data),
    refetchInterval: 15000,
  })

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.getAlerts().then(res => res.data),
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-k8s-blue"></div>
      </div>
    )
  }

  const anomalies = health?.anomalies || []
  const warnings = health?.warnings || []
  const recentAlerts = alerts?.filter((alert: any) => alert.status === 'active').slice(0, 10) || []
  const criticalEvents = events?.filter((event: any) => 
    event.type === 'Warning' || event.reason === 'Failed'
  ).slice(0, 10) || []

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'high':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'low':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Root Cause Analysis</h1>
          <p className="text-gray-400 mt-2">AI-powered anomaly detection and problem investigation</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-k8s-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="font-semibold text-white">Anomalies</h3>
          </div>
          <p className="text-3xl font-bold text-red-400">{anomalies.length}</p>
          <p className="text-gray-500 text-sm mt-1">Detected by AI</p>
        </Card>

        <Card className="flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <h3 className="font-semibold text-white">Warnings</h3>
          </div>
          <p className="text-3xl font-bold text-yellow-400">{warnings.length}</p>
          <p className="text-gray-500 text-sm mt-1">Cluster warnings</p>
        </Card>

        <Card className="flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-6 h-6 text-orange-400" />
            <h3 className="font-semibold text-white">Active Alerts</h3>
          </div>
          <p className="text-3xl font-bold text-orange-400">{recentAlerts.length}</p>
          <p className="text-gray-500 text-sm mt-1">Require attention</p>
        </Card>

        <Card className="flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            <h3 className="font-semibold text-white">Events</h3>
          </div>
          <p className="text-3xl font-bold text-blue-400">{criticalEvents.length}</p>
          <p className="text-gray-500 text-sm mt-1">Critical events</p>
        </Card>
      </div>

      {/* No Issues Found */}
      {anomalies.length === 0 && warnings.length === 0 && recentAlerts.length === 0 && (
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">All Clear!</h3>
              <p className="text-gray-400">No anomalies or critical issues detected at this time</p>
            </div>
          </div>
        </Card>
      )}

      {/* Detected Anomalies */}
      {anomalies.length > 0 && (
        <Card>
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-k8s-border">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-semibold text-white">AI-Detected Anomalies</h2>
            <span className="ml-auto px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-sm font-medium">
              {anomalies.length} detected
            </span>
          </div>

          <div className="space-y-3">
            {anomalies.map((anomaly: any, idx: number) => (
              <div
                key={idx}
                className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition cursor-pointer"
                onClick={() => setSelectedResource(anomaly)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                        {anomaly.resource_type}
                      </span>
                      <h3 className="text-white font-semibold">{anomaly.name}</h3>
                    </div>
                    <p className="text-gray-400 text-sm">{anomaly.message}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(anomaly.severity || 'medium')}`}>
                    {anomaly.severity || 'Medium'}
                  </span>
                </div>
                
                {anomaly.details && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {Object.entries(anomaly.details).map(([key, value]: [string, any]) => (
                      <div key={key}>
                        <p className="text-gray-500">{key}</p>
                        <p className="text-white font-medium">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card>
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-k8s-border">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-semibold text-white">Cluster Warnings</h2>
            <span className="ml-auto px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-sm font-medium">
              {warnings.length} warnings
            </span>
          </div>

          <div className="space-y-3">
            {warnings.map((warning: any, idx: number) => (
              <div
                key={idx}
                className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/10 transition"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
                    {warning.resource_type}
                  </span>
                  <h3 className="text-white font-semibold">{warning.name}</h3>
                </div>
                <p className="text-gray-400 text-sm">{warning.message}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active Alerts */}
      {recentAlerts.length > 0 && (
        <Card>
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-k8s-border">
            <Activity className="w-6 h-6 text-orange-400" />
            <h2 className="text-xl font-semibold text-white">Active Alerts</h2>
            <span className="ml-auto px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full text-sm font-medium">
              {recentAlerts.length} active
            </span>
          </div>

          <div className="space-y-3">
            {recentAlerts.map((alert: any) => (
              <div
                key={alert.id}
                className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg hover:bg-orange-500/10 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-white font-semibold">{alert.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{alert.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Critical Events */}
      {criticalEvents.length > 0 && (
        <Card>
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-k8s-border">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Recent Critical Events</h2>
          </div>

          <div className="space-y-2">
            {criticalEvents.map((event: any, idx: number) => (
              <div
                key={idx}
                className="p-3 bg-k8s-darker border border-k8s-border rounded-lg hover:bg-k8s-darker/50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${event.type === 'Warning' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                      <span className="text-white font-medium">{event.reason}</span>
                      <span className="text-gray-500 text-sm">• {event.namespace}</span>
                    </div>
                    <p className="text-gray-400 text-sm">{event.message}</p>
                  </div>
                  <span className="text-gray-500 text-xs whitespace-nowrap ml-4">{event.age}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Resource Detail Modal */}
      {selectedResource && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedResource.name}</h2>
                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-sm font-medium">
                  {selectedResource.resource_type}
                </span>
              </div>
              <button
                onClick={() => setSelectedResource(null)}
                className="text-gray-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Issue Description</h3>
                <p className="text-white">{selectedResource.message}</p>
              </div>

              {selectedResource.details && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Details</h3>
                  <div className="bg-k8s-darker p-4 rounded-lg">
                    <pre className="text-sm text-gray-300 overflow-x-auto">
                      {JSON.stringify(selectedResource.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Recommended Actions</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li>Check pod logs for error messages</li>
                  <li>Verify resource limits and requests</li>
                  <li>Review recent configuration changes</li>
                  <li>Check node capacity and health</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
