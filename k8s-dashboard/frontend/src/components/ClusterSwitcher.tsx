import { useState, useEffect } from 'react'
import { ChevronDown, Server, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
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

export default function ClusterSwitcher() {
  const { currentCluster, clusters, setCurrentCluster, fetchClusters } = useClusterStore()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadClusters() }, [])

  const loadClusters = async () => {
    setLoading(true)
    try { await fetchClusters() } catch (error) { console.error('Failed to load clusters:', error) } finally { setLoading(false) }
  }

  const handleClusterSelect = (cluster: Cluster) => {
    setCurrentCluster(cluster)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors" disabled={loading}>
        <Server className="w-4 h-4" />
        <span className="font-medium">{currentCluster ? currentCluster.name : 'Select Cluster'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
          <div className="p-2 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 px-2">Your Clusters</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : clusters.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No clusters configured</p>
                <Link to="/cluster-management" className="text-k8s-blue hover:underline text-sm mt-2 block">Add your first cluster</Link>
              </div>
            ) : (
              <div className="py-1">
                {clusters.map((cluster) => (
                  <button key={cluster.id} onClick={() => handleClusterSelect(cluster)}
                    className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <Server className="w-4 h-4 text-gray-500" />
                      <div className="text-left">
                        <p className="font-medium text-white">{cluster.name}</p>
                        {cluster.description && <p className="text-xs text-gray-400">{cluster.description}</p>}
                      </div>
                    </div>
                    {currentCluster?.id === cluster.id && <Check className="w-4 h-4 text-green-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="p-2 border-t border-gray-700">
            <Link to="/cluster-management" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-center text-sm text-k8s-blue hover:bg-gray-700 rounded">
              Manage Clusters
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
