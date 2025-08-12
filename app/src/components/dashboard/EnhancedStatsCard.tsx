import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { HelpCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface EnhancedStatsCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  description?: string
  trend?: {
    value: string
    direction: 'up' | 'down' | 'neutral'
    isGood?: boolean
  }
  helpText?: string
  benchmark?: {
    value: string | number
    label: string
    comparison: 'above' | 'below' | 'at'
  }
  status?: 'excellent' | 'good' | 'warning' | 'critical'
}

const statusColors = {
  excellent: 'bg-green-100 text-green-800 border-green-200',
  good: 'bg-blue-100 text-blue-800 border-blue-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
}

const statusLabels = {
  excellent: 'Excellent',
  good: 'Good',
  warning: 'Needs Attention',
  critical: 'Critical',
}

export function EnhancedStatsCard({ 
  title, 
  value, 
  icon, 
  description, 
  trend,
  helpText,
  benchmark,
  status
}: EnhancedStatsCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />
      case 'down':
        return <TrendingDown className="h-3 w-3" />
      case 'neutral':
        return <Minus className="h-3 w-3" />
    }
  }

  const getTrendColor = () => {
    if (!trend) return ''
    
    if (trend.isGood === undefined) {
      return trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
    }
    
    return trend.isGood ? 'text-green-600' : 'text-red-600'
  }

  const getBenchmarkColor = () => {
    if (!benchmark) return ''
    
    switch (benchmark.comparison) {
      case 'above':
        return 'text-green-600'
      case 'below':
        return 'text-red-600'
      case 'at':
        return 'text-yellow-600'
      default:
        return ''
    }
  }

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">
            {title}
          </CardTitle>
          {helpText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{helpText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-2">
          {status && (
            <Badge 
              variant="outline" 
              className={cn("text-xs", statusColors[status])}
            >
              {statusLabels[status]}
            </Badge>
          )}
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        
        {benchmark && (
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs text-muted-foreground">
              {benchmark.label}:
            </span>
            <span className={cn("text-xs font-medium", getBenchmarkColor())}>
              {benchmark.value}
            </span>
          </div>
        )}
        
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        
        {trend && (
          <div className={cn("flex items-center gap-1 text-xs mt-1", getTrendColor())}>
            {getTrendIcon()}
            <span>{trend.value}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}