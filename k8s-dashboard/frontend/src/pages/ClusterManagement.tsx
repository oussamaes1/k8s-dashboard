import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Trash2, Server, Upload, Loader2, AlertTriangle, Clock, Globe, Key, FileText, X } from 'lucide-react'
import { clusterManagementApi } from '../services/api'
import { useClusterStore } from '../store'
import { toast } from '../components/Toast'

interface Cluster {
  id: number
  name: string
  description?: string
  is_active: boolean
  last_connected?: string
  allowed_namespaces?: string[]
  is_namespace_restricted: boolean
}

function ClusterCard({ cluster, onTest, onDelete, index }: { cluster: Cluster; onTest: (id: number) => void; onDelete: (id: number) => void; index: number }) {
  const [testing, setTesting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const handleTest = async () => {
    setTesting(true)
    await onTest(cluster.id)
    setTesting(false)
  }

  const handleDelete = () => {
    if (deleteConfirm) {
      onDelete(cluster.id)
      setDeleteConfirm(false)
    } else {
      setDeleteConfirm(true)
      setTimeout(() => setDeleteConfirm(false), 5000)
    }
  }

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm hover:border-slate-600/80 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50 animate-slide-up"
      style={{ animationDelay: `${index * 75}ms` }}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{cluster.name}</h3>
              {cluster.description && <p className="text-sm text-slate-400 mt-0.5">{cluster.description}</p>}
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cluster.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${cluster.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
            {cluster.is_active ? 'Active' : 'Inactive'}
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-2 mb-4">
          {cluster.last_connected && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Last connected: {new Date(cluster.last_connected).toLocaleString()}</span>
            </div>
          )}
          {cluster.is_namespace_restricted && cluster.allowed_namespaces && cluster.allowed_namespaces.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">Restricted Namespaces</p>
              <div className="flex flex-wrap gap-1.5">
                {cluster.allowed_namespaces.map((ns) => (
                  <span key={ns} className="px-2 py-0.5 bg-slate-700/50 border border-slate-600/50 text-slate-300 text-xs rounded-md font-mono">{ns}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-slate-700/30">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            onClick={handleDelete}
            className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${deleteConfirm ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40'}`}
            title={deleteConfirm ? 'Click again to confirm deletion' : 'Delete cluster'}
          >
            {deleteConfirm ? <AlertTriangle className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
            {deleteConfirm ? 'Confirm' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddClusterModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (data: any, method: string) => Promise<void> }) {
  const [addMethod, setAddMethod] = useState<'kubeconfig' | 'token'>('kubeconfig')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    kubeconfigContent: '',
    apiServerUrl: '',
    token: '',
    allowedNamespaces: '',
    isNamespaceRestricted: false,
  })
  const [dragActive, setDragActive] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setFormData({ name: '', description: '', kubeconfigContent: '', apiServerUrl: '', token: '', allowedNamespaces: '', isNamespaceRestricted: false })
    setAddMethod('kubeconfig')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await onAdd(formData, addMethod)
      handleClose()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const content = ev.target?.result as string
        setFormData(prev => ({ ...prev, kubeconfigContent: content }))
      }
      reader.readAsText(file)
    }
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setFormData(prev => ({ ...prev, kubeconfigContent: content }))
    }
    reader.readAsText(file)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700/50 bg-slate-800/90 backdrop-blur-xl shadow-2xl shadow-slate-950/50 animate-slide-up">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-800/90 backdrop-blur-xl rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-white">Add New Cluster</h2>
            <p className="text-sm text-slate-400 mt-0.5">Connect a Kubernetes cluster to your dashboard</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Method Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Connection Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAddMethod('kubeconfig')}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${addMethod === 'kubeconfig' ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'}`}
              >
                <div className={`p-2 rounded-lg ${addMethod === 'kubeconfig' ? 'bg-blue-500/20' : 'bg-slate-700/50'}`}>
                  <FileText className={`w-5 h-5 ${addMethod === 'kubeconfig' ? 'text-blue-400' : 'text-slate-400'}`} />
                </div>
                <span className="font-semibold text-white text-sm">Kubeconfig</span>
                <span className="text-xs text-slate-400">Upload or paste config</span>
                {addMethod === 'kubeconfig' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400" />}
              </button>
              <button
                onClick={() => setAddMethod('token')}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${addMethod === 'token' ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'}`}
              >
                <div className={`p-2 rounded-lg ${addMethod === 'token' ? 'bg-blue-500/20' : 'bg-slate-700/50'}`}>
                  <Key className={`w-5 h-5 ${addMethod === 'token' ? 'text-blue-400' : 'text-slate-400'}`} />
                </div>
                <span className="font-semibold text-white text-sm">API Token</span>
                <span className="text-xs text-slate-400">URL + bearer token</span>
                {addMethod === 'token' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400" />}
              </button>
            </div>
          </div>

          {/* Common Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Cluster Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="production-cluster"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="Optional description"
              />
            </div>

            {addMethod === 'kubeconfig' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Upload Kubeconfig File</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-900/30'}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      id="kubeconfig-file"
                      type="file"
                      accept=".yaml,.yml,.conf,.config"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${dragActive ? 'text-blue-400' : 'text-slate-500'}`} />
                    <p className="text-sm text-slate-300">
                      {dragActive ? 'Drop your file here' : 'Drag & drop your kubeconfig file'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">or click to browse • .yaml, .yml, .conf</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Or Paste Kubeconfig Content <span className="text-red-400">*</span></label>
                  <textarea
                    value={formData.kubeconfigContent}
                    onChange={(e) => setFormData({ ...formData, kubeconfigContent: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                    rows={8}
                    placeholder="apiVersion: v1&#10;kind: Config&#10;clusters:&#10;- cluster:&#10;    server: https://..."
                  />
                </div>
              </div>
            )}

            {addMethod === 'token' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">API Server URL <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={formData.apiServerUrl}
                      onChange={(e) => setFormData({ ...formData, apiServerUrl: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      placeholder="https://kubernetes.default.svc"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Bearer Token <span className="text-red-400">*</span></label>
                  <textarea
                    value={formData.token}
                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                    rows={4}
                    placeholder="eyJhbGciOiJSUzI1NiIsImtpZCI6..."
                  />
                </div>
              </div>
            )}

            {/* Namespace Restriction */}
            <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-700/30">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.isNamespaceRestricted}
                    onChange={(e) => setFormData({ ...formData, isNamespaceRestricted: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-slate-700 rounded-full peer-checked:bg-blue-500 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-300">Restrict to specific namespaces</span>
                  <p className="text-xs text-slate-500 mt-0.5">Limit access to only the namespaces you specify</p>
                </div>
              </label>
            </div>

            {formData.isNamespaceRestricted && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Allowed Namespaces</label>
                <input
                  type="text"
                  value={formData.allowedNamespaces}
                  onChange={(e) => setFormData({ ...formData, allowedNamespaces: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="default, production, staging"
                />
                <p className="text-xs text-slate-500 mt-1.5">Separate multiple namespaces with commas</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 px-6 py-4 border-t border-slate-700/50 bg-slate-800/90 backdrop-blur-xl rounded-b-2xl flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !formData.name}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white rounded-xl transition-all font-medium text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {submitting ? 'Adding...' : 'Add Cluster'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClusterManagement() {
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const { fetchClusters } = useClusterStore()

  useEffect(() => { loadClusters() }, [])

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

  const handleAddCluster = async (formData: any, method: string) => {
    try {
      if (method === 'kubeconfig') {
        await clusterManagementApi.createWithKubeconfig({
          name: formData.name,
          kubeconfig_content: formData.kubeconfigContent,
          description: formData.description,
          allowed_namespaces: formData.allowedNamespaces ? formData.allowedNamespaces.split(',').map((s: string) => s.trim()) : [],
          is_namespace_restricted: formData.isNamespaceRestricted,
        })
      } else {
        await clusterManagementApi.createWithToken({
          name: formData.name,
          api_server_url: formData.apiServerUrl,
          token: formData.token,
          description: formData.description,
          allowed_namespaces: formData.allowedNamespaces ? formData.allowedNamespaces.split(',').map((s: string) => s.trim()) : [],
          is_namespace_restricted: formData.isNamespaceRestricted,
        })
      }
      loadClusters()
      fetchClusters()
      toast('Cluster added successfully!', 'success')
    } catch (error: any) {
      toast('Failed to add cluster: ' + (error.response?.data?.detail || error.message), 'error')
    }
  }

  const handleDeleteCluster = async (id: number) => {
    try {
      await clusterManagementApi.delete(id)
      loadClusters()
      fetchClusters()
      toast('Cluster deleted successfully!', 'success')
    } catch (error: any) {
      toast('Failed to delete cluster: ' + (error.response?.data?.detail || error.message), 'error')
    }
  }

  const handleTestConnection = async (id: number) => {
    try {
      const response = await clusterManagementApi.testConnection(id)
      if (response.data.success) {
        toast('Connection successful! Cluster is reachable.', 'success')
      } else {
        toast('Connection failed: ' + response.data.error, 'error')
      }
    } catch (error: any) {
      toast('Connection test failed: ' + (error.response?.data?.detail || error.message), 'error')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Cluster Management</h1>
          <p className="text-slate-400 mt-1">Add, configure, and manage your Kubernetes clusters</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
        >
          <Plus className="w-5 h-5" />
          Add Cluster
        </button>
      </div>

      {/* Clusters Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />
            <p className="text-slate-400 text-sm animate-pulse">Loading clusters...</p>
          </div>
        </div>
      ) : clusters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-slate-700/50 bg-slate-800/30">
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/30 mb-4">
            <Server className="w-12 h-12 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-1">No clusters configured</h3>
          <p className="text-sm text-slate-500 mb-6">Add your first Kubernetes cluster to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Your First Cluster
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusters.map((cluster, index) => (
            <ClusterCard
              key={cluster.id}
              cluster={cluster}
              index={index}
              onTest={handleTestConnection}
              onDelete={handleDeleteCluster}
            />
          ))}
        </div>
      )}

      {/* Add Cluster Modal */}
      <AddClusterModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCluster}
      />
    </div>
  )
}
