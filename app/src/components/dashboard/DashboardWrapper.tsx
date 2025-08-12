'use client'

import { useEffect, useState } from 'react'
import { DashboardSkeleton } from './DashboardSkeleton'

interface DashboardWrapperProps {
  children: React.ReactNode
  loading?: boolean
}

export function DashboardWrapper({ children, loading = false }: DashboardWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate initial load time for demonstration
    // In production, this would be controlled by actual data fetching state
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (loading || isLoading) {
    return <DashboardSkeleton />
  }

  return <>{children}</>
}