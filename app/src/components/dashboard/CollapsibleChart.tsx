'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleChartProps {
  title: string
  description?: string
  summary: string | React.ReactNode
  children: React.ReactNode
  defaultExpanded?: boolean
  fullscreenEnabled?: boolean
}

export function CollapsibleChart({
  title,
  description,
  summary,
  children,
  defaultExpanded = false,
  fullscreenEnabled = false
}: CollapsibleChartProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const toggleExpanded = () => setIsExpanded(!isExpanded)
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen)

  return (
    <Card className={cn(
      "transition-all duration-300",
      isFullscreen && "fixed inset-4 z-50 h-auto"
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {title}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpanded}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {isExpanded && fullscreenEnabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        
        {!isExpanded && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            {typeof summary === 'string' ? (
              <p className="text-sm">{summary}</p>
            ) : (
              summary
            )}
          </div>
        )}
      </CardHeader>
      
      {isExpanded && (
        <CardContent className={cn(
          "transition-all duration-300",
          isFullscreen && "h-[calc(100vh-200px)] overflow-auto"
        )}>
          {children}
        </CardContent>
      )}
      
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleFullscreen}
        />
      )}
    </Card>
  )
}