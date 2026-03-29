import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import ToastContainer from './components/Toast'
import './index.css'

// Global axios interceptor for modules that use axios directly
axios.interceptors.request.use(
  (config) => {
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

    const monitoredPrefixes = [
      '/api/v1/cluster',
      '/api/v1/metrics',
      '/api/v1/logs',
      '/api/v1/namespaces',
      '/api/v1/alerts',
    ]

    const urlPath = config.url || ''
    const shouldAttachCluster = monitoredPrefixes.some((prefix) => urlPath.startsWith(prefix))

    if (shouldAttachCluster) {
      const clusterStorage = localStorage.getItem('cluster-storage')
      if (clusterStorage) {
        try {
          const { state } = JSON.parse(clusterStorage)
          const clusterId = state?.currentCluster?.id
          if (clusterId) {
            const existingParams = (config.params || {}) as Record<string, unknown>
            config.params = {
              ...existingParams,
              cluster_id: existingParams.cluster_id ?? clusterId,
            }
          }
        } catch (error) {
          console.error('Failed to parse cluster selection:', error)
        }
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <ToastContainer />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
