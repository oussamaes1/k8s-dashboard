import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Server,
  Box,
  FileText,
  Bell,
  Activity,
  Gauge,
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
  { path: '/observability', label: 'Observability', icon: Gauge },
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
  { path: '/observability', label: 'Observability', icon: Gauge },
  { path: '/logs', label: 'Logs', icon: FileText },
  { path: '/root-cause-analysis', label: 'Root Cause Analysis', icon: Search },
]

const avatarGradients = [
  'from-blue-500 to-cyan-400',
  'from-violet-500 to-purple-400',
  'from-emerald-500 to-teal-400',
  'from-orange-500 to-amber-400',
  'from-rose-500 to-pink-400',
  'from-indigo-500 to-blue-400',
]

function getAvatarGradient(username: string): string {
  const idx = (username || 'U').charCodeAt(0) % avatarGradients.length
  return avatarGradients[idx]
}

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

  const pageLabel =
    navItems.find((item) => item.path === location.pathname)?.label ||
    (location.pathname === '/settings' ? 'Settings' : '') ||
    (location.pathname === '/help' ? 'Help Center' : '') ||
    'Dashboard'

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800/50 flex flex-col relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-40 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />

        {/* Logo */}
        <div className="p-5 border-b border-slate-800/60 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <span className="text-white font-bold text-sm">K8s</span>
            </div>
            <div>
              <h1 className="text-white font-semibold tracking-tight">K8s Dashboard</h1>
              <p className="text-xs text-slate-500 mt-0.5">Cluster Monitoring</p>
            </div>
          </div>
        </div>

        {/* Cluster Status */}
        <div className="px-3 pt-3">
          <ClusterStatus />
        </div>

        {/* Namespace Selector */}
        <div className="px-3 pt-2">
          <NamespaceSelector />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon

            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/20 to-blue-500/10 text-white'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full" />
                )}
                <Icon
                  size={18}
                  className={clsx(
                    'transition-colors duration-200',
                    isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                  )}
                />
                <span className="text-sm font-medium">{item.label}</span>
                {item.path === '/alerts' && activeAlerts > 0 && (
                  <span
                    className={clsx(
                      'ml-auto px-2 py-0.5 text-xs rounded-full font-semibold',
                      criticalAlerts > 0
                        ? 'bg-red-500/90 text-white animate-pulse-slow shadow-lg shadow-red-500/20'
                        : 'bg-amber-500/90 text-slate-900'
                    )}
                  >
                    {activeAlerts}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="px-3 pt-2 pb-3 border-t border-slate-800/60 space-y-0.5 bg-slate-900/40">
          {/* User Info */}
          <div className="mx-1 mb-3 px-3 py-3 bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/30">
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  'w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold text-sm shadow-lg',
                  getAvatarGradient(user?.username || '')
                )}
              >
                {(user?.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                <p className="text-xs text-slate-500">{user?.role || 'User'}</p>
              </div>
              {isAdmin && <Shield size={14} className="text-purple-400 flex-shrink-0" />}
            </div>
          </div>

          {/* Settings */}
          <button
            onClick={() => navigate('/settings')}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group',
              location.pathname === '/settings'
                ? 'bg-gradient-to-r from-blue-600/20 to-blue-500/10 text-white'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            )}
          >
            {location.pathname === '/settings' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full" />
            )}
            <Settings
              size={18}
              className={clsx(
                'transition-colors duration-200',
                location.pathname === '/settings'
                  ? 'text-blue-400'
                  : 'text-slate-500 group-hover:text-slate-300'
              )}
            />
            <span className="text-sm font-medium">Settings</span>
          </button>

          {/* Help */}
          <button
            onClick={() => navigate('/help')}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group',
              location.pathname === '/help'
                ? 'bg-gradient-to-r from-blue-600/20 to-blue-500/10 text-white'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            )}
          >
            {location.pathname === '/help' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full" />
            )}
            <HelpCircle
              size={18}
              className={clsx(
                'transition-colors duration-200',
                location.pathname === '/help'
                  ? 'text-blue-400'
                  : 'text-slate-500 group-hover:text-slate-300'
              )}
            />
            <span className="text-sm font-medium">Help</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400/80 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 group"
          >
            <LogOut size={18} className="text-red-400/60 group-hover:text-red-400 transition-colors" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>

        {/* Status Indicator */}
        <div className="px-4 py-3 border-t border-slate-800/60 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div
                className={clsx(
                  'w-2 h-2 rounded-full',
                  isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                )}
              />
              <div
                className={clsx(
                  'absolute inset-0 rounded-full animate-ping opacity-60',
                  isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                )}
              />
            </div>
            <span
              className={clsx(
                'text-xs font-medium',
                isConnected ? 'text-emerald-400' : 'text-amber-400'
              )}
            >
              {isConnected ? 'Cluster Connected' : 'Demo Mode Active'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white tracking-tight">{pageLabel}</h2>
              <p className="text-sm text-slate-500 mt-0.5">Kubernetes Cluster Management</p>
            </div>
            <div className="flex items-center gap-4">
              <ClusterSwitcher />
              <span className="text-sm text-slate-500">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-200 shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 text-sm font-medium"
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
