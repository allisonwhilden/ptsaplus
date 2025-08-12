'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface MemberEngagementProps {
  totalMembers: number
  activeVolunteers: number
  recentRsvps: number
}

export function MemberEngagement({ totalMembers, activeVolunteers, recentRsvps }: MemberEngagementProps) {
  const engagementRate = totalMembers > 0 ? ((activeVolunteers / totalMembers) * 100).toFixed(1) : 0
  const rsvpRate = totalMembers > 0 ? ((recentRsvps / totalMembers) * 100).toFixed(1) : 0
  
  // Mock engagement data - in production, this would come from API
  const engagementData = [
    { activity: 'Events', members: Math.floor(totalMembers * 0.45), percentage: 45 },
    { activity: 'Volunteering', members: activeVolunteers, percentage: Number(engagementRate) },
    { activity: 'Donations', members: Math.floor(totalMembers * 0.30), percentage: 30 },
    { activity: 'Communications', members: Math.floor(totalMembers * 0.65), percentage: 65 },
  ]

  const chartConfig = {
    members: {
      label: 'Members',
      color: 'hsl(var(--chart-1))',
    },
  }

  const getEngagementLevel = (rate: number) => {
    if (rate >= 70) return { label: 'Excellent', color: 'text-green-600' }
    if (rate >= 50) return { label: 'Good', color: 'text-blue-600' }
    if (rate >= 30) return { label: 'Moderate', color: 'text-yellow-600' }
    return { label: 'Low', color: 'text-red-600' }
  }

  const overallEngagement = engagementData.reduce((sum, item) => sum + item.percentage, 0) / engagementData.length
  const engagementLevel = getEngagementLevel(overallEngagement)

  return (
    <div>
      {/* Overall Engagement Score */}
      <div className="mb-4 p-4 bg-accent rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Overall Engagement Score</span>
          <Badge className={engagementLevel.color}>
            {engagementLevel.label}
          </Badge>
        </div>
        <div className="text-3xl font-bold mb-2">{overallEngagement.toFixed(0)}%</div>
        <Progress value={overallEngagement} className="h-2" />
      </div>

      {/* Engagement by Activity */}
      <ChartContainer config={chartConfig} className="h-[200px] w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={engagementData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              type="number"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis 
              type="category"
              dataKey="activity"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar 
              dataKey="percentage" 
              fill="hsl(var(--chart-1))" 
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">Active Rate</p>
          <p className="text-lg font-bold">{engagementRate}%</p>
          <p className="text-xs text-muted-foreground">
            {activeVolunteers} of {totalMembers} members
          </p>
        </div>
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">RSVP Rate</p>
          <p className="text-lg font-bold">{rsvpRate}%</p>
          <p className="text-xs text-muted-foreground">
            {recentRsvps} recent RSVPs
          </p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
          Engagement Tip
        </p>
        <p className="text-xs text-muted-foreground">
          Consider hosting a social event to boost member participation. 
          Events with refreshments typically see 40% higher attendance.
        </p>
      </div>
    </div>
  )
}