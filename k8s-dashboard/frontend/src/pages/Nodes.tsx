import { useQuery } from '@tanstack/react-query'
import { clusterApi } from '../services/api'
import { Card, StatusBadge } from '../components/ui/Card'
import { Server, Cpu, HardDrive, Box } from 'lucide-react'

export default function Nodes() {
  const { data: nodes, isLoading } = useQuery({
    queryKey: ['nodes'],
    queryFn: () => clusterApi.getNodes().then(res => res.data),
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-k8s-blue"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Server className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Nodes</p>
              <p className="text-2xl font-bold text-white">{nodes?.length || 0}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Server className="text-green-400" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Ready Nodes</p>
              <p className="text-2xl font-bold text-white">
                {nodes?.filter((n: any) => n.status === 'Ready').length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Cpu className="text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total CPU Cores</p>
              <p className="text-2xl font-bold text-white">
                {nodes?.reduce((acc: number, n: any) => acc + parseInt(n.cpu || 0), 0) || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Node List */}
      <Card title="Cluster Nodes">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-k8s-border">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Roles</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">CPU</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Memory</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Pods</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">OS</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Runtime</th>
              </tr>
            </thead>
            <tbody>
              {nodes?.map((node: any) => (
                <tr key={node.name} className="border-b border-k8s-border/50 hover:bg-k8s-border/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <Server className="text-k8s-blue" size={18} />
                      <span className="text-white font-medium">{node.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={node.status} />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-1">
                      {node.roles?.map((role: string) => (
                        <span 
                          key={role}
                          className="px-2 py-0.5 bg-k8s-blue/20 text-k8s-blue text-xs rounded"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-300">
                    <div className="flex items-center gap-2">
                      <Cpu size={14} className="text-gray-500" />
                      {node.cpu}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-300">
                    <div className="flex items-center gap-2">
                      <HardDrive size={14} className="text-gray-500" />
                      {node.memory}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-300">
                    <div className="flex items-center gap-2">
                      <Box size={14} className="text-gray-500" />
                      {node.pods}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-400 text-sm">{node.os}</td>
                  <td className="py-4 px-4 text-gray-400 text-sm">{node.container_runtime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
