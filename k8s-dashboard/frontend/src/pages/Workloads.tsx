import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { clusterApi } from '../services/api'
import { Card } from '../components/ui/Card'
import { Package, RefreshCw, Play, Scale, Filter, Search } from 'lucide-react'
import { useAuthStore } from '../store'
import axios from 'axios'

export default function Workloads() {
  const { isAdmin } = useAuthStore()
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'deployments' | 'pods'>('deployments')
  const [scaleDeployment, setScaleDeployment] = useState<{ name: string; namespace: string; replicas: number } | null>(null)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch namespaces
  const { data: namespaces } = useQuery({
    queryKey: ['namespaces'],
    queryFn: () => clusterApi.getNamespaces().then(res => res.data),
    refetchInterval: 30000,
  })

  // Fetch deployments
  const { data: deployments, isLoading: deploymentsLoading, refetch: refetchDeployments } = useQuery({
    queryKey: ['deployments', selectedNamespace],
    queryFn: () => clusterApi.getDeployments(selectedNamespace === 'all' ? undefined : selectedNamespace).then(res => res.data),
    refetchInterval: 10000,
  })

  // Fetch pods
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
        return 'text-green-400 bg-green-500/10'
      case 'Pending':
        return 'text-yellow-400 bg-yellow-500/10'
      case 'Failed':
      case 'Error':
        return 'text-red-400 bg-red-500/10'
      default:
        return 'text-gray-400 bg-gray-500/10'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Workloads</h1>
          <p className="text-gray-400 mt-2">View and manage deployments and pods</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-k8s-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div className={`px-4 py-3 rounded-lg border ${
          actionMessage.type === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Namespace Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Filter size={14} className="inline mr-1" />
              Namespace
            </label>
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="w-full px-4 py-2 bg-k8s-darker border border-k8s-border rounded-lg text-white focus:outline-none focus:border-k8s-blue transition"
            >
              <option value="all">All Namespaces</option>
              {namespaces?.map((ns: any) => (
                <option key={ns.name} value={ns.name}>{ns.name}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Search size={14} className="inline mr-1" />
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-4 py-2 bg-k8s-darker border border-k8s-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-k8s-blue transition"
            />
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-k8s-border">
        <button
          onClick={() => setActiveTab('deployments')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'deployments'
              ? 'text-k8s-blue border-b-2 border-k8s-blue'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Deployments ({filteredDeployments.length})
        </button>
        <button
          onClick={() => setActiveTab('pods')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'pods'
              ? 'text-k8s-blue border-b-2 border-k8s-blue'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Pods ({filteredPods.length})
        </button>
      </div>

      {/* Deployments Tab */}
      {activeTab === 'deployments' && (
        <div className="space-y-4">
          {deploymentsLoading ? (
            <Card>
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-k8s-blue"></div>
              </div>
            </Card>
          ) : filteredDeployments.length > 0 ? (
            filteredDeployments.map((deployment: any) => (
              <Card key={`${deployment.namespace}-${deployment.name}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Package className="w-5 h-5 text-k8s-blue" />
                      <h3 className="text-lg font-semibold text-white">{deployment.name}</h3>
                      <span className="px-2 py-1 text-xs rounded bg-gray-500/10 text-gray-400">
                        {deployment.namespace}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-gray-500 text-sm">Replicas</p>
                        <p className="text-white font-medium">
                          {deployment.ready_replicas || 0} / {deployment.replicas || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Available</p>
                        <p className="text-white font-medium">{deployment.available_replicas || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Strategy</p>
                        <p className="text-white font-medium">{deployment.strategy || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Status</p>
                        <p className={`font-medium ${
                          deployment.ready_replicas === deployment.replicas
                            ? 'text-green-400'
                            : 'text-yellow-400'
                        }`}>
                          {deployment.ready_replicas === deployment.replicas ? 'Healthy' : 'Updating'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setScaleDeployment({
                        name: deployment.name,
                        namespace: deployment.namespace,
                        replicas: deployment.replicas || 1
                      })}
                      className="flex items-center gap-2 px-3 py-2 bg-k8s-blue/20 text-k8s-blue rounded hover:bg-k8s-blue/30 transition"
                    >
                      <Scale size={16} />
                      Scale
                    </button>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
                <p className="text-gray-400">No deployments found</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Pods Tab */}
      {activeTab === 'pods' && (
        <div className="space-y-4">
          {podsLoading ? (
            <Card>
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-k8s-blue"></div>
              </div>
            </Card>
          ) : filteredPods.length > 0 ? (
            filteredPods.map((pod: any) => (
              <Card key={`${pod.namespace}-${pod.name}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        pod.status === 'Running' ? 'bg-green-400' : 
                        pod.status === 'Pending' ? 'bg-yellow-400' : 'bg-red-400'
                      }`} />
                      <h3 className="text-lg font-semibold text-white">{pod.name}</h3>
                      <span className="px-2 py-1 text-xs rounded bg-gray-500/10 text-gray-400">
                        {pod.namespace}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(pod.status)}`}>
                        {pod.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-gray-500 text-sm">Node</p>
                        <p className="text-white font-medium">{pod.node || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">IP</p>
                        <p className="text-white font-medium">{pod.ip || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Restarts</p>
                        <p className={`font-medium ${pod.restarts > 0 ? 'text-yellow-400' : 'text-white'}`}>
                          {pod.restarts || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Age</p>
                        <p className="text-white font-medium">{pod.age || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  {isAdmin && pod.status === 'Running' && (
                    <button
                      onClick={() => handleRestartPod(pod.namespace, pod.name)}
                      className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition"
                    >
                      <Play size={16} />
                      Restart
                    </button>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
                <p className="text-gray-400">No pods found</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Scale Modal */}
      {scaleDeployment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-white mb-4">Scale Deployment</h2>
            <p className="text-gray-400 mb-4">
              Scale <span className="text-white font-medium">{scaleDeployment.name}</span> in namespace{' '}
              <span className="text-white font-medium">{scaleDeployment.namespace}</span>
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Replicas
              </label>
              <input
                type="number"
                min="0"
                value={scaleDeployment.replicas}
                onChange={(e) => setScaleDeployment({ ...scaleDeployment, replicas: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-k8s-darker border border-k8s-border rounded-lg text-white focus:outline-none focus:border-k8s-blue transition"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleScaleDeployment}
                className="flex-1 bg-k8s-blue text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
              >
                Scale
              </button>
              <button
                onClick={() => setScaleDeployment(null)}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
