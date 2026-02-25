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
      'bg-k8s-card border border-k8s-border rounded-xl p-6 card-hover',
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
  green: 'from-green-500 to-green-600',
  yellow: 'from-yellow-500 to-yellow-600',
  red: 'from-red-500 to-red-600',
  purple: 'from-purple-500 to-purple-600',
}

export function StatCard({ title, value, subtitle, icon, trend, color = 'blue' }: StatCardProps) {
  return (
    <div className="bg-k8s-card border border-k8s-border rounded-xl p-6 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={clsx(
              'text-sm mt-2 flex items-center gap-1',
              trend.isPositive ? 'text-green-400' : 'text-red-400'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className={clsx(
            'w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center text-white',
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
    Running: 'bg-green-500/20 text-green-400 border-green-500/30',
    Ready: 'bg-green-500/20 text-green-400 border-green-500/30',
    Active: 'bg-green-500/20 text-green-400 border-green-500/30',
    healthy: 'bg-green-500/20 text-green-400 border-green-500/30',
    Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    Error: 'bg-red-500/20 text-red-400 border-red-500/30',
    NotReady: 'bg-red-500/20 text-red-400 border-red-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    degraded: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  return (
    <span className={clsx(
      'rounded-full border font-medium',
      sizeClasses[size],
      statusColors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    )}>
      {status}
    </span>
  )
}
