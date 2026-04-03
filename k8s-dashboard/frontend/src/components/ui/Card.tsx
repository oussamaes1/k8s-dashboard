import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface CardProps {
  title?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}

export function Card({ title, children, className, action }: CardProps) {
  return (
    <div className={clsx(
      'bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm transition-all duration-300 hover:border-slate-600/50 hover:shadow-lg hover:shadow-slate-900/20',
      className
    )}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-emerald-500 to-emerald-600',
  yellow: 'from-amber-500 to-amber-600',
  red: 'from-red-500 to-red-600',
  purple: 'from-violet-500 to-violet-600',
}

const bgGlowClasses = {
  blue: 'from-blue-500/10 to-blue-600/5',
  green: 'from-emerald-500/10 to-emerald-600/5',
  yellow: 'from-amber-500/10 to-amber-600/5',
  red: 'from-red-500/10 to-red-600/5',
  purple: 'from-violet-500/10 to-violet-600/5',
}

export function StatCard({ title, value, subtitle, icon, trend, color = 'blue' }: StatCardProps) {
  return (
    <div className={clsx(
      'bg-gradient-to-br border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm transition-all duration-300 hover:border-slate-600/50 hover:shadow-lg hover:-translate-y-0.5',
      bgGlowClasses[color]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2 tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={clsx(
              'text-sm mt-2 flex items-center gap-1 font-medium',
              trend.isPositive ? 'text-emerald-400' : 'text-red-400'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className={clsx(
            'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg',
            colorClasses[color]
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const statusColors: Record<string, string> = {
    Running: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Ready: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    healthy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Failed: 'bg-red-500/15 text-red-400 border-red-500/30',
    Error: 'bg-red-500/15 text-red-400 border-red-500/30',
    NotReady: 'bg-red-500/15 text-red-400 border-red-500/30',
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    degraded: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    resolved: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    acknowledged: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  return (
    <span className={clsx(
      'rounded-full border font-medium inline-flex items-center gap-1.5',
      sizeClasses[size],
      statusColors[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'
    )}>
      <span className={clsx(
        'w-1.5 h-1.5 rounded-full',
        statusColors[status]?.includes('emerald') ? 'bg-emerald-400' :
        statusColors[status]?.includes('amber') ? 'bg-amber-400' :
        statusColors[status]?.includes('red') ? 'bg-red-400' :
        statusColors[status]?.includes('orange') ? 'bg-orange-400' :
        statusColors[status]?.includes('blue') ? 'bg-blue-400' :
        'bg-slate-400'
      )} />
      {status}
    </span>
  )
}
