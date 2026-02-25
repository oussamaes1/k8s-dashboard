import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { logsApi, clusterApi } from '../services/api'
import { Card } from '../components/ui/Card'
import { Search, Filter, Download, RefreshCw } from 'lucide-react'

export default function Logs() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null)
  const [severity, setSeverity] = useState<string | null>(null)

  const { data: namespaces } = useQuery({
    queryKey: ['namespaces'],
    queryFn: () => clusterApi.getNamespaces().then(res => res.data),
  })

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['logs-search', searchQuery, selectedNamespace, severity],
    queryFn: () => searchQuery 
      ? logsApi.search(searchQuery, selectedNamespace || undefined, severity || undefined, 100).then(res => res.data)
      : logsApi.getAggregated(selectedNamespace || undefined, 60).then(res => res.data),
    refetchInterval: 30000,
  })

  const { data: stats } = useQuery({
    queryKey: ['log-stats'],
    queryFn: () => logsApi.getStats().then(res => res.data),
  })

  const getSeverityColor = (sev: string) => {
    switch(sev?.toUpperCase()) {
      case 'ERROR': return 'text-red-400 bg-red-500/20'
      case 'WARN': 
      case 'WARNING': return 'text-yellow-400 bg-yellow-500/20'
      case 'DEBUG': return 'text-purple-400 bg-purple-500/20'
      default: return 'text-blue-400 bg-blue-500/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{stats?.stats?.total_entries?.toLocaleString() || 0}</p>
            <p className="text-gray-400 text-sm">Total Entries</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{stats?.stats?.by_severity?.INFO?.toLocaleString() || 0}</p>
            <p className="text-gray-400 text-sm">Info</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats?.stats?.by_severity?.WARN?.toLocaleString() || 0}</p>
            <p className="text-gray-400 text-sm">Warnings</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">{stats?.stats?.by_severity?.ERROR?.toLocaleString() || 0}</p>
            <p className="text-gray-400 text-sm">Errors</p>
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
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-k8s-dark border border-k8s-border rounded-lg text-white focus:outline-none focus:border-k8s-blue"
              />
            </div>
          </div>

          {/* Namespace Filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={selectedNamespace || ''}
              onChange={(e) => setSelectedNamespace(e.target.value || null)}
              className="bg-k8s-dark border border-k8s-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-k8s-blue"
              aria-label="Select namespace"
            >
              <option value="">All Namespaces</option>
              {namespaces?.map((ns: any) => (
                <option key={ns.name} value={ns.name}>{ns.name}</option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <select
            value={severity || ''}
            onChange={(e) => setSeverity(e.target.value || null)}
            className="bg-k8s-dark border border-k8s-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-k8s-blue"
            aria-label="Select severity"
          >
            <option value="">All Severities</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warning</option>
            <option value="ERROR">Error</option>
            <option value="DEBUG">Debug</option>
          </select>

          {/* Actions */}
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-k8s-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-k8s-border text-white rounded-lg hover:bg-gray-600 transition-colors">
            <Download size={16} />
            Export
          </button>
        </div>
      </Card>

      {/* Logs View */}
      <Card title={`Logs (${logs?.count || logs?.logs?.length || 0})`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-k8s-blue"></div>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto font-mono text-sm">
            {(logs?.logs || []).map((log: any, index: number) => (
              <div 
                key={log.id || index}
                className="p-3 bg-k8s-dark rounded border border-k8s-border/50 hover:border-k8s-blue/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${getSeverityColor(log.severity)}`}>
                    {log.severity}
                  </span>
                  <span className="text-gray-400 shrink-0">[{log.namespace}/{log.pod}]</span>
                  <span className="text-white break-all">{log.message}</span>
                </div>
              </div>
            ))}
            {(!logs?.logs || logs.logs.length === 0) && (
              <p className="text-gray-400 text-center py-8">No logs found</p>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
