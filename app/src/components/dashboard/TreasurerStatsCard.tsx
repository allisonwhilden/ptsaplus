'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface TreasurerStatsCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  description?: string
  plainLanguageTitle: string
  helpText: string
  healthStatus: 'good' | 'warning' | 'alert'
  trend?: {
    direction: 'up' | 'down' | 'stable'
    percentage?: string
    isGood: boolean
  }
  actionable?: {
    action: string
    description: string
  }
}

const healthConfig = {
  good: {
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    icon: CheckCircle,
    label: 'Looking good'
  },
  warning: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    icon: AlertTriangle,
    label: 'Needs attention'
  },
  alert: {
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    icon: XCircle,
    label: 'Action required'
  }
}

export function TreasurerStatsCard({ 
  title, 
  value, 
  icon, 
  description,
  plainLanguageTitle,
  helpText,
  healthStatus,
  trend,
  actionable
}: TreasurerStatsCardProps) {
  const [showHelp, setShowHelp] = useState(false)
  const healthSettings = healthConfig[healthStatus]
  const HealthIcon = healthSettings.icon

  const getTrendIcon = () => {
    if (!trend) return null
    switch (trend.direction) {
      case 'up': return <TrendingUp className="h-3 w-3" />
      case 'down': return <TrendingDown className="h-3 w-3" />
      case 'stable': return <Minus className="h-3 w-3" />
    }
  }

  const getTrendColor = () => {
    if (!trend) return 'text-gray-600'
    if (trend.isGood) return 'text-green-600'
    return 'text-red-600'
  }

  return (
    <Card className={cn("relative transition-all hover:shadow-md", healthSettings.bgColor)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">
            {showHelp ? plainLanguageTitle : title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setShowHelp(!showHelp)}
          >
            <HelpCircle className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {icon}
          <HealthIcon className={cn("h-4 w-4", healthSettings.color)} />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="text-2xl font-bold mb-1">{value}</div>
        
        {showHelp ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {helpText}
            </p>
            <Badge variant="outline" className={cn("text-xs", healthSettings.color)}>
              {healthSettings.label}
            </Badge>
          </div>
        ) : (
          <div className="space-y-1">
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
            
            {trend && (
              <div className={cn("flex items-center gap-1 text-xs", getTrendColor())}>
                {getTrendIcon()}
                <span>{trend.percentage}</span>
              </div>
            )}
            
            <Badge variant="outline" className={cn("text-xs", healthSettings.color)}>
              {healthSettings.label}
            </Badge>
          </div>
        )}

        {actionable && healthStatus !== 'good' && (
          <div className="mt-3 p-2 bg-white dark:bg-gray-900 rounded border">
            <p className="text-xs font-medium mb-1">{actionable.action}</p>
            <p className="text-xs text-muted-foreground">{actionable.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}