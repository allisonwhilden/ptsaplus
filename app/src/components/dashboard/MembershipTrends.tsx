'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

// Mock data - in production, this would come from props or API
const chartData = [
  { month: 'Jan', new: 12, renewed: 8, expired: 3 },
  { month: 'Feb', new: 18, renewed: 12, expired: 5 },
  { month: 'Mar', new: 15, renewed: 10, expired: 2 },
  { month: 'Apr', new: 22, renewed: 15, expired: 4 },
  { month: 'May', new: 8, renewed: 6, expired: 8 },
  { month: 'Jun', new: 14, renewed: 11, expired: 3 },
]

const chartConfig = {
  new: {
    label: 'New Members',
    color: 'hsl(var(--chart-1))',
  },
  renewed: {
    label: 'Renewed',
    color: 'hsl(var(--chart-2))',
  },
  expired: {
    label: 'Expired',
    color: 'hsl(var(--chart-3))',
  },
}

export function MembershipTrends() {
  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="month" 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="new" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="renewed" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expired" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}