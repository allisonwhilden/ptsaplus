'use client'

import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

interface PaymentBreakdownProps {
  membershipRevenue: number
  donationRevenue: number
}

export function PaymentBreakdown({ membershipRevenue, donationRevenue }: PaymentBreakdownProps) {
  const total = membershipRevenue + donationRevenue
  
  const chartData = [
    { 
      name: 'Membership Dues', 
      value: membershipRevenue,
      percentage: total > 0 ? ((membershipRevenue / total) * 100).toFixed(1) : 0,
      color: 'hsl(var(--chart-1))' 
    },
    { 
      name: 'Donations', 
      value: donationRevenue,
      percentage: total > 0 ? ((donationRevenue / total) * 100).toFixed(1) : 0,
      color: 'hsl(var(--chart-2))' 
    },
  ]

  const chartConfig = {
    membership: {
      label: 'Membership Dues',
      color: 'hsl(var(--chart-1))',
    },
    donations: {
      label: 'Donations',
      color: 'hsl(var(--chart-2))',
    },
  }

  return (
    <div>
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
              label={({ percentage }) => `${percentage}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              content={<ChartTooltipContent />}
              formatter={(value: number) => `$${value.toFixed(2)}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
      
      <div className="mt-4 space-y-2">
        {chartData.map((item) => (
          <div key={item.name} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm">{item.name}</span>
            </div>
            <span className="text-sm font-medium">${item.value.toFixed(2)}</span>
          </div>
        ))}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center font-medium">
            <span>Total Revenue</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}