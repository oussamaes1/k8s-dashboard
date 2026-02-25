import { useQuery } from '@tanstack/react-query'
import { clusterApi } from '../services/api'
import { Card } from '../components/ui/Card'
import { Server, Database, HardDrive, Activity, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'

export default function ClusterOverview() {
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

  if (infoLoading || summaryLoading || healthLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-k8s-blue"></div>
      </div>
    )
  }

  const getHealthStatus = () => {
    if (!health) return { status: 'Unknown', color: 'text-gray-400', bgColor: 'bg-gray-500/10' }
    
    const anomalyCount = health.anomalies?.length || 0
    const warningCount = health.warnings?.length || 0
    
    if (anomalyCount > 0) {
      return { status: 'Critical', color: 'text-red-400', bgColor: 'bg-red-500/10' }
    } else if (warningCount > 0) {
      return { status: 'Warning', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' }
    }
    return { status: 'Healthy', color: 'text-green-400', bgColor: 'bg-green-500/10' }
  }

  const healthStatus = getHealthStatus()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Cluster Overview</h1>
          <p className="text-gray-400 mt-2">Monitor your Kubernetes cluster at a glance</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-k8s-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Cluster Info Card */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Cluster Information</h2>
            <div className="space-y-2 text-gray-300">
              <p><span className="text-gray-500">Kubernetes Version:</span> {clusterInfo?.kubernetes_version || 'N/A'}</p>
              <p><span className="text-gray-500">Platform:</span> {clusterInfo?.platform || 'N/A'}</p>
              <p><span className="text-gray-500">Connection Status:</span> 
                <span className={`ml-2 ${clusterInfo?.connected ? 'text-green-400' : 'text-red-400'}`}>
                  {clusterInfo?.connected ? '● Connected' : '● Disconnected'}
                </span>
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg ${healthStatus.bgColor}`}>
            <p className="text-sm text-gray-400 mb-1">Overall Health</p>
            <p className={`text-xl font-bold ${healthStatus.color}`}>{healthStatus.status}</p>
          </div>
        </div>
      </Card>

      {/* Resource Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Nodes */}
        <Card className="flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-8 h-8 text-k8s-blue" />
            <h3 className="text-lg font-semibold text-white">Nodes</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Total</span>
              <span className="text-white font-medium">{summary?.nodes?.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Ready</span>
              <span className="text-green-400 font-medium">{summary?.nodes?.ready || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Not Ready</span>
              <span className="text-red-400 font-medium">{summary?.nodes?.not_ready || 0}</span>
            </div>
          </div>
        </Card>

        {/* Pods */}
        <Card className="flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-8 h-8 text-green-500" />
            <h3 className="text-lg font-semibold text-white">Pods</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Total</span>
              <span className="text-white font-medium">{summary?.pods?.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Running</span>
              <span className="text-green-400 font-medium">{summary?.pods?.running || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Failed</span>
              <span className="text-red-400 font-medium">{summary?.pods?.failed || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Restarts</span>
              <span className="text-yellow-400 font-medium">{summary?.pods?.total_restarts || 0}</span>
            </div>
          </div>
        </Card>

        {/* Deployments */}
        <Card className="flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <HardDrive className="w-8 h-8 text-purple-500" />
            <h3 className="text-lg font-semibold text-white">Deployments</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Total</span>
              <span className="text-white font-medium">{summary?.deployments?.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Healthy</span>
              <span className="text-green-400 font-medium">{summary?.deployments?.healthy || 0}</span>
            </div>
          </div>
        </Card>

        {/* Namespaces */}
        <Card className="flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-8 h-8 text-yellow-500" />
            <h3 className="text-lg font-semibold text-white">Namespaces</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Total</span>
              <span className="text-white font-medium">{summary?.namespaces?.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Services</span>
              <span className="text-white font-medium">{summary?.services?.total || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Anomalies and Warnings */}
      {health && (health.anomalies?.length > 0 || health.warnings?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Anomalies */}
          {health.anomalies && health.anomalies.length > 0 && (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Detected Anomalies</h3>
              </div>
              <div className="space-y-2">
                {health.anomalies.slice(0, 5).map((anomaly: any, idx: number) => (
                  <div key={idx} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 font-medium">{anomaly.resource_type}: {anomaly.name}</p>
                    <p className="text-gray-400 text-sm mt-1">{anomaly.message}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Warnings */}
          {health.warnings && health.warnings.length > 0 && (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Warnings</h3>
              </div>
              <div className="space-y-2">
                {health.warnings.slice(0, 5).map((warning: any, idx: number) => (
                  <div key={idx} className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-400 font-medium">{warning.resource_type}: {warning.name}</p>
                    <p className="text-gray-400 text-sm mt-1">{warning.message}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Healthy Status */}
      {health && health.anomalies?.length === 0 && health.warnings?.length === 0 && (
        <Card>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">All Systems Operational</h3>
              <p className="text-gray-400">No anomalies or warnings detected in your cluster</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
