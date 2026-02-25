import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { clusterApi } from '../services/api'
import { Card, StatusBadge } from '../components/ui/Card'
import { Box, RefreshCw, Search, Filter } from 'lucide-react'
import { useClusterStore } from '../store'

export default function Pods() {
  const { selectedNamespace } = useClusterStore()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: pods, isLoading, refetch } = useQuery({
    queryKey: ['pods', selectedNamespace],
    queryFn: () => clusterApi.getPods(selectedNamespace || undefined).then(res => res.data),
    refetchInterval: 15000,
  })

  const filteredPods = pods?.filter((pod: any) => 
    pod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pod.namespace.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const statusCounts = {
    running: pods?.filter((p: any) => p.status === 'Running').length || 0,
    pending: pods?.filter((p: any) => p.status === 'Pending').length || 0,
    failed: pods?.filter((p: any) => ['Failed', 'Error'].includes(p.status)).length || 0,
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{pods?.length || 0}</p>
            <p className="text-gray-400 text-sm">Total Pods</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">{statusCounts.running}</p>
            <p className="text-gray-400 text-sm">Running</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10">
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-400">{statusCounts.pending}</p>
            <p className="text-gray-400 text-sm">Pending</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10">
          <div className="text-center">
            <p className="text-3xl font-bold text-red-400">{statusCounts.failed}</p>
            <p className="text-gray-400 text-sm">Failed</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search pods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-k8s-dark border border-k8s-border rounded-lg text-white focus:outline-none focus:border-k8s-blue"
              />
            </div>
          </div>

          {/* Current Namespace Badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-k8s-dark border border-k8s-border rounded-lg">
            <Filter size={18} className="text-gray-400" />
            <span className="text-sm text-gray-400">Namespace:</span>
            <span className="text-sm text-white font-medium">{selectedNamespace}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-k8s-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </Card>

      {/* Pods Table */}
      <Card title={`Pods (${filteredPods?.length || 0})`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-k8s-blue"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-k8s-border">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Namespace</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Node</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">IP</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Containers</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Restarts</th>
                </tr>
              </thead>
              <tbody>
                {filteredPods?.map((pod: any) => (
                  <tr key={`${pod.namespace}/${pod.name}`} className="border-b border-k8s-border/50 hover:bg-k8s-border/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Box className="text-k8s-blue" size={18} />
                        <span className="text-white font-medium">{pod.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-k8s-border text-gray-300 text-sm rounded">
                        {pod.namespace}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={pod.status} />
                    </td>
                    <td className="py-4 px-4 text-gray-300">{pod.node}</td>
                    <td className="py-4 px-4 text-gray-400 font-mono text-sm">{pod.ip}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-1">
                        {pod.containers?.map((container: string) => (
                          <span 
                            key={container}
                            className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded"
                          >
                            {container}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`font-medium ${
                        pod.restarts > 3 ? 'text-red-400' : 
                        pod.restarts > 0 ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        {pod.restarts}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
