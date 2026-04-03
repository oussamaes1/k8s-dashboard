import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { clusterApi } from '../services/api'

import { Box, RefreshCw, Search, Filter, ChevronDown, ChevronUp, Layers, AlertCircle, Terminal, Clock, RotateCcw, Network } from 'lucide-react'
import { useClusterStore } from '../store'
import axios from 'axios'

export default function Pods() {
  const { selectedNamespace } = useClusterStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPods, setExpandedPods] = useState<Set<string>>(new Set())
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: pods, isLoading, refetch } = useQuery({
    queryKey: ['pods', selectedNamespace],
    queryFn: () => clusterApi.getPods(selectedNamespace || undefined).then(res => res.data),
    refetchInterval: 15000,
  })

  const toggleExpand = (key: string) => {
    const next = new Set(expandedPods)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setExpandedPods(next)
  }

  const handleRestartPod = async (namespace: string, podName: string) => {
    if (!window.confirm(`Restart pod '${podName}'? It will be recreated by the controller.`)) return

    try {
      await axios.post(`/api/v1/cluster/pods/${namespace}/${podName}/restart`)
      setActionMessage({ type: 'success', text: `Successfully restarted ${podName}` })
      setTimeout(() => refetch(), 1000)
    } catch (error: any) {
      setActionMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to restart pod' })
    }

    setTimeout(() => setActionMessage(null), 5000)
  }

  const filteredPods = pods?.filter((pod: any) => {
    const matchesSearch = pod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pod.namespace.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || pod.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  const statusCounts = {
    running: pods?.filter((p: any) => p.status === 'Running').length || 0,
    pending: pods?.filter((p: any) => p.status === 'Pending').length || 0,
    failed: pods?.filter((p: any) => ['Failed', 'Error'].includes(p.status)).length || 0,
  }

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'Running':
        return 'bg-emerald-400 shadow-emerald-400/50'
      case 'Pending':
        return 'bg-amber-400 shadow-amber-400/50'
      case 'Failed':
      case 'Error':
        return 'bg-red-400 shadow-red-400/50'
      default:
        return 'bg-slate-400 shadow-slate-400/50'
    }
  }

  const SkeletonRow = () => (
    <div className="px-6 py-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-5 h-5 bg-slate-700/50 rounded" />
          <div className="h-5 bg-slate-700/50 rounded w-44" />
          <div className="h-6 bg-slate-700/50 rounded-full w-20" />
        </div>
        <div className="flex gap-4">
          <div className="h-5 bg-slate-700/50 rounded w-24" />
          <div className="h-5 bg-slate-700/50 rounded w-28" />
          <div className="h-5 bg-slate-700/50 rounded w-12" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Pods</h1>
          <p className="text-slate-400 mt-1">View and manage pod workloads across namespaces</p>
        </div>
        <button
          onClick={() => refetch()}
          className="group flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border border-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700/80 hover:border-slate-600/50 hover:text-white transition-all duration-200 backdrop-blur-sm"
        >
          <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
          Refresh
        </button>
      </div>

      {actionMessage && (
        <div className={`px-4 py-3 rounded-xl border backdrop-blur-sm flex items-center gap-3 animate-slide-in ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <AlertCircle size={18} />
          {actionMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Pods</p>
              <p className="text-2xl font-bold text-white mt-1">{pods?.length || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Layers size={22} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Running</p>
              <p className="text-2xl font-bold text-white mt-1">{statusCounts.running}</p>
              <p className="text-emerald-400 text-xs mt-1">{pods?.length > 0 ? Math.round((statusCounts.running / pods.length) * 100) : 0}% of total</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Terminal size={22} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-white mt-1">{statusCounts.pending}</p>
              <p className="text-slate-500 text-xs mt-1">waiting to schedule</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Clock size={22} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Failed</p>
              <p className="text-2xl font-bold text-white mt-1">{statusCounts.failed}</p>
              <p className="text-slate-500 text-xs mt-1">requires attention</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
              <AlertCircle size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pods by name or namespace..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg">
              <Filter size={16} className="text-slate-500" />
              <span className="text-sm text-slate-400">NS:</span>
              <span className="text-sm text-white font-medium">{selectedNamespace || 'all'}</span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
            >
              <option value="all">All Status</option>
              <option value="Running">Running</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Error">Error</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl backdrop-blur-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-700/30">
            {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
          </div>
        ) : filteredPods.length > 0 ? (
          <div className="divide-y divide-slate-700/30">
            <div className="px-6 py-3 bg-slate-900/30 grid grid-cols-12 gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Namespace</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Node</div>
              <div className="col-span-1">IP</div>
              <div className="col-span-1">Restarts</div>
              <div className="col-span-1">Age</div>
              <div className="col-span-1"></div>
            </div>
            {filteredPods.map((pod: any) => {
              const key = `${pod.namespace}/${pod.name}`
              const isExpanded = expandedPods.has(key)

              return (
                <div key={key} className="group">
                  <div 
                    className="px-6 py-4 grid grid-cols-12 gap-4 items-center cursor-pointer hover:bg-slate-700/20 transition-colors"
                    onClick={() => toggleExpand(key)}
                  >
                    <div className="col-span-3 flex items-center gap-3">
                      <button className="text-slate-500 hover:text-slate-300 transition-colors">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${getStatusDot(pod.status)}`} />
                      <span className="text-white font-medium truncate">{pod.name}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="px-2.5 py-1 text-xs rounded-md bg-slate-700/50 text-slate-300 border border-slate-600/30">
                        {pod.namespace}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        pod.status === 'Running' 
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                          : pod.status === 'Pending'
                            ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                            : 'text-red-400 bg-red-500/10 border-red-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(pod.status)}`} />
                        {pod.status}
                      </span>
                    </div>
                    <div className="col-span-2 text-slate-300 text-sm truncate">
                      {pod.node || 'N/A'}
                    </div>
                    <div className="col-span-1 text-slate-400 font-mono text-xs">
                      {pod.ip || 'N/A'}
                    </div>
                    <div className="col-span-1">
                      <span className={`font-medium ${
                        pod.restarts > 3 ? 'text-red-400' : 
                        pod.restarts > 0 ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {pod.restarts || 0}
                      </span>
                    </div>
                    <div className="col-span-1 text-slate-400 text-sm">
                      {pod.age || 'N/A'}
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-2">
                      {pod.status === 'Running' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRestartPod(pod.namespace, pod.name)
                          }}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all duration-200 text-xs font-medium"
                        >
                          <RotateCcw size={12} />
                          Restart
                        </button>
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-6 py-4 bg-slate-900/30 border-t border-slate-700/30">
                      <div className="grid grid-cols-4 gap-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Network size={14} className="text-blue-400" />
                            <p className="text-slate-500 text-xs uppercase tracking-wider">Node</p>
                          </div>
                          <p className="text-white font-medium">{pod.node || 'N/A'}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Terminal size={14} className="text-emerald-400" />
                            <p className="text-slate-500 text-xs uppercase tracking-wider">IP Address</p>
                          </div>
                          <p className="text-white font-mono text-sm">{pod.ip || 'N/A'}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <RotateCcw size={14} className="text-amber-400" />
                            <p className="text-slate-500 text-xs uppercase tracking-wider">Restarts</p>
                          </div>
                          <p className={`font-semibold ${pod.restarts > 0 ? 'text-amber-400' : 'text-white'}`}>
                            {pod.restarts || 0}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Clock size={14} className="text-purple-400" />
                            <p className="text-slate-500 text-xs uppercase tracking-wider">Age</p>
                          </div>
                          <p className="text-white font-medium">{pod.age || 'N/A'}</p>
                        </div>
                      </div>
                      {pod.containers && pod.containers.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-700/30">
                          <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Containers</p>
                          <div className="flex flex-wrap gap-2">
                            {pod.containers.map((container: string) => (
                              <span 
                                key={container}
                                className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg border border-emerald-500/20 font-medium"
                              >
                                {container}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700/30 flex items-center justify-center">
              <Box size={28} className="text-slate-500" />
            </div>
            <p className="text-slate-400 font-medium">No pods found</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}
