import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (where zustand persist stores it)
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage)
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`
        }
      } catch (error) {
        console.error('Failed to parse auth token:', error)
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect to login
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Cluster API
export const clusterApi = {
  getInfo: () => api.get('/cluster/info'),
  getHealth: () => api.get('/cluster/health'),
  getNodes: () => api.get('/cluster/nodes'),
  getNode: (name: string) => api.get(`/cluster/nodes/${name}`),
  getNamespaces: () => api.get('/cluster/namespaces'),
  getPods: (namespace?: string) => 
    api.get('/cluster/pods', { params: { namespace } }),
  getPod: (namespace: string, name: string) => 
    api.get(`/cluster/pods/${namespace}/${name}`),
  getDeployments: (namespace?: string) => 
    api.get('/cluster/deployments', { params: { namespace } }),
  getServices: (namespace?: string) => 
    api.get('/cluster/services', { params: { namespace } }),
  getEvents: (namespace?: string, limit?: number) => 
    api.get('/cluster/events', { params: { namespace, limit } }),
  getSummary: () => api.get('/cluster/summary'),
}

// Metrics API
export const metricsApi = {
  getCurrent: () => api.get('/metrics/current'),
  getNodeMetrics: (nodeName: string) => api.get(`/metrics/nodes/${nodeName}`),
  detectAnomaly: (metrics: Record<string, number>) => 
    api.post('/metrics/detect', metrics),
  getAnomalies: (limit?: number) => 
    api.get('/metrics/anomalies', { params: { limit } }),
  getSummary: () => api.get('/metrics/summary'),
  getHistory: (metric?: string, limit?: number) => 
    api.get('/metrics/history', { params: { metric, limit } }),
}

// Logs API
export const logsApi = {
  getPodLogs: (namespace: string, podName: string, tailLines?: number) => 
    api.get(`/logs/pods/${namespace}/${podName}`, { params: { tail_lines: tailLines } }),
  search: (query: string, namespace?: string, severity?: string, limit?: number) => 
    api.get('/logs/search', { params: { query, namespace, severity, limit } }),
  getAggregated: (namespace?: string, sinceMinutes?: number) => 
    api.get('/logs/aggregate', { params: { namespace, since_minutes: sinceMinutes } }),
  getStats: (namespace?: string) => api.get('/logs/stats', { params: { namespace } }),
}

// Alerts API
export const alertsApi = {
    getAlerts: (status?: string, severity?: string) => 
      api.get('/alerts/', { params: { status, severity } }),
  getAll: (status?: string, severity?: string) => 
    api.get('/alerts/', { params: { status, severity } }),
  getActive: () => api.get('/alerts/active'),
  get: (alertId: string) => api.get(`/alerts/${alertId}`),
  acknowledge: (alertId: string, acknowledgedBy: string, comment?: string) => 
    api.post(`/alerts/${alertId}/acknowledge`, { acknowledged_by: acknowledgedBy, comment }),
  resolve: (alertId: string) => api.post(`/alerts/${alertId}/resolve`),
  getRules: () => api.get('/alerts/rules/'),
  createRule: (rule: {
    name: string
    description?: string
    metric: string
    operator: string
    threshold: number
    severity?: string
    enabled?: boolean
  }) => api.post('/alerts/rules/', rule),
  updateRule: (ruleId: string, rule: object) => api.put(`/alerts/rules/${ruleId}`, rule),
  deleteRule: (ruleId: string) => api.delete(`/alerts/rules/${ruleId}`),
  toggleRule: (ruleId: string) => api.post(`/alerts/rules/${ruleId}/toggle`),
  getStats: () => api.get('/alerts/stats'),
}

// Namespaces API
export const namespacesApi = {
  getAll: () => api.get('/namespaces'),
  select: (namespace: string) => api.post(`/namespaces/${namespace}/select`),
  getSummary: (namespace: string) => api.get(`/namespaces/${namespace}/summary`),
  getHealth: (namespace: string) => api.get(`/namespaces/${namespace}/health`),
}

// Cluster Management API
export const clusterManagementApi = {
  list: () => api.get('/clusters/'),
  get: (id: number) => api.get(`/clusters/${id}/`),
  createWithKubeconfig: (data: {
    name: string
    kubeconfig_content: string
    description?: string
    allowed_namespaces?: string[]
    is_namespace_restricted?: boolean
  }) => api.post('/clusters/', data),
  createWithToken: (data: {
    name: string
    api_server_url: string
    token: string
    description?: string
    allowed_namespaces?: string[]
    is_namespace_restricted?: boolean
  }) => api.post('/clusters/token/', data),
  uploadKubeconfig: (name: string, file: File, description?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name)
    if (description) formData.append('description', description)
    return api.post('/clusters/upload-kubeconfig/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  update: (id: number, data: {
    name?: string
    description?: string
    allowed_namespaces?: string[]
    is_namespace_restricted?: boolean
  }) => api.put(`/clusters/${id}/`, data),
  delete: (id: number) => api.delete(`/clusters/${id}/`),
  testConnection: (id: number) => api.post(`/clusters/${id}/test/`),
}

export default api
