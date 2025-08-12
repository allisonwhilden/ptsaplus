import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FinancialHealthProps {
  totalRevenue: number
  monthlyRevenue: number
  outstandingDues: number
  pendingMembersCount: number
  membershipRevenue: number
  donationRevenue: number
}

export function FinancialHealthSummary({
  totalRevenue,
  monthlyRevenue,
  outstandingDues,
  pendingMembersCount,
  membershipRevenue,
  donationRevenue
}: FinancialHealthProps) {
  
  // Calculate health indicators
  const isHealthy = outstandingDues < 500 && pendingMembersCount < 10
  const needsAttention = outstandingDues >= 500 && outstandingDues < 1000
  const isAlert = outstandingDues >= 1000 || pendingMembersCount >= 20

  const getOverallHealth = () => {
    if (isAlert) return 'alert'
    if (needsAttention) return 'warning'
    return 'good'
  }

  const getHealthColor = () => {
    switch (getOverallHealth()) {
      case 'good': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'alert': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getHealthIcon = () => {
    switch (getOverallHealth()) {
      case 'good': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'alert': return <XCircle className="h-5 w-5 text-red-600" />
      default: return null
    }
  }

  const getHealthMessage = () => {
    switch (getOverallHealth()) {
      case 'good': 
        return "Your PTSA finances are in good shape! Keep up the great work."
      case 'warning': 
        return "Everything looks okay, but there are a few things that need your attention."
      case 'alert': 
        return "There are some financial items that need immediate attention."
      default: 
        return "Unable to determine financial health."
    }
  }

  const getQuickActions = () => {
    const actions = []
    
    if (pendingMembersCount > 5) {
      actions.push({
        icon: <Users className="h-4 w-4" />,
        action: "Send membership reminders",
        description: `${pendingMembersCount} families haven't paid dues yet`,
        urgent: pendingMembersCount > 15
      })
    }
    
    if (outstandingDues > 300) {
      actions.push({
        icon: <DollarSign className="h-4 w-4" />,
        action: "Follow up on payments",
        description: `$${outstandingDues.toFixed(2)} in outstanding dues`,
        urgent: outstandingDues > 800
      })
    }
    
    if (monthlyRevenue < 500) {
      actions.push({
        icon: <TrendingUp className="h-4 w-4" />,
        action: "Consider fundraising",
        description: "Monthly income is lower than usual",
        urgent: false
      })
    }

    return actions
  }

  const quickActions = getQuickActions()

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">How Are We Doing?</CardTitle>
          {getHealthIcon()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Health Message */}
        <div className={cn("p-3 rounded-lg border-l-4", 
          getOverallHealth() === 'good' ? 'bg-green-50 border-green-500 dark:bg-green-900/20' :
          getOverallHealth() === 'warning' ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20' :
          'bg-red-50 border-red-500 dark:bg-red-900/20'
        )}>
          <p className={cn("font-medium", getHealthColor())}>
            {getHealthMessage()}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total money raised</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">${monthlyRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">This month's income</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className={cn("text-2xl font-bold", outstandingDues > 500 ? 'text-red-600' : 'text-green-600')}>
              ${outstandingDues.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Still owed to us</p>
          </div>
        </div>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Things you might want to do:</h4>
            {quickActions.map((action, index) => (
              <div key={index} className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                action.urgent ? 'border-red-200 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 bg-gray-50 dark:bg-gray-800'
              )}>
                <div className="flex items-center gap-3">
                  {action.urgent && (
                    <Badge variant="destructive" className="text-xs">Urgent</Badge>
                  )}
                  {action.icon}
                  <div>
                    <p className="font-medium text-sm">{action.action}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Simple breakdown */}
        <div className="pt-2 border-t">
          <h4 className="font-medium text-sm mb-2">Where our money comes from:</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Membership fees</span>
              <span className="font-medium">${membershipRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Donations & fundraising</span>
              <span className="font-medium">${donationRevenue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}