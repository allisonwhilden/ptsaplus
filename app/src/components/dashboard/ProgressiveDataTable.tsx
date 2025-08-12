'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ProgressiveDataTableProps {
  title: string
  description?: string
  data: any[]
  columns: {
    key: string
    label: string
    format?: (value: any) => string
    priority: 'primary' | 'secondary' | 'detail'
  }[]
  initialRows?: number
  incrementBy?: number
}

export function ProgressiveDataTable({
  title,
  description,
  data,
  columns,
  initialRows = 5,
  incrementBy = 10
}: ProgressiveDataTableProps) {
  const [visibleRows, setVisibleRows] = useState(initialRows)
  const [showDetailColumns, setShowDetailColumns] = useState(false)
  
  const primaryColumns = columns.filter(col => col.priority === 'primary')
  const secondaryColumns = columns.filter(col => col.priority === 'secondary')
  const detailColumns = columns.filter(col => col.priority === 'detail')
  
  const displayColumns = showDetailColumns 
    ? columns 
    : [...primaryColumns, ...secondaryColumns]
  
  const displayData = data.slice(0, visibleRows)
  const hasMoreData = visibleRows < data.length
  
  const handleShowMore = () => {
    setVisibleRows(prev => Math.min(prev + incrementBy, data.length))
  }
  
  const handleShowLess = () => {
    setVisibleRows(initialRows)
  }
  
  const toggleDetailColumns = () => {
    setShowDetailColumns(!showDetailColumns)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {detailColumns.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDetailColumns}
              className="text-xs"
            >
              {showDetailColumns ? 'Hide' : 'Show'} Details
              {showDetailColumns ? (
                <ChevronUp className="ml-1 h-3 w-3" />
              ) : (
                <ChevronDown className="ml-1 h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {displayColumns.map((column) => (
                  <TableHead 
                    key={column.key}
                    className={column.priority === 'detail' ? 'text-xs' : ''}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((row, index) => (
                <TableRow key={index}>
                  {displayColumns.map((column) => (
                    <TableCell 
                      key={column.key}
                      className={column.priority === 'detail' ? 'text-xs' : ''}
                    >
                      {column.format 
                        ? column.format(row[column.key])
                        : row[column.key]
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {displayData.length === 0 && (
                <TableRow>
                  <TableCell 
                    colSpan={displayColumns.length} 
                    className="text-center text-muted-foreground"
                  >
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {data.length > initialRows && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {hasMoreData ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowMore}
              >
                Show More ({data.length - visibleRows} remaining)
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowLess}
              >
                Show Less
                <ChevronUp className="ml-1 h-3 w-3" />
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              Showing {visibleRows} of {data.length} rows
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}