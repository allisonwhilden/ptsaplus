'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

interface RevenueChartProps {
  detailed?: boolean
}

// Mock data - in production, this would come from props or API
const chartData = [
  { month: 'Jan', revenue: 1200, donations: 300, membership: 900 },
  { month: 'Feb', revenue: 800, donations: 200, membership: 600 },
  { month: 'Mar', revenue: 1500, donations: 500, membership: 1000 },
  { month: 'Apr', revenue: 2100, donations: 800, membership: 1300 },
  { month: 'May', revenue: 900, donations: 100, membership: 800 },
  { month: 'Jun', revenue: 1800, donations: 400, membership: 1400 },
  { month: 'Jul', revenue: 2200, donations: 600, membership: 1600 },
  { month: 'Aug', revenue: 3500, donations: 900, membership: 2600 },
  { month: 'Sep', revenue: 2800, donations: 700, membership: 2100 },
  { month: 'Oct', revenue: 1900, donations: 400, membership: 1500 },
  { month: 'Nov', revenue: 2400, donations: 800, membership: 1600 },
  { month: 'Dec', revenue: 3200, donations: 1200, membership: 2000 },
]

const chartConfig = {
  revenue: {
    label: 'Total Revenue',
    color: 'hsl(var(--chart-1))',
  },
  membership: {
    label: 'Membership',
    color: 'hsl(var(--chart-2))',
  },
  donations: {
    label: 'Donations',
    color: 'hsl(var(--chart-3))',
  },
}

export function RevenueChart({ detailed = false }: RevenueChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorMembership" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="month" 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          {detailed && (
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `$${value}`}
            />
          )}
          <ChartTooltip content={<ChartTooltipContent />} />
          {detailed ? (
            <>
              <Area
                type="monotone"
                dataKey="donations"
                stackId="1"
                stroke="hsl(var(--chart-3))"
                fill="url(#colorDonations)"
              />
              <Area
                type="monotone"
                dataKey="membership"
                stackId="1"
                stroke="hsl(var(--chart-2))"
                fill="url(#colorMembership)"
              />
            </>
          ) : (
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--chart-1))"
              fill="url(#colorRevenue)"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}