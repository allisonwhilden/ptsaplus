'use client'

import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

// Mock data - in production, this would come from props or API
const chartData = [
  { name: 'Meetings', value: 35, color: 'hsl(var(--chart-1))' },
  { name: 'Fundraisers', value: 28, color: 'hsl(var(--chart-2))' },
  { name: 'Volunteer', value: 22, color: 'hsl(var(--chart-3))' },
  { name: 'Social', value: 10, color: 'hsl(var(--chart-4))' },
  { name: 'Educational', value: 5, color: 'hsl(var(--chart-5))' },
]

const chartConfig = {
  meetings: {
    label: 'Meetings',
    color: 'hsl(var(--chart-1))',
  },
  fundraisers: {
    label: 'Fundraisers',
    color: 'hsl(var(--chart-2))',
  },
  volunteer: {
    label: 'Volunteer',
    color: 'hsl(var(--chart-3))',
  },
  social: {
    label: 'Social',
    color: 'hsl(var(--chart-4))',
  },
  educational: {
    label: 'Educational',
    color: 'hsl(var(--chart-5))',
  },
}

export function EventAnalytics() {
  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            content={<ChartTooltipContent />}
            formatter={(value: number) => `${value}%`}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}