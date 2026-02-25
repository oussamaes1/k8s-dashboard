import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useClusterStore } from '../store'
import axios from 'axios'
import { Layers } from 'lucide-react'

interface Namespace {
  name: string
  status: string
  pod_count: number
  description?: string
}

export default function NamespaceSelector() {
  const { selectedNamespace, setSelectedNamespace, fetchAvailableNamespaces } = useClusterStore()
  
  const { data: namespaces, isLoading } = useQuery({
    queryKey: ['namespaces'],
    queryFn: () => axios.get('/api/v1/namespaces').then(res => res.data as Namespace[]),
    refetchInterval: 30000,
  })

  useEffect(() => {
    if (namespaces && namespaces.length > 0) {
      fetchAvailableNamespaces()
    }
  }, [namespaces, fetchAvailableNamespaces])
  
  if (isLoading) {
    return (
      <div className="px-4 py-4 border-b border-k8s-border">
        <div className="animate-pulse">
          <div className="h-4 bg-k8s-border rounded w-1/2 mb-2"></div>
          <div className="h-10 bg-k8s-border rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 border-b border-k8s-border">
      <label className="block text-xs font-medium text-gray-400 mb-2">
        <Layers className="inline w-4 h-4 mr-1" />
        Project / Namespace
      </label>
      <select
        value={selectedNamespace}
        onChange={(e) => setSelectedNamespace(e.target.value)}
        title="Select Namespace"
        className="w-full px-3 py-2 bg-k8s-border text-white rounded border border-gray-600 focus:outline-none focus:border-k8s-blue text-sm transition-colors hover:border-gray-500"
      >
        {namespaces?.map(ns => (
          <option key={ns.name} value={ns.name}>
            {ns.name} ({ns.pod_count} {ns.pod_count === 1 ? 'pod' : 'pods'})
          </option>
        ))}
      </select>
      {namespaces && namespaces.length === 0 && (
        <p className="text-xs text-gray-500 mt-2">No namespaces available</p>
      )}
    </div>
  )
}
