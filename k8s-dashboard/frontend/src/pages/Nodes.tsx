import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { clusterApi } from '../services/api'

import { Server, Cpu, HardDrive, Box, RefreshCw, Search, Filter, ChevronDown, ChevronUp, Network, Activity, Layers, Gauge } from 'lucide-react'

export default function Nodes() {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const { data: nodes, isLoading, refetch } = useQuery({
    queryKey: ['nodes'],
    queryFn: () => clusterApi.getNodes().then(res => res.data),
    refetchInterval: 30000,
  })

  const toggleExpand = (name: string) => {
    const next = new Set(expandedNodes)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    setExpandedNodes(next)
  }

  const filteredNodes = nodes?.filter((node: any) =>
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.os?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const totalNodes = nodes?.length || 0
  const readyNodes = nodes?.filter((n: any) => n.status === 'Ready').length || 0
  const totalCPU = nodes?.reduce((acc: number, n: any) => acc + parseInt(n.cpu || '0'), 0) || 0
  const totalPods = nodes?.reduce((acc: number, n: any) => acc + parseInt(n.pods || '0'), 0) || 0

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'Ready':
        return 'bg-emerald-400 shadow-emerald-400/50'
      case 'NotReady':
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
          <div className="h-5 bg-slate-700/50 rounded w-40" />
          <div className="h-6 bg-slate-700/50 rounded-full w-20" />
        </div>
        <div className="flex gap-4">
          <div className="h-5 bg-slate-700/50 rounded w-16" />
          <div className="h-5 bg-slate-700/50 rounded w-20" />
          <div className="h-5 bg-slate-700/50 rounded w-12" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Nodes</h1>
          <p className="text-slate-400 mt-1">Monitor and manage cluster nodes</p>
        </div>
        <button
          onClick={() => refetch()}
          className="group flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border border-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700/80 hover:border-slate-600/50 hover:text-white transition-all duration-200 backdrop-blur-sm"
        >
          <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Nodes</p>
              <p className="text-2xl font-bold text-white mt-1">{totalNodes}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Server size={22} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Ready Nodes</p>
              <p className="text-2xl font-bold text-white mt-1">{readyNodes}</p>
              <p className="text-emerald-400 text-xs mt-1">{totalNodes > 0 ? Math.round((readyNodes / totalNodes) * 100) : 0}% available</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Activity size={22} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total CPU</p>
              <p className="text-2xl font-bold text-white mt-1">{totalCPU} <span className="text-sm text-slate-400 font-normal">cores</span></p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Cpu size={22} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Pods</p>
              <p className="text-2xl font-bold text-white mt-1">{totalPods}</p>
              <p className="text-slate-500 text-xs mt-1">across all nodes</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Layers size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search nodes by name, status, or OS..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg">
            <Filter size={16} className="text-slate-500" />
            <span className="text-sm text-slate-400">Showing</span>
            <span className="text-sm text-white font-medium">{filteredNodes.length}</span>
            <span className="text-sm text-slate-400">of {totalNodes}</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl backdrop-blur-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-700/30">
            {[1, 2, 3, 4].map(i => <SkeletonRow key={i} />)}
          </div>
        ) : filteredNodes.length > 0 ? (
          <div className="divide-y divide-slate-700/30">
            <div className="px-6 py-3 bg-slate-900/30 grid grid-cols-12 gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <div className="col-span-3">Name</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Roles</div>
              <div className="col-span-1">CPU</div>
              <div className="col-span-1">Memory</div>
              <div className="col-span-1">Pods</div>
              <div className="col-span-1">OS</div>
              <div className="col-span-2">Runtime</div>
            </div>
            {filteredNodes.map((node: any) => {
              const isExpanded = expandedNodes.has(node.name)
              const isReady = node.status === 'Ready'

              return (
                <div key={node.name} className="group">
                  <div 
                    className="px-6 py-4 grid grid-cols-12 gap-4 items-center cursor-pointer hover:bg-slate-700/20 transition-colors"
                    onClick={() => toggleExpand(node.name)}
                  >
                    <div className="col-span-3 flex items-center gap-3">
                      <button className="text-slate-500 hover:text-slate-300 transition-colors">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center">
                        <Server size={18} className="text-blue-400" />
                      </div>
                      <span className="text-white font-medium truncate">{node.name}</span>
                    </div>
                    <div className="col-span-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        isReady 
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                          : 'text-red-400 bg-red-500/10 border-red-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full shadow-sm ${getStatusDot(node.status)}`} />
                        {node.status}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex flex-wrap gap-1">
                        {node.roles?.map((role: string) => (
                          <span 
                            key={role}
                            className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded-md border border-blue-500/20 font-medium"
                          >
                            {role}
                          </span>
                        ))}
                        {(!node.roles || node.roles.length === 0) && (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-1 flex items-center gap-2 text-slate-300">
                      <Cpu size={14} className="text-slate-500" />
                      <span className="font-medium">{node.cpu}</span>
                    </div>
                    <div className="col-span-1 flex items-center gap-2 text-slate-300">
                      <HardDrive size={14} className="text-slate-500" />
                      <span className="font-medium">{node.memory}</span>
                    </div>
                    <div className="col-span-1 flex items-center gap-2 text-slate-300">
                      <Box size={14} className="text-slate-500" />
                      <span className="font-medium">{node.pods}</span>
                    </div>
                    <div className="col-span-1 text-slate-400 text-sm truncate">
                      {node.os || '—'}
                    </div>
                    <div className="col-span-2 text-slate-400 text-sm truncate">
                      {node.container_runtime || '—'}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-6 py-4 bg-slate-900/30 border-t border-slate-700/30">
                      <div className="grid grid-cols-4 gap-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Cpu size={14} className="text-purple-400" />
                            <p className="text-slate-500 text-xs uppercase tracking-wider">CPU</p>
                          </div>
                          <p className="text-white font-semibold">{node.cpu} cores</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <HardDrive size={14} className="text-amber-400" />
                            <p className="text-slate-500 text-xs uppercase tracking-wider">Memory</p>
                          </div>
                          <p className="text-white font-semibold">{node.memory}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Box size={14} className="text-blue-400" />
                            <p className="text-slate-500 text-xs uppercase tracking-wider">Pods</p>
                          </div>
                          <p className="text-white font-semibold">{node.pods} running</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Gauge size={14} className="text-emerald-400" />
                            <p className="text-slate-500 text-xs uppercase tracking-wider">Runtime</p>
                          </div>
                          <p className="text-white font-semibold">{node.container_runtime || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700/30 flex items-center justify-center">
              <Network size={28} className="text-slate-500" />
            </div>
            <p className="text-slate-400 font-medium">No nodes found</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your search filter</p>
          </div>
        )}
      </div>
    </div>
  )
}
