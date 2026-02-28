import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import axios from 'axios'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Login from './pages/Login'
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
import RootCauseAnalysis from './pages/RootCauseAnalysis'
import Settings from './pages/Settings'
import Help from './pages/Help'
import { useAuthStore } from './store'

function App() {
  const { token, isAuthenticated, isAdmin } = useAuthStore()

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }, [token])

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={isAdmin ? "/admin" : "/user-dashboard"} replace />} />
      <Route path="/admin-login" element={!isAuthenticated ? <AdminLogin /> : <Navigate to={isAdmin ? "/admin" : "/user-dashboard"} replace />} />
      <Route path="/user-login" element={!isAuthenticated ? <UserLogin /> : <Navigate to={isAdmin ? "/admin" : "/user-dashboard"} replace />} />
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
