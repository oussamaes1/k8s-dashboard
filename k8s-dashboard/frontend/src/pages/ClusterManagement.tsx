import { useState, useEffect } from 'react'
import { Plus, Trash2, Server, CheckCircle, XCircle, Upload, Link as LinkIcon } from 'lucide-react'
import { clusterManagementApi } from '../services/api'
import { useClusterStore } from '../store'

interface Cluster {
  id: number
  name: string
  description?: string
  is_active: boolean
  last_connected?: string
  allowed_namespaces?: string[]
  is_namespace_restricted: boolean
}

export default function ClusterManagement() {
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addMethod, setAddMethod] = useState<'kubeconfig' | 'token'>('kubeconfig')
  const { fetchClusters } = useClusterStore()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    kubeconfigContent: '',
    apiServerUrl: '',
    token: '',
    allowedNamespaces: '',
    isNamespaceRestricted: false,
  })

  useEffect(() => {
    loadClusters()
  }, [])

  const loadClusters = async () => {
    setLoading(true)
    try {
      const response = await clusterManagementApi.list()
      setClusters(response.data)
    } catch (error) {
      console.error('Failed to load clusters:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCluster = async () => {
    try {
      if (addMethod === 'kubeconfig') {
        await clusterManagementApi.createWithKubeconfig({
          name: formData.name,
          kubeconfig_content: formData.kubeconfigContent,
          description: formData.description,
          allowed_namespaces: formData.allowedNamespaces ? formData.allowedNamespaces.split(',').map(s => s.trim()) : [],
          is_namespace_restricted: formData.isNamespaceRestricted,
        })
      } else {
        await clusterManagementApi.createWithToken({
          name: formData.name,
          api_server_url: formData.apiServerUrl,
          token: formData.token,
          description: formData.description,
          allowed_namespaces: formData.allowedNamespaces ? formData.allowedNamespaces.split(',').map(s => s.trim()) : [],
          is_namespace_restricted: formData.isNamespaceRestricted,
        })
      }

      setShowAddModal(false)
      resetForm()
      loadClusters()
      fetchClusters()
      alert('Cluster added successfully!')
    } catch (error: any) {
      alert('Failed to add cluster: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleDeleteCluster = async (id: number) => {
    if (!confirm('Are you sure you want to delete this cluster?')) return

    try {
      await clusterManagementApi.delete(id)
      loadClusters()
      fetchClusters()
      alert('Cluster deleted successfully!')
    } catch (error: any) {
      alert('Failed to delete cluster: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleTestConnection = async (id: number) => {
    try {
      const response = await clusterManagementApi.testConnection(id)
      if (response.data.success) {
        alert('Connection successful!\n\n' + JSON.stringify(response.data.cluster_info, null, 2))
      } else {
        alert('Connection failed: ' + response.data.error)
      }
    } catch (error: any) {
      alert('Connection test failed: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setFormData({ ...formData, kubeconfigContent: content })
    }
    reader.readAsText(file)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      kubeconfigContent: '',
      apiServerUrl: '',
      token: '',
      allowedNamespaces: '',
      isNamespaceRestricted: false,
    })
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Cluster Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your Kubernetes clusters</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Cluster
        </button>
      </div>

      {/* Clusters List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">Loading...</div>
        ) : clusters.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Server className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No clusters configured</p>
            <p className="text-sm text-gray-500 mt-2">Add your first Kubernetes cluster to get started</p>
          </div>
        ) : (
          clusters.map((cluster) => (
            <div
              key={cluster.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Server className="w-8 h-8 text-blue-500" />
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">{cluster.name}</h3>
                    {cluster.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{cluster.description}</p>
                    )}
                  </div>
                </div>
                {cluster.is_active ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>

              {cluster.last_connected && (
                <p className="text-xs text-gray-500 mb-3">
                  Last connected: {new Date(cluster.last_connected).toLocaleString()}
                </p>
              )}

              {cluster.is_namespace_restricted && cluster.allowed_namespaces && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Restricted Namespaces:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {cluster.allowed_namespaces.map((ns) => (
                      <span
                        key={ns}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded"
                      >
                        {ns}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleTestConnection(cluster.id)}
                  className="flex-1 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                >
                  Test
                </button>
                <button
                  onClick={() => handleDeleteCluster(cluster.id)}
                  className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                  title="Delete cluster"
                  aria-label="Delete cluster"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Cluster Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Add New Cluster</h2>

              {/* Method Selection */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setAddMethod('kubeconfig')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                    addMethod === 'kubeconfig'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <Upload className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="font-semibold">Kubeconfig</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Upload config file</p>
                </button>
                <button
                  onClick={() => setAddMethod('token')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                    addMethod === 'token'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <LinkIcon className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="font-semibold">API Token</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Server URL + Token</p>
                </button>
              </div>

              {/* Common Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cluster Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    placeholder="Production Cluster"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    placeholder="Optional description"
                  />
                </div>

                {/* Kubeconfig Method */}
                {addMethod === 'kubeconfig' && (
                  <>
                    <div>
                      <label htmlFor="kubeconfig-file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Upload Kubeconfig File
                      </label>
                      <input
                        id="kubeconfig-file"
                        type="file"
                        accept=".yaml,.yml,.conf,.config"
                        onChange={handleFileUpload}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                        title="Upload kubeconfig file"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Or Paste Kubeconfig Content *
                      </label>
                      <textarea
                        value={formData.kubeconfigContent}
                        onChange={(e) => setFormData({ ...formData, kubeconfigContent: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 font-mono text-sm"
                        rows={8}
                        placeholder="apiVersion: v1&#10;kind: Config&#10;clusters:..."
                      />
                    </div>
                  </>
                )}

                {/* Token Method */}
                {addMethod === 'token' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        API Server URL *
                      </label>
                      <input
                        type="text"
                        value={formData.apiServerUrl}
                        onChange={(e) => setFormData({ ...formData, apiServerUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                        placeholder="https://kubernetes.default.svc"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bearer Token *
                      </label>
                      <textarea
                        value={formData.token}
                        onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 font-mono text-sm"
                        rows={4}
                        placeholder="eyJhbGciOiJSUzI1NiIsImtpZCI6..."
                      />
                    </div>
                  </>
                )}

                {/* Namespace Restrictions */}
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isNamespaceRestricted}
                      onChange={(e) => setFormData({ ...formData, isNamespaceRestricted: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Restrict to specific namespaces
                    </span>
                  </label>
                </div>

                {formData.isNamespaceRestricted && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Allowed Namespaces (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.allowedNamespaces}
                      onChange={(e) => setFormData({ ...formData, allowedNamespaces: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      placeholder="default, production, staging"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddCluster}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Cluster
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
