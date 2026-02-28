import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Server,
  Box,
  FileText,
  Bell,
  Activity,
  Settings,
  HelpCircle,
  LogOut,
  Shield,
  User,
  Layers,
  Search,
  Database,
} from 'lucide-react'
import { useAlertStore, useAuthStore, useClusterStore } from '../store'
import NamespaceSelector from './NamespaceSelector'
import ClusterStatus from './ClusterStatus'
import ClusterSwitcher from './ClusterSwitcher'

const adminNavItems = [
  { path: '/admin', label: 'Admin Dashboard', icon: Shield },
  { path: '/cluster-management', label: 'Cluster Management', icon: Database },
  { path: '/cluster-overview', label: 'Cluster Overview', icon: LayoutDashboard },
  { path: '/workloads', label: 'Workloads', icon: Layers },
  { path: '/nodes', label: 'Nodes', icon: Server },
  { path: '/pods', label: 'Pods', icon: Box },
  { path: '/metrics', label: 'Metrics', icon: Activity },
  { path: '/logs', label: 'Logs', icon: FileText },
  { path: '/root-cause-analysis', label: 'Root Cause Analysis', icon: Search },
  { path: '/alerts', label: 'Alerts', icon: Bell },
]

const userNavItems = [
  { path: '/user-dashboard', label: 'My Dashboard', icon: User },
  { path: '/cluster-management', label: 'My Clusters', icon: Database },
  { path: '/cluster-overview', label: 'Cluster Overview', icon: LayoutDashboard },
  { path: '/workloads', label: 'Workloads', icon: Layers },
  { path: '/pods', label: 'Pods', icon: Box },
  { path: '/nodes', label: 'Nodes', icon: Server },
  { path: '/metrics', label: 'Metrics', icon: Activity },
  { path: '/logs', label: 'Logs', icon: FileText },
  { path: '/root-cause-analysis', label: 'Root Cause Analysis', icon: Search },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { activeAlerts, criticalAlerts } = useAlertStore()
  const { user, isAdmin, logout } = useAuthStore()
  const { isConnected } = useClusterStore()

  const navItems = isAdmin ? adminNavItems : userNavItems

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-k8s-dark">
      {/* Sidebar */}
      <aside className="w-64 bg-k8s-card border-r border-k8s-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-k8s-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-k8s-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">K8s</span>
            </div>
            <div>
              <h1 className="text-white font-semibold">K8s Dashboard</h1>
              <p className="text-xs text-gray-400">Cluster Monitoring</p>
            </div>
          </div>
        </div>

        {/* Cluster Status */}
        <ClusterStatus />

        {/* Namespace Selector */}
        <NamespaceSelector />

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-k8s-blue text-white'
                    : 'text-gray-400 hover:bg-k8s-border hover:text-white'
                )}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {item.path === '/alerts' && activeAlerts > 0 && (
                  <span className={clsx(
                    'ml-auto px-2 py-0.5 text-xs rounded-full',
                    criticalAlerts > 0 
                      ? 'bg-red-500 text-white animate-pulse-slow' 
                      : 'bg-yellow-500 text-black'
                  )}>
                    {activeAlerts}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-k8s-border space-y-1">
          <div className="mb-3 px-4 py-2 bg-k8s-border rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              {isAdmin ? <Shield size={16} className="text-purple-400" /> : <User size={16} className="text-blue-400" />}
              <span className="text-sm font-medium text-white">{user?.username}</span>
            </div>
            <span className="text-xs text-gray-400">{user?.role || 'User'}</span>
          </div>
          <button 
            onClick={() => navigate('/settings')}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
              location.pathname === '/settings'
                ? 'bg-k8s-blue text-white'
                : 'text-gray-400 hover:bg-k8s-border hover:text-white'
            )}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
          <button 
            onClick={() => navigate('/help')}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
              location.pathname === '/help'
                ? 'bg-k8s-blue text-white'
                : 'text-gray-400 hover:bg-k8s-border hover:text-white'
            )}
          >
            <HelpCircle size={20} />
            <span>Help</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>

        {/* Status Indicator */}
        <div className="p-4 border-t border-k8s-border">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
            <span className={isConnected ? 'text-green-400' : 'text-yellow-400'}>
              {isConnected ? 'Cluster Connected' : 'Demo Mode Active'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-k8s-card border-b border-k8s-border px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {navItems.find((item) => item.path === location.pathname)?.label 
                  || (location.pathname === '/settings' ? 'Settings' : '')
                  || (location.pathname === '/help' ? 'Help Center' : '')
                  || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-400">Kubernetes Cluster Management</p>
            </div>
            <div className="flex items-center gap-4">
              <ClusterSwitcher />
              <span className="text-sm text-gray-400">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-k8s-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
