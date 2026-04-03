import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { logsApi, clusterApi } from '../services/api'
import { Card } from '../components/ui/Card'
import { Search, Filter, Download, RefreshCw, Info, AlertTriangle, AlertCircle, Bug } from 'lucide-react'
import { toast } from '../components/Toast'

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

  const getSeverityConfig = (sev: string) => {
    switch (sev?.toUpperCase()) {
      case 'ERROR': return { bg: 'bg-red-500/15 border-red-500/30 text-red-400', icon: AlertCircle, color: 'text-red-400' }
      case 'WARN':
      case 'WARNING': return { bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400', icon: AlertTriangle, color: 'text-amber-400' }
      case 'DEBUG': return { bg: 'bg-violet-500/15 border-violet-500/30 text-violet-400', icon: Bug, color: 'text-violet-400' }
      default: return { bg: 'bg-blue-500/15 border-blue-500/30 text-blue-400', icon: Info, color: 'text-blue-400' }
    }
  }

  const handleExport = () => {
    const entries = logs?.logs || []
    if (entries.length === 0) {
      toast('No log entries to export', 'warning')
      return
    }
    const text = entries.map((l: any) => `[${l.timestamp || ''}] [${l.severity || 'INFO'}] ${l.pod || ''}: ${l.message || ''}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `k8s-logs-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast('Logs exported successfully', 'success')
  }

  const logCount = logs?.count || logs?.logs?.length || 0

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm transition-all duration-300 hover:border-slate-600/50 hover:shadow-lg hover:shadow-slate-900/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-white tracking-tight">{stats?.stats?.total_entries?.toLocaleString() || 0}</p>
              <p className="text-slate-400 text-sm mt-1 font-medium">Total Entries</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-600/30 flex items-center justify-center">
              <Filter size={18} className="text-slate-300" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/5 blur-xl" />
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-slate-800/50 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm transition-all duration-300 hover:border-slate-600/50 hover:shadow-lg hover:shadow-slate-900/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-blue-400 tracking-tight">{stats?.stats?.by_severity?.INFO?.toLocaleString() || 0}</p>
              <p className="text-slate-400 text-sm mt-1 font-medium">Info</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Info size={18} className="text-blue-400" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-blue-500/10 blur-xl" />
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-slate-800/50 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm transition-all duration-300 hover:border-slate-600/50 hover:shadow-lg hover:shadow-slate-900/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-amber-400 tracking-tight">{stats?.stats?.by_severity?.WARN?.toLocaleString() || 0}</p>
              <p className="text-slate-400 text-sm mt-1 font-medium">Warnings</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle size={18} className="text-amber-400" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-amber-500/10 blur-xl" />
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-red-500/10 via-red-600/5 to-slate-800/50 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm transition-all duration-300 hover:border-slate-600/50 hover:shadow-lg hover:shadow-slate-900/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-red-400 tracking-tight">{stats?.stats?.by_severity?.ERROR?.toLocaleString() || 0}</p>
              <p className="text-slate-400 text-sm mt-1 font-medium">Errors</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <AlertCircle size={18} className="text-red-400" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-red-500/10 blur-xl" />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          {/* Namespace Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={selectedNamespace || ''}
              onChange={(e) => setSelectedNamespace(e.target.value || null)}
              className="bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all text-sm"
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
            className="bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all text-sm"
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
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all text-sm font-medium"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-xl hover:bg-slate-700 hover:text-white transition-all text-sm font-medium"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Logs View */}
      <Card title={`Logs (${logCount})`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
              <p className="text-slate-400 text-sm">Loading logs...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {(logs?.logs || []).map((log: any, index: number) => {
              const sevConfig = getSeverityConfig(log.severity)
              const SeverityIcon = sevConfig.icon

              return (
                <div
                  key={log.id || index}
                  className="group p-4 bg-slate-900/50 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200 hover:shadow-md hover:shadow-slate-900/20"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-slate-500 text-xs font-mono shrink-0 mt-0.5 tabular-nums">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border shrink-0 ${sevConfig.bg}`}>
                      <SeverityIcon size={12} />
                      {log.severity}
                    </span>
                    <span className="text-slate-400 text-xs font-mono shrink-0">[{log.namespace}/{log.pod}]</span>
                    <span className="text-slate-200 text-sm font-mono break-all leading-relaxed">{log.message}</span>
                  </div>
                </div>
              )
            })}
            {(!logs?.logs || logs.logs.length === 0) && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700/30 flex items-center justify-center">
                  <Search size={24} className="text-slate-500" />
                </div>
                <p className="text-slate-400 text-lg font-medium">No logs found</p>
                <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
