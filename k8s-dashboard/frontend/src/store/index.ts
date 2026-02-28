import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

interface User {
  username: string
  email: string
  role: 'admin' | 'user'
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      login: async (username: string, password: string) => {
        const response = await axios.post('/api/v1/auth/login', {
          username,
          password,
        })
        const { access_token, username: user, email, role } = response.data
        const isAdmin = role === 'admin'
        set({ 
          token: access_token, 
          user: { username: user, email, role }, 
          isAuthenticated: true,
          isAdmin 
        })
        
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false, isAdmin: false })
        delete axios.defaults.headers.common['Authorization']
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

interface Cluster {
  id: number
  name: string
  description?: string
  is_active: boolean
  last_connected?: string
  allowed_namespaces?: string[]
  is_namespace_restricted: boolean
}

interface ClusterState {
  isConnected: boolean
  demoMode: boolean
  selectedNamespace: string
  availableNamespaces: string[]
  refreshInterval: number
  currentCluster: Cluster | null
  clusters: Cluster[]
  setConnected: (connected: boolean) => void
  setDemoMode: (demo: boolean) => void
  setSelectedNamespace: (namespace: string) => void
  setAvailableNamespaces: (namespaces: string[]) => void
  setRefreshInterval: (interval: number) => void
  setCurrentCluster: (cluster: Cluster | null) => void
  setClusters: (clusters: Cluster[]) => void
  fetchAvailableNamespaces: () => Promise<void>
  fetchClusters: () => Promise<void>
}

export const useClusterStore = create<ClusterState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      demoMode: true,
      selectedNamespace: 'default',
      availableNamespaces: [],
      refreshInterval: 30000, // 30 seconds
      currentCluster: null,
      clusters: [],
      setConnected: (connected) => set({ isConnected: connected }),
      setDemoMode: (demo) => set({ demoMode: demo }),
      setSelectedNamespace: (namespace) => {
        set({ selectedNamespace: namespace })
        // Notify backend of namespace selection
        axios.post(`/api/v1/namespaces/${namespace}/select`).catch(err => {
          console.error('Failed to select namespace:', err)
        })
      },
      setAvailableNamespaces: (namespaces) => set({ availableNamespaces: namespaces }),
      setRefreshInterval: (interval) => set({ refreshInterval: interval }),
      setCurrentCluster: (cluster) => set({ currentCluster: cluster }),
      setClusters: (clusters) => set({ clusters }),
      fetchAvailableNamespaces: async () => {
        try {
          const response = await axios.get('/api/v1/namespaces')
          const namespaces = response.data.map((ns: any) => ns.name)
          set({ availableNamespaces: namespaces })
        } catch (error) {
          console.error('Failed to fetch namespaces:', error)
        }
      },
      fetchClusters: async () => {
        try {
          const response = await axios.get('/api/v1/clusters/')
          const clusters = response.data
          set({ clusters })
          // Auto-select first cluster if none selected
          if (!get().currentCluster && clusters.length > 0) {
            set({ currentCluster: clusters[0] })
          }
        } catch (error) {
          console.error('Failed to fetch clusters:', error)
        }
      },
    }),
    {
      name: 'cluster-storage',
    }
  )
)

interface AlertState {
  activeAlerts: number
  criticalAlerts: number
  setActiveAlerts: (count: number) => void
  setCriticalAlerts: (count: number) => void
}

export const useAlertStore = create<AlertState>((set) => ({
  activeAlerts: 0,
  criticalAlerts: 0,
  setActiveAlerts: (count) => set({ activeAlerts: count }),
  setCriticalAlerts: (count) => set({ criticalAlerts: count }),
}))
