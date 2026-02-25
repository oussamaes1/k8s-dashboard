import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { CheckCircle, AlertCircle, Server } from 'lucide-react'
import { useClusterStore } from '../store'
import { useEffect } from 'react'

interface ClusterInfo {
  kubernetes_version: string
  platform: string
  connected: boolean
  demo_mode?: boolean
  timestamp: string
}

export default function ClusterStatus() {
  const { setConnected, setDemoMode } = useClusterStore()
  
  const { data: info } = useQuery({
    queryKey: ['cluster-info'],
    queryFn: () => axios.get('/api/v1/cluster/info').then(res => res.data as ClusterInfo),
    refetchInterval: 30000,
    retry: 1,
  })

  useEffect(() => {
    if (info) {
      setConnected(info.connected)
      setDemoMode(!info.connected || info.demo_mode === true)
    }
  }, [info, setConnected, setDemoMode])

  if (!info) {
    return (
      <div className="flex items-center gap-2 px-6 py-3 bg-k8s-border border-b border-k8s-border">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
          <div className="h-3 bg-gray-600 rounded w-24"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-k8s-border border-b border-k8s-border">
      <div className="flex items-center gap-3">
        <Server className="w-4 h-4 text-gray-400" />
        <div className="flex items-center gap-2">
          {info.connected ? (
            <>
              <div className="relative">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full opacity-20 animate-ping"></div>
              </div>
              <span className="text-xs text-green-500 font-medium">Connected</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-yellow-500 font-medium">Demo Mode</span>
            </>
          )}
        </div>
        <span className="text-xs text-gray-400 border-l border-gray-600 pl-3">
          {info.kubernetes_version}
        </span>
      </div>
      {info.demo_mode && (
        <span className="text-xs text-gray-500 italic">
          Using simulated data
        </span>
      )}
    </div>
  )
}
