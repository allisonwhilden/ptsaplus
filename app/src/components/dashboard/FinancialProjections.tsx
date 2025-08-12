'use client'

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { TrendingUp } from 'lucide-react'

interface FinancialProjectionsProps {
  currentMonthRevenue: number
  activeMembers: number
}

export function FinancialProjections({ currentMonthRevenue, activeMembers }: FinancialProjectionsProps) {
  // Simple projection based on historical average and member count
  const baseMonthlyRevenue = activeMembers * 15 // Assuming $15 average per member
  const growthRate = 1.05 // 5% growth projection
  
  const projectionData = [
    { month: 'Current', actual: currentMonthRevenue, projected: currentMonthRevenue },
    { month: '+1 Month', actual: null, projected: baseMonthlyRevenue * growthRate },
    { month: '+2 Months', actual: null, projected: baseMonthlyRevenue * (growthRate ** 2) },
    { month: '+3 Months', actual: null, projected: baseMonthlyRevenue * (growthRate ** 3) },
  ]

  const chartConfig = {
    actual: {
      label: 'Actual',
      color: 'hsl(var(--chart-1))',
    },
    projected: {
      label: 'Projected',
      color: 'hsl(var(--chart-2))',
    },
  }

  const totalProjected = projectionData
    .filter(d => d.projected)
    .reduce((sum, d) => sum + d.projected, 0)

  return (
    <div>
      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `$${value}`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-1))' }}
            />
            <Line 
              type="monotone" 
              dataKey="projected" 
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: 'hsl(var(--chart-2))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <p className="text-sm font-medium">3-Month Projection</p>
        </div>
        <p className="text-2xl font-bold text-green-600 dark:text-green-500">
          ${totalProjected.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Based on {activeMembers} active members with 5% growth
        </p>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Expected Renewals</span>
          <span className="font-medium">{Math.floor(activeMembers * 0.8)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">New Member Target</span>
          <span className="font-medium">{Math.floor(activeMembers * 0.1)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Donation Goal</span>
          <span className="font-medium">${(currentMonthRevenue * 0.2).toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}