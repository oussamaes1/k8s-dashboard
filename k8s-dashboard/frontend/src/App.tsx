import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AdminLogin from './pages/AdminLogin'
import UserLogin from './pages/UserLogin'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import UserDashboard from './pages/UserDashboard'
import ClusterOverview from './pages/ClusterOverview'
import ClusterManagement from './pages/ClusterManagement'
import Workloads from './pages/Workloads'
import Nodes from './pages/Nodes'
import Pods from './pages/Pods'
import Logs from './pages/Logs'
import Alerts from './pages/Alerts'
import Metrics from './pages/Metrics'
import Observability from './pages/Observability'
import RootCauseAnalysis from './pages/RootCauseAnalysis'
import Settings from './pages/Settings'
import Help from './pages/Help'
import { useAuthStore, useClusterStore } from './store'

function App() {
  const { token, isAuthenticated, isAdmin } = useAuthStore()
  const { fetchClusters, fetchAvailableNamespaces } = useClusterStore()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      if (!isAuthenticated) {
        if (mounted) setIsInitialized(true)
        return
      }

      try {
        await fetchClusters()
        await fetchAvailableNamespaces()
      } catch (error) {
        console.error('Bootstrap initialization failed:', error)
      } finally {
        if (mounted) setIsInitialized(true)
      }
    }

    bootstrap()

    return () => {
      mounted = false
    }
  }, [token, isAuthenticated, fetchClusters, fetchAvailableNamespaces])

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-sm">Initializing dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <UserLogin /> : <Navigate to={isAdmin ? "/admin" : "/user-dashboard"} replace />} />
      <Route path="/admin/login" element={!isAuthenticated ? <AdminLogin /> : <Navigate to={isAdmin ? "/admin" : "/user-dashboard"} replace />} />
      <Route path="/admin-login" element={<Navigate to="/admin/login" replace />} />
      <Route path="/user-login" element={<Navigate to="/login" replace />} />
      <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to={isAdmin ? "/admin" : "/user-dashboard"} replace />} />
      
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        
        {/* User Routes */}
        <Route path="/user-dashboard" element={<UserDashboard />} />
        
        {/* Cluster Management */}
        <Route path="/cluster-management" element={<ClusterManagement />} />
        
        {/* Shared Routes - Monitoring & Observability */}
        <Route path="/" element={isAdmin ? <Dashboard /> : <Navigate to="/user-dashboard" replace />} />
        <Route path="/cluster-overview" element={<ClusterOverview />} />
        <Route path="/workloads" element={<Workloads />} />
        <Route path="/nodes" element={<Nodes />} />
        <Route path="/pods" element={<Pods />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/metrics" element={<Metrics />} />
        <Route path="/observability" element={<Observability />} />
        <Route path="/root-cause-analysis" element={<RootCauseAnalysis />} />
        <Route path="/alerts" element={isAdmin ? <Alerts /> : <Navigate to="/user-dashboard" replace />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<Help />} />
      </Route>
      
      <Route path="*" element={<Navigate to={isAuthenticated ? (isAdmin ? "/admin" : "/user-dashboard") : "/login"} replace />} />
    </Routes>
  )
}

export default App
