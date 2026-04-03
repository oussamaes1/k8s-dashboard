import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { clusterApi } from '../services/api'

import { Package, RefreshCw, Play, Scale, Filter, Search, ChevronDown, ChevronUp, AlertCircle, Layers } from 'lucide-react'
import { useAuthStore } from '../store'
import axios from 'axios'

export default function Workloads() {
  const { isAdmin } = useAuthStore()
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'deployments' | 'pods'>('deployments')
  const [scaleDeployment, setScaleDeployment] = useState<{ name: string; namespace: string; replicas: number } | null>(null)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [expandedDeployments, setExpandedDeployments] = useState<Set<string>>(new Set())

  const { data: namespaces } = useQuery({
    queryKey: ['namespaces'],
    queryFn: () => clusterApi.getNamespaces().then(res => res.data),
    refetchInterval: 30000,
  })

  const { data: deployments, isLoading: deploymentsLoading, refetch: refetchDeployments } = useQuery({
    queryKey: ['deployments', selectedNamespace],
    queryFn: () => clusterApi.getDeployments(selectedNamespace === 'all' ? undefined : selectedNamespace).then(res => res.data),
    refetchInterval: 10000,
  })

  const { data: pods, isLoading: podsLoading, refetch: refetchPods } = useQuery({
    queryKey: ['pods', selectedNamespace],
    queryFn: () => clusterApi.getPods(selectedNamespace === 'all' ? undefined : selectedNamespace).then(res => res.data),
    refetchInterval: 10000,
  })

  const handleRefresh = () => {
    refetchDeployments()
    refetchPods()
  }

  const handleScaleDeployment = async () => {
    if (!scaleDeployment || !isAdmin) return

    try {
      await axios.post(
        `/api/v1/cluster/deployments/${scaleDeployment.namespace}/${scaleDeployment.name}/scale?replicas=${scaleDeployment.replicas}`
      )
      setActionMessage({ type: 'success', text: `Successfully scaled ${scaleDeployment.name} to ${scaleDeployment.replicas} replicas` })
      setScaleDeployment(null)
      setTimeout(() => refetchDeployments(), 1000)
    } catch (error: any) {
      setActionMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to scale deployment' })
    }

    setTimeout(() => setActionMessage(null), 5000)
  }

  const handleRestartPod = async (namespace: string, podName: string) => {
    if (!isAdmin) return

    if (!window.confirm(`Restart pod '${podName}'? It will be recreated by the controller.`)) return

    try {
      await axios.post(`/api/v1/cluster/pods/${namespace}/${podName}/restart`)
      setActionMessage({ type: 'success', text: `Successfully restarted ${podName}` })
      setTimeout(() => refetchPods(), 1000)
    } catch (error: any) {
      setActionMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to restart pod' })
    }

    setTimeout(() => setActionMessage(null), 5000)
  }

  const toggleExpand = (key: string) => {
    const next = new Set(expandedDeployments)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setExpandedDeployments(next)
  }

  const filteredDeployments = deployments?.filter((dep: any) =>
    dep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dep.namespace.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const filteredPods = pods?.filter((pod: any) =>
    pod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pod.namespace.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running':
      case 'Ready':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'Pending':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'Failed':
      case 'Error':
        return 'text-red-400 bg-red-500/10 border-red-500/20'
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
    }
  }

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'Running':
      case 'Ready':
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

  const totalDeployments = filteredDeployments.length
  const totalPods = filteredPods.length
  const healthyDeployments = filteredDeployments.filter((d: any) => d.ready_replicas === d.replicas).length
  const runningPods = filteredPods.filter((p: any) => p.status === 'Running').length
  const failedPods = filteredPods.filter((p: any) => ['Failed', 'Error'].includes(p.status)).length

  const SkeletonRow = () => (
    <div className="px-6 py-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-5 h-5 bg-slate-700/50 rounded" />
          <div className="h-5 bg-slate-700/50 rounded w-48" />
          <div className="h-5 bg-slate-700/50 rounded w-20" />
        </div>
        <div className="flex gap-3">
          <div className="h-8 bg-slate-700/50 rounded w-16" />
          <div className="h-8 bg-slate-700/50 rounded w-16" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Workloads</h1>
          <p className="text-slate-400 mt-1">Manage deployments and pods across your cluster</p>
        </div>
        <button
          onClick={handleRefresh}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Deployments</p>
              <p className="text-2xl font-bold text-white mt-1">{totalDeployments}</p>
              <p className="text-emerald-400 text-xs mt-1">{healthyDeployments} healthy</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Package size={22} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Running Pods</p>
              <p className="text-2xl font-bold text-white mt-1">{runningPods}</p>
              <p className="text-slate-500 text-xs mt-1">of {totalPods} total</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Layers size={22} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Failed Pods</p>
              <p className="text-2xl font-bold text-white mt-1">{failedPods}</p>
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
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-400 mb-2">
              <Filter size={14} className="inline mr-1.5 -mt-0.5" />
              Namespace
            </label>
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
            >
              <option value="all">All Namespaces</option>
              {namespaces?.map((ns: any) => (
                <option key={ns.name} value={ns.name}>{ns.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-400 mb-2">
              <Search size={14} className="inline mr-1.5 -mt-0.5" />
              Search
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or namespace..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-800/30 p-1 rounded-xl w-fit border border-slate-700/30">
        <button
          onClick={() => setActiveTab('deployments')}
          className={`px-5 py-2.5 font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'deployments'
              ? 'bg-slate-700/80 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
          }`}
        >
          <Package size={14} className="inline mr-2" />
          Deployments
          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
            activeTab === 'deployments' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-600/50 text-slate-400'
          }`}>
            {totalDeployments}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('pods')}
          className={`px-5 py-2.5 font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'pods'
              ? 'bg-slate-700/80 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
          }`}
        >
          <Layers size={14} className="inline mr-2" />
          Pods
          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
            activeTab === 'pods' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600/50 text-slate-400'
          }`}>
            {totalPods}
          </span>
        </button>
      </div>

      {activeTab === 'deployments' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl backdrop-blur-sm overflow-hidden">
          {deploymentsLoading ? (
            <div className="divide-y divide-slate-700/30">
              {[1, 2, 3, 4].map(i => <SkeletonRow key={i} />)}
            </div>
          ) : filteredDeployments.length > 0 ? (
            <div className="divide-y divide-slate-700/30">
              <div className="px-6 py-3 bg-slate-900/30 grid grid-cols-12 gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Namespace</div>
                <div className="col-span-2">Replicas</div>
                <div className="col-span-2">Strategy</div>
                <div className="col-span-2">Status</div>
              </div>
              {filteredDeployments.map((deployment: any) => {
                const key = `${deployment.namespace}-${deployment.name}`
                const isExpanded = expandedDeployments.has(key)
                const isHealthy = deployment.ready_replicas === deployment.replicas

                return (
                  <div key={key} className="group">
                    <div 
                      className="px-6 py-4 grid grid-cols-12 gap-4 items-center cursor-pointer hover:bg-slate-700/20 transition-colors"
                      onClick={() => toggleExpand(key)}
                    >
                      <div className="col-span-4 flex items-center gap-3">
                        <button className="text-slate-500 hover:text-slate-300 transition-colors">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <Package size={18} className="text-blue-400" />
                        <span className="text-white font-medium">{deployment.name}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="px-2.5 py-1 text-xs rounded-md bg-slate-700/50 text-slate-300 border border-slate-600/30">
                          {deployment.namespace}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className={`font-medium ${isHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {deployment.ready_replicas || 0} / {deployment.replicas || 0}
                        </span>
                      </div>
                      <div className="col-span-2 text-slate-400 text-sm">
                        {deployment.strategy || 'N/A'}
                      </div>
                      <div className="col-span-2 flex items-center justify-between">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(isHealthy ? 'Ready' : 'Pending')}`}>
                          <span className={`w-2 h-2 rounded-full shadow-sm ${getStatusDot(isHealthy ? 'Ready' : 'Pending')}`} />
                          {isHealthy ? 'Healthy' : 'Updating'}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setScaleDeployment({
                                name: deployment.name,
                                namespace: deployment.namespace,
                                replicas: deployment.replicas || 1
                              })
                            }}
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all duration-200 text-xs font-medium"
                          >
                            <Scale size={14} />
                            Scale
                          </button>
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-6 py-4 bg-slate-900/30 border-t border-slate-700/30">
                        <div className="grid grid-cols-3 gap-6">
                          <div>
                            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Available Replicas</p>
                            <p className="text-white font-semibold">{deployment.available_replicas || 0}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Total Replicas</p>
                            <p className="text-white font-semibold">{deployment.replicas || 0}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Strategy</p>
                            <p className="text-white font-semibold">{deployment.strategy || 'N/A'}</p>
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
                <Package size={28} className="text-slate-500" />
              </div>
              <p className="text-slate-400 font-medium">No deployments found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your search or namespace filter</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pods' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl backdrop-blur-sm overflow-hidden">
          {podsLoading ? (
            <div className="divide-y divide-slate-700/30">
              {[1, 2, 3, 4].map(i => <SkeletonRow key={i} />)}
            </div>
          ) : filteredPods.length > 0 ? (
            <div className="divide-y divide-slate-700/30">
              <div className="px-6 py-3 bg-slate-900/30 grid grid-cols-12 gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Namespace</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Node</div>
                <div className="col-span-2">IP</div>
                <div className="col-span-1">Restarts</div>
                <div className="col-span-1">Age</div>
              </div>
              {filteredPods.map((pod: any) => (
                <div key={`${pod.namespace}-${pod.name}`} className="group px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-700/20 transition-colors">
                  <div className="col-span-3 flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${getStatusDot(pod.status)}`} />
                    <span className="text-white font-medium truncate">{pod.name}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="px-2.5 py-1 text-xs rounded-md bg-slate-700/50 text-slate-300 border border-slate-600/30">
                      {pod.namespace}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(pod.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(pod.status)}`} />
                      {pod.status}
                    </span>
                  </div>
                  <div className="col-span-2 text-slate-300 text-sm truncate">
                    {pod.node || 'N/A'}
                  </div>
                  <div className="col-span-2 text-slate-400 font-mono text-xs">
                    {pod.ip || 'N/A'}
                  </div>
                  <div className="col-span-1">
                    <span className={`font-medium ${pod.restarts > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                      {pod.restarts || 0}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center justify-between">
                    <span className="text-slate-400 text-sm">{pod.age || 'N/A'}</span>
                    {isAdmin && pod.status === 'Running' && (
                      <button
                        onClick={() => handleRestartPod(pod.namespace, pod.name)}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all duration-200 text-xs font-medium"
                      >
                        <Play size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700/30 flex items-center justify-center">
                <Layers size={28} className="text-slate-500" />
              </div>
              <p className="text-slate-400 font-medium">No pods found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your search or namespace filter</p>
            </div>
          )}
        </div>
      )}

      {scaleDeployment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/90 border border-slate-700/50 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-black/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Scale size={20} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Scale Deployment</h2>
                <p className="text-slate-400 text-sm">Adjust replica count</p>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 mb-6 border border-slate-700/30">
              <p className="text-slate-300">
                <span className="text-white font-medium">{scaleDeployment.name}</span>
                <span className="text-slate-500 mx-2">in</span>
                <span className="text-slate-400">{scaleDeployment.namespace}</span>
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Number of Replicas
              </label>
              <input
                type="number"
                min="0"
                value={scaleDeployment.replicas}
                onChange={(e) => setScaleDeployment({ ...scaleDeployment, replicas: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleScaleDeployment}
                className="flex-1 bg-blue-500 text-white py-2.5 px-4 rounded-xl hover:bg-blue-600 transition-colors font-medium"
              >
                Apply Scale
              </button>
              <button
                onClick={() => setScaleDeployment(null)}
                className="flex-1 bg-slate-700/50 text-slate-300 py-2.5 px-4 rounded-xl hover:bg-slate-700 hover:text-white transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
